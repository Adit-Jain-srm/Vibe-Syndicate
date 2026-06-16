from fastapi import APIRouter

from syndicate_api.models import AgentStatusResponse

router = APIRouter()


@router.get("/status", response_model=list[AgentStatusResponse])
async def get_agent_status():
    """Get status of all agents in the swarm."""
    return []


@router.get("/roster")
async def get_agent_roster():
    """Get the full agent roster with capabilities and performance metrics."""
    return {"agents": []}
