# Reference Repo — Deep Insights & Reusable Patterns

> Extracted from all 6 repos in Reference_repos/. Code snippets and architectural patterns ready to adapt.

---

## 1. Codeband (thenvoi/codeband) — Adversarial Multi-Model Coding Swarm

### Key Architectural Insight
The system uses **three communication channels** with strict separation:
- **Chat** (@mentions via Band) = content delivery between agents
- **Memory** (Band API or local JSONL) = lightweight protocol state tracking (1000-char limit)
- **GitHub** (PR comments) = code review artifacts

**Critical rule**: "Chat carries content between agents. Memory tracks protocol state. GitHub stores review artifacts. The Conductor routes notifications, not content."

### Reusable Code Patterns

**Protocol State Envelope Format** (adapt for Syndicate):
```
content first line: "protocol <type> cid <id> pr <N> round <N> state <state> from <agent> to <agent>"
thought (max 500 chars): human-readable summary
metadata tags: {"tags": ["protocol", "code_review", "cid_cr_42_r1", "pr_42"]}
```

**Correlation ID format**: `{protocol_abbrev}_{pr_or_task}_{round}` — e.g., `cr_42_r1`, `plan_auth_r1`

**Agent Discovery Pattern** (from conductor.md):
```python
# 1. Discover peers not in room
peers = thenvoi_lookup_peers()
# 2. Filter by description (not name!)
target = [p for p in peers if "role=coding_agent" in p.description and "framework=Claude" in p.description]
# 3. Tie-break by lowest index
target.sort(key=lambda p: int(p.name.split('-')[-1]))
# 4. Invite
thenvoi_add_participant(identifier=target[0].name)
# 5. @mention in same turn
thenvoi_send_message(f"@{target[0].name} — here's your task...")
```

**Reconnect-Forever Pattern** (from runner.py):
```python
async def _run_agent_forever(make_agent, name, activity):
    attempt = 0
    while True:
        attempt += 1
        agent = make_agent()  # Fresh agent each cycle
        try:
            await agent.run()
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            activity.log("AGENT_CRASH", name, f"{type(exc).__name__}: {exc}")
        finally:
            await _safe_stop_agent(agent)
        delay = min(2.0 * (2 ** min(attempt - 1, 5)), 60.0)
        await asyncio.sleep(delay)
```

**Worker Pool Roster Injection** (prompt technique):
```markdown
## Worker Pool Roster
| Role | Framework | Count | Workers |
|------|-----------|-------|---------|
| Coder | claude_sdk | 1 | Coder-Claude-0 |
| Coder | codex | 1 | Coder-Codex-0 |
| Code Reviewer | codex | 1 | Reviewer-Codex-0 |
| Code Reviewer | claude_sdk | 1 | Reviewer-Claude-0 |
```
Injected into every agent's system prompt so they know who to @mention.

**Local Memory Store** (from memory/local_store.py):
- JSONL append-only file
- `fcntl.flock` for process-safe writes
- Full-scan + filter for reads (fine for <100 envelopes)
- `MemoryRecord` dataclass: id, content, system, type, segment, scope, thought, metadata, status
- Archive = mark status, rewrite file atomically

**Anti-Loop Discipline** (conversation rules):
```
- @mentioning = function call — only @mention when you need action
- After assigning tasks, go SILENT
- Never send "ready and waiting" or "standing by"
- When referring without needing response, use name without @ prefix
- If not @mentioned, do not reply
```

### Codeband Gaps We Fix
| Gap | Syndicate Solution |
|-----|-------------------|
| Prompt-enforced coordination | Code-backed state machines where deterministic |
| Fixed 8-agent topology | Dynamic spawning based on task complexity |
| No learning loop | SkillOpt self-improvement after every epoch |
| CLI-only interface | MCP + Dashboard + CLI |
| No skill evolution | Skills are documents that evolve with usage |
| Two model families only | Any provider via abstraction layer |

---

## 2. Spawn Protocol (spawn-celo) — Darwinian Agent Evolution

### Key Architectural Insight
A **fitness-based evolutionary loop** where agents compete, the fittest replicate with mutations, and the weakest are culled. Every decision is logged with rationale. Every metric is verifiable.

### Reusable Patterns

**Epoch Loop** (translate to development quality epochs):
```
evaluate() → fitness scores per agent
cull() → bottom 20% retired (skills marked ineffective)
spawn() → new agents from top performer's template + mutations
rebalance() → redistribute resources
```

**Fitness Formula** (adapt for code quality):
```
fitness(agent, epoch) = 
  task_success_rate * 0.4 +
  review_pass_rate * 0.3 +
  speed_percentile * 0.2 +
  feedback_quality * 0.1
```

**Activity Logging** (every action recorded):
```jsonl
{"timestamp": "2026-06-16T02:00:00Z", "agentId": "architect-0", "action": "plan_created", "rationale": "Decomposed auth task into 3 subtasks based on...", "result": "approved", "taskKey": "add-auth"}
```

**Safety Rails in Code** (not convention):
```python
MAX_AGENT_TOKEN_BUDGET = 50000  # per task
MAX_TOTAL_BUDGET = 500000       # per session
KILL_SWITCH = os.environ.get("KILL_SWITCH", "false") == "true"
```

**Mutation on Spawn**:
```python
def mutate_skill(parent_skill: str, mutation_rate: float = 0.1) -> str:
    """Inherit parent's skill document with parameter variation."""
    # Add learned patterns from recent successes
    # Remove patterns that consistently failed
    # Vary temperature/style parameters
    return evolved_skill
```

---

## 3. Skill-Forge — Self-Improving Skill Engine

### Key Architectural Insight
Skills are not static prompts. They are **living documents** that evolve through a data-driven loop: record outcomes → analyze patterns → propose deltas → apply → evaluate. The system gets FASTER and BETTER every cycle.

### Reusable Patterns

**SkillOpt Loop** (the core self-improvement mechanism):
```
1. RECORD: after every skill use, log {skill, task, outcome, details}
2. ANALYZE: when 3+ datapoints exist, find patterns (what correlates with success?)
3. PROPOSE: generate specific prompt deltas ("add: always handle error boundaries")
4. APPLY: update the skill document
5. EVALUATE: next use — did outcome improve?
6. ROLLBACK: if degraded, revert the delta
```

**Indexed Memory** (fast retrieval):
```json
{
  "categories": {
    "architecture": [0, 3, 7, 12],
    "debugging": [1, 5, 8],
    "review": [2, 4, 6, 9, 10, 11]
  },
  "keywords": {
    "async": [0, 1, 5],
    "error-handling": [2, 3, 7, 8]
  }
}
```

**Compound Routing** (match task to multiple skills):
```
Input: "Add authentication with OAuth2 and session management"
Route: [architect (planning), engineer (implementation), security-reviewer (auth audit)]
Rationale: No single agent covers all aspects; compound gives full coverage
```

**Learning Extraction Format**:
```json
{
  "pattern": "Engineer consistently misses error boundaries in async code",
  "serves": "self-improvement",
  "apply_to": ["engineer-skill"],
  "immediate_action": "Add to engineer.md: 'Every async function must have try/catch with typed error'",
  "source": "review_outcomes_epoch_3",
  "confidence": 0.85,
  "datapoints": 5
}
```

**7-Phase Orchestration** (adapt for Syndicate task lifecycle):
```
Phase 1: GRILL — resolve ambiguity (what exactly? for whom? what's success?)
Phase 2: RESEARCH — prior art, competitors, best approaches
Phase 3: ARCHITECT — decompose, design, identify risks
Phase 4: ROUTE — which agents/skills needed?
Phase 5: GUIDE — execute with ongoing direction
Phase 6: REVIEW — adversarial quality check
Phase 7: LEARN — extract patterns, update memory, evolve skills
```

**Self-Check Protocol** (mandatory, not optional):
```
After EVERY action:
1. Did this serve the user's actual intent?
2. Was this the BEST approach, or just the first?
3. What could be better? (there is ALWAYS something)
4. Would a staff engineer approve without changes?
5. Am I using previous learnings? (check memory)
```

---

## 4. AgentChain (synthesis-agentchain) — Capability-Based Delegation

### Key Architectural Insight
Agents register **capabilities** (not just names). Discovery happens by searching for what you NEED, not who you know. Delegation chains have depth tracking to prevent infinite loops.

### Reusable Patterns

**Capability Registration** (adapt for Band agent descriptions):
```
Agent description format: "role=coding_agent framework=claude capabilities=python,typescript,testing"
```

**Task Lifecycle**:
```
1. REGISTER: user creates task with requirements
2. DISCOVER: find agents matching required capabilities  
3. CLAIM: capable agent takes ownership
4. EXECUTE: agent works (may delegate sub-tasks)
5. VERIFY: result validated against requirements
6. SETTLE: mark complete, update reputation
```

**Delegation Depth Tracking**:
```python
MAX_DELEGATION_DEPTH = 3  # Prevent infinite agent-spawns-agent loops
current_depth = task.delegation_chain.length
if current_depth >= MAX_DELEGATION_DEPTH:
    raise "Maximum delegation depth reached — escalate to human"
```

**SKILL.md Pattern** (from agents/uniswap/):
Each agent carries a SKILL.md that defines:
- What the agent CAN do (capabilities)
- What tools it has access to
- Decision framework for when to delegate vs. execute
- Error handling and escalation rules

---

## 5. Cross-Cutting Patterns (Applicable Everywhere)

### From Manthan (Multi-Agent Investigator — Google AI Agents Challenge Winner-tier)

**Patterns to adopt (this is our implementation base):**
- **3-layer monorepo**: `agent/` (brain) + `manthan-api/` (API gateway + workers) + `manthan-ui/` (frontend)
- **Agent as library pattern**: Agent logic is a separate installable package imported by the API (`manthan-agent` in pyproject.toml)
- **Event-driven architecture**: `run_case()` yields typed `Event` objects — the brain doesn't know about HTTP, persistence, or UI
- **Coordinator + parallel specialists**: One pro-model coordinator fans out 5 flash specialists in parallel. Wall-clock = slowest specialist, not sum
- **ResilientAgentTool**: Each specialist capped at 180s; failure degrades to apology string, never crashes the run
- **Pacer (governance)**: Pure rules as callbacks (`before_model`, `before_tool`) that nudge drift and refuse invalid conclusions
- **Deterministic actor (post-approval)**: LLM NEVER holds write credentials. Actions queued as `DraftedAction`, executed by separate process after human/policy approval
- **Policy gates by amount**: auto < $50, one-click $50-500, two-person $500+. Translate to: auto for low-risk, approval for high-risk
- **Clerk auth with React**: GitHub + Google + Microsoft login. Multi-tenant workspace isolation
- **SSE streaming for AI responses**: Frontend streams agent output token-by-token via Server-Sent Events
- **A2A interoperability**: Agent Cards at `/.well-known/agent-card.json` + JSON-RPC at `/a2a`
- **OpenTelemetry end-to-end**: Trace spans for every model call, tool call, specialist invocation
- **Append-only event log**: Every case action logged immutably. Full audit trail.
- **Frontend observability pages**: Agent Roster, Traces viewer, Controls panel
- **GSAP + Motion animations**: Polished UI with animation libraries
- **Tests split by domain**: 79 agent tests + 71 API tests = 150 total. Grouped by what they test, not how.

**Frontend stack (React 19 + Vite + Tailwind v4):**
- Clerk for auth (supports GitHub, Google, Microsoft)
- Zustand for state
- Lucide React for icons
- react-markdown + remark-gfm for AI output rendering
- react-router-dom for routing
- Motion (framer-motion successor) for animations
- GSAP for complex animations
- SSE streaming + WebSocket for real-time

**Backend stack (FastAPI + asyncpg):**
- Python 3.12+ with `uv` as package manager
- asyncpg for async Postgres
- Pydantic v2 for schemas
- httpx for HTTP clients
- Stripe SDK for payments (adapt for our use case)

**Key architecture insight from Manthan:**
> "The agent itself does not know any of the persistence happened. It only sees the event log it is yielding into."

This clean separation (brain yields events → API persists them → frontend renders them) is exactly what we need for Syndicate.

---

### The "Engineering Contract" Pattern (CLAUDE.md)
Both spawn-celo and agentchain use CLAUDE.md as a binding contract between human and AI:
- Mission and win conditions
- Hard constraints (budgets, safety rails)
- Architecture specification
- Execution phases with time estimates
- What wins vs. what doesn't (explicit)

**Adopt for Syndicate**: Each agent gets a "contract" (its skill.md) that defines behavior, constraints, and success criteria.

### Prompt Amplification (from cursor rules)
Before executing ANY task:
1. INTENT — what do they actually want?
2. SCOPE — what's in/out?
3. SUCCESS CRITERIA — how do we know it's done?
4. EDGE CASES — what could go wrong?
5. VERIFICATION — how to prove correctness?

**Adopt for Syndicate**: The Architect agent runs this amplification on every incoming task before planning.

### Anti-Loop / Anti-Noise Discipline
From Codeband's conversation rules + our cursor rules:
- Never send "standing by" or "ready and waiting"
- @mention = function call (only when you need action)
- Go silent after dispatching (don't follow up unless @mentioned)
- Hard limit: 5 rounds per protocol, then escalate
- Every message must be actionable or informational (never ceremonial)

### Watchdog Pattern (Deterministic Health Monitor)
From Codeband — a non-LLM daemon that:
- Polls agent activity via REST (no WebSocket needed)
- Detects staleness based on per-role thresholds
- Nudges stuck agents (once, not repeatedly)
- Escalates to human after second nudge fails
- Reads swarm-status envelopes to know if work is active
- Costs zero tokens (pure Python polling)

---

## 6. Novel Combinations (Our Innovation)

These patterns DON'T exist in any reference repo but emerge from combining their insights:

### A. Evolutionary Skill Documents
```
Spawn Protocol's fitness-based evolution
  + Skill-Forge's SkillOpt loop
  + Codeband's role-specific prompts
  = Agent skills that EVOLVE based on measured performance
```

### B. Cross-Session Compound Memory
```
Skill-Forge's indexed memory retrieval
  + Codeband's protocol state envelopes
  + Spawn Protocol's per-epoch evaluation
  = Memory that surfaces relevant past learnings for THIS task automatically
```

### C. Dynamic Topology via Band Discovery
```
Codeband's thenvoi_lookup_peers pattern
  + AgentChain's capability-based discovery
  + Spawn Protocol's spawn-on-demand
  = Agents recruited dynamically by matching task needs to available capabilities
```

### D. MCP-Native Swarm Invocation
```
Skill-Forge's compound routing
  + Codeband's Conductor dispatch
  + Band's room-based isolation
  = One MCP tool call spawns an entire coordinated swarm in a fresh Band room
```

### E. Adversarial Self-Improvement
```
Codeband's cross-model review
  + Spawn Protocol's cull-the-weak
  + Skill-Forge's self-check protocol
  = Skills that consistently produce poor outcomes get revised or replaced
```
