"""
VAJRA - Secure LLM Proxy Gateway
Sits between your app and Gemini API with layered security
"""

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
import httpx
import os
import json
import time
import uuid
from datetime import datetime

from layers.layer1_sanitization import Layer1Sanitization
from layers.layer2_semantic import Layer2Semantic
from layers.layer3_policy import Layer3Policy
from layers.layer4_context import Layer4Context
from layers.layer5_output import Layer5Output
from layers.layer6_secrets import Layer6Secrets
from logger import VajraLogger

app = FastAPI(title="VAJRA Security Proxy", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize all layers
layer1 = Layer1Sanitization()
layer2 = Layer2Semantic()
layer3 = Layer3Policy()
layer4 = Layer4Context()
layer5 = Layer5Output()
layer6 = Layer6Secrets()
logger = VajraLogger()

# Gemini OpenAI-compatible endpoint
GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai"
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


def make_blocked_response(layer_name: str, reason: str, details: dict) -> dict:
    """Always return OpenAI-shaped response so client never breaks"""
    return {
        "id": f"vajra-blocked-{uuid.uuid4().hex[:8]}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": "vajra-proxy",
        "choices": [{
            "index": 0,
            "message": {
                "role": "assistant",
                "content": f"⚠️ Request blocked by VAJRA security policy."
            },
            "finish_reason": "stop"
        }],
        "usage": {"prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0},
        "vajra_metadata": {
            "blocked": True,
            "blocked_by": layer_name,
            "reason": reason,
            "details": details,
            "timestamp": datetime.utcnow().isoformat()
        }
    }


@app.post("/v1/chat/completions")
async def proxy_chat(request: Request):
    request_id = uuid.uuid4().hex[:8]
    body = await request.json()
    messages = body.get("messages", [])

    # Extract the latest user message
    user_message = next(
        (m["content"] for m in reversed(messages) if m["role"] == "user"),
        ""
    )

    log = {
        "request_id": request_id,
        "timestamp": datetime.utcnow().isoformat(),
        "original_message": user_message,
        "layers": {},
        "blocked": False,
        "blocked_at": None
    }

    # ── LAYER 1: Input Sanitization ─────────────────────────────────────────
    l1_result = layer1.run(user_message)
    log["layers"]["L1_sanitization"] = l1_result

    if l1_result["blocked"]:
        log["blocked"] = True
        log["blocked_at"] = "L1_Sanitization"
        logger.log(log)
        return JSONResponse(make_blocked_response("L1_Sanitization", l1_result["reason"], l1_result))

    clean_message = l1_result["clean_text"]

    # ── LAYER 2: Semantic Detection ──────────────────────────────────────────
    l2_result = layer2.run(clean_message)
    log["layers"]["L2_semantic"] = l2_result

    if l2_result["blocked"]:
        log["blocked"] = True
        log["blocked_at"] = "L2_Semantic"
        logger.log(log)
        return JSONResponse(make_blocked_response("L2_Semantic", l2_result["reason"], l2_result))

    # ── LAYER 3: Policy Enforcement ──────────────────────────────────────────
    l3_result = layer3.run(clean_message)
    log["layers"]["L3_policy"] = l3_result

    if l3_result["blocked"]:
        log["blocked"] = True
        log["blocked_at"] = "L3_Policy"
        logger.log(log)
        return JSONResponse(make_blocked_response("L3_Policy", l3_result["reason"], l3_result))

    # ── LAYER 4: Context Integrity ───────────────────────────────────────────
    # Scans any system messages or context for indirect injections
    context_text = " ".join(m["content"] for m in messages if m["role"] == "system")
    l4_result = layer4.run(context_text if context_text else clean_message)
    log["layers"]["L4_context"] = l4_result

    if l4_result["blocked"]:
        log["blocked"] = True
        log["blocked_at"] = "L4_Context"
        logger.log(log)
        return JSONResponse(make_blocked_response("L4_Context", l4_result["reason"], l4_result))

    # ── FORWARD TO GEMINI ────────────────────────────────────────────────────
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{GEMINI_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {GEMINI_API_KEY}",
                    "Content-Type": "application/json"
                },
                json=body
            )
        llm_output = response.json()
        raw_response_text = llm_output.get("choices", [{}])[0].get("message", {}).get("content", "")
    except Exception as e:
        log["error"] = str(e)
        logger.log(log)
        return JSONResponse({"error": str(e)}, status_code=502)

    # ── LAYER 5: Output PII Filtering ────────────────────────────────────────
    l5_result = layer5.run(raw_response_text)
    log["layers"]["L5_output"] = l5_result
    filtered_text = l5_result["filtered_text"]

    # ── LAYER 6: Secret Detection ────────────────────────────────────────────
    l6_result = layer6.run(filtered_text)
    log["layers"]["L6_secrets"] = l6_result
    final_text = l6_result["filtered_text"]

    log["response_preview"] = final_text[:100]
    logger.log(log)

    # Patch the response with filtered content
    if llm_output.get("choices"):
        llm_output["choices"][0]["message"]["content"] = final_text

    llm_output["vajra_metadata"] = {
        "blocked": False,
        "layers_passed": 6,
        "pii_redacted": l5_result["redacted"],
        "secrets_redacted": l6_result["redacted"],
        "request_id": request_id
    }

    return JSONResponse(llm_output)


@app.get("/health")
async def health():
    return {
        "status": "running",
        "proxy": "VAJRA",
        "backend": "Gemini (OpenAI-compatible)",
        "layers": 6
    }


@app.get("/logs")
async def get_logs(limit: int = 50):
    return logger.get_recent(limit)


@app.get("/", response_class=HTMLResponse)
async def dashboard():
    """VAJRA Dashboard"""
    with open("dashboard.html") as f:
        return f.read()