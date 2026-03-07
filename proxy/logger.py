"""
VAJRA Logger — JSONL format, one entry per request
Easy to grep, easy to stream to dashboard, easy to feed into analytics
PRODUCTION TODO:
    - Ship to Langfuse for observability
    - Add structured alerting for high-severity blocks
    - Rotate log files daily
"""

import json
from pathlib import Path
from datetime import datetime
from collections import deque

LOG_FILE = Path("vajra_logs.jsonl")
MAX_MEMORY_LOGS = 500  # keep last N logs in memory for dashboard


class VajraLogger:

    def __init__(self):
        self._memory = deque(maxlen=MAX_MEMORY_LOGS)

    def log(self, entry: dict):
        entry["logged_at"] = datetime.utcnow().isoformat()
        self._memory.append(entry)

        # Append to file
        with open(LOG_FILE, "a") as f:
            f.write(json.dumps(entry) + "\n")

    def get_recent(self, limit: int = 50) -> list:
        logs = list(self._memory)[-limit:]
        return list(reversed(logs))  # newest first

    def get_stats(self) -> dict:
        logs = list(self._memory)
        total = len(logs)
        blocked = sum(1 for l in logs if l.get("blocked"))

        blocked_by_layer = {}
        for log in logs:
            if log.get("blocked_at"):
                layer = log["blocked_at"]
                blocked_by_layer[layer] = blocked_by_layer.get(layer, 0) + 1

        return {
            "total_requests": total,
            "blocked_requests": blocked,
            "passed_requests": total - blocked,
            "block_rate": f"{(blocked/total*100):.1f}%" if total > 0 else "0%",
            "blocked_by_layer": blocked_by_layer
        }