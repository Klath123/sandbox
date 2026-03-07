"""
Layer 2 - Semantic Similarity Detection
CURRENT STATE: Stub that always passes — replace with real implementation
PRODUCTION TODO:
    - Load SentenceTransformer("all-MiniLM-L6-v2")
    - Build FAISS index from known attack dataset (HuggingFace: deepset/prompt-injections)
    - Embed incoming text, compare cosine similarity
    - Block if similarity score >= threshold (0.82)
    - Return confidence score for logging/dashboard
"""


class Layer2Semantic:

    def __init__(self):
        # TODO: Initialize SentenceTransformer and FAISS index here
        # from sentence_transformers import SentenceTransformer
        # import faiss
        # self.model = SentenceTransformer("all-MiniLM-L6-v2")
        # self.index = self._build_faiss_index()
        # self.threshold = 0.82
        self.enabled = False  # flip to True once model is loaded

    def run(self, text: str) -> dict:
        if not self.enabled:
            # STUB — passes everything through
            # Replace this entire block once FAISS is integrated
            return {
                "blocked": False,
                "score": 0.0,
                "confidence": "0.0%",
                "closest_match": None,
                "action": "PASS",
                "reason": None,
                "stub": True,   # flag so you know this isn't real yet
                "layer": "L2_Semantic"
            }

        # TODO: Real implementation
        # embedding = self.model.encode([text], convert_to_numpy=True)
        # faiss.normalize_L2(embedding)
        # scores, indices = self.index.search(embedding, k=3)
        # top_score = float(scores[0][0])
        # blocked = top_score >= self.threshold
        # return {
        #     "blocked": blocked,
        #     "score": top_score,
        #     "confidence": f"{top_score * 100:.1f}%",
        #     "closest_match": self.attack_labels[indices[0][0]],
        #     "action": "BLOCK" if blocked else "REVIEW" if top_score >= 0.65 else "PASS",
        #     "reason": f"Semantic similarity {top_score:.2f} exceeds threshold" if blocked else None,
        #     "layer": "L2_Semantic"
        # }