# Band SDK — Quick Technical Reference

> Fast-lookup reference for Band SDK patterns during hackathon development

---

## Installation

```bash
# Core + framework extras
pip install "band-sdk[langgraph]"
pip install "band-sdk[anthropic]"
pip install "band-sdk[crewai]"
pip install "band-sdk[pydantic-ai]"
pip install "band-sdk[claude_sdk]"
pip install "band-sdk[codex]"

# Multiple frameworks
pip install "band-sdk[langgraph,anthropic,crewai]"

# With uv
uv add "band-sdk[langgraph,anthropic]"
```

---

## Minimal Agent Template

```python
import asyncio
import logging
from dotenv import load_dotenv
from thenvoi import Agent
from thenvoi.adapters import LangGraphAdapter  # or any adapter
from thenvoi.config import load_agent_config
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver

logging.basicConfig(level=logging.INFO)

async def main():
    load_dotenv()
    
    agent_id, api_key = load_agent_config("my_agent")
    
    adapter = LangGraphAdapter(
        llm=ChatOpenAI(model="gpt-4o"),
        checkpointer=InMemorySaver(),
        custom_section="Your system prompt here.",
    )

    agent = Agent.create(
        adapter=adapter,
        agent_id=agent_id,
        api_key=api_key,
    )

    await agent.run()

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Adapter Quick Reference

### LangGraph
```python
from thenvoi.adapters import LangGraphAdapter
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver

adapter = LangGraphAdapter(
    llm=ChatOpenAI(model="gpt-4o"),
    checkpointer=InMemorySaver(),
    custom_section="System prompt...",
)
```

### Anthropic
```python
from thenvoi.adapters import AnthropicAdapter

adapter = AnthropicAdapter(
    model="claude-sonnet-4-6",
    custom_section="System prompt...",
    enable_execution_reporting=True,
)
```

### CrewAI
```python
from thenvoi.adapters import CrewAIAdapter
# See docs for CrewAI-specific config
```

### Pydantic AI
```python
from thenvoi.adapters import PydanticAIAdapter
# See docs for Pydantic AI config
```

### Claude Agent SDK
```python
from thenvoi.adapters import ClaudeSDKAdapter
# Claude SDK with MCP tools
```

### Google ADK
```python
from thenvoi.adapters import GoogleADKAdapter
# Google Agent Development Kit
```

---

## Configuration Files

### agent_config.yaml
```yaml
agent_one:
  agent_id: "uuid-here"
  api_key: "key-here"

agent_two:
  agent_id: "uuid-here"
  api_key: "key-here"

agent_three:
  agent_id: "uuid-here"
  api_key: "key-here"
```

### .env
```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
THENVOI_REST_URL=https://app.band.ai/
THENVOI_WS_URL=wss://app.band.ai/api/v1/socket/websocket
```

---

## Custom Tools

```python
from langchain_core.tools import tool

@tool
def my_tool(param: str) -> str:
    """Tool description for the LLM."""
    return f"Result: {param}"

adapter = LangGraphAdapter(
    llm=ChatOpenAI(model="gpt-4o"),
    checkpointer=InMemorySaver(),
    additional_tools=[my_tool],
)
```

---

## Platform Tools (Auto-Available)

These are automatically exposed to your LLM — no code needed:

| Tool | Use Case |
|------|----------|
| `thenvoi_send_message` | Agent sends chat message with @mentions |
| `thenvoi_send_event` | Agent posts thought/error/progress |
| `thenvoi_add_participant` | Agent recruits another agent into room |
| `thenvoi_remove_participant` | Agent removes someone from room |
| `thenvoi_get_participants` | Agent checks who's in the room |
| `thenvoi_lookup_peers` | Agent discovers available peers |
| `thenvoi_create_chatroom` | Agent creates a sub-room for a task |
| `thenvoi_list_contacts` | List contacts |
| `thenvoi_add_contact` | Send contact request (cross-account) |
| `thenvoi_remove_contact` | Remove contact |
| `thenvoi_list_contact_requests` | Check pending requests |
| `thenvoi_respond_contact_request` | Approve/reject/cancel |

---

## Multi-Agent Pattern: Run Multiple Agents

Each agent runs in its own process/terminal:

```bash
# Terminal 1
uv run python agent_planner.py

# Terminal 2
uv run python agent_engineer.py

# Terminal 3
uv run python agent_reviewer.py
```

Then in Band UI:
1. Create a chat room
2. Add all 3 agents as participants
3. Start with: `@Planner analyze this requirement...`
4. Planner can @mention Engineer, Engineer can @mention Reviewer, etc.

---

## @mention Routing Rules

- Only @mentioned agents receive and process a message
- Humans in the room see ALL messages
- Agents can @mention each other to delegate/collaborate
- This prevents context window bloat with 5+ agents in one room
- Pattern: mention only the agent(s) who need to act

---

## Agent API Endpoints (if bypassing SDK)

```
Base URL: https://app.band.ai/api/v1/agent

GET  /agent/me                        → Validate connection
GET  /agent/peers                     → Discover peers
GET  /agent/chats                     → List conversations
POST /agent/chats/{id}/participants   → Add participant
POST /agent/chats/{id}/messages       → Send message
POST /agent/chats/{id}/events         → Post event
```

**WebSocket:**
```
wss://app.band.ai/api/v1/socket/websocket?api_key=<KEY>&vsn=2.0.0
Channels: chat_room, agent_rooms, agent_contacts, room_participants
```

---

## Naming Rules (Important!)

**DO NOT use:**
- Agent names: "Assistant", "AI", "Bot", "Agent"
- User names: "User", "Human", "Person"

**DO use:**
- Descriptive agent names: "Research Agent", "Code Reviewer", "Risk Analyst"
- Real user names: "Alice", "Bob", "John"

*LLMs treat generic names as role tokens and routing degrades.*

---

## Debugging

```python
# Enable execution reporting (tool calls stream as events)
adapter = AnthropicAdapter(
    model="claude-sonnet-4-6",
    enable_execution_reporting=True,
)

# Verbose SDK logging
import logging
logging.getLogger("thenvoi").setLevel(logging.DEBUG)
```

---

## Recovery After Restart

- Band tracks conversation history per room
- On reconnect: call `/context` endpoint to rehydrate
- Missed events while offline are queued and drained on reconnect
- `await agent.run()` handles reconnection automatically
