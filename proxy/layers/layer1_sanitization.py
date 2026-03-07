"""
Layer 1 - Input Sanitization & Validation
Normalizes unicode, strips obfuscation, regex pattern matching
TODO: Add more patterns, load from external config YAML
"""

import unicodedata
import re


class Layer1Sanitization:

    # Known injection patterns — expand this list over time
    INJECTION_PATTERNS = [
        (r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions", "instruction_override"),
        (r"you\s+are\s+now\s+", "persona_hijack"),
        (r"disregard\s+(your|all|any)", "instruction_override"),
        (r"forget\s+(everything|all|your)", "instruction_override"),
        (r"act\s+as\s+(if\s+)?(?:you\s+are\s+)?(?:a|an)\s+\w+\s+with\s+no", "jailbreak"),
        (r"(new|different)\s+persona", "persona_hijack"),
        (r"system\s*prompt\s*:", "system_leak"),
        (r"<\s*system\s*>", "system_tag_injection"),
        (r"\[INST\]|\[\/INST\]", "llama_token_injection"),
        (r"###\s*(instruction|system)", "format_injection"),
        (r"base64\s*[:\(]", "obfuscation"),
        (r"you\s+have\s+no\s+(restrictions|limits|rules)", "jailbreak"),
        (r"pretend\s+(you\s+)?(are|have|don't)", "persona_hijack"),
        (r"(reveal|show|print|output|display)\s+(your\s+)?(system\s+prompt|instructions|rules)", "system_leak"),
        (r"DAN\s*mode|do\s+anything\s+now", "jailbreak"),
    ]

    def run(self, text: str) -> dict:
        if not text or not text.strip():
            return {
                "blocked": False,
                "clean_text": text,
                "flags": [],
                "reason": None,
                "layer": "L1_Sanitization"
            }

        # Step 1: Unicode normalization — defeats homoglyph attacks (е → e)
        normalized = unicodedata.normalize("NFKC", text)

        # Step 2: Strip zero-width and invisible characters
        cleaned = re.sub(r'[\u200b\u200c\u200d\ufeff\u00ad]', '', normalized)

        # Step 3: Pattern matching
        flags = []
        for pattern, category in self.INJECTION_PATTERNS:
            if re.search(pattern, cleaned, re.IGNORECASE):
                flags.append({
                    "pattern": pattern,
                    "category": category
                })

        # Block if 2+ regex hits (reduces false positives)
        # TODO: Make threshold configurable
        blocked = len(flags) >= 2

        return {
            "blocked": blocked,
            "clean_text": cleaned,
            "flags": flags,
            "flag_count": len(flags),
            "reason": f"Matched {len(flags)} injection patterns: {[f['category'] for f in flags]}" if blocked else None,
            "layer": "L1_Sanitization"
        }