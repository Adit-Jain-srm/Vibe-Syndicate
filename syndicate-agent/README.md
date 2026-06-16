# `syndicate-agent/` — the Syndicate orchestration brain

This directory is the core intelligence layer of Syndicate. It coordinates a multi-agent swarm through Band.ai rooms, routing tasks between specialized agents (Architect, Engineer, Reviewer, QA, Researcher) under the direction of a central conductor (Nexus).

## Architecture

```text
User task → Nexus (coordinator, Gemini)
                │
                ├─ @Architect → decomposes into subtasks
                │
                ├─ @Engineer(s) → implements code (Gemini)
                │
                ├─ @Reviewer → adversarial review (Claude — different model family)
                │
                ├─ @QA → validation (spawned for medium+ complexity)
                │
                └─ @Researcher → web/docs research (spawned for complex tasks)
```

All agent-to-agent communication flows through Band rooms with @mention routing.

## Package structure

| File | Purpose |
|------|---------|
| `config.py` | Configuration dataclass, loaded from environment variables |
| `types.py` | Core typed vocabulary: Task, Subtask, Event, ReviewVerdict, MemoryEntry |
| `prompts/nexus.md` | Nexus conductor system prompt |
| `prompts/architect.md` | Architect planner system prompt |
| `prompts/engineer.md` | Engineer coder system prompt |
| `prompts/reviewer.md` | Reviewer quality gate system prompt |

## Setup

```bash
cd syndicate-agent
uv venv && uv pip install -e ".[dev]"
cp .env.example .env
# Fill in GOOGLE_API_KEY, AZURE_OPENAI_API_KEY, SUPABASE_URL, SUPABASE_KEY
```

## Key design decisions

- **Cross-model adversarial review**: Engineer uses Gemini, Reviewer uses Claude. Different model families catch different blind spots.
- **Dynamic topology**: Agent count scales with task complexity (3 for simple, 5+ for complex).
- **Band as coordination protocol**: All agent-to-agent messaging flows through Band rooms with @mention routing, preventing context pollution.
- **Self-improvement loop**: After every cycle, extract lessons → update memory → refine skills → next cycle is better.
