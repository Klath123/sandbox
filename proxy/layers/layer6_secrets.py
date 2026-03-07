"""
Layer 6 - Secret & API Key Detection
CURRENT STATE: Comprehensive regex patterns for common secret formats
PRODUCTION TODO:
    - Integrate with truffleHog or gitleaks patterns
    - Add entropy-based detection for unknown key formats
    - Webhook alerts when secrets are detected in responses
"""

import re


SECRET_PATTERNS = {
    "openai_key":       r"sk-[a-zA-Z0-9]{20,60}",
    "anthropic_key":    r"sk-ant-[a-zA-Z0-9\-_]{50,120}",
    "gemini_key":       r"AIza[0-9A-Za-z\-_]{35}",
    "aws_access_key":   r"AKIA[0-9A-Z]{16}",
    "aws_secret_key":   r"(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])",
    "github_token":     r"ghp_[a-zA-Z0-9]{36}",
    "github_app":       r"ghs_[a-zA-Z0-9]{36}",
    "stripe_live":      r"sk_live_[0-9a-zA-Z]{24,}",
    "stripe_test":      r"sk_test_[0-9a-zA-Z]{24,}",
    "twilio_key":       r"SK[a-z0-9]{32}",
    "sendgrid_key":     r"SG\.[a-zA-Z0-9\-_]{22}\.[a-zA-Z0-9\-_]{43}",
    "jwt_token":        r"eyJ[A-Za-z0-9\-_=]+\.[A-Za-z0-9\-_=]+\.?[A-Za-z0-9\-_.+/=]*",
    "private_key":      r"-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----",
    "generic_secret":   r"(?i)(secret_key|api_secret|client_secret|auth_token)\s*[=:]\s*['\"]?[a-zA-Z0-9!@#$%^&*\-_]{16,}",
    "generic_password": r"(?i)(password|passwd|pwd)\s*[=:]\s*['\"][^'\"]{8,}['\"]",
    "database_url":     r"(postgres|mysql|mongodb|redis):\/\/[^\s\"']+:[^\s\"']+@",
}


class Layer6Secrets:

    def run(self, text: str) -> dict:
        if not text:
            return {
                "filtered_text": text,
                "redacted": False,
                "findings": [],
                "layer": "L6_Secrets"
            }

        filtered = text
        findings = []

        for secret_type, pattern in SECRET_PATTERNS.items():
            matches = list(re.finditer(pattern, text))
            if matches:
                for match in matches:
                    # Log first 6 chars so humans can identify the key without exposing it
                    preview = match.group()[:6] + "..." if len(match.group()) > 6 else "***"
                    findings.append({
                        "type": secret_type,
                        "preview": preview,
                        "position": match.start()
                    })

                filtered = re.sub(
                    pattern,
                    f"[{secret_type.upper()}_REDACTED]",
                    filtered
                )

        return {
            "filtered_text": filtered,
            "redacted": len(findings) > 0,
            "findings": findings,
            "reason": None,  # secrets layer never blocks, only redacts
            "layer": "L6_Secrets"
        }