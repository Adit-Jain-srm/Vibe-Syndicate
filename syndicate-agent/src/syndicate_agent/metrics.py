"""Metrics computation engine — quantifies agent performance per task."""
from __future__ import annotations

import logging
from datetime import datetime, timezone

import httpx

from syndicate_agent.config import Config

logger = logging.getLogger("syndicate.metrics")


class MetricsEngine:
    """Computes and stores task metrics after completion."""

    def __init__(self, config: Config):
        self.config = config
        self._headers = {
            "apikey": config.supabase_key,
            "Authorization": f"Bearer {config.supabase_key}",
            "Content-Type": "application/json",
        }

    async def compute_and_store(self, task_id: str) -> dict:
        """Compute metrics for a completed task and store in Supabase."""
        events = await self._fetch_events(task_id)
        if not events:
            return {}

        # Compute metrics
        has_review_failed = any(e.get("type") == "review_failed" for e in events)
        first_pass = not has_review_failed
        iteration_count = sum(1 for e in events if e.get("type") == "code_generated")
        agents_involved = list({e.get("agent", "") for e in events if e.get("agent")})

        # Time to complete
        timestamps = [e.get("created_at") or e.get("timestamp") for e in events]
        timestamps = [t for t in timestamps if t]
        time_seconds = 0.0
        if len(timestamps) >= 2:
            try:
                first = datetime.fromisoformat(timestamps[0].replace("Z", "+00:00"))
                last = datetime.fromisoformat(timestamps[-1].replace("Z", "+00:00"))
                time_seconds = (last - first).total_seconds()
            except (ValueError, TypeError):
                pass

        # Token estimation from content length (approximate: 1 token ≈ 4 chars)
        total_content_chars = sum(len(e.get("content", "")) for e in events)
        estimated_tokens = total_content_chars // 4

        # Review score
        review_score = 1.0 if first_pass else (0.5 if iteration_count <= 2 else 0.2)

        metrics = {
            "task_id": task_id,
            "first_pass_rate": first_pass,
            "iteration_count": max(iteration_count, 1),
            "time_to_complete_seconds": time_seconds,
            "tokens_used": estimated_tokens,
            "agents_involved": agents_involved,
            "review_score": review_score,
        }

        # Store in Supabase
        await self._store_metrics(metrics)
        logger.info("Metrics stored for %s: pass=%s, iters=%d, time=%.1fs",
                    task_id, first_pass, iteration_count, time_seconds)
        return metrics

    async def get_rolling_averages(self, window: int = 10) -> dict:
        """Get rolling averages over the last N tasks."""
        metrics = await self.get_all_metrics(limit=window)
        if not metrics:
            return {"first_pass_rate": 0, "avg_iterations": 0, "avg_time": 0}

        pass_count = sum(1 for m in metrics if m.get("first_pass_rate"))
        avg_iters = sum(m.get("iteration_count", 1) for m in metrics) / len(metrics)
        avg_time = sum(m.get("time_to_complete_seconds", 0) for m in metrics) / len(metrics)

        return {
            "first_pass_rate": pass_count / len(metrics),
            "avg_iterations": avg_iters,
            "avg_time": avg_time,
            "sample_size": len(metrics),
        }

    async def get_all_metrics(self, limit: int = 50) -> list[dict]:
        """Get all stored metrics for dashboard display."""
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(
                    f"{self.config.supabase_url}/rest/v1/task_metrics?select=*&order=created_at.asc&limit={limit}",
                    headers=self._headers,
                    timeout=5.0,
                )
                if resp.status_code == 200:
                    return resp.json()
            except Exception as e:
                logger.warning("Failed to fetch metrics: %s", e)
        return []

    async def _fetch_events(self, task_id: str) -> list[dict]:
        """Fetch all events for a task from Supabase."""
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.get(
                    f"{self.config.supabase_url}/rest/v1/events?task_id=eq.{task_id}&select=*&order=created_at.asc",
                    headers=self._headers,
                    timeout=5.0,
                )
                if resp.status_code == 200:
                    return resp.json()
            except Exception as e:
                logger.warning("Failed to fetch events for %s: %s", task_id, e)
        return []

    async def _store_metrics(self, metrics: dict):
        """Store computed metrics in task_metrics table."""
        async with httpx.AsyncClient() as client:
            try:
                await client.post(
                    f"{self.config.supabase_url}/rest/v1/task_metrics",
                    headers={**self._headers, "Prefer": "resolution=merge-duplicates"},
                    json=metrics,
                    timeout=5.0,
                )
            except Exception as e:
                logger.warning("Failed to store metrics: %s", e)
