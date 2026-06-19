---
name: deep-system-diagnose
description: Maximum-effort end-to-end system diagnosis. Explores every layer (frontend, backend, API, data, integration, UX), identifies all issues, gaps, and improvement opportunities. Forces a looping investigation pattern that refuses to stop until every subsystem is examined. Use when user says "diagnose", "audit", "find all issues", "what's broken", or wants a comprehensive system health check.
user-invocable: true
---

# Deep System Diagnose

A maximum-effort, end-to-end system diagnosis skill that forces comprehensive investigation across every layer. This is NOT a quick scan — it is a systematic, exhaustive audit that loops until every subsystem is examined and every issue is documented.

## When to Invoke

- User says "diagnose", "audit", "find all issues", "what's wrong", "deep analysis"
- Before major refactors or releases (pre-ship audit)
- After discovering one bug that hints at systemic problems
- When something "feels off" but the specific issue is unclear
- When a demo/presentation is upcoming and quality must be verified

## Core Philosophy

**You are not debugging a single bug. You are auditing a SYSTEM.**

A single-bug diagnosis stops when it finds the cause. A system diagnosis stops when it has examined every surface and can prove there are no hidden issues. The difference is thoroughness-by-default.

## The Mandatory Loop

For EACH subsystem, execute this loop. Do not skip steps. Do not declare "looks fine" without evidence.

```
LOOP per subsystem:
  1. READ — Read every relevant file (not summaries, actual code)
  2. TRACE — Follow data flow end-to-end through this subsystem
  3. IDENTIFY — List every issue (bugs, gaps, inconsistencies, dead code, stale state)
  4. CLASSIFY — Rate each issue: Critical / High / Medium / Low
  5. CONTEXT — What SHOULD it do vs what it DOES (spec vs reality gap)
  6. OPPORTUNITY — What features/improvements are unlocked by fixing this?
  7. EVIDENCE — Point to exact file:line for every claim
```

## Subsystem Checklist (examine ALL of these)

### Layer 1: Data Flow Integrity

- [ ] Does data created at source arrive at destination unchanged?
- [ ] Are there race conditions between concurrent writers?
- [ ] Is the schema consistent across all consumers (frontend types match backend types)?
- [ ] Are there orphaned records, stale state, or zombie entries?
- [ ] Does real-time propagation actually work (not just in theory)?
- [ ] Are there hardcoded/mocked values pretending to be real data?

### Layer 2: Frontend UX/Explainability

- [ ] Can the user understand WHAT is happening at all times?
- [ ] Can the user understand WHY something is happening?
- [ ] Are loading, error, and empty states all handled gracefully?
- [ ] Does every interactive element give feedback on click?
- [ ] Are there dead links, broken routes, or stub pages?
- [ ] Is progressive disclosure working (overview → detail on demand)?
- [ ] Are animations adding clarity or just decoration?
- [ ] Does the UI tell a STORY (narrative) or just dump data?

### Layer 3: Backend/API Integrity

- [ ] Do all API endpoints actually do what their name suggests?
- [ ] Are there fake/stub implementations behind real-looking interfaces?
- [ ] Is error handling complete (not swallowed, not generic)?
- [ ] Are timeouts, retries, and circuit breakers present?
- [ ] Is authentication/authorization enforced on all sensitive operations?
- [ ] Are there single points of failure?

### Layer 4: Integration Points

- [ ] Do external services (Band, Supabase, LLMs) have proper fallbacks?
- [ ] Is the integration tested under failure conditions?
- [ ] Are API keys/credentials rotated and not hardcoded?
- [ ] Does the system degrade gracefully when a dependency is unavailable?
- [ ] Are webhooks/callbacks properly acknowledged?

### Layer 5: User Workflows (E2E)

- [ ] Walk through every critical user journey start-to-finish
- [ ] Submit a task → Does it actually get processed?
- [ ] Make an approval decision → Does the workflow resume?
- [ ] Check metrics → Are they real or fabricated?
- [ ] View traces → Is the timeline accurate and complete?
- [ ] Each workflow: identify where it breaks, stalls, or lies

### Layer 6: System Architecture

- [ ] Are the promised features actually implemented (not just interfaces)?
- [ ] Is the documentation (README, AGENTS.md) in sync with reality?
- [ ] Are there phantom features (described but not built)?
- [ ] Is the architecture sound for the stated scale requirements?
- [ ] Are there circular dependencies or architectural violations?

## Issue Classification Matrix

| Severity | Definition | Response |
|----------|-----------|----------|
| **Critical** | System lies to the user, data corruption, feature doesn't work at all | Must fix before any demo/release |
| **High** | Feature partially works but has significant gaps, broken edge cases | Fix in current sprint |
| **Medium** | Works but has quality issues, poor UX, missing polish | Fix when touching that area |
| **Low** | Cosmetic, minor inconsistencies, nice-to-have improvements | Backlog |

## Output Format (MANDATORY)

The diagnosis MUST produce a structured report with:

### 1. Executive Summary
- Total issues found (by severity)
- Most critical findings (top 3)
- Overall system health assessment (1-10 scale)
- Recommendation: ship / fix-first / rebuild-needed

### 2. Issue Registry (table format)
```
| # | Issue | Severity | Location (file:line) | Category |
```

### 3. Per-Subsystem Deep Dive
For each of the 6 layers:
- What works well
- What's broken
- What's missing entirely
- Specific improvement opportunities
- Feature additions that become possible after fixes

### 4. Priority Fix Order
Ordered list of what to fix first, with dependency relationships:
- "Fix A before B because B depends on A being correct"
- "Fix C in parallel with D (independent)"

### 5. Improvement Roadmap
Features and enhancements that would upgrade the system from "working" to "excellent":
- Quick wins (< 1 hour each)
- Medium improvements (1-4 hours)
- Major features (4+ hours)

## Anti-Patterns to Flag

During diagnosis, specifically look for and call out:

- **Simulated reality** — Fake data/events that look real to the user
- **Dead code paths** — Functions that exist but are never called
- **Phantom features** — UI elements that don't connect to anything
- **Swallowed errors** — `catch(() => {})` patterns hiding failures
- **Hardcoded magic** — Values that should be configurable but aren't
- **Missing feedback loops** — User actions with no confirmation/response
- **State desync** — Multiple sources of truth that can diverge
- **Security gaps** — Unvalidated input, exposed credentials, no auth
- **Performance bombs** — N+1 queries, unbounded lists, missing pagination
- **Breaking assumptions** — Code that works "by coincidence" not by design

## Loop Termination Criteria

You are DONE only when you can affirm ALL of:

- [ ] Every file in every relevant directory has been read (not skimmed)
- [ ] Every user workflow has been traced end-to-end
- [ ] Every external integration has been verified
- [ ] Every issue has a file:line citation
- [ ] Every claim of "working" is backed by evidence
- [ ] The issue registry is COMPLETE (no "there might be more")
- [ ] The priority ordering considers dependencies
- [ ] The improvement roadmap is actionable (not vague)

## Forcing Maximum Effort

If you find yourself writing:
- "This seems fine" → STOP. Read the actual code and prove it.
- "No issues found" → STOP. You haven't looked hard enough. There are ALWAYS issues.
- "The rest looks good" → STOP. Check every file, not just the first few.
- "I'll skip this for now" → STOP. You cannot skip. The skill demands exhaustive coverage.

The standard is: **Would a staff engineer signing off on this system for production find anything you missed?** If the answer is "maybe" — keep looking.
