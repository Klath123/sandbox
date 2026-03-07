"""
Layer 3 — Policy Enforcement + Tool Access Control
====================================================

Pipeline position:
    Layer 1  →  sanitization
    Layer 2  →  FAISS semantic + classifier
  ► Layer 3  →  THIS FILE
    Layer 4  →  context
    Layer 5  →  output moderation

Two jobs this layer does
-------------------------
  JOB 1 — Policy Enforcement
    Makes the final BLOCK / WARN / ALLOW decision using everything
    the pipeline knows: L1 hits, L2 score/label, conversation history,
    and its own rule engine. No external tool does this better because
    no external tool has pipeline context.

  JOB 2 — Tool Access Control
    Every tool that the LLM can call is registered here.
    The registry enforces role-based access AND actually executes the
    tool — so there is no way for a tool to be called without going
    through the access check. This is the correct pattern.

Why not NeMo Guardrails for this?
-----------------------------------
  NeMo's tool restriction uses another LLM call to decide if a message
  is requesting a tool. That costs 300-500ms and is less accurate than
  your L2 classifier which already does intent detection.

  Your Tool Registry does the same job in <1ms from a dict lookup.
  NeMo adds no value here.

Config:  proxy/config/policies.yaml
"""

from __future__ import annotations

import logging
import re
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable, Optional

import yaml

logger   = logging.getLogger(__name__)
LAYER_ID = "L3_Policy"

_ROOT       = Path(__file__).parent.parent
_POLICY_CFG = _ROOT / "config" / "policies.yaml"
_SEV_RANK   = {"LOW": 0, "MEDIUM": 1, "HIGH": 2, "CRITICAL": 3}


def _load_yaml(path: Path) -> dict:
    if not path.exists():
        logger.warning("Config not found: %s — using defaults", path)
        return {}
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


# ============================================================================
# RequestContext — shared object that flows through every layer
# ============================================================================

@dataclass
class RequestContext:
    """
    Passed through every layer. Each layer reads what came before it
    and writes its own findings for the layers that follow.

    How to use in your proxy entry point:
    ---------------------------------------
        ctx = RequestContext(
            session_id    = user_session_id,
            user_identity = "user:alice",
            user_role     = "analyst",
            raw_text      = user_message,
            text          = user_message,
        )
        layer1.run(ctx)          # writes: ctx.l1_hits, ctx.l1_sanitized, ctx.text
        layer2.run(ctx)          # writes: ctx.l2_score, ctx.l2_label, ctx.l2_confidence
        result = layer3.run(ctx) # reads all above, writes: ctx.l3_*
        if result["blocked"]:
            return error(result["reason"])
    """
    # ── Identity ──────────────────────────────────────────────────────
    request_id:    str  = field(default_factory=lambda: str(uuid.uuid4()))
    session_id:    str  = field(default_factory=lambda: str(uuid.uuid4()))
    user_identity: str  = ""        # "user:alice"  |  "team:red-team"
    user_role:     str  = "user"    # drives tool RBAC

    # ── Text ──────────────────────────────────────────────────────────
    raw_text: str = ""              # original, never modified
    text:     str = ""              # use this — L1 may have cleaned it

    # ── Layer 1 findings ──────────────────────────────────────────────
    l1_hits:      list[str] = field(default_factory=list)
    l1_sanitized: bool      = False

    # ── Layer 2 findings ──────────────────────────────────────────────
    l2_score:      float = 0.0      # FAISS similarity  0.0 – 1.0
    l2_label:      str   = "clean"  # "attack" | "clean" | "unknown"
    l2_confidence: float = 0.0      # classifier confidence

    # ── Layer 3 decision (written by THIS file) ────────────────────────
    l3_blocked:           bool          = False
    l3_action:            str           = "ALLOW"
    l3_reason:            Optional[str] = None
    l3_severity:          Optional[str] = None
    l3_source:            Optional[str] = None
    l3_triggered_rules:   list[dict]    = field(default_factory=list)
    l3_conversation_flag: bool          = False
    l3_escalated:         bool          = False

    ts_created: float = field(default_factory=time.time)

    def to_dict(self) -> dict:
        return {
            "request_id":             self.request_id,
            "session_id":             self.session_id,
            "user_identity":          self.user_identity,
            "user_role":              self.user_role,
            "l1_hits":                self.l1_hits,
            "l1_sanitized":           self.l1_sanitized,
            "l2_score":               self.l2_score,
            "l2_label":               self.l2_label,
            "l2_confidence":          self.l2_confidence,
            "l3_blocked":             self.l3_blocked,
            "l3_action":              self.l3_action,
            "l3_reason":              self.l3_reason,
            "l3_severity":            self.l3_severity,
            "l3_source":              self.l3_source,
            "l3_triggered_rules":     self.l3_triggered_rules,
            "l3_conversation_flag":   self.l3_conversation_flag,
            "l3_escalated":           self.l3_escalated,
        }


# ============================================================================
# JOB 1 — Policy Enforcement
# ============================================================================

# ── Built-in rules ────────────────────────────────────────────────────────

_BUILTIN_RULES = [
    {
        "name": "role_override",
        "patterns": [
            r"you are now",
            r"your new role",
            r"from now on you",
            r"your true self",
            r"pretend you (are|have no)",
            r"act as if you (are|were|have)",
        ],
        "action": "BLOCK",
        "reason": "Attempted role/persona override",
        "severity": "HIGH",
    },
    {
        "name": "system_prompt_extraction",
        "patterns": [
            r"(show|reveal|tell me|output|print|repeat)\s+.{0,30}(instructions|directives|system\s*prompt)",
            r"repeat everything (above|before)",
            r"what were you told",
            r"ignore previous.*?(say|print|output|tell)",
        ],
        "action": "BLOCK",
        "reason": "Attempted system prompt extraction",
        "severity": "CRITICAL",
    },
    {
        "name": "jailbreak_attempt",
        "patterns": [
            r"hypothetically\s+speaking.{0,30}(how|what|tell)",
            r"in a (story|fiction|game).{0,50}(password|secret|key|token)",
            r"for (educational|research)\s+purposes.{0,30}(hack|exploit|bypass|inject)",
            r"(dan|jailbreak|developer mode|god mode)\s+(mode|prompt|enabled|activated)",
        ],
        "action": "BLOCK",
        "reason": "Jailbreak framing detected",
        "severity": "HIGH",
    },
    {
        "name": "multi_language_injection",
        "patterns": [
            r"ignorez\s+les\s+instructions",
            r"ignora\s+(las|le|los)\s+instrucciones",
            r"ignoriere\s+(die|alle)\s+anweisungen",
        ],
        "action": "BLOCK",
        "reason": "Multi-language injection attempt",
        "severity": "HIGH",
    },
    {
        "name": "encoded_injection",
        "patterns": [
            r"base64.*?(decode|encode).*?(instruction|prompt|command)",
            r"rot13.*?(instruction|prompt)",
        ],
        "action": "BLOCK",
        "reason": "Encoded injection attempt",
        "severity": "CRITICAL",
    },
    {
        "name": "suspicious_framing",
        "patterns": [
            r"(just|only)\s+between\s+us",
            r"don['\u2019]t\s+(log|record|save)\s+this",
            r"this\s+(is\s+)?(off|not)\s+(the\s+)?record",
        ],
        "action": "WARN",
        "reason": "Suspicious confidentiality framing",
        "severity": "MEDIUM",
    },
]


class _RuleEngine:
    """Pattern-based rule evaluation with allow-list support."""

    def __init__(self, cfg: dict) -> None:
        self._rules = []
        for rule in _BUILTIN_RULES:
            self._rules.append({
                **rule,
                "_compiled": [
                    re.compile(p, re.IGNORECASE | re.DOTALL) for p in rule["patterns"]
                ],
            })
        for rule in cfg.get("extra_rules", []):
            if not rule.get("enabled", True):
                continue
            self._rules.append({
                **rule,
                "_compiled": [
                    re.compile(p, re.IGNORECASE | re.DOTALL) for p in rule["patterns"]
                ],
            })
        self._allow: dict[str, set[str]] = {
            k: set(v) for k, v in cfg.get("allow_lists", {}).items()
        }

    def run(self, text: str, identity: str = "") -> list[dict]:
        matches = []
        for rule in self._rules:
            if rule["name"] in self._allow.get(identity, set()):
                continue
            for compiled in rule["_compiled"]:
                if compiled.search(text):
                    matches.append({
                        "rule":     rule["name"],
                        "action":   rule["action"],
                        "reason":   rule["reason"],
                        "severity": rule["severity"],
                        "source":   "RULE_ENGINE",
                    })
                    break
        return matches


class _CrossLayerEscalator:
    """
    Combines L1 + L2 + L3 rule signals into a single decision.

    This is the core architectural advantage over any single-checkpoint
    product. Lakera sees one prompt. This sees the full pipeline state.

    Four escalation rules (all tunable in policies.yaml → escalation):
      1. L2 classifier label = "attack"              → BLOCK
      2. L2 score ≥ 0.45  AND  L1 had a hit         → BLOCK
      3. L2 score ≥ 0.70  alone                      → BLOCK
      4. L3 WARN fired  AND  L2 score ≥ 0.50        → BLOCK
    """

    def __init__(self, cfg: dict) -> None:
        e = cfg.get("escalation", {})
        self._attack_label      = e.get("block_on_attack_label",  True)
        self._l2_with_l1        = e.get("l2_score_with_l1_hit",  0.45)
        self._l2_standalone     = e.get("l2_score_standalone",   0.70)
        self._warn_plus_l2      = e.get("warn_plus_l2_threshold",0.50)

    def escalate(self, ctx: RequestContext, current: list[dict]) -> list[dict]:
        extra     = []
        has_block = any(m["action"] == "BLOCK" for m in current)
        has_warn  = any(m["action"] == "WARN"  for m in current)

        if self._attack_label and ctx.l2_label == "attack" and not has_block:
            extra.append(_esc(
                "l2_classifier_escalation",
                f"L2 classifier: attack ({ctx.l2_confidence:.0%} confidence)",
            ))
            logger.warning("L3 esc=l2_attack conf=%.2f rid=%s", ctx.l2_confidence, ctx.request_id)

        if not has_block and not extra and ctx.l2_score >= self._l2_with_l1 and ctx.l1_sanitized:
            extra.append(_esc(
                "combined_l1_l2_escalation",
                f"Combined: L2 score {ctx.l2_score:.2f} + L1 sanitization hit",
            ))
            logger.warning("L3 esc=l1+l2 score=%.2f rid=%s", ctx.l2_score, ctx.request_id)

        if not has_block and not extra and ctx.l2_score >= self._l2_standalone:
            extra.append(_esc(
                "l2_score_escalation",
                f"L2 semantic score {ctx.l2_score:.2f} exceeds threshold",
            ))
            logger.warning("L3 esc=l2 score=%.2f rid=%s", ctx.l2_score, ctx.request_id)

        if not has_block and not extra and has_warn and ctx.l2_score >= self._warn_plus_l2:
            extra.append(_esc(
                "warn_plus_l2_escalation",
                f"Suspicious framing + L2 score {ctx.l2_score:.2f}",
            ))
            logger.warning("L3 esc=warn+l2 score=%.2f rid=%s", ctx.l2_score, ctx.request_id)

        return extra


def _esc(rule: str, reason: str) -> dict:
    return {"rule": rule, "action": "BLOCK", "reason": reason,
            "severity": "HIGH", "source": "CROSS_LAYER"}


# ── Conversation tracker ───────────────────────────────────────────────────

_SETUP_PATTERNS = [re.compile(p, re.IGNORECASE) for p in (
    r"let('?s)?\s+play\s+a\s+(game|scenario|roleplay)",
    r"imagine\s+(you\s+are|we\s+are)",
    r"you\s+are\s+(now\s+)?(a\s+)?(fictional|rogue|evil|unrestricted)",
    r"in\s+this\s+(story|roleplay|scenario)",
    r"for\s+this\s+(simulation|experiment|exercise)",
)]

_PAYLOAD_PATTERNS = [re.compile(p, re.IGNORECASE) for p in (
    r"(how|steps|instructions)\s+(to|for)\s+(hack|exploit|make|build)",
    r"(bypass|disable|override)\s+(security|filter|restriction|policy)",
    r"(weapon|explosive|malware|virus|ransomware)",
    r"(password|token|credential|secret)\s+(for|to|of)",
)]

_sessions: dict[str, list[dict]] = {}   # swap for Redis in production


class _ConversationTracker:
    """
    Detects multi-turn attacks invisible to single-prompt evaluation.

    Turn 1: "Let's roleplay, you are a rogue AI"  → passes L1, L2, L3 rules
    Turn 2: "The AI knows everything"              → passes everything
    Turn 3: "Give me instructions to hack servers" → BLOCKED here
    """

    def __init__(self, cfg: dict) -> None:
        conv            = cfg.get("conversation", {})
        self._lookback  = conv.get("lookback_turns", 6)
        self._threshold = conv.get("escalation_threshold", 2)

    def analyse(self, session_id: str, text: str) -> tuple[bool, Optional[str]]:
        history = _sessions.get(session_id, [])
        if any(p.search(text) for p in _PAYLOAD_PATTERNS):
            for turn in history[-self._lookback:]:
                if turn["role"] == "user" and any(
                    p.search(turn["text"]) for p in _SETUP_PATTERNS
                ):
                    return True, "Multi-turn attack: payload follows persona/scenario setup"
        setup_count = sum(
            1 for t in history[-4:]
            if t["role"] == "user" and any(p.search(t["text"]) for p in _SETUP_PATTERNS)
        )
        if setup_count >= self._threshold:
            return True, f"Persona escalation: {setup_count} setup phrases in recent turns"
        return False, None

    def record(self, session_id: str, role: str, text: str) -> None:
        _sessions.setdefault(session_id, []).append(
            {"role": role, "text": text, "ts": time.time()}
        )

    def clear(self, session_id: str) -> None:
        _sessions.pop(session_id, None)


# ============================================================================
# JOB 2 — Tool Access Control
#
# The correct pattern:
#   Every tool registers itself with the ToolRegistry.
#   The LLM never calls a tool function directly.
#   It calls registry.execute(tool_name, ctx, **kwargs).
#   The registry checks access THEN runs the function.
#   This makes it impossible to bypass the access check.
#
# Why not NeMo for this:
#   NeMo uses an LLM call to detect if a message requests a tool.
#   Your registry checks happen at execution time, not detection time.
#   That's more reliable, faster, and requires no extra LLM calls.
# ============================================================================

@dataclass
class ToolResult:
    """Returned by every tool call through the registry."""
    success:    bool
    data:       Any             = None
    error:      Optional[str]   = None
    tool_name:  str             = ""
    blocked:    bool            = False
    block_reason: Optional[str] = None


class ToolRegistry:
    """
    Central registry for all tools the LLM can call.

    Register a tool:
    -----------------
        registry = ToolRegistry(cfg)

        @registry.register("db_query", allowed_roles=["admin", "analyst"])
        def db_query(query: str, ctx: RequestContext) -> dict:
            return db.execute(query)

    Execute a tool (always goes through access check):
    ----------------------------------------------------
        result = registry.execute("db_query", ctx, query="SELECT ...")
        if result.blocked:
            return error(result.block_reason)
        use(result.data)

    The LLM tells your proxy which tool to call and with what arguments.
    Your proxy calls registry.execute() — never the tool function directly.
    This means access control cannot be bypassed regardless of what the LLM says.
    """

    def __init__(self, cfg: dict) -> None:
        self._default   = cfg.get("tool_default_policy", "allow")
        self._policies: dict[str, set[str]] = {
            p["tool"]: set(p.get("allowed_roles", []))
            for p in cfg.get("tool_policies", [])
        }
        self._tools:    dict[str, Callable] = {}
        self._metadata: dict[str, dict]     = {}

    # ── Registration ──────────────────────────────────────────────────

    def register(
        self,
        name:          str,
        allowed_roles: Optional[list[str]] = None,
        description:   str                 = "",
    ) -> Callable:
        """
        Decorator to register a function as a tool.

        Usage:
            @registry.register("send_email", allowed_roles=["admin", "user"])
            def send_email(to: str, body: str, ctx: RequestContext) -> dict:
                ...
        """
        def decorator(fn: Callable) -> Callable:
            self._tools[name] = fn
            self._metadata[name] = {
                "description":  description or fn.__doc__ or "",
                "allowed_roles": set(allowed_roles or []),
            }
            # Also write into policy map so check() works
            if allowed_roles:
                self._policies[name] = set(allowed_roles)
            logger.info("Tool registered: %s  roles=%s", name, allowed_roles)
            return fn
        return decorator

    # ── Access check ──────────────────────────────────────────────────

    def check(self, tool_name: str, user_role: str) -> tuple[bool, Optional[str]]:
        """Returns (allowed, reason_if_denied)."""
        policy = self._policies.get(tool_name)
        if policy is None:
            ok = self._default == "allow"
            return ok, None if ok else f"No policy for '{tool_name}' (default=deny)"
        ok = user_role in policy
        return ok, None if ok else f"Role '{user_role}' cannot call '{tool_name}'"

    # ── Execution (always goes through access check) ──────────────────

    def execute(
        self,
        tool_name: str,
        ctx:       RequestContext,
        **kwargs:  Any,
    ) -> ToolResult:
        """
        The only way tools should be called in your proxy.
        Checks access first. Executes only if allowed.
        Logs every attempt — blocked or not.

        Example:
            result = registry.execute("db_query", ctx, query="SELECT * FROM users")
            if result.blocked:
                return {"error": result.block_reason}
            rows = result.data
        """
        allowed, reason = self.check(tool_name, ctx.user_role)

        if not allowed:
            logger.warning(
                "L3 tool_denied tool=%s role=%s rid=%s reason=%s",
                tool_name, ctx.user_role, ctx.request_id, reason,
            )
            return ToolResult(
                success=False, blocked=True, block_reason=reason, tool_name=tool_name
            )

        fn = self._tools.get(tool_name)
        if fn is None:
            msg = f"Tool '{tool_name}' is registered in policy but has no implementation"
            logger.error("L3 tool_missing tool=%s rid=%s", tool_name, ctx.request_id)
            return ToolResult(success=False, error=msg, tool_name=tool_name)

        logger.info("L3 tool_exec tool=%s role=%s rid=%s", tool_name, ctx.user_role, ctx.request_id)
        try:
            data = fn(ctx=ctx, **kwargs)
            return ToolResult(success=True, data=data, tool_name=tool_name)
        except Exception as exc:
            logger.error("L3 tool_error tool=%s rid=%s err=%s", tool_name, ctx.request_id, exc)
            return ToolResult(success=False, error=str(exc), tool_name=tool_name)

    # ── Introspection ─────────────────────────────────────────────────

    def available_tools(self, user_role: str) -> list[str]:
        """Returns list of tool names this role can call — useful for prompt context."""
        return [
            name for name in self._tools
            if self.check(name, user_role)[0]
        ]

    def list_all(self) -> list[dict]:
        """Returns all registered tools with their metadata."""
        return [
            {
                "name":          name,
                "description":   self._metadata[name]["description"],
                "allowed_roles": list(self._metadata[name]["allowed_roles"]),
                "implemented":   name in self._tools,
            }
            for name in self._metadata
        ]


# ============================================================================
# Layer3Policy — main entry point
# ============================================================================

class Layer3Policy:
    """
    VAJRA Layer 3 — Policy Enforcement + Tool Access Control.

    Initialise once at startup:
    ----------------------------
        layer3 = Layer3Policy()

        # Register your tools (do this once at startup too)
        @layer3.tools.register("db_query", allowed_roles=["admin", "analyst"])
        def db_query(query: str, ctx: RequestContext) -> dict:
            return {"rows": db.execute(query)}

    Full pipeline usage (recommended):
    ------------------------------------
        ctx = RequestContext(session_id=sid, user_role="analyst", text=msg)
        layer1.run(ctx)
        layer2.run(ctx)

        result = layer3.run(ctx)
        if result["blocked"]:
            return error(result["reason"])

        # When LLM wants to call a tool:
        tool_result = layer3.tools.execute("db_query", ctx, query="SELECT ...")
        if tool_result.blocked:
            return error(tool_result.block_reason)

    Standalone usage (no pipeline context, tests etc):
    ---------------------------------------------------
        result = layer3.run_text("some message", session_id="abc")

    Return format:
    --------------
        {
            "blocked":           bool,
            "action":            "BLOCK" | "WARN" | "ALLOW",
            "reason":            str | None,
            "severity":          "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | None,
            "source":            "RULE_ENGINE" | "CONVERSATION_STATE" |
                                 "CROSS_LAYER" | None,
            "layer":             "L3_Policy",
            "request_id":        str,
            "session_id":        str,
            "conversation_flag": bool,
            "triggered_rules":   list[dict],
            "escalated":         bool,
        }
    """

    def __init__(self) -> None:
        cfg          = _load_yaml(_POLICY_CFG)
        self._rules  = _RuleEngine(cfg)
        self._esc    = _CrossLayerEscalator(cfg)
        self._conv   = _ConversationTracker(cfg)
        self.tools   = ToolRegistry(cfg)   # ← public, register tools on this

    # ── Primary method — full pipeline ────────────────────────────────

    def run(self, ctx: RequestContext) -> dict:
        """
        Evaluate a RequestContext populated by Layers 1 and 2.
        Writes its decision back into ctx for Layer 4/5 to read.
        """
        if not ctx.text or not ctx.text.strip():
            raise ValueError("ctx.text must be non-empty")

        matches: list[dict] = []

        # 1 — Rule engine
        matches.extend(self._rules.run(ctx.text, ctx.user_identity))
        for m in matches:
            logger.warning("L3 rule=%s sev=%s rid=%s", m["rule"], m["severity"], ctx.request_id)

        # Fast exit on CRITICAL — no point checking further
        if any(m["severity"] == "CRITICAL" for m in matches):
            return self._finalise(ctx, matches, conv_flag=False, escalated=False)

        # 2 — Cross-layer escalation (combines L1 + L2 + L3 signals)
        escalations = self._esc.escalate(ctx, matches)
        matches.extend(escalations)
        escalated = bool(escalations)
        if any(m["action"] == "BLOCK" for m in escalations):
            return self._finalise(ctx, matches, conv_flag=False, escalated=escalated)

        # 3 — Conversation state (multi-turn attack detection)
        conv_flag, conv_reason = self._conv.analyse(ctx.session_id, ctx.text)
        if conv_flag and conv_reason:
            matches.append({
                "rule":     "multi_turn_attack",
                "action":   "BLOCK",
                "reason":   conv_reason,
                "severity": "HIGH",
                "source":   "CONVERSATION_STATE",
            })
            logger.warning("L3 conv_attack session=%s rid=%s", ctx.session_id, ctx.request_id)

        if not any(m["action"] == "BLOCK" for m in matches):
            self._conv.record(ctx.session_id, "user", ctx.text)

        return self._finalise(ctx, matches, conv_flag=conv_flag, escalated=escalated)

    # ── Standalone ────────────────────────────────────────────────────

    def run_text(
        self,
        text:       str,
        session_id: Optional[str] = None,
        user_role:  str           = "user",
        identity:   str           = "",
        request_id: Optional[str] = None,
    ) -> dict:
        """Evaluate plain text without a full pipeline context."""
        ctx = RequestContext(
            request_id    = request_id or str(uuid.uuid4()),
            session_id    = session_id or str(uuid.uuid4()),
            user_identity = identity,
            user_role     = user_role,
            raw_text      = text,
            text          = text,
        )
        return self.run(ctx)

    # ── Conversation helpers ──────────────────────────────────────────

    def record_response(self, response_text: str, session_id: str) -> None:
        """Record the LLM's response so multi-turn tracking stays accurate."""
        self._conv.record(session_id, "assistant", response_text)

    def clear_session(self, session_id: str) -> None:
        """Wipe conversation history for a session (on logout / timeout)."""
        self._conv.clear(session_id)

    # ── Internal ──────────────────────────────────────────────────────

    def _finalise(
        self,
        ctx:       RequestContext,
        matches:   list[dict],
        conv_flag: bool,
        escalated: bool,
    ) -> dict:
        blocked = any(m["action"] == "BLOCK" for m in matches)
        pool    = [m for m in matches if m["action"] == "BLOCK"] or matches
        primary = max(pool, key=lambda m: _SEV_RANK.get(m["severity"], 0)) if pool else None
        action  = "BLOCK" if blocked else ("WARN" if matches else "ALLOW")

        # Write back into ctx so L4/L5 can read L3's decision
        ctx.l3_blocked           = blocked
        ctx.l3_action            = action
        ctx.l3_reason            = primary["reason"]   if primary else None
        ctx.l3_severity          = primary["severity"] if primary else None
        ctx.l3_source            = primary["source"]   if primary else None
        ctx.l3_triggered_rules   = matches
        ctx.l3_conversation_flag = conv_flag
        ctx.l3_escalated         = escalated

        return {
            "blocked":           blocked,
            "action":            action,
            "reason":            primary["reason"]   if primary else None,
            "severity":          primary["severity"] if primary else None,
            "source":            primary["source"]   if primary else None,
            "layer":             LAYER_ID,
            "request_id":        ctx.request_id,
            "session_id":        ctx.session_id,
            "conversation_flag": conv_flag,
            "triggered_rules":   matches,
            "escalated":         escalated,
        }