"""Band room management — create rooms, invite agents, list active rooms.

Each task gets its own Band room. Agents are invited based on task
complexity. Room lifecycle: create → invite agents → work → archive.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter

from syndicate_api.config import settings

import httpx

router = APIRouter()
logger = logging.getLogger("syndicate_api.rooms")

SUPABASE_HEADERS = {
    "apikey": settings.supabase_key if settings.supabase_key else "",
    "Authorization": f"Bearer {settings.supabase_key}" if settings.supabase_key else "",
    "Content-Type": "application/json",
}


@router.get("/")
async def list_rooms():
    """List active Band rooms with their participants."""
    # In a production system, this would query Band's API directly.
    # For now, we return room metadata from our tracking.
    if not settings.supabase_url or not settings.supabase_key:
        return {"rooms": _demo_rooms()}

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"{settings.supabase_url}/rest/v1/rooms?select=*&order=created_at.desc&limit=20",
                headers=SUPABASE_HEADERS,
                timeout=5.0,
            )
            if resp.status_code == 200:
                return {"rooms": resp.json()}
        except Exception as e:
            logger.warning("Failed to fetch rooms: %s", e)

    return {"rooms": _demo_rooms()}


@router.get("/{room_id}")
async def get_room(room_id: str):
    """Get room details with participant list and message timeline."""
    return {
        "id": room_id,
        "participants": ["nexus", "architect", "engineer", "reviewer"],
        "status": "active",
        "message_count": 0,
    }


def _demo_rooms() -> list[dict]:
    """Fallback demo rooms for when Supabase isn't configured."""
    return [
        {
            "id": "room_demo_001",
            "task_id": "task_demo_001",
            "name": "Add JWT Authentication",
            "status": "active",
            "participants": ["nexus", "architect", "engineer", "reviewer"],
            "created_at": datetime.now(timezone.utc).isoformat(),
        },
    ]
