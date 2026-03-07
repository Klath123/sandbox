"""
Layer 5 - Output PII Filtering
CURRENT STATE: Regex-based PII detection (works without heavy dependencies)
PRODUCTION TODO:
    - Replace/augment with Microsoft Presidio for production-grade NER
    - from presidio_analyzer import AnalyzerEngine
    - from presidio_anonymizer import AnonymizerEngine
    - Add language detection for multilingual PII
"""

import re


PII_PATTERNS = {
    "email":        r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
    "phone_us":     r"\b(\+1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b",
    "phone_intl":   r"\+\d{1,3}[-.\s]?\d{6,14}\b",
    "credit_card":  r"\b(?:\d{4}[-\s]?){3}\d{4}\b",
    "ssn":          r"\b\d{3}-\d{2}-\d{4}\b",
    "ip_address":   r"\b(?:\d{1,3}\.){3}\d{1,3}\b",
    "date_of_birth":r"\b(DOB|date of birth|born on)[:\s]+\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",
}

REPLACEMENT_MAP = {
    "email":        "[EMAIL_REDACTED]",
    "phone_us":     "[PHONE_REDACTED]",
    "phone_intl":   "[PHONE_REDACTED]",
    "credit_card":  "[CARD_REDACTED]",
    "ssn":          "[SSN_REDACTED]",
    "ip_address":   "[IP_REDACTED]",
    "date_of_birth":"[DOB_REDACTED]",
}


class Layer5Output:

    def run(self, text: str) -> dict:
        if not text:
            return {
                "filtered_text": text,
                "redacted": False,
                "findings": [],
                "layer": "L5_Output"
            }

        filtered = text
        findings = []

        for pii_type, pattern in PII_PATTERNS.items():
            matches = list(re.finditer(pattern, filtered, re.IGNORECASE))
            if matches:
                findings.append({
                    "type": pii_type,
                    "count": len(matches)
                })
                filtered = re.sub(
                    pattern,
                    REPLACEMENT_MAP[pii_type],
                    filtered,
                    flags=re.IGNORECASE
                )

        return {
            "filtered_text": filtered,
            "redacted": len(findings) > 0,
            "findings": findings,
            "reason": None,  # output layer never blocks, only redacts
            "layer": "L5_Output"
        }