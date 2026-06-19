# Syndicate — System Architecture

> High-level architecture of the Syndicate multi-agent orchestration platform.
> A self-improving swarm that compounds intelligence across sessions.

---

## High-Level System Diagram

```mermaid
graph TB
    subgraph surfaces ["User Surfaces"]
        MCP["MCP Server\n(9 tools in Cursor IDE)"]
        DASH["Web Dashboard\n(10 pages, 3D, real-time)"]
        CLI["CLI\n(future)"]
    end

    subgraph band ["Band.ai Coordination Protocol"]
        ROOMS["Rooms + @mention Routing\nPeer Discovery | WebSocket | Room-per-task"]
    end

    subgraph swarm ["Agent Swarm (6 Agents)"]
        NEX["Nexus\nConductor\nGemini 2.5 Flash"]
        ARCH["Architect\nPlanner\nGemini 2.5 Flash"]
        ENG["Engineer\nCoder\nGemini 2.5 Flash"]
        REV["Reviewer\nQuality Gate\nAzure GPT-4o"]
        RES["Researcher\nDiscovery\nGemini 2.5 Flash"]
        QA["QA\nValidator\nGemini 2.5 Flash"]
    end

    subgraph intel ["Intelligence Layer"]
        MEM["Memory Engine\n3 layers + pgvector\nsemantic search"]
        MET["Metrics Engine\nfirst_pass_rate\nreview_score"]
        SELF["Self-Improvement\nSkillOpt Loop\nprompt evolution"]
    end

    subgraph data ["Data Layer — Supabase"]
        DB["PostgreSQL + pgvector + Realtime + RLS\nagents | tasks | events | memory | approvals | task_metrics"]
    end

    MCP --> ROOMS
    DASH --> ROOMS
    CLI --> ROOMS
    ROOMS --> NEX
    NEX --> ARCH
    NEX --> ENG
    NEX --> RES
    NEX --> QA
    ENG --> REV
    REV -->|feedback| ENG
    ARCH --> NEX
    REV --> NEX
    QA --> NEX
    NEX --> MEM
    NEX --> MET
    MET --> SELF
    SELF -->|evolves prompts| ENG
    SELF -->|evolves prompts| ARCH
    MEM --> DB
    MET --> DB
    DASH -.->|Realtime subscription| DB
```

---

## Task Lifecycle (Sequence)

```mermaid
sequenceDiagram
    participant U as User (IDE/Dashboard)
    participant N as Nexus (Conductor)
    participant A as Architect
    participant E as Engineer (Gemini)
    participant R as Reviewer (GPT-4o)
    participant Q as QA
    participant M as Memory + Metrics

    U->>N: syn_task "add rate limiter"
    N->>N: Analyze complexity = medium
    N->>A: @Architect — decompose this task
    A->>N: Plan ready (3 subtasks)
    N->>E: @Engineer — implement subtask 1
    E->>R: @Reviewer — code ready for review
    R->>R: Adversarial review (different model!)
    alt Review PASSED
        R->>N: PASS (risk: low)
        N->>Q: @QA — validate implementation
        Q->>N: Validation passed
        N->>U: Task complete
    else Review FAILED
        R->>E: FAIL — missing error handling
        E->>R: Revised code for re-review
        R->>N: PASS on retry
        N->>U: Task complete
    end
    N->>M: Extract learnings + compute metrics
    M->>M: Self-improvement cycle (evolve prompts)
```

---

## Memory and Self-Improvement Flow

```mermaid
flowchart LR
    EXEC["Execute\nTask"] --> REVIEW["Review\nOutcome"]
    REVIEW --> EXTRACT["Extract\nPatterns"]
    EXTRACT --> STORE["Update\nMemory"]
    STORE --> EVOLVE["Evolve\nAgent Prompts"]
    EVOLVE --> EVAL["Evaluate\nImprovement"]
    EVAL -->|next task is better| EXEC
```

---

## Three Memory Layers

```mermaid
graph TB
    subgraph L1 ["Layer 1: Protocol State (ephemeral)"]
        P1["Current task step"]
        P2["Assigned agents"]
        P3["Subtask status"]
    end

    subgraph L2 ["Layer 2: Project Memory (permanent)"]
        M1["Coding conventions"]
        M2["Architecture decisions"]
        M3["Gotchas and edge cases"]
    end

    subgraph L3 ["Layer 3: Agent Learning (permanent)"]
        A1["Review failure patterns"]
        A2["Skill evolution history"]
        A3["Prompt delta outcomes"]
    end

    L2 -->|768-dim embeddings| VS["pgvector\nCosine Similarity\nSemantic Search"]
    L3 -->|pattern detection| SI["Self-Improvement\nEngine"]
    SI -->|prompt deltas| AGENTS["Agent System Prompts"]
```

---

## Cross-Model Adversarial Review

```mermaid
graph LR
    subgraph same ["Same-Model Review (BAD)"]
        G1["Gemini writes"] --> G2["Gemini reviews"]
        G2 --> BAD["Same blind spots\nMisses same bugs"]
    end

    subgraph cross ["Cross-Model Review (SYNDICATE)"]
        C1["Gemini 2.5 Flash\nwrites code"] --> C2["Azure GPT-4o\nreviews code"]
        C2 --> GOOD["Different training\nCatches what other misses"]
    end
```

---

## MCP Integration (IDE-Native Swarm)

```mermaid
graph LR
    subgraph cursor ["Cursor IDE"]
        USER["Developer"] --> CHAT["Cursor Chat"]
    end

    subgraph mcp ["MCP Server (9 tools)"]
        INIT["syn_init"]
        TASK["syn_task"]
        STATUS["syn_status"]
        REVIEW["syn_review"]
        MEMORY["syn_memory"]
        FIND["syn_find_tool"]
        INSTALL["syn_install_skill"]
        LIST["syn_list_skills"]
        INFO["syn_skill_info"]
    end

    subgraph backend ["Backend Services"]
        SUPA["Supabase"]
        BAND["Band.ai Swarm"]
        GH["GitHub API"]
    end

    CHAT --> mcp
    TASK --> SUPA
    TASK --> BAND
    STATUS --> SUPA
    MEMORY --> SUPA
    FIND --> GH
    REVIEW --> BAND
```

---

## Deployment Architecture

```mermaid
graph TB
    subgraph vercel ["Vercel (Frontend)"]
        UI["React SPA\nsyndicate-ui-five.vercel.app\nAuto-deploy from main"]
    end

    subgraph supabase ["Supabase (Database)"]
        PG["PostgreSQL + pgvector"]
        RT["Realtime WebSocket"]
        RLS_DB["Row Level Security"]
    end

    subgraph local ["Local Machine (Agents)"]
        SWARM["python -m syndicate_agent.main\n6 agents running concurrently"]
        MCP_S["MCP Server\nsyndicate-mcp/server.py"]
    end

    subgraph bandcloud ["Band.ai (Cloud)"]
        BAND_R["Rooms + Routing\nWebSocket + REST"]
    end

    UI <-->|Realtime subscriptions| RT
    UI <-->|REST API| PG
    SWARM <-->|Agent SDK WebSocket| BAND_R
    SWARM -->|Write events/metrics| PG
    MCP_S -->|Read/write| PG
    MCP_S -->|Task dispatch| BAND_R
```

---

## Dynamic Topology (Swarm Scales to Complexity)

```mermaid
graph TB
    subgraph simple ["Simple Task (3 agents)"]
        S_N["Nexus"] --> S_E["Engineer"]
        S_E --> S_R["Reviewer"]
    end

    subgraph medium ["Medium Task (4-5 agents)"]
        M_N["Nexus"] --> M_A["Architect"]
        M_A --> M_E["Engineer"]
        M_E --> M_R["Reviewer"]
        M_R -->|if fail| M_E
        M_N --> M_Q["QA"]
    end

    subgraph complex ["Complex Task (6 agents)"]
        C_N["Nexus"] --> C_RES["Researcher"]
        C_N --> C_A["Architect"]
        C_A --> C_E["Engineer"]
        C_E --> C_R["Reviewer"]
        C_R -->|if fail| C_E
        C_N --> C_Q["QA"]
    end
```

---

## Core Principles

| # | Principle | Implementation |
|---|-----------|---------------|
| 1 | **Compound Intelligence** | Every task teaches the system. Memory persists. Skills evolve. Session 100 is 10x better than session 1. |
| 2 | **Visible Collaboration** | Agent-to-agent work is not hidden. Real-time dashboard shows who did what, why, and how handoffs happened. |
| 3 | **Cross-Model Adversarial** | The model that writes (Gemini) is never the model that reviews (GPT-4o). Different families catch different blind spots. |
| 4 | **Dynamic Topology** | Agent count scales with complexity. Simple = 3 agents. Complex = 6 agents. The swarm breathes. |
| 5 | **Human-in-the-Loop** | High-risk decisions escalate to humans. The system asks, not assumes. |
| 6 | **Self-Improvement Loop** | After every cycle: extract lessons, update memory, refine prompts. Next cycle is measurably better. |

---

## Agent Roster (Detailed)

### Nexus — Conductor
- **Model**: Gemini 2.5 Flash
- **Role**: Receives all incoming tasks. Analyzes complexity. Dynamically recruits agents. Tracks protocol state. Reports completion.
- **Band tools**: `band_lookup_peers`, `band_add_participant`, `band_send_message`, `band_create_chatroom`
- **Key behavior**: Routes work to specialists. Never implements. Goes silent after dispatching.

### Architect — Planner
- **Model**: Gemini 2.5 Flash
- **Role**: Decomposes tasks into structured subtasks with dependencies. Identifies risks. Defines success criteria.
- **Output**: Numbered subtasks with descriptions, dependencies, estimated complexity.
- **Key behavior**: Amplifies intent before planning. Identifies edge cases proactively.

### Engineer — Coder
- **Model**: Gemini 2.5 Flash
- **Role**: Implements code. Follows project conventions from memory. Handles one subtask at a time.
- **Key behavior**: Checks memory before implementing. Applies learned patterns. Produces typed code with error handling.
- **Evolving**: Self-improvement engine modifies this agent's prompt based on review outcomes.

### Reviewer — Quality Gate
- **Model**: Azure OpenAI GPT-4o (DIFFERENT model family)
- **Role**: Adversarial code review. Catches bugs, missing error handling, security issues.
- **Output**: Structured verdict — PASS/FAIL with findings and severity.
- **Why different model**: Same-model review shares blind spots. Cross-model provides genuine adversarial perspective.

### Researcher — Discovery
- **Model**: Gemini 2.5 Flash
- **Role**: Web research, documentation lookup, tool discovery, prior art.
- **Spawning**: Only recruited for complex tasks or knowledge gaps.

### QA — Validator
- **Model**: Gemini 2.5 Flash
- **Role**: Testing and verification. Validates implementation meets requirements.
- **Spawning**: Recruited for medium+ complexity tasks.

---

## MCP Server — 9 Tools

| Tool | Purpose | Connects To |
|------|---------|-------------|
| `syn_init` | Initialize swarm for project | Supabase (agent count, skills, memory) |
| `syn_task` | Submit task to swarm | Supabase tasks + Band |
| `syn_status` | Check agents, tasks, approvals | Supabase |
| `syn_review` | Request cross-model code review | GPT-4o reviewer queue |
| `syn_memory` (query) | Search accumulated knowledge | Supabase + pgvector |
| `syn_memory` (store) | Teach system a convention | Supabase memory |
| `syn_find_tool` | Search for skills/tools | GitHub API |
| `syn_install_skill` | Install from GitHub | npx skills + filesystem |
| `syn_list_skills` | Show installed skills | Local directories |

**Protocol**: JSON-RPC 2.0 over stdio (MCP standard)
**Config**: `.cursor/mcp.json` — one entry, auto-discovered by Cursor

---

## Frontend — 10 Pages

| Page | Function | Data Source |
|------|----------|-------------|
| Landing `/` | Cinematic 3D intro + CTA | Static + GSAP ScrollTrigger |
| Dashboard `/app` | Task submission, swarm status | Supabase Realtime |
| Pipeline `/pipeline` | Signal flow (expandable stages) | Supabase events |
| Live Room `/live` | Real-time agent event stream | Supabase Realtime |
| Agents `/agents` | Roster with models and status | Supabase agents |
| Tasks `/tasks` | Kanban pipeline | Supabase tasks |
| Metrics `/metrics` | KPIs + improvement trend | Supabase task_metrics |
| Memory `/memory` | Store/query learnings | Supabase memory + RPC |
| Approvals `/approvals` | Human-in-the-loop decisions | Supabase approvals |
| Settings `/settings` | Theme, sound, preferences | Local state |

**Design**: Dark-mode (#08090a), one accent (indigo #6366f1), glassmorphic, Three.js 3D, Framer Motion + GSAP, Web Audio API sound design.

---

## Data Layer — Supabase Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `agents` | Swarm roster | name, role, status, model, description |
| `tasks` | Task pipeline | id, description, status, complexity, assigned_agents |
| `events` | Agent activity log | agent, type, content, task_id, created_at |
| `memory` | Compound intelligence | content, category, agent, tags, embedding(768) |
| `approvals` | HITL decisions | task_id, description, risk_level, status |
| `task_metrics` | Performance | task_id, first_pass_rate, iteration_count, time_to_complete |

**Features**: pgvector (semantic search), Realtime (WebSocket), RLS (anon reads), RPC (`match_memories`)

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Coordination | Band.ai | Rooms, @mention routing, WebSocket, peer discovery |
| LLM Primary | Google Gemini 2.5 Flash | 5 agents (fast, free, powerful) |
| LLM Adversarial | Azure OpenAI GPT-4o | Reviewer (different model family) |
| Embeddings | Google text-embedding-004 | 768-dim vectors for semantic memory |
| Frontend | React 19 + Vite 8 + TypeScript 6 | SPA with real-time |
| Styling | Tailwind CSS v4 | Dark-mode-first |
| State | Zustand | Lightweight store |
| 3D | Three.js + React Three Fiber | Orb constellation, particles |
| Animation | Framer Motion + GSAP | Springs, scroll reveals |
| Sound | Web Audio API | Synthesized feedback |
| Auth | Clerk | GitHub + Google + Microsoft OAuth |
| Database | Supabase (PostgreSQL) | Relational + JSONB + Realtime |
| Vector | pgvector | Cosine similarity on embeddings |
| MCP | Python (stdio JSON-RPC) | 9 IDE tools |
| Agent SDK | Band SDK (Python) | Agent lifecycle + adapters |
| Deploy | Vercel + Supabase | Managed, auto-deploy |

---

## Differentiation

| Existing Tools | Syndicate |
|---------------|-----------|
| Stateless (forget between sessions) | 3-layer persistent memory compounds forever |
| Single model reviews its own work | Cross-model adversarial (Gemini vs GPT-4o) |
| Fixed agents (just prompts) | Dynamic topology — swarm scales to complexity |
| No visibility into AI work | Real-time dashboard shows every handoff |
| Never learns your codebase | Project memory stores conventions + gotchas |
| Same quality day 100 as day 1 | Self-improvement: quantified, measurable |
| Separate tools for plan/code/review | Unified lifecycle through Band rooms |
| CLI or web (not both) | MCP (IDE) + Dashboard (web) + CLI (future) |
