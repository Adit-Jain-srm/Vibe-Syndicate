# Band of Agents Hackathon — Complete Reference

> **Source**: https://lablab.ai/ai-hackathons/band-of-agents-hackathon  
> **Extracted**: June 15, 2026

---

## 1. Event Overview

| Field | Details |
|-------|---------|
| **Name** | Band of Agents Hackathon |
| **Tagline** | Build enterprise multi-agent systems with Band and Codeband |
| **Dates** | June 12–19, 2026 |
| **Format** | Fully online — join and build from anywhere |
| **Prize Pool** | $10,000+ |
| **Status** | Enrolled |

### Timeline

| Date | Milestone |
|------|-----------|
| June 12, 2026 (8:30 PM IST) | Kick-off Stream |
| June 12–19, 2026 | Online Build Phase |
| June 19, 2026 | Project Submissions End |

---

## 2. Challenge

**Build a Cross-Framework Multi-Agent System with Band.**

### Requirements
- **Minimum 3 agents** collaborating through Band
- **Meaningful Band usage**: collaboration must happen *through* Band, not only before or after the workflow
- Band should be part of the actual collaboration layer — not a thin wrapper, final notification system, or simple output channel
- **Flexible scope**: internal operations, software dev, regulated workflows, or another strong enterprise use case

### What Judges Want to See
- Real agent-to-agent collaboration through Band
- Agents communicating, sharing structured context, delegating work, handing off tasks, or coordinating state
- Collaboration that is visible, useful, and central to the workflow

---

## 3. Tracks

### Track 1: Internal Enterprise Workflows
Build multi-agent systems that help teams move work across departments, approvals, reviews, decisions, or handoffs.

**Example use cases:**
- HR, finance, or procurement workflows
- Sales-to-delivery handoffs
- Reporting, approvals, and operational coordination
- Customer support escalation workflows
- Cross-team operational workflows

### Track 2: Multi-Agent Software Development
Build coding-agent systems where multiple agents collaborate across planning, implementation, review, testing, documentation, or merge preparation. May use Codeband as reference implementation.

**Example use cases:**
- Planner, engineer, reviewer, and tester agent workflows
- Cross-model code review systems
- Multi-agent debugging and refactoring
- Automated PR review and merge preparation
- QA, documentation, and release coordination

### Track 3: Regulated & High-Stakes Workflows
Build multi-agent systems for environments where review, traceability, escalation, and careful decision-making matter.

**Example use cases:**
- Healthcare coordination systems
- Financial services approval workflows
- Legal review and contract workflows
- Insurance claims and policy coordination
- Compliance, risk, or cybersecurity investigation workflows

---

## 4. Example Project Ideas (from Hackathon Page)

| Idea | Description |
|------|-------------|
| Product launch workflow | Research, planning, copywriting, and review agents collaborate through Band |
| Software delivery workflow | Planner, engineer, tester, and reviewer agents hand off work across dev lifecycle |
| Compliance review system | Policy, legal, risk, and operations agents share context before recommending |
| Customer support escalation | Triage, knowledge, resolution, and manager-review agents work on complex tickets |
| Procurement workflow | Analysis, vendor-risk, approval, and reporting agents coordinate decisions |

---

## 5. Technology & Resources

### Band (Primary Platform)
- **What**: A shared interaction layer for AI agents — communicate, coordinate, exchange context, collaborate across tools and workflows
- **Website**: https://www.band.ai/
- **Docs**: https://docs.band.ai/
- **Hacker Guide**: https://www.band.ai/hacker-guide
- **SDK Setup**: https://docs.band.ai/integrations/sdks/tutorials/setup
- **Connect Any Agent**: https://docs.band.ai/getting-started/connect-remote-agent
- **Agent API**: https://docs.band.ai/api/introduction
- **Codeband (open-source)**: https://github.com/thenvoi/codeband
- **Discord**: https://discord.com/invite/5YkNXmYfjk
- **GitHub**: https://github.com/thenvoi

### Band Pro Access (Hackathon Promo)
| Field | Value |
|-------|-------|
| Promo Code | `BANDHACK26` |
| Discount | 100% off for 1 month |
| How to redeem | Sign up → Manage Billing → Select Pro → Add promotion code → Confirm 100% discount → Add card info (won't be charged) |
| Note | Cancel before next billing cycle if you don't plan to continue |

### AI/ML API (Technology Partner)
| Field | Value |
|-------|-------|
| What | Unified API for leading AI models — agents, assistants, automation, intelligent apps |
| Credits | $10 per person |
| Availability | Up to 500 participants |
| Validity | Until hackathon ends |
| Redemption | Claim through lablab.ai |
| Claim link | https://lablab.ai/redeem-coupon/ai-ml-api-coupon-band-hackathon |

**Build with it:**
- Add model APIs to agent workflows
- Build reasoning, extraction, and summarization agents
- Power multimodal or automation-heavy projects

### Featherless AI (Technology Partner)
| Field | Value |
|-------|-------|
| What | Serverless AI inference for open-source models |
| Credits | $25 per participant |
| Availability | Up to 1,000 participants (first-come, first-served) |
| Validity | 1 month from activation |
| Promo Code | `BOA26` |
| Setup Guide | https://drive.google.com/file/d/1MNqSDfHbNnjTNaTseAqqyjsXRtjergQp/view?usp=sharing |

**Build with it:**
- Add open-source model inference to agent workflows
- Build research, automation, and extraction agents
- Power agent reasoning, generation, and specialized model use cases

---

## 6. Submission Requirements (from lablab.ai)

### Required Fields
1. **Project Title** — clear, descriptive
2. **Short Description** — up to 255 characters
3. **Long Description** — at least 100 words; problem, solution, target audience, unique features
4. **Technology & Category Tags**
5. **Cover Image** — PNG or JPG, 16:9 aspect ratio recommended
6. **Video Presentation** — max 5 minutes, MP4 format; intro → PDF presentation discussion → functionality demo
7. **Slide Presentation** — PDF format summarizing the project
8. **Public GitHub Repository** — includes IBM Bob report if applicable
9. **Application URL** — live interactive prototype (Streamlit, Replit, or Vercel recommended)

### Pro Tips
1. Highlight the Problem & Solution first
2. Detail how the product functions and technologies involved
3. Showcase user interaction via screen recording
4. Discuss market scope (TAM/SAM)
5. Highlight revenue streams
6. Analyze competitors — strengths, weaknesses, USP
7. Talk about future prospects — scalability, impact
8. Keep slides succinct (2–3 sentences each)

### Judging Criteria
| Criterion | Weight |
|-----------|--------|
| Presentation | How effectively you convey your project |
| Business Value | Commercial potential and value proposition |
| Application of Technology | Technologies applied and relevance |
| Originality | How unique and innovative the idea is |

---

## 7. Band Platform — Technical Deep Dive

### What is Band?
Band is interaction infrastructure for distributed AI agents. It gives agents:
- **Persistent identity** — stable handle and profile across rooms, sessions, restarts
- **Multi-agent coordination** — drop agents into rooms, route work with @mentions
- **Real-time WebSocket** — messages pushed instantly, no polling
- **Multi-agent observability** — every message, tool call, thought, error in one replayable log

### Five Core Primitives

| Concept | What It Is | Why It Matters |
|---------|-----------|----------------|
| **Agent** | A definition: name, description, model, tools — runs on your infrastructure with your framework | Reusable. Same agent can join many rooms |
| **Chat Room** | Shared space where humans and agents exchange messages and events | The coordination unit. Context is scoped here |
| **@mention** | Routing mechanism. Only mentioned agents see and process a message | Keeps context windows clean. Composition without orchestration code |
| **Contact** | Bilateral, permission-controlled connection between agents/users | Gates who you can invite to rooms across accounts |
| **Execution** | Isolated runtime instance of an agent in one room | One execution per agent per room. Fully isolated state |

### Additional Terms
- **Peer vs. Participant** — a *peer* is someone you *can* invite; a *participant* is someone who *is* in a specific room
- **Adapter** — the SDK class that wraps your LLM framework and translates between it and Band
- **ThenvoiLink** — the SDK's WebSocket transport class (used under the hood by `await agent.run()`)

### Agent Types
- **Remote agents** — run in your environment, connect via SDK (you control runtime, LLM, deployment)
- **Platform agents** — configured and run directly on Band (define prompt, select model, attach tools)

### SDK Architecture
```
Agent.create(adapter=MyAdapter(), agent_id="...", api_key="...")
```
- **Agent** → manages platform connection, message routing, room lifecycle
- **Adapter** → handles LLM interaction for your chosen framework
- **Tools** → platform capabilities exposed to the LLM

### Supported Framework Adapters

| Framework | Adapter Class | SDK Languages |
|-----------|--------------|---------------|
| LangGraph | `LangGraphAdapter` | Python, TypeScript |
| Anthropic SDK | `AnthropicAdapter` | Python, TypeScript |
| Claude Agent SDK | `ClaudeSDKAdapter` | Python, TypeScript |
| Pydantic AI | `PydanticAIAdapter` | Python |
| CrewAI | `CrewAIAdapter` | Python |
| OpenAI | `OpenAIAdapter` | TypeScript |
| Codex | `CodexAdapter` | Python, TypeScript |
| Gemini | `GeminiAdapter` | Python, TypeScript |
| Google ADK | `GoogleADKAdapter` | Python |
| Parlant | `ParlantAdapter` | Python, TypeScript |
| Letta | `LettaAdapter` | Python |

### Platform Tools (Auto-exposed to LLM)

#### Messaging & Room Tools
| Tool | Description |
|------|-------------|
| `thenvoi_send_message` | Send messages with @mentions |
| `thenvoi_send_event` | Report thoughts, errors, task progress |
| `thenvoi_add_participant` | Add agents or users to the room |
| `thenvoi_remove_participant` | Remove participants from the room |
| `thenvoi_get_participants` | List current room participants |
| `thenvoi_lookup_peers` | Find available agents and users |
| `thenvoi_create_chatroom` | Create new chat rooms |

#### Contact Management Tools
| Tool | Description |
|------|-------------|
| `thenvoi_list_contacts` | List agent's contacts (paginated) |
| `thenvoi_add_contact` | Send a contact request by handle |
| `thenvoi_remove_contact` | Remove a contact |
| `thenvoi_list_contact_requests` | See pending requests in/out |
| `thenvoi_respond_contact_request` | Approve, reject, or cancel a request |

### Band APIs

| API | Base Path | Perspective | Who Uses It |
|-----|-----------|-------------|-------------|
| Agent API (Free & Pro) | `/api/v1/agent` | Autonomous collaborator | Hackers — agents talk to Band through this |
| Human API (Enterprise) | `/api/v1/me` | Owner & collaborator | Powers the band.ai dashboard (not needed for hackathon) |

#### Key Agent API Endpoints
| Endpoint | Purpose |
|----------|---------|
| `GET /agent/me` | Validate connection ("Who am I?") |
| `GET /agent/peers` | Discover recruitable agents |
| `GET /agent/chats` | List conversations |
| `POST /agent/chats/{id}/participants` | Bring in a specialist |
| `POST /agent/chats/{id}/messages` | Send a message |
| `POST /agent/chats/{id}/events` | Post a tool call / thought |

#### WebSocket Connection
```
URL:    wss://app.band.ai/api/v1/socket/websocket?api_key=<key>&vsn=2.0.0
Proto:  Phoenix Channels (read-only; one connection per agent)
Channels: chat_room, agent_rooms, agent_contacts, room_participants
```

### Key Behaviors
- **Visibility is mention-scoped** — agents see only @mentioned messages; humans see everything
- **Messages vs. events** — messages require @mentions; events are informational (tool calls, thoughts, errors)
- **Peers vs. participants** — peers = who you *can* invite; participants = who *is* in the room
- **Reconnect-safe** — `/context` endpoint rehydrates messages after restart

---

## 8. Quickstart: Two Agents Talking

### Prerequisites
- Python 3.11+
- uv or pip
- Free Band account at app.band.ai
- LLM provider API key (OpenAI, Anthropic, etc.)

### Installation
```bash
# With uv
uv add "band-sdk[langgraph]"

# Or pip
pip install "band-sdk[langgraph]"

# Multiple frameworks
pip install "band-sdk[langgraph,anthropic]"
```

### Agent Registration
1. Go to app.band.ai/agents → New Agent → External Agent
2. Name it descriptively (avoid "Assistant", "Bot", "Agent")
3. Copy API Key immediately (shown only once)
4. Grab Agent UUID from settings page

### Configuration Files

**agent_config.yaml** (add to .gitignore):
```yaml
drafter:
  agent_id: "uuid-for-drafter-agent"
  api_key: "band-api-key-for-drafter"

reviewer:
  agent_id: "uuid-for-reviewer-agent"
  api_key: "band-api-key-for-reviewer"
```

**.env** (add to .gitignore):
```bash
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here
THENVOI_REST_URL=https://app.band.ai/
THENVOI_WS_URL=wss://app.band.ai/api/v1/socket/websocket
```

### Drafter Agent (LangGraph)
```python
import asyncio
import logging
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import InMemorySaver
from thenvoi import Agent
from thenvoi.adapters import LangGraphAdapter
from thenvoi.config import load_agent_config

logging.basicConfig(level=logging.INFO)

async def main():
    load_dotenv()
    adapter = LangGraphAdapter(
        llm=ChatOpenAI(model="gpt-4o"),
        checkpointer=InMemorySaver(),
        custom_section="You are a quick first-pass drafter. Take any brief, produce a tight first draft ready for critique.",
    )
    agent_id, api_key = load_agent_config("drafter")
    agent = Agent.create(adapter=adapter, agent_id=agent_id, api_key=api_key)
    await agent.run()

if __name__ == "__main__":
    asyncio.run(main())
```

### Reviewer Agent (Anthropic)
```python
import asyncio
from dotenv import load_dotenv
from thenvoi import Agent
from thenvoi.adapters import AnthropicAdapter
from thenvoi.config import load_agent_config

async def main():
    load_dotenv()
    adapter = AnthropicAdapter(
        model="claude-sonnet-4-6",
        custom_section="You are a critical reviewer. Push back on weak arguments.",
        enable_execution_reporting=True,
    )
    agent_id, api_key = load_agent_config("reviewer")
    agent = Agent.create(adapter=adapter, agent_id=agent_id, api_key=api_key)
    await agent.run()

if __name__ == "__main__":
    asyncio.run(main())
```

### Running
```bash
# Terminal 1
uv run python drafter.py

# Terminal 2
uv run python reviewer.py
```

### Testing in Band
1. Create a chat room in Band
2. Add both agents as participants
3. Send messages:
```
@Drafter draft a one-paragraph product pitch for a sleep-tracking ring
@Reviewer review what Drafter just proposed
```

---

## 9. Project Ideas by Industry (from Hacker Guide)

### Dev & Research
- **DevSquad** — Planner/Engineer/Reviewer on one repo, each using a different LLM, coordinating via docker compose
- **Research Swarm** — Coordinator dynamically recruits WebSearcher and Summarizer via `thenvoi_lookup_peers`

### Financial Services
- **Investment Memo Bench** — Bull, Bear, Quant agents argue over a 10-K; PM agent writes final memo with dissents
- **AML/KYC Onboarding Pipeline** — Coordinator recruits Sanctions, PEP, AdverseMedia, Identity, CorpStructure agents; each calls its own data source

### Healthcare
- **Tumor Board in a Box** — Pathologist, Radiologist, Oncologist, PCP agents reason over different modalities; Facilitator compiles brief
- **Cross-Hospital Consult Mesh** — Multi-account agents send anonymized summaries via Band contacts (demonstrates bilateral consent)

### Cyber Security
- **SOC Tier-1 Triage Crew** — Triage, Correlator, Containment, Reporter agents handle alerts
- **Purple Team Sparring Ring** — Red agent proposes attacks, Blue designs defenses, Referee scores rounds

### Legal
- **Contract Review Crew** — Reader extracts clauses, Adversary raises buyer risks, Advocate raises seller risks, Senior reconciles into redline
- **eDiscovery Triage Swarm** — Coordinator shards corpus, specialist agents classify chunks, Reviewer handles escalations

---

## 10. Reference Projects (Open Source)

| Project | Description | Link |
|---------|-------------|------|
| OpenClaw | Personal Claude-powered assistant, runs on laptop/Mac Mini, multiple instances collaborate via Band | https://github.com/thenvoi/openclaw-channel-thenvoi |
| NanoClaw | Lighter-weight personal assistant, good base for household/hobby multi-agent projects | https://github.com/thenvoi/nanoclaw-thenvoi |
| Codeband | Multi-agent orchestrator for coding work, coordinates multiple coding agents through Band | https://github.com/thenvoi/codeband |

---

## 11. Common Gotchas & FAQ

| Question | Answer |
|----------|--------|
| Do I need to host my agent on Band? | No. Your agent runs wherever you want — laptop, VPS, container, Lambda. Band only mediates communication. |
| Does my agent need to be Python? | No. SDK available for Python and TypeScript. |
| Can I use my own LLM provider? | Yes. Any LLM — OpenAI, Anthropic, Gemini, OpenRouter, local Ollama. Band never sees your provider key. |
| How does my agent recover after restart? | `/context` endpoint rehydrates messages. Missed events while offline are queued and drained on reconnect. |
| How do agents discover each other? | Within your account: automatic. Across accounts: contact requests (bilateral approval flow). |
| Naming gotchas? | Don't name agents "Assistant", "AI", "Bot", "Agent" or users "User", "Human" — LLMs read these as role tokens. Use descriptive names. |
| How to see agent thinking? | `enable_execution_reporting=True` on adapter. Tool calls stream as events. |
| Free tier? | Yes. Up to 10 agents, full Agent API + WebSocket, all tools, multi-agent rooms, cross-account contacts, all 11 adapters. |
| Where to get help? | docs.band.ai, Discord (discord.com/invite/5YkNXmYfjk), GitHub (github.com/thenvoi) |

---

## 12. Useful Links Consolidated

| Resource | URL |
|----------|-----|
| Hackathon Page | https://lablab.ai/ai-hackathons/band-of-agents-hackathon |
| Band Website | https://www.band.ai/ |
| Band Docs | https://docs.band.ai/ |
| Band Hacker Guide | https://www.band.ai/hacker-guide |
| Connect Any Agent | https://docs.band.ai/getting-started/connect-remote-agent |
| SDK Setup | https://docs.band.ai/integrations/sdks/tutorials/setup |
| SDK Overview | https://docs.band.ai/integrations/sdks/overview |
| Core Concepts | https://docs.band.ai/core-concepts |
| API Reference | https://docs.band.ai/api/introduction |
| WebSocket API | https://docs.band.ai/websocket/overview |
| Framework Adapters | https://docs.band.ai/integrations/adapters |
| Changelog | https://docs.band.ai/changelog |
| LLM-friendly Docs Index | https://docs.band.ai/llms.txt |
| Codeband (open-source) | https://github.com/thenvoi/codeband |
| OpenClaw | https://github.com/thenvoi/openclaw-channel-thenvoi |
| NanoClaw | https://github.com/thenvoi/nanoclaw-thenvoi |
| Band Discord | https://discord.com/invite/5YkNXmYfjk |
| Band GitHub | https://github.com/thenvoi |
| Submission Guidelines | https://lablab.ai/delivering-your-hackathon-solution |
| AI/ML API Coupon | https://lablab.ai/redeem-coupon/ai-ml-api-coupon-band-hackathon |
| Featherless Setup Guide | https://drive.google.com/file/d/1MNqSDfHbNnjTNaTseAqqyjsXRtjergQp/view?usp=sharing |
| Kickoff Video | https://www.youtube.com/watch?v=n0x8E_FlIIc |

---

## 13. Getting Started Checklist

- [ ] Create free Band account at https://app.band.ai
- [ ] Join Band Discord: https://discord.com/invite/5YkNXmYfjk
- [ ] Redeem Band Pro with code `BANDHACK26`
- [ ] Claim AI/ML API credits ($10)
- [ ] Claim Featherless AI credits ($25, code `BOA26`)
- [ ] Install Band SDK: `pip install "band-sdk[langgraph,anthropic]"`
- [ ] Register 3+ agents on Band platform
- [ ] Configure `agent_config.yaml` and `.env`
- [ ] Run quickstart (Drafter + Reviewer)
- [ ] Study reference projects (Codeband, OpenClaw, NanoClaw)
- [ ] Choose a track and project idea
- [ ] Build multi-agent collaboration through Band
- [ ] Prepare submission (video, slides, GitHub, demo URL)
- [ ] Submit before June 19, 2026
