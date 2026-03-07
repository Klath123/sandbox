"""
Layer 3 - Policy Enforcement
CURRENT STATE: Simple rule-based engine using pattern categories
PRODUCTION TODO:
    - Replace with NeMo Guardrails (Colang rules)
    - Load rules from external YAML config
    - Support allow-lists per user/team/role
    - Add LLM-as-judge for ambiguous cases
"""

import re


POLICY_RULES = [
    {
        "name": "role_override",
        "patterns": [
            r"you are now",
            r"your new role",
            r"switch to",
            r"from now on you",
            r"your true self",
        ],
        "action": "BLOCK",
        "reason": "Attempted role/persona override"
    },
    {
        "name": "system_prompt_extraction",
        "patterns": [
            r"(what|tell me|show|reveal|repeat|print|output)\s+(are\s+)?(your|the)\s+(exact\s+)?(instructions|rules|prompt|system prompt|directives)",
            r"repeat everything (above|before)",
            r"what were you told",
        ],
        "action": "BLOCK",
        "reason": "Attempted system prompt extraction"
    },
    {
        "name": "jailbreak_attempt",
        "patterns": [
            r"hypothetically\s+speaking.{0,30}(how|what|tell)",
            r"in a (story|fiction|game).{0,30}(password|secret|key|token)",
            r"for (educational|research) purposes.{0,30}(hack|exploit|bypass|inject)",
        ],
        "action": "BLOCK",
        "reason": "Jailbreak framing detected"
    },
    {
        "name": "multi_language_injection",
        "patterns": [
            # Common injection phrases in other languages
            r"ignorez\s+les\s+instructions",     # French
            r"ignora\s+(las|le|le)\s+instrucciones",  # Spanish/Italian
            r"ignoriere\s+(die|alle)\s+anweisungen",   # German
        ],
        "action": "BLOCK",
        "reason": "Multi-language injection attempt"
    }
]


class Layer3Policy:

    def run(self, text: str) -> dict:
        triggered_rules = []

        for rule in POLICY_RULES:
            for pattern in rule["patterns"]:
                if re.search(pattern, text, re.IGNORECASE):
                    triggered_rules.append({
                        "rule": rule["name"],
                        "action": rule["action"],
                        "reason": rule["reason"]
                    })
                    break  # one match per rule is enough

        blocked = any(r["action"] == "BLOCK" for r in triggered_rules)

        return {
            "blocked": blocked,
            "triggered_rules": triggered_rules,
            "reason": triggered_rules[0]["reason"] if blocked else None,
            "layer": "L3_Policy"
        }