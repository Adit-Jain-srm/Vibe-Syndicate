from fastapi import APIRouter

from syndicate_api.models import AgentStatusResponse, AgentRole
from syndicate_api.config import settings

import httpx

router = APIRouter()

SUPABASE_HEADERS = {
    "apikey": settings.supabase_key if settings.supabase_key else "",
    "Authorization": f"Bearer {settings.supabase_key}" if settings.supabase_key else "",
}


@router.get("/status", response_model=list[AgentStatusResponse])
async def get_agent_status():
    """Get status of all agents in the swarm from Supabase."""
    if not settings.supabase_url or not settings.supabase_key:
        return []

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.supabase_url}/rest/v1/agents?select=*",
            headers=SUPABASE_HEADERS,
            timeout=5.0,
        )
        if resp.status_code == 200:
            return [
                AgentStatusResponse(
                    name=a["name"],
                    role=a["role"],
                    status=a.get("status", "idle"),
                    current_task=None,
                    model=a.get("model", ""),
                )
                for a in resp.json()
            ]
    return []


@router.get("/roster")
async def get_agent_roster():
    """Get the full agent roster with capabilities."""
    if not settings.supabase_url or not settings.supabase_key:
        return {"agents": []}

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.supabase_url}/rest/v1/agents?select=*",
            headers=SUPABASE_HEADERS,
            timeout=5.0,
        )
        if resp.status_code == 200:
            agents = resp.json()
            return {
                "agents": agents,
                "total": len(agents),
                "active": sum(1 for a in agents if a.get("status") == "active"),
            }
    return {"agents": [], "total": 0, "active": 0}
