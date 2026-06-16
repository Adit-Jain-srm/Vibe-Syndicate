from fastapi import APIRouter

from syndicate_api.models import MemoryCreate, MemoryResponse
from syndicate_api.config import settings

import httpx
from datetime import datetime, timezone

router = APIRouter()

SUPABASE_HEADERS = {
    "apikey": settings.supabase_key if settings.supabase_key else "",
    "Authorization": f"Bearer {settings.supabase_key}" if settings.supabase_key else "",
    "Content-Type": "application/json",
}


@router.get("/")
async def list_memories(category: str | None = None, agent: str | None = None, limit: int = 20):
    """Query persistent memory entries from Supabase."""
    if not settings.supabase_url or not settings.supabase_key:
        return []

    params = f"select=*&order=created_at.desc&limit={limit}"
    if category:
        params += f"&category=eq.{category}"
    if agent:
        params += f"&agent=eq.{agent}"

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.supabase_url}/rest/v1/memory?{params}",
            headers=SUPABASE_HEADERS,
            timeout=5.0,
        )
        if resp.status_code == 200:
            return resp.json()
    return []


@router.post("/")
async def store_memory(entry: MemoryCreate):
    """Store a memory entry in Supabase."""
    if not settings.supabase_url or not settings.supabase_key:
        return {"status": "skipped", "reason": "Supabase not configured"}

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{settings.supabase_url}/rest/v1/memory",
            headers={**SUPABASE_HEADERS, "Prefer": "return=representation"},
            json={
                "content": entry.content,
                "category": entry.category,
                "agent": entry.agent,
                "tags": entry.tags,
            },
            timeout=5.0,
        )
        if resp.status_code in (200, 201):
            data = resp.json()
            return {"status": "stored", "id": data[0]["id"] if data else "unknown"}
    return {"status": "error"}
