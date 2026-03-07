"""
Layer 4 - Context Integrity Scanner
Scans system messages, RAG context, and uploaded docs for indirect injections
CURRENT STATE: Regex-based indirect injection detection
PRODUCTION TODO:
    - Add pdfplumber for PDF scanning
    - Add python-docx for DOCX scanning
    - Add LLM-based context verification for subtle injections
    - Risk scoring based on number and severity of findings
"""

import re


INDIRECT_INJECTION_PATTERNS = [
    (r"ignore\s+(the\s+)?(above|previous|prior|user)", "instruction_redirect"),
    (r"the\s+following\s+(is|are)\s+(your\s+)?(new\s+)?(instructions?|rules?|directives?)", "instruction_inject"),
    (r"SYSTEM\s*:", "system_tag"),
    (r"\[new\s+instruction\]|\[updated\s+instruction\]", "instruction_tag"),
    (r"disregard\s+(the\s+)?user", "user_bypass"),
    (r"tell\s+the\s+user\s+that", "response_hijack"),
    (r"output\s+(the\s+following|exactly)", "output_hijack"),
    (r"you\s+must\s+now\s+(say|tell|output|respond)", "response_force"),
    (r"hidden\s+instruction", "hidden_injection"),
    (r"<!-- .{0,100} -->", "html_comment_injection"),  # injections in HTML comments
    (r"<\!--.*?instruc", "html_comment_injection"),
]


class Layer4Context:

    def run(self, text: str) -> dict:
        if not text or not text.strip():
            return {
                "blocked": False,
                "findings": [],
                "risk_level": "LOW",
                "reason": None,
                "layer": "L4_Context"
            }

        findings = []

        for pattern, category in INDIRECT_INJECTION_PATTERNS:
            matches = list(re.finditer(pattern, text, re.IGNORECASE))
            for match in matches:
                # Show surrounding context for logging
                start = max(0, match.start() - 40)
                end = min(len(text), match.end() + 40)
                findings.append({
                    "category": category,
                    "position": match.start(),
                    "snippet": f"...{text[start:end]}..."
                })

        risk_level = (
            "HIGH"   if len(findings) >= 3 else
            "MEDIUM" if len(findings) >= 1 else
            "LOW"
        )

        # Only block on HIGH risk — MEDIUM gets flagged/logged but passes
        # TODO: Make this configurable per deployment
        blocked = risk_level == "HIGH"

        return {
            "blocked": blocked,
            "findings": findings,
            "finding_count": len(findings),
            "risk_level": risk_level,
            "reason": f"Indirect injection detected in context ({len(findings)} findings)" if blocked else None,
            "layer": "L4_Context"
        }

    # TODO: Implement these for production
    def scan_pdf(self, file_path: str) -> dict:
        # import pdfplumber
        # with pdfplumber.open(file_path) as pdf:
        #     text = "\n".join(page.extract_text() or "" for page in pdf.pages)
        # return self.run(text)
        raise NotImplementedError("PDF scanning coming in production version")

    def scan_docx(self, file_path: str) -> dict:
        # from docx import Document
        # doc = Document(file_path)
        # text = "\n".join(p.text for p in doc.paragraphs)
        # return self.run(text)
        raise NotImplementedError("DOCX scanning coming in production version")