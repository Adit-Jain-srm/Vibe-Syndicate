import asyncio
import json

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from syndicate_api.models import EventResponse
from syndicate_api.config import settings

import httpx

router = APIRouter()

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
async def stream_task_events(task_id: str):
    """SSE stream of task events in real-time."""
    async def event_generator():
        yield f'data: {{"type": "connected", "task_id": "{task_id}"}}\n\n'

        last_count = 0
        for _ in range(150):  # 5 minutes max
            if settings.supabase_url and settings.supabase_key:
                async with httpx.AsyncClient() as client:
                    resp = await client.get(
                        f"{settings.supabase_url}/rest/v1/events?task_id=eq.{task_id}&select=*&order=created_at.asc",
                        headers=SUPABASE_HEADERS,
                        timeout=5.0,
                    )
                    if resp.status_code == 200:
                        events = resp.json()
                        if len(events) > last_count:
                            for e in events[last_count:]:
                                yield f'data: {json.dumps({"type": e["type"], "agent": e["agent"], "content": e["content"], "timestamp": e["created_at"]})}\n\n'
                            last_count = len(events)

            await asyncio.sleep(2)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
