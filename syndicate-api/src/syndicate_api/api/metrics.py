"""Agent performance metrics — fitness tracking per agent.

Tracks task success rate, review pass rate, speed, and quality scores.
Powers the Metrics page on the dashboard and the self-improvement engine's
fitness-based evaluation (from Spawn Protocol).
"""
from __future__ import annotations

import logging

from fastapi import APIRouter

from syndicate_api.config import settings

import httpx

router = APIRouter()
logger = logging.getLogger("syndicate_api.metrics")

SUPABASE_HEADERS = {
    "apikey": settings.supabase_key if settings.supabase_key else "",
    "Authorization": f"Bearer {settings.supabase_key}" if settings.supabase_key else "",
    "Content-Type": "application/json",
}


@router.get("/")
async def get_metrics():
    """Get system-wide metrics: tasks completed, review pass rate, etc."""
    if not settings.supabase_url or not settings.supabase_key:
        return _demo_metrics()

    async with httpx.AsyncClient() as client:
        try:
            # Task counts by status
            resp = await client.get(
                f"{settings.supabase_url}/rest/v1/tasks?select=status",
                headers=SUPABASE_HEADERS,
                timeout=5.0,
            )
            tasks = resp.json() if resp.status_code == 200 else []

            # Event counts
            resp2 = await client.get(
                f"{settings.supabase_url}/rest/v1/events?select=type",
                headers=SUPABASE_HEADERS,
                timeout=5.0,
            )
            events = resp2.json() if resp2.status_code == 200 else []

            total = len(tasks)
            completed = sum(1 for t in tasks if t.get("status") == "complete")
            in_progress = sum(1 for t in tasks if t.get("status") in ("planning", "in_progress", "reviewing"))
            review_events = [e for e in events if e.get("type") in ("review_passed", "review_failed")]
            review_passed = sum(1 for e in review_events if e.get("type") == "review_passed")

            return {
                "tasks_total": total,
                "tasks_completed": completed,
                "tasks_in_progress": in_progress,
                "review_pass_rate": (review_passed / len(review_events) * 100) if review_events else 0,
                "total_events": len(events),
                "memory_entries": 0,  # TODO: count from memory table
            }
        except Exception as e:
            logger.warning("Failed to compute metrics: %s", e)

    return _demo_metrics()


@router.get("/agents/{agent_name}")
async def get_agent_metrics(agent_name: str):
    """Get per-agent fitness metrics."""
    return {
        "agent": agent_name,
        "tasks_completed": 0,
        "review_pass_rate": 0.0,
        "avg_task_duration_s": 0,
        "fitness_score": 0.0,
        "skill_version": "1.0.0",
    }


def _demo_metrics() -> dict:
    """Fallback metrics for demo/no-db mode."""
    return {
        "tasks_total": 0,
        "tasks_completed": 0,
        "tasks_in_progress": 0,
        "review_pass_rate": 0,
        "total_events": 0,
        "memory_entries": 0,
    }
