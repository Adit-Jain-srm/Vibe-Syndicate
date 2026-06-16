---
name: Syndicate — Strategic Roadmap & Product Specification
overview: "Syndicate (syn) — a self-improving multi-agent developer swarm coordinated through Band. Strategic roadmap covering phases, effort allocation, architecture decisions, and delivery milestones. Quality bar: startup-grade."
todos:
  - id: research-synthesis
    content: Create AGENTS.md with project preferences, architecture decisions, and reference insights synthesized from all 7 repos
    status: completed
  - id: p1-fork-manthan
    content: "P1.1: Fork manthan-main into working directory. Strip ALL billing/dispute domain code. Verify clean build (no domain references remain)."
    status: completed
  - id: p1-supabase-setup
    content: "P1.2: Set up Supabase project. Create schema (agents, tasks, events, memory tables). Replace Docker Postgres references. Verify connection from FastAPI."
    status: completed
  - id: p1-clerk-auth
    content: "P1.3: Configure Clerk with GitHub + Google + Microsoft OAuth. Verify login flow works end-to-end (frontend → backend JWT verification)."
    status: completed
  - id: p1-band-agents
    content: "P1.4: Register 5+ agents on Band platform. Create agent_config.yaml. Write connection test script that proves each agent can send/receive messages in a Band room."
    status: completed
  - id: p1-basic-loop
    content: "P1.5: Implement minimal agent loop — Nexus receives a message, discovers a peer (Architect), invites to room, sends task. Architect acknowledges. Verify in Band UI."
    status: completed
  - id: p1-test-verify
    content: "P1.6: Write tests for P1 — Band connectivity, agent discovery, Supabase CRUD, Clerk auth flow. Run all. Update README with setup instructions."
    status: completed
  - id: p2-nexus-conductor
    content: "P2.1: Implement Nexus conductor prompt + Band integration. Task routing, agent discovery, protocol state tracking. Test: send task → Nexus correctly identifies required agents."
    status: completed
  - id: p2-architect-agent
    content: "P2.2: Implement Architect agent — receives task from Nexus, decomposes into subtasks, returns structured plan. Test: plan quality (has subtasks, files, acceptance criteria)."
    status: completed
  - id: p2-engineer-agent
    content: "P2.3: Implement Engineer agent — receives subtask from Nexus, generates code in isolated workspace. Test: code is syntactically valid, addresses the subtask."
    status: completed
  - id: p2-reviewer-agent
    content: "P2.4: Implement Reviewer agent (DIFFERENT model family from Engineer). Receives PR/code, produces structured review. Test: review catches intentional bugs in test code."
    status: completed
  - id: p2-full-lifecycle
    content: "P2.5: Wire full lifecycle: task → Nexus → Architect → plan → Nexus → Engineer → code → Reviewer → verdict. ALL communication through Band rooms with visible @mentions."
    status: completed
  - id: p2-test-verify
    content: "P2.6: Integration tests for full lifecycle. Verify: every handoff visible in Band room, protocol state envelopes written, no silent failures. Update docs with architecture diagram."
    status: completed
  - id: p3-cross-model
    content: "P3.1: Cross-model adversarial review — Engineer uses Gemini, Reviewer uses Claude. Verify different model families are actually used (log model names)."
    status: completed
  - id: p3-memory-engine
    content: "P3.2: Implement persistent memory — protocol state (per-task), project memory (conventions/learnings), agent memory (cross-task patterns). Store in Supabase + local JSONL."
    status: completed
  - id: p3-self-improvement
    content: "P3.3: Implement one self-improvement cycle — after task completion, extract lessons from review outcomes, update agent skill documents. Log what changed and why."
    status: completed
  - id: p3-dynamic-spawn
    content: "P3.4: Dynamic spawning — Nexus recruits additional agents (Researcher, QA) based on task complexity. Simple tasks = 3 agents, complex = 5+. Test both paths."
    status: completed
  - id: p3-tool-discovery
    content: "P3.5: Implement tool discovery — Researcher agent can search MCP/skill marketplaces, evaluate results, install tools. Test: given a need, finds and installs a relevant skill."
    status: completed
  - id: p3-test-verify
    content: "P3.6: Tests for memory persistence (survives restart), self-improvement (skill doc changed), dynamic spawning (correct agents recruited). Update AGENTS.md with any learned patterns."
    status: completed
  - id: p4-mcp-server
    content: "P4.1: Build MCP server — syn_init, syn_task, syn_status, syn_review, syn_memory, syn_find_tool. Each tool callable from Cursor. Test each tool individually."
    status: completed
  - id: p4-dashboard-core
    content: "P4.2: Dashboard core — live Band room feed (WebSocket), agent status cards, task pipeline visualization. Real data flowing from Band events."
    status: completed
  - id: p4-dashboard-memory
    content: "P4.3: Dashboard memory/evolution page — show accumulated learnings, skill deltas applied, agent performance over time."
    status: completed
  - id: p4-dashboard-approval
    content: "P4.4: Dashboard approval queue — human-in-the-loop decisions rendered as cards, approve/reject actions that trigger next workflow step."
    status: completed
  - id: p4-test-verify
    content: "P4.5: E2E test — user calls syn_task from Cursor → swarm executes → dashboard shows live → result returned. Frontend unit tests for all dashboard components. Update README."
    status: completed
  - id: p5-readme
    content: "P5.1: Write comprehensive README with 5+ mermaid diagrams (architecture, sequence, agent topology, memory flow, self-improvement cycle). API table. Tech stack table. One-command setup."
    status: completed
  - id: p5-deploy
    content: "P5.2: Deploy — Vercel (frontend), Railway/Cloud Run (backend), Supabase (DB). Verify live URL works end-to-end. Add live demo link to README."
    status: completed
  - id: p5-video
    content: "P5.3: Record 5-minute demo video following the script (problem → greenfield init → feature lifecycle → dashboard → self-improvement → vision). Upload to YouTube."
    status: completed
  - id: p5-submit
    content: "P5.4: Submit on lablab.ai — title, short description, long description, tags, cover image, video, slides PDF, GitHub link, demo URL. Verify all fields complete."
    status: completed
isProject: true
---

# Syndicate — Strategic Roadmap & Product Specification

## One-Sentence Pitch

**Syndicate is a self-improving multi-agent development swarm where specialized AI agents collaborate through Band rooms, accumulating intelligence across sessions so the 100th task is executed 10x better than the 1st.**

---

## Why This Wins

| Criterion (from judges) | How Syndicate Scores |
|------------------------|---------------------|
| **Application of Technology** (most important) | Band is the CORE coordination layer — all agent-to-agent collaboration flows through rooms with @mention routing |
| **Presentation** | Real-time dashboard shows the collaboration LIVE. Mermaid diagrams, sequence flows, architecture explained. |
| **Business Value** | Real enterprise problem: dev teams waste time on fragmented, stateless AI tools that never learn |
| **Originality** | Self-improving agents + dynamic spawning + compound memory = no other hackathon project does this |

## Prize Targeting

| Prize | Eligibility | How We Qualify |
|-------|-------------|---------------|
| **Main Prize ($3,500/$2,500/$1,500)** | Band as core collaboration layer, 5+ agents, visible workflow | All agent-to-agent goes through Band rooms with @mention routing. Dashboard shows it live. |
| ~~AI/ML API Prize~~ | ~~Multi-model routing~~ | **NOT TARGETING** — dropped from stack |
| ~~Featherless Prize~~ | ~~Open-source models~~ | **NOT TARGETING** — dropped from stack |

Focus is on the **main prize** — maximum quality on the Band collaboration, visible handoffs, and impressive demo.

---

## Anti-Laziness Protocol (Enforced at Every Step)

Every implementation step MUST follow this sequence. Skipping any step = lazy = unacceptable.

```
1. IMPLEMENT — Write the actual code/feature
2. SELF-REVIEW — Re-read what you wrote. Would a staff engineer approve?
3. TEST — Write at least one test proving it works (not "should work" — PROVE it)
4. VERIFY — Run the test. Run the build. Confirm zero errors.
5. DOC SYNC — Update README/AGENTS.md/relevant docs to reflect new state
6. PROVE — Show evidence (test output, screenshot, Band room message) before claiming done
```

### Quality Gates Per Phase

| After Phase | Required Proof |
|-------------|---------------|
| P1 (Foundation) | All 5 agents visible in Band room. Tests passing. README has setup instructions. |
| P2 (Orchestration) | Full task lifecycle recorded in Band room (screenshot/log). Integration tests green. Architecture diagram in docs. |
| P3 (Intelligence) | Memory persists across restarts (test). Self-improvement cycle logged. Different model families confirmed in logs. |
| P4 (Interface) | MCP tool callable from Cursor (screenshot). Dashboard renders live data. E2E test passes. |
| P5 (Polish) | Live URL works. Video recorded. All submission fields filled. |

### Red Flags That Mean "Go Back"

- "It should work" without running it → run it
- Test file exists but is empty or trivial → write a real test
- Docs say one thing, code does another → sync them
- Agent claims "done" but no evidence shown → show evidence
- Skipping error handling → add it
- Copy-paste without understanding → rewrite in context

---

## Architecture (High-Level)

```mermaid
flowchart TB
    subgraph user [User Surfaces]
        MCP["MCP Server (syn_*)"]
        CLI["CLI (syn task, syn status)"]
        Dashboard["Web Dashboard"]
    end

    subgraph core [Core Engine]
        Nexus["Nexus (Conductor)"]
        Memory["Memory Engine"]
        Skills["Skill Engine"]
        Models["Model Router"]
    end

    subgraph band [Band.ai Layer]
        Rooms["Chat Rooms"]
        WS["WebSocket Events"]
    end

    subgraph swarm [Agent Swarm]
        Arch["Architect"]
        Eng["Engineer(s)"]
        Rev["Reviewer(s)"]
        Res["Researcher"]
        QA["QA"]
    end

    MCP --> Nexus
    CLI --> Nexus
    Dashboard --> Nexus
    Nexus --> Memory
    Nexus --> Skills
    Nexus --> Models
    Nexus --> Rooms
    Rooms --> Arch
    Rooms --> Eng
    Rooms --> Rev
    Rooms --> Res
    Rooms --> QA
    Models --> Featherless["Featherless (open-source)"]
    Models --> AIML["AI/ML API (500+ models)"]
    Models --> Claude["Anthropic Claude"]
    Dashboard -.->|"reads"| WS
```

## Task Lifecycle (What Happens When User Says "syn task 'add auth'")

```mermaid
sequenceDiagram
    participant U as User (IDE/CLI)
    participant N as Nexus (Conductor)
    participant A as Architect
    participant E as Engineer
    participant R as Reviewer
    participant M as Memory

    U->>N: syn task "add authentication"
    N->>M: Load project memory (conventions, past learnings)
    N->>A: @Architect — plan this task
    A->>A: Research, decompose, amplify
    A->>N: Plan ready (subtasks, files, acceptance criteria)
    N->>E: @Engineer — implement subtask-1
    E->>E: Code in isolated worktree
    E->>R: @Reviewer — PR ready (cross-model)
    R->>R: Review (different LLM family)
    alt Review PASSED
        R->>N: Review PASSED (risk: low)
        N->>U: Task complete — PR merged
    else Review FAILED
        R->>E: @Engineer — findings attached
        E->>E: Fix issues
        E->>R: @Reviewer — addressed
    end
    N->>M: Extract learnings, update skills
```

## Self-Improvement Cycle

```mermaid
flowchart LR
    subgraph epoch [Every N Tasks]
        Collect["Collect Outcomes"]
        Analyze["Analyze Patterns"]
        Propose["Propose Skill Deltas"]
        Apply["Update Agent Skills"]
        Evaluate["Measure Improvement"]
    end
    Collect --> Analyze --> Propose --> Apply --> Evaluate --> Collect
```

---

## Strategic Decisions

### What to Build vs. What to Skip

| BUILD (core value) | SKIP (not worth the time) |
|-------------------|--------------------------|
| Multi-agent Band collaboration (the whole point) | Complex auth system (use simple API keys) |
| Real-time dashboard showing agent work | Mobile responsiveness |
| Self-improvement loop with visible evolution | Fancy onboarding wizard |
| MCP server for IDE integration | Payment/billing |
| Cross-model adversarial review | User accounts/multi-tenancy |
| Persistent memory across sessions | Advanced admin panel |
| Dynamic agent spawning | Rate limiting (hackathon, not prod traffic) |
| Beautiful mermaid diagrams in README | Blog/marketing site |

### Where to Invest Maximum Effort

1. **The collaboration must be VISIBLE** — dashboard shows every @mention, handoff, decision in real-time
2. **Cross-model review must be REAL** — genuinely different LLM families catching each other's blind spots
3. **Memory must ACCUMULATE** — show that session 2 is better than session 1
4. **README must be IMPRESSIVE** — diagrams, tables, architecture, one-command setup
5. **Demo video must tell a STORY** — problem → solution → "imagine session 100"

### Where to Accept "Good Enough"

- CLI interface (basic argparse, not a full TUI)
- Error messages (clear but not beautiful)
- Test coverage (critical paths only, not exhaustive)
- Skill evolution (demonstrate the loop, don't need 100 iterations)

---

## Effort Allocation

| Phase | Duration | Effort % | Deliverable |
|-------|----------|----------|-------------|
| Phase 1: Foundation | 4-6 hours | 15% | Copy Manthan, strip domain, register Band agents, get basic agent loop working |
| Phase 2: Orchestration | 8-12 hours | 30% | Full task lifecycle (plan → code → review) with visible Band collaboration |
| Phase 3: Intelligence | 6-8 hours | 20% | Cross-model review (Gemini + Claude), persistent memory, self-improvement cycle |
| Phase 4: Interface | 8-10 hours | 20% | MCP server + real-time dashboard showing live Band room collaboration |
| Phase 5: Polish | 4-6 hours | 15% | Tests, README with diagrams, Vercel deploy, Supabase setup, video, submission |

### Phase 1 Details: Fork and Adapt
1. Copy manthan-main into working directory
2. Strip all billing/dispute domain code
3. Register 5-6 agents on Band platform (using your UUID)
4. Replace Clerk config with YOUR Clerk keys (GitHub + Google + Microsoft)
5. Set up Supabase project (replaces Docker Postgres)
6. Verify: agents can talk to each other through Band rooms
7. Verify: frontend loads with Clerk auth working

### Phase 2 Details: Core Orchestration
1. Implement Nexus (conductor) prompt + Band integration
2. Implement Architect agent (task decomposition)
3. Implement Engineer agent (code generation in isolated workspace)
4. Implement Reviewer agent (cross-model review via Claude)
5. Wire the full lifecycle: task → plan → assign → code → review → complete
6. All communication visible in Band rooms with @mention routing

### Phase 3 Details: Intelligence Layer
1. Cross-model review: Engineer uses Gemini, Reviewer uses Claude
2. Memory engine: protocol state + project memory + agent learning (JSONL + Supabase)
3. Self-improvement: after each task cycle, extract lessons, update agent skills
4. Dynamic spawning: Nexus recruits agents based on task complexity

### Phase 4 Details: Interface Layer
1. MCP server: `syn_task`, `syn_status`, `syn_review`, `syn_init`, `syn_memory`
2. Dashboard: live Band room feed, agent status cards, task pipeline visualization
3. Approval queue: human-in-the-loop for high-risk decisions
4. Trace viewer: see every agent thought, tool call, decision (from Manthan's pattern)

### Phase 5 Details: Ship It
1. README with 5+ mermaid diagrams (architecture, sequence, flow, agent topology, memory)
2. Testing: critical paths only (agent communication, memory, review loop)
3. Deploy: Vercel (frontend) + Railway (backend) + Supabase (DB)
4. Demo video: 5 minutes, telling the compound-intelligence story
5. Submit on lablab.ai with all required fields

---

## Tech Stack Decisions

| Layer | Choice | Rationale |
|-------|--------|-----------|
| **Implementation Base** | Fork `manthan-main`, adapt architecture | Production-grade multi-agent system. Saves weeks of scaffolding. |
| **Agent Coordination** | Band SDK (Python) | Hackathon requirement. @mention routing, WebSocket, rooms. |
| **Agent Brain** | Google ADK patterns (coordinator + parallel specialists) | Proven in Manthan. Fan-out parallelism. Pacer governance. |
| **LLM Providers** | Gemini (free AI Studio) + Anthropic Claude | Gemini for most agents. Claude for adversarial review (different model family). |
| **Frontend** | React 19 + Vite + TypeScript + Tailwind v4 + Zustand | From Manthan. Fast, modern, proven. |
| **Auth** | Clerk (GitHub + Google + Microsoft OAuth) | From Manthan. All 3 providers supported OOTB. |
| **Database** | Supabase (managed PostgreSQL + realtime + edge functions) | Managed. No Docker DB hassle. Built-in realtime subscriptions. |
| **Backend API** | FastAPI + asyncpg | From Manthan. Async-native. WebSocket + SSE + REST in one framework. |
| **Deployment** | Vercel (frontend) + Railway/Cloud Run (backend) + Supabase (DB) | Modern serverless. No infra management. |
| **MCP Server** | Python MCP SDK | Cursor/Claude integration. `syn_*` tools. |
| **Real-time** | SSE (AI streaming) + WebSocket (live updates) | From Manthan. Battle-tested pattern. |
| **Animations** | Motion + GSAP | From Manthan. Premium feel. |
| **Testing** | pytest (backend) + Vitest (frontend) | Fast, modern, adequate coverage. |

### NOT Using (explicitly dropped)

| Dropped | Why |
|---------|-----|
| AI/ML API | User decision — simplifying provider stack |
| Featherless AI | User decision — using Gemini (free) instead |
| Docker-only deployment | Using Vercel + managed services (simpler) |
| Next.js | Using Vite + React (from Manthan — lighter, faster builds) |

---

## Agent Design

| Agent | Cognitive Task | Model | Why |
|-------|---------------|-------|-----|
| **Nexus** | Coordination, routing, state tracking | Gemini 3.1 Pro | Best reasoning, follows complex protocols |
| **Architect** | Planning, decomposition, research | Gemini 3.5 Flash | Fast, good enough for planning |
| **Engineer** | Code implementation | Gemini 3.1 Pro | Strong code generation |
| **Reviewer** | Adversarial code review | Anthropic Claude Sonnet | DIFFERENT model family from Engineer — catches blind spots |
| **Researcher** | Web research, prior art | Gemini 3.1 Flash Lite | Fast, cheap, search synthesis |
| **QA** | Test validation, verification | Gemini 3.1 Flash Lite | Fast verification |

**Key architectural rule from Manthan**: The coordinator (Nexus) uses the strongest model. Specialists use flash models for speed. Cross-model review uses a completely different provider (Gemini writes, Claude reviews).

---

## Implementation Strategy: Fork Manthan, Adapt for Band

### What We Keep from Manthan (saves weeks)
- 3-layer monorepo structure (`agent/` + `api/` + `ui/`)
- FastAPI backend with asyncpg
- React 19 + Vite + Tailwind v4 frontend
- Clerk auth (GitHub + Google + Microsoft)
- SSE streaming for AI responses
- Event-driven agent architecture (brain yields events)
- Zustand state management
- OpenTelemetry observability
- GSAP/Motion animations for polish
- Deterministic action execution pattern (LLM proposes, code executes)

### What We Replace/Add
- Manthan's Google ADK agents → Band SDK agents (coordinated through Band rooms)
- Manthan's Coral SQL data plane → Git workspace + code analysis tools
- Manthan's billing dispute domain → Software development lifecycle domain
- Manthan's triage/investigator/advisor → Nexus/Architect/Engineer/Reviewer/Researcher/QA
- ADD: MCP server for IDE integration
- ADD: Self-improvement loop (SkillOpt pattern from skill-forge)
- ADD: Persistent project memory that compounds
- ADD: Dynamic agent spawning via Band peer discovery
- ADD: Live collaboration dashboard (Band room visualization)

### What We Delete from Manthan
- All billing/dispute domain logic
- Stripe integration
- Coral data plane
- HubSpot/Intercom/Datadog adapters
- Policy engine (replace with code review severity gates)

---

## Memory Architecture

Three layers, each with clear purpose:

| Layer | Scope | Persists | Purpose |
|-------|-------|----------|---------|
| **Protocol State** | Per-task | Until task complete | Track where we are in the workflow (like Codeband envelopes) |
| **Project Memory** | Per-project | Forever | Conventions, gotchas, architecture decisions for THIS codebase |
| **Agent Learning** | Per-agent-role, cross-project | Forever | What patterns work, what fails, how to improve (drives skill evolution) |

---

## Dashboard Design (What Judges See — THE Product Surface)

> "Selling a product right is SO IMPORTANT." The dashboard IS the product. Not a data dump. A narrative.

### Design Language
- **Aesthetic**: Linear meets Dimension — dark command deck, one accent color, glassmorphic surfaces
- **Typography**: Inter Variable (UI) + Berkeley Mono (code/IDs), whisper-weight headlines
- **Colors**: Near-black canvas (#08090a), cool gray scale, single accent (indigo or acid lime)
- **Surfaces**: Glassmorphism (backdrop-blur + translucency), 1px hairline borders, no heavy shadows
- **Shapes**: Pill-shaped interactions (9999px radius), 12px cards, 6px inputs

### Animation (Framer Motion + GSAP — MANDATORY everywhere)
- Page transitions: fade + Y translate (300ms, spring)
- Cards: scale from 0.96 + opacity (250ms, spring)
- Agent status: breathing pulse animation (infinite, 2s)
- Messages: character-by-character streaming reveal
- Task pipeline: flow indicators with spring physics
- Loading: skeleton shimmer, never blank space
- Scroll reveals: staggered fade-in with IntersectionObserver

### Micro-Interactions
- Every button: hover scale (1.02), press scale (0.97)
- Every card: hover lift + border glow
- Focus rings: animated expand outward
- Number counters: animate from 0 when entering viewport
- Agent avatars: subtle idle breathing animation

### Sound Design (subtle, mutable, satisfying)
- Task submitted: soft whoosh
- Agent joined room: subtle ping
- Review passed: satisfying ding
- Task complete: rising tone sequence
- Approval needed: gentle chime

### Pages

| Page | Purpose | Key Elements | Animation Focus |
|------|---------|-------------|-----------------|
| **Live Room** | Watch agents collaborate | Message feed with streaming text, agent avatars with status pulse | Character reveal, message slide-in, avatar breathing |
| **Task Pipeline** | See progress through stages | Kanban with spring-physics card movement | Drag-drop, state transitions, progress bars with overshoot |
| **Agent Status** | Who's doing what | Cards with role, model, current task | Pulse animation, status color transitions |
| **Memory/Evolution** | System learning over time | Timeline of lessons, skill deltas, metrics | Number counters, graph drawing animation, growth visualization |
| **Cost Tracker** | Token usage per model | Animated bar charts | Bar grow-in, hover detail reveal |
| **Approval Queue** | Human-in-the-loop | Cards with weight and urgency | Slide-in from edge, gentle pulse for pending items |

Design inspiration: Linear (clean density), Vercel (developer dashboard), Dimension (glassmorphic atmosphere), Dala (cosmic void + accent punch).

---

## MCP Tools (What Users Call from Cursor)

| Tool | Description | Returns |
|------|-------------|---------|
| `syn_init` | Initialize Syndicate for current project (creates memory context) | Confirmation + project profile |
| `syn_task` | Send a development task to the swarm | Task ID + live status URL |
| `syn_status` | Check current swarm state | Active agents, current task, progress |
| `syn_review` | Request review of staged/committed changes | Review findings (streaming) |
| `syn_research` | Spawn a researcher for a question | Synthesized answer with sources |
| `syn_memory` | Query or write project memory | Relevant memories for context |
| `syn_approve` | Approve a pending human-in-the-loop decision | Confirmation, triggers next step |
| `syn_evolve` | Trigger self-improvement cycle | Report of what changed and why |
| `syn_find_tool` | Search MCP/skill marketplaces for a capability | Ranked results with install commands |
| `syn_install_tool` | Install a discovered skill/MCP into the swarm | Confirmation + capability added |

---

## Dynamic Tool Discovery (Self-Expanding Capability)

Agents can autonomously expand the swarm's capabilities by searching and installing tools from the ecosystem:

### Marketplace Sources (21,600+ skills, 12,500+ MCP servers)

| Source | What It Has | Search Method |
|--------|-------------|---------------|
| [mcpmarket.com](https://mcpmarket.com) | MCP servers for any integration | Web scrape / API |
| [skillsllm.com](https://skillsllm.com) | 3,040+ skills, categorized | Web scrape / API |
| [claudeskills.info](https://claudeskills.info) | 658+ curated Claude skills | Web scrape |
| [claudemarketplaces.com](https://claudemarketplaces.com) | 21,600+ skills, 12,500+ MCP servers | Web scrape |
| GitHub Topics | `cursor-skills`, `mcp-server` repos | gh API search |
| Web Search | Exa / Bright Data SERP for novel tools | Semantic search |

### Discovery Flow

```mermaid
flowchart LR
    subgraph trigger [Trigger]
        NeedDetected["Agent detects missing capability"]
        UserRequest["User asks syn_find_tool"]
    end

    subgraph search [Search]
        Marketplaces["Query 4 marketplaces"]
        GitHub["Search GitHub topics"]
        Web["Web search for tools"]
    end

    subgraph evaluate [Evaluate]
        Rank["Rank by: stars, installs, recency, relevance"]
        Audit["Security audit (scan for injection, exfil)"]
    end

    subgraph install [Install]
        NPX["npx skills add <repo>"]
        MCPConfig["Add to MCP config"]
        Validate["Smoke test the tool"]
    end

    subgraph persist [Persist]
        ProjectMemory["Record in project memory"]
        FutureUse["Available for all future tasks"]
    end

    NeedDetected --> Marketplaces
    UserRequest --> Marketplaces
    Marketplaces --> Rank
    GitHub --> Rank
    Web --> Rank
    Rank --> Audit
    Audit --> NPX
    Audit --> MCPConfig
    NPX --> Validate
    MCPConfig --> Validate
    Validate --> ProjectMemory
    ProjectMemory --> FutureUse
```

### Example Scenarios

| Task | Missing Capability | Discovery Result |
|------|-------------------|-----------------|
| "Add Stripe payments" | No Stripe MCP | Finds stripe MCP server on mcpmarket.com → installs |
| "Write E2E tests" | No Playwright skill | Finds adding-e2e-tests on skillsllm.com → installs |
| "Deploy to Vercel" | No Vercel tooling | Finds Vercel plugin on claudemarketplaces.com → installs |
| "Set up monitoring" | No observability MCP | Finds Datadog/Sentry MCP → installs |

---

## Delivery Milestones

### Milestone 1: "Agents Are Talking" (Phase 1 complete)
- 5 agents registered on Band platform
- Nexus can discover, invite, and @mention other agents
- Basic message exchange working (proof: Band room shows conversation)

### Milestone 2: "Full Task Lifecycle" (Phase 2 complete)
- User sends task → Architect plans → Engineer codes → Reviewer reviews → Complete
- Visible handoffs in Band room
- Cross-model review working (different LLM families)

### Milestone 3: "Intelligence Layer" (Phase 3 complete)
- Multiple model providers in use (Featherless + AI/ML API)
- Memory persists between tasks
- One demonstration of self-improvement (show before/after)

### Milestone 4: "Interface Layer" (Phase 4 complete)
- MCP server callable from Cursor
- Dashboard showing live Band room activity
- Approval queue for human-in-the-loop

### Milestone 5: "Ship It" (Phase 5 complete)
- README with 5+ mermaid diagrams
- docker-compose one-command setup
- 5-minute demo video recorded
- Deployed live at a URL
- Submitted on lablab.ai

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Band free tier hits 10-agent limit | High | Use 5-7 agents max. Reuse agents across tasks. |
| Featherless concurrency bottleneck (4 channels) | Medium | Small models for simple tasks. Queue when busy. |
| LLM reliability (API timeouts, bad responses) | Medium | Fallback chain: Featherless → AI/ML API → local cache. Retry with backoff. |
| Dashboard takes too long to build | Medium | Start with minimal viable: message feed + agent status. Add charts later. |
| Demo doesn't show visible collaboration | Critical | Test the full flow repeatedly. Record backup video early. |
| Self-improvement loop is hard to demonstrate | Medium | Pre-seed one "before" and show "after" in the demo. Log the evolution. |

---

## What Makes This a Startup (Beyond Hackathon)

| Hackathon Version | Startup Version |
|-------------------|-----------------|
| 5-7 agents, single project | Unlimited agents, multi-project |
| JSONL + Supabase memory | Full vector DB + semantic retrieval |
| Single user (Clerk) | Team collaboration with shared agents |
| Basic self-improvement | ML-driven skill optimization with RL signals |
| Free Band tier | Band Enterprise (cross-org agents) |
| Demo dashboard | Production dashboard with billing |
| One workflow (code task) | Many workflows (debug, refactor, deploy, review PR, research, onboard) |
| Gemini + Claude | Any model provider (plug-and-play) |
| Vercel deploy | Self-hosted option + Vercel |

## Manthan Adaptation Map

| Manthan Component | Syndicate Equivalent |
|-------------------|---------------------|
| Billing dispute domain | Software development lifecycle |
| Triage agent | Nexus (conductor) — receives tasks, routes |
| Investigator coordinator | Nexus — orchestrates specialists |
| 5 parallel specialists | Architect + Engineer + Reviewer + Researcher + QA |
| Coral SQL data plane | Git workspace + code analysis + file system tools |
| Policy engine (amount gates) | Risk-based review gates (auto-merge low / approve high) |
| Deterministic actor | Merge executor (git operations post-approval) |
| Advisor agent | Memory/help agent (answers questions about project state) |
| Case → Events → Brief | Task → Events → Completion |
| Stripe webhooks (trigger) | MCP tool call / CLI command / GitHub webhook (trigger) |
| Agent Cards (A2A) | Band agent descriptions + peer discovery |
| Clerk auth | Clerk auth (keep as-is, add GitHub + Google + Microsoft) |
| SSE streaming | SSE streaming (keep as-is) |
| Traces page | Agent collaboration visualization page |
| Controls page | Approval queue + agent management |
