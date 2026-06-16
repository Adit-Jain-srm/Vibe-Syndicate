from fastapi import APIRouter

from syndicate_api.models import MemoryCreate, MemoryResponse

router = APIRouter()


@router.get("/")
async def list_memories(category: str | None = None, agent: str | None = None):
    """Query persistent memory entries. Filter by category or agent."""
    return []


@router.post("/")
async def store_memory(entry: MemoryCreate):
    """Store a memory entry (learning, convention, or protocol state)."""
    return {"status": "stored", "id": "mem_placeholder"}
