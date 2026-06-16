"""Self-improvement engine — evolves agent skills from measured outcomes."""
from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path

from syndicate_agent.memory import MemoryEngine

logger = logging.getLogger("syndicate.self_improve")
SKILLS_DIR = Path(__file__).parent / "prompts"
EVOLUTION_LOG = Path(__file__).parent.parent.parent.parent / "memory" / "skill_evolution.jsonl"


class SelfImprovementEngine:
    def __init__(self, memory: MemoryEngine):
        self.memory = memory
        EVOLUTION_LOG.parent.mkdir(parents=True, exist_ok=True)

    async def run_cycle(self, task_id: str, events: list[dict]) -> dict:
        report = {
            "task_id": task_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "lessons": [],
            "updates": [],
        }
        lessons = await self.memory.extract_lessons(task_id, events)
        report["lessons"] = lessons

        learnings = await self.memory.get_agent_learnings("engineer", limit=10)
        if len(learnings) >= 3:
            patterns = self._find_patterns(learnings)
            if patterns:
                delta = self._make_delta(patterns)
                self._apply_delta("engineer", delta)
                report["updates"].append({"role": "engineer", "delta": delta})

        self._log(report)
        logger.info(
            "Self-improvement: %d lessons, %d updates",
            len(report["lessons"]),
            len(report["updates"]),
        )
        return report

    def _find_patterns(self, learnings: list[dict]) -> list[str]:
        counts: dict[str, int] = {}
        keywords = [
            "error handling",
            "edge case",
            "type",
            "validation",
            "async",
            "import",
            "test",
            "null",
        ]
        for l in learnings:
            for kw in keywords:
                if kw in l.get("content", "").lower():
                    counts[kw] = counts.get(kw, 0) + 1
        return [f"Recurring: {k} ({v} times)" for k, v in counts.items() if v >= 2]

    def _make_delta(self, patterns: list[str]) -> str:
        lines = ["\n\n## Learned Patterns (auto-evolved)\n"]
        lines.extend(f"- {p}" for p in patterns[:3])
        return "\n".join(lines)

    def _apply_delta(self, role: str, delta: str):
        path = SKILLS_DIR / f"{role}.md"
        if path.exists() and delta.strip() not in path.read_text():
            with open(path, "a") as f:
                f.write(delta)

    def _log(self, report: dict):
        with open(EVOLUTION_LOG, "a") as f:
            f.write(json.dumps(report) + "\n")
