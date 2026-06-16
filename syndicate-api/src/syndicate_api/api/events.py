from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from syndicate_api.models import EventResponse

router = APIRouter()


@router.get("/{task_id}", response_model=list[EventResponse])
async def get_task_events(task_id: str):
    """Get all events for a task (agent thoughts, handoffs, decisions)."""
    return []


@router.get("/{task_id}/stream")
async def stream_task_events(task_id: str):
    """SSE stream of task events in real-time. Connect to watch agents collaborate live."""

    async def event_generator():
        yield f'data: {{"type": "connected", "task_id": "{task_id}"}}\n\n'

    return StreamingResponse(event_generator(), media_type="text/event-stream")
