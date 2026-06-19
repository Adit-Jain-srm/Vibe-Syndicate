"""Event timeline endpoints — list + SSE stream.

The timeline is the canonical view of "what the agent is doing right now."
The orchestrator writes events to Supabase; this endpoint replays the
history then streams new ones via Server-Sent Events.

Adapted from production SSE pattern (replay + live tail).
"""
from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from syndicate_api.models import EventResponse
from syndicate_api.config import settings

import httpx

router = APIRouter()
logger = logging.getLogger("syndicate_api.events")

SUPABASE_HEADERS = {
    "apikey": settings.supabase_key if settings.supabase_key else "",
    "Authorization": f"Bearer {settings.supabase_key}" if settings.supabase_key else "",
}


@router.get("/{task_id}", response_model=list[EventResponse])
async def get_task_events(task_id: str):
    """Get all events for a task from Supabase."""
    if not settings.supabase_url or not settings.supabase_key:
        return []

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.supabase_url}/rest/v1/events?task_id=eq.{task_id}&select=*&order=created_at.asc",
            headers=SUPABASE_HEADERS,
            timeout=5.0,
        )
        if resp.status_code == 200:
            return [
                EventResponse(
                    id=e["id"],
                    task_id=e.get("task_id", task_id),
                    type=e["type"],
                    agent=e["agent"],
                    content=e["content"],
                    timestamp=e["created_at"],
                    metadata=e.get("metadata", {}),
                )
                for e in resp.json()
            ]
    return []


@router.get("/{task_id}/stream")
async def stream_task_events(request: Request, task_id: str):
    """SSE stream of task events in real-time.

    Follows standard pattern: replay existing events first, then
    poll for new ones with heartbeat pings. Client receives:
      - event: task_event — a real event from the swarm
      - event: ping — keepalive (every 10s)
      - event: complete — task finished, stream ends
    """
    async def event_generator():
        # 1. Connected signal
        yield _sse("connected", {"task_id": task_id, "status": "streaming"})

        last_count = 0

        # 2. Replay existing + live tail
        for tick in range(600):  # 10 minutes max
            if await request.is_disconnected():
                break

            if settings.supabase_url and settings.supabase_key:
                try:
                    async with httpx.AsyncClient() as client:
                        resp = await client.get(
                            f"{settings.supabase_url}/rest/v1/events"
                            f"?task_id=eq.{task_id}&select=*&order=created_at.asc",
                            headers=SUPABASE_HEADERS,
                            timeout=5.0,
                        )
                        if resp.status_code == 200:
                            events = resp.json()

                            # Emit new events since last check
                            if len(events) > last_count:
                                for e in events[last_count:]:
                                    yield _sse("task_event", {
                                        "seq": last_count + events.index(e) - last_count + 1,
                                        "type": e["type"],
                                        "agent": e["agent"],
                                        "content": e["content"],
                                        "timestamp": e["created_at"],
                                        "metadata": e.get("metadata", {}),
                                    })

                                    # Check for terminal events
                                    if e["type"] in ("task_complete", "error"):
                                        yield _sse("complete", {"task_id": task_id})
                                        return

                                last_count = len(events)
                except Exception as exc:
                    logger.warning("SSE poll error: %s", exc)

            # Heartbeat every cycle
            if tick % 5 == 0 and tick > 0:
                yield _sse("ping", {"tick": tick})

            await asyncio.sleep(1)

        # Stream timeout
        yield _sse("timeout", {"task_id": task_id, "reason": "max_duration_reached"})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/recent/all")
async def get_recent_events():
    """Get the most recent events across all tasks."""
    if not settings.supabase_url or not settings.supabase_key:
        return {"events": []}

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"{settings.supabase_url}/rest/v1/events?select=*&order=created_at.desc&limit=50",
                headers=SUPABASE_HEADERS,
                timeout=5.0,
            )
            if resp.status_code == 200:
                return {"events": resp.json()}
        except Exception as e:
            logger.warning("Failed to fetch recent events: %s", e)

    return {"events": []}


def _sse(event: str, data: dict) -> str:
    """Format an SSE message."""
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"
