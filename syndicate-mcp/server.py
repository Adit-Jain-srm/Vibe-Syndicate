"""Syndicate MCP Server — exposes swarm tools + skill management for Cursor IDE."""
import asyncio
import json
import os
import subprocess
import sys
import uuid
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

PROJECT_ROOT = Path(__file__).parent.parent
SKILLS_DIR = PROJECT_ROOT / ".cursor" / "skills"
AGENTS_SKILLS_DIR = PROJECT_ROOT / ".agents" / "skills"

TOOLS = [
    {
        "name": "syn_init",
        "description": "Initialize Syndicate for current project. Returns agent count and project info.",
        "inputSchema": {
            "type": "object",
            "properties": {"project_name": {"type": "string", "description": "Name of the project to initialize"}},
            "required": ["project_name"],
        },
    },
    {
        "name": "syn_task",
        "description": "Send a development task to the multi-agent swarm. Returns task ID for tracking.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "description": {"type": "string", "description": "What to build/fix/research"},
                "complexity": {
                    "type": "string",
                    "enum": ["simple", "medium", "complex"],
                    "description": "Task complexity (affects agent count)",
                },
            },
            "required": ["description"],
        },
    },
    {
        "name": "syn_status",
        "description": "Check swarm status: active agents, recent tasks, pending approvals.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "syn_review",
        "description": "Request adversarial cross-model code review (Gemini writes, GPT-4o reviews).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "code": {"type": "string", "description": "Code to review"},
                "context": {"type": "string", "description": "What this code does"},
            },
            "required": ["code"],
        },
    },
    {
        "name": "syn_memory",
        "description": "Query or store persistent project memory (conventions, learnings, decisions).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "action": {"type": "string", "enum": ["query", "store"], "description": "Query existing or store new"},
                "content": {"type": "string", "description": "Content to store (when action=store)"},
                "category": {"type": "string", "enum": ["project", "agent_learning", "protocol_state", "skill_evolution"]},
            },
            "required": ["action"],
        },
    },
    {
        "name": "syn_find_tool",
        "description": "Search GitHub and skill marketplaces for tools/skills matching a need.",
        "inputSchema": {
            "type": "object",
            "properties": {"need": {"type": "string", "description": "What capability you need"}},
            "required": ["need"],
        },
    },
    {
        "name": "syn_install_skill",
        "description": "Install a skill from a GitHub repository into the project.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "repo": {"type": "string", "description": "GitHub repo (owner/name)"},
                "target": {"type": "string", "enum": [".cursor/skills", ".agents/skills"], "description": "Where to install"},
            },
            "required": ["repo"],
        },
    },
    {
        "name": "syn_list_skills",
        "description": "List all installed skills in this project (.cursor/skills and .agents/skills).",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "syn_skill_info",
        "description": "Get details about a specific installed skill.",
        "inputSchema": {
            "type": "object",
            "properties": {"skill_name": {"type": "string", "description": "Name of the skill directory"}},
            "required": ["skill_name"],
        },
    },
    {
        "name": "syn_approve",
        "description": "Approve or reject a pending human-in-the-loop decision.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "approval_id": {"type": "string", "description": "ID of the approval to resolve"},
                "decision": {"type": "string", "enum": ["approved", "rejected"], "description": "Your decision"},
            },
            "required": ["approval_id", "decision"],
        },
    },
    {
        "name": "syn_events",
        "description": "Get recent events for a task (shows agent activity, decisions, progress).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string", "description": "Task ID to get events for"},
                "limit": {"type": "integer", "description": "Max events to return (default 20)"},
            },
            "required": ["task_id"],
        },
    },
    {
        "name": "syn_cancel",
        "description": "Cancel a running or pending task.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string", "description": "Task ID to cancel"},
                "reason": {"type": "string", "description": "Why the task is being cancelled"},
            },
            "required": ["task_id"],
        },
    },
    {
        "name": "syn_watch",
        "description": "Get live updates for a task. Returns current state and recent events since last check.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string", "description": "Task ID to watch"},
                "since": {"type": "string", "description": "ISO timestamp — only return events after this time"},
            },
            "required": ["task_id"],
        },
    },
    {
        "name": "syn_explain",
        "description": "Ask an agent to explain its reasoning for a specific event or decision.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "task_id": {"type": "string", "description": "Task ID context"},
                "question": {"type": "string", "description": "What you want explained (e.g. 'why did the reviewer flag this?')"},
            },
            "required": ["task_id", "question"],
        },
    },
]


async def handle_tool(name: str, args: dict) -> str:
    if name == "syn_init":
        return json.dumps({
            "status": "initialized",
            "project": args.get("project_name", ""),
            "agents": 6,
            "skills_installed": _count_skills(),
            "memory_entries": await _count_memories(),
        })

    elif name == "syn_task":
        desc = args.get("description", "").strip()
        if not desc or len(desc) < 5:
            return json.dumps({"error": "Task description must be at least 5 characters"})

        tid = str(uuid.uuid4())
        complexity = args.get("complexity", "medium")

        if not SUPABASE_URL:
            return json.dumps({"error": "SUPABASE_URL not configured"})

        try:
            async with httpx.AsyncClient() as c:
                resp = await c.post(
                    f"{SUPABASE_URL}/rest/v1/tasks",
                    headers=HEADERS,
                    json={
                        "id": tid,
                        "description": desc,
                        "status": "pending",
                        "complexity": complexity,
                    },
                    timeout=10.0,
                )
                if resp.status_code not in (200, 201):
                    return json.dumps({"error": f"Failed to create task: {resp.status_code}"})

                # Emit creation event
                await c.post(
                    f"{SUPABASE_URL}/rest/v1/events",
                    headers=HEADERS,
                    json={"task_id": tid, "type": "task_created", "agent": "mcp", "content": f"Task submitted via MCP: {desc}", "metadata": {"complexity": complexity, "source": "mcp"}},
                    timeout=10.0,
                )

                # Immediate Band routing (M3) — don't rely on polling
                band_room_id = os.getenv("BAND_ROOM_ID", "")
                nexus_api_key = os.getenv("NEXUS_API_KEY", "")
                band_rest_url = os.getenv("BAND_REST_URL", "https://app.band.ai/")
                if band_room_id and nexus_api_key:
                    try:
                        await c.post(
                            f"{band_rest_url}api/v1/agent/chats/{band_room_id}/messages",
                            headers={"x-api-key": nexus_api_key, "Content-Type": "application/json"},
                            json={"content": f"@Syndicate Nexus New task from MCP (ID: {tid}): {desc}"},
                            timeout=15.0,
                        )
                    except Exception:
                        pass  # Bridge polling will catch it as fallback

        except httpx.TimeoutException:
            return json.dumps({"error": "Request timed out — Supabase may be slow. Task may still have been created."})
        except Exception as e:
            return json.dumps({"error": f"Task creation failed: {str(e)}"})

        return json.dumps({"task_id": tid, "status": "pending", "complexity": complexity, "message": "Task submitted to swarm"})

    elif name == "syn_status":
        result: dict = {"agents": [], "tasks": [], "pending_approvals": 0}
        if SUPABASE_URL:
            async with httpx.AsyncClient() as c:
                r = await c.get(
                    f"{SUPABASE_URL}/rest/v1/agents?select=name,role,status",
                    headers=HEADERS, timeout=10.0,
                )
                if r.status_code == 200:
                    result["agents"] = r.json()
                r = await c.get(
                    f"{SUPABASE_URL}/rest/v1/tasks?select=id,description,status&order=created_at.desc&limit=5",
                    headers=HEADERS, timeout=10.0,
                )
                if r.status_code == 200:
                    result["tasks"] = r.json()
                r = await c.get(
                    f"{SUPABASE_URL}/rest/v1/approvals?select=id&status=eq.pending",
                    headers={**HEADERS, "Prefer": "count=exact"}, timeout=10.0,
                )
                if r.status_code == 200:
                    result["pending_approvals"] = int(r.headers.get("content-range", "0/0").split("/")[-1] or 0)
        return json.dumps(result)

    elif name == "syn_review":
        code = args.get("code", "")
        context = args.get("context", "Code review requested")
        if not code.strip():
            return json.dumps({"error": "No code provided for review"})

        # Actually invoke cross-model review via Gemini or Azure OpenAI
        review_result = await _perform_review(code, context)
        return json.dumps(review_result)

    elif name == "syn_memory":
        if args["action"] == "store" and SUPABASE_URL:
            async with httpx.AsyncClient() as c:
                await c.post(
                    f"{SUPABASE_URL}/rest/v1/memory",
                    headers=HEADERS,
                    json={
                        "content": args.get("content", ""),
                        "category": args.get("category", "project"),
                        "agent": "user",
                        "tags": [],
                    },
                    timeout=10.0,
                )
            return json.dumps({"status": "stored", "category": args.get("category", "project")})
        elif args["action"] == "query" and SUPABASE_URL:
            params = "select=content,category,agent,created_at&order=created_at.desc&limit=10"
            if args.get("category"):
                params += f"&category=eq.{args['category']}"
            async with httpx.AsyncClient() as c:
                r = await c.get(f"{SUPABASE_URL}/rest/v1/memory?{params}", headers=HEADERS, timeout=10.0)
                return json.dumps({"memories": r.json() if r.status_code == 200 else []})
        return json.dumps({"memories": []})

    elif name == "syn_find_tool":
        tools = []
        try:
            async with httpx.AsyncClient() as c:
                r = await c.get(
                    "https://api.github.com/search/repositories",
                    params={"q": f"{args['need']} topic:cursor-skills", "sort": "stars", "per_page": 5},
                    timeout=10.0,
                )
                if r.status_code == 200:
                    tools = [
                        {"name": repo["name"], "full_name": repo["full_name"], "stars": repo["stargazers_count"],
                         "description": repo.get("description", ""), "install": f"npx skills add {repo['full_name']}"}
                        for repo in r.json().get("items", [])
                    ]
        except Exception:
            pass
        return json.dumps({"results": tools, "query": args["need"]})

    elif name == "syn_install_skill":
        repo = args["repo"]
        target = args.get("target", ".agents/skills")
        target_dir = PROJECT_ROOT / target
        target_dir.mkdir(parents=True, exist_ok=True)
        try:
            result = subprocess.run(
                ["npx", "skills", "add", repo],
                capture_output=True, text=True, timeout=30, cwd=str(PROJECT_ROOT),
            )
            if result.returncode == 0:
                return json.dumps({"status": "installed", "repo": repo, "target": target, "output": result.stdout[:500]})
            else:
                return json.dumps({"status": "failed", "repo": repo, "error": result.stderr[:500]})
        except Exception as e:
            return json.dumps({"status": "error", "message": str(e)})

    elif name == "syn_list_skills":
        skills = []
        for d in [SKILLS_DIR, AGENTS_SKILLS_DIR]:
            if d.exists():
                for skill_dir in sorted(d.iterdir()):
                    if skill_dir.is_dir():
                        skill_file = skill_dir / "SKILL.md"
                        desc = ""
                        if skill_file.exists():
                            first_lines = skill_file.read_text(encoding="utf-8", errors="ignore")[:200]
                            desc = first_lines.split("\n")[0].lstrip("# ").strip()
                        skills.append({
                            "name": skill_dir.name,
                            "location": str(d.relative_to(PROJECT_ROOT)),
                            "has_skill_md": skill_file.exists(),
                            "description": desc,
                        })
        return json.dumps({"skills": skills, "total": len(skills)})

    elif name == "syn_skill_info":
        skill_name = args["skill_name"]
        for d in [SKILLS_DIR, AGENTS_SKILLS_DIR]:
            skill_path = d / skill_name / "SKILL.md"
            if skill_path.exists():
                content = skill_path.read_text(encoding="utf-8", errors="ignore")
                return json.dumps({
                    "name": skill_name,
                    "path": str(skill_path.relative_to(PROJECT_ROOT)),
                    "content": content[:2000],
                    "size": len(content),
                })
        return json.dumps({"error": f"Skill '{skill_name}' not found"})

    elif name == "syn_approve":
        approval_id = args["approval_id"]
        decision = args["decision"]
        if SUPABASE_URL:
            async with httpx.AsyncClient() as c:
                r = await c.patch(
                    f"{SUPABASE_URL}/rest/v1/approvals?id=eq.{approval_id}",
                    headers={**HEADERS, "Prefer": "return=representation"},
                    json={"status": decision, "decided_by": "mcp_user", "decided_at": __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat()},
                    timeout=10.0,
                )
                if r.status_code == 200:
                    data = r.json()
                    if data:
                        task_id = data[0].get("task_id", "")
                        new_status = "in_progress" if decision == "approved" else "failed"
                        await c.patch(
                            f"{SUPABASE_URL}/rest/v1/tasks?id=eq.{task_id}",
                            headers=HEADERS,
                            json={"status": new_status},
                            timeout=10.0,
                        )
                        await c.post(
                            f"{SUPABASE_URL}/rest/v1/events",
                            headers=HEADERS,
                            json={"task_id": task_id, "type": f"approval_{decision}", "agent": "user", "content": f"Approval {decision} via MCP", "metadata": {}},
                            timeout=10.0,
                        )

                        # Send Band RESUME/REJECT signal if approved
                        if decision == "approved":
                            band_room_id = os.getenv("BAND_ROOM_ID", "")
                            nexus_api_key = os.getenv("NEXUS_API_KEY", "")
                            band_rest_url = os.getenv("BAND_REST_URL", "https://app.band.ai/")
                            if band_room_id and nexus_api_key:
                                try:
                                    await c.post(
                                        f"{band_rest_url}api/v1/agent/chats/{band_room_id}/messages",
                                        headers={"x-api-key": nexus_api_key, "Content-Type": "application/json"},
                                        json={"content": f"@Syndicate Nexus RESUME: Task {task_id} has been approved. Continue processing."},
                                        timeout=15.0,
                                    )
                                except Exception:
                                    pass

                        return json.dumps({"status": decision, "task_id": task_id, "task_status": new_status})
        return json.dumps({"error": "Failed to resolve approval"})

    elif name == "syn_events":
        task_id = args["task_id"]
        limit = args.get("limit", 20)
        if SUPABASE_URL:
            try:
                async with httpx.AsyncClient() as c:
                    r = await c.get(
                        f"{SUPABASE_URL}/rest/v1/events?task_id=eq.{task_id}&select=type,agent,content,created_at,metadata&order=created_at.asc&limit={limit}",
                        headers=HEADERS, timeout=10.0,
                    )
                    if r.status_code == 200:
                        return json.dumps({"events": r.json(), "task_id": task_id})
            except Exception as e:
                return json.dumps({"error": f"Failed to fetch events: {str(e)}", "task_id": task_id})
        return json.dumps({"events": [], "task_id": task_id})

    elif name == "syn_cancel":
        task_id = args["task_id"]
        reason = args.get("reason", "Cancelled by user")
        if not SUPABASE_URL:
            return json.dumps({"error": "SUPABASE_URL not configured"})
        try:
            async with httpx.AsyncClient() as c:
                r = await c.get(
                    f"{SUPABASE_URL}/rest/v1/tasks?id=eq.{task_id}&select=status",
                    headers=HEADERS, timeout=10.0,
                )
                if r.status_code == 200 and r.json():
                    current_status = r.json()[0]["status"]
                    if current_status in ("complete", "failed"):
                        return json.dumps({"error": f"Cannot cancel task in '{current_status}' state"})

                await c.patch(
                    f"{SUPABASE_URL}/rest/v1/tasks?id=eq.{task_id}",
                    headers=HEADERS,
                    json={"status": "failed", "result": f"Cancelled: {reason}"},
                    timeout=10.0,
                )
                await c.post(
                    f"{SUPABASE_URL}/rest/v1/events",
                    headers=HEADERS,
                    json={"task_id": task_id, "type": "task_cancelled", "agent": "user", "content": f"Task cancelled: {reason}", "metadata": {"source": "mcp"}},
                    timeout=10.0,
                )
                return json.dumps({"status": "cancelled", "task_id": task_id, "reason": reason})
        except Exception as e:
            return json.dumps({"error": f"Cancel failed: {str(e)}"})

    elif name == "syn_watch":
        task_id = args["task_id"]
        since = args.get("since", "")
        if not SUPABASE_URL:
            return json.dumps({"error": "SUPABASE_URL not configured"})
        try:
            async with httpx.AsyncClient() as c:
                # Get task current state
                r = await c.get(
                    f"{SUPABASE_URL}/rest/v1/tasks?id=eq.{task_id}&select=*",
                    headers=HEADERS, timeout=10.0,
                )
                task_data = r.json()[0] if r.status_code == 200 and r.json() else None

                # Get events since timestamp (or all if no since)
                events_url = f"{SUPABASE_URL}/rest/v1/events?task_id=eq.{task_id}&select=type,agent,content,created_at&order=created_at.asc"
                if since:
                    events_url += f"&created_at=gt.{since}"
                r = await c.get(events_url, headers=HEADERS, timeout=10.0)
                events = r.json() if r.status_code == 200 else []

                # Check for pending approvals
                r = await c.get(
                    f"{SUPABASE_URL}/rest/v1/approvals?task_id=eq.{task_id}&status=eq.pending&select=id,title,risk_level",
                    headers=HEADERS, timeout=10.0,
                )
                pending_approvals = r.json() if r.status_code == 200 else []

                return json.dumps({
                    "task": task_data,
                    "new_events": events,
                    "pending_approvals": pending_approvals,
                    "timestamp": __import__('datetime').datetime.now(__import__('datetime').timezone.utc).isoformat(),
                })
        except Exception as e:
            return json.dumps({"error": f"Watch failed: {str(e)}"})

    elif name == "syn_explain":
        task_id = args["task_id"]
        question = args["question"]
        if not SUPABASE_URL:
            return json.dumps({"error": "SUPABASE_URL not configured"})

        try:
            async with httpx.AsyncClient() as c:
                # Fetch task events as context
                r = await c.get(
                    f"{SUPABASE_URL}/rest/v1/events?task_id=eq.{task_id}&select=type,agent,content,created_at&order=created_at.asc&limit=30",
                    headers=HEADERS, timeout=10.0,
                )
                events = r.json() if r.status_code == 200 else []

            if not events:
                return json.dumps({"error": "No events found for this task"})

            # Use Gemini to explain the reasoning
            google_key = os.getenv("GOOGLE_API_KEY", "")
            if not google_key:
                return json.dumps({"error": "GOOGLE_API_KEY not configured for explanations"})

            timeline = "\n".join(
                f"[{e.get('created_at', '')}] {e['agent']}: ({e['type']}) {e['content'][:200]}"
                for e in events
            )
            explain_prompt = f"""You are explaining the reasoning of an AI agent swarm called Syndicate.

Here is the timeline of events for task {task_id}:

{timeline}

The user asks: {question}

Explain clearly and concisely:
1. What happened and why
2. What decision was made and the reasoning
3. What alternatives were considered (if visible from context)
4. What the outcome was"""

            async with httpx.AsyncClient() as c:
                resp = await c.post(
                    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                    headers={"Authorization": f"Bearer {google_key}", "Content-Type": "application/json"},
                    json={
                        "model": "gemini-2.5-flash",
                        "messages": [{"role": "user", "content": explain_prompt}],
                        "temperature": 0.3,
                        "max_tokens": 1500,
                    },
                    timeout=30.0,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    explanation = data["choices"][0]["message"]["content"]
                    return json.dumps({"explanation": explanation, "task_id": task_id, "events_analyzed": len(events)})
                return json.dumps({"error": f"Explanation generation failed: {resp.status_code}"})
        except Exception as e:
            return json.dumps({"error": f"Explain failed: {str(e)}"})

    return json.dumps({"error": f"Unknown tool: {name}"})


def _count_skills() -> int:
    count = 0
    for d in [SKILLS_DIR, AGENTS_SKILLS_DIR]:
        if d.exists():
            count += sum(1 for p in d.iterdir() if p.is_dir() and (p / "SKILL.md").exists())
    return count


async def _count_memories() -> int:
    if not SUPABASE_URL:
        return 0
    try:
        async with httpx.AsyncClient() as c:
            r = await c.get(
                f"{SUPABASE_URL}/rest/v1/memory?select=id",
                headers={**HEADERS, "Prefer": "count=exact"},
                timeout=5.0,
            )
            return int(r.headers.get("content-range", "0/0").split("/")[-1] or 0)
    except Exception:
        return 0


async def _perform_review(code: str, context: str) -> dict:
    """Perform adversarial cross-model code review using Azure OpenAI GPT-4o."""
    azure_endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "")
    azure_key = os.getenv("AZURE_OPENAI_API_KEY", "")
    azure_deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o")
    azure_api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-12-01-preview")

    if not azure_endpoint or not azure_key:
        google_key = os.getenv("GOOGLE_API_KEY", "")
        if not google_key:
            return {"status": "error", "message": "No LLM credentials configured (AZURE_OPENAI or GOOGLE_API_KEY)"}
        return await _review_with_gemini(code, context, google_key)

    review_prompt = f"""You are an adversarial code reviewer (GPT-4o). Review this code critically.

Context: {context}

Code:
```
{code[:8000]}
```

Provide:
1. **Risk Level**: critical / high / medium / low
2. **Issues Found**: List each issue with severity and line reference
3. **Security Concerns**: Any vulnerabilities
4. **Suggestions**: Improvements for quality/performance
5. **Verdict**: PASS or FAIL with one-sentence summary

Be thorough but concise. Focus on real bugs, not style nitpicks."""

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{azure_endpoint}/openai/deployments/{azure_deployment}/chat/completions?api-version={azure_api_version}",
                headers={"api-key": azure_key, "Content-Type": "application/json"},
                json={
                    "messages": [{"role": "user", "content": review_prompt}],
                    "temperature": 0.3,
                    "max_tokens": 2000,
                },
                timeout=30.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                review_text = data["choices"][0]["message"]["content"]

                if SUPABASE_URL:
                    await _store_review_event(code, review_text)

                return {
                    "status": "reviewed",
                    "reviewer": f"Azure OpenAI {azure_deployment} (adversarial cross-model)",
                    "review": review_text,
                    "code_length": len(code),
                    "model": azure_deployment,
                }
            else:
                return {"status": "error", "message": f"Azure OpenAI returned {resp.status_code}: {resp.text[:200]}"}
    except Exception as e:
        return {"status": "error", "message": f"Review failed: {str(e)}"}


async def _review_with_gemini(code: str, context: str, api_key: str) -> dict:
    """Fallback review using Gemini when Azure is unavailable."""
    review_prompt = f"""You are an adversarial code reviewer. Review this code critically.

Context: {context}

Code:
```
{code[:8000]}
```

Provide:
1. Risk Level (critical/high/medium/low)
2. Issues Found (with severity)
3. Security Concerns
4. Suggestions
5. Verdict: PASS or FAIL with summary"""

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": "gemini-2.5-flash",
                    "messages": [{"role": "user", "content": review_prompt}],
                    "temperature": 0.3,
                    "max_tokens": 2000,
                },
                timeout=30.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                review_text = data["choices"][0]["message"]["content"]
                if SUPABASE_URL:
                    await _store_review_event(code, review_text)
                return {
                    "status": "reviewed",
                    "reviewer": "Google Gemini 2.5 Flash (fallback)",
                    "review": review_text,
                    "code_length": len(code),
                    "model": "gemini-2.5-flash",
                }
            return {"status": "error", "message": f"Gemini returned {resp.status_code}"}
    except Exception as e:
        return {"status": "error", "message": f"Gemini review failed: {str(e)}"}


async def _store_review_event(code: str, review_text: str):
    """Store review as an event in Supabase for dashboard visibility."""
    try:
        async with httpx.AsyncClient() as c:
            await c.post(
                f"{SUPABASE_URL}/rest/v1/events",
                headers=HEADERS,
                json={
                    "type": "review_passed" if "PASS" in review_text.upper() else "review_failed",
                    "agent": "reviewer",
                    "content": review_text[:1000],
                    "metadata": {"source": "mcp", "code_length": len(code)},
                },
                timeout=10.0,
            )
    except Exception:
        pass


async def handle_request(req: dict) -> dict | None:
    method = req.get("method", "")
    rid = req.get("id")
    params = req.get("params", {})

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": rid,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "syndicate", "version": "0.3.0"},
            },
        }
    if method == "tools/list":
        return {"jsonrpc": "2.0", "id": rid, "result": {"tools": TOOLS}}
    if method == "tools/call":
        tool_name = params.get("name", "")
        tool_args = params.get("arguments", {})
        try:
            text = await handle_tool(tool_name, tool_args)
        except Exception as e:
            text = json.dumps({"error": f"Tool execution failed: {str(e)}"})
        return {
            "jsonrpc": "2.0",
            "id": rid,
            "result": {"content": [{"type": "text", "text": text}]},
        }
    if method.startswith("notifications/"):
        return None
    return {
        "jsonrpc": "2.0",
        "id": rid,
        "error": {"code": -32601, "message": f"Unknown method: {method}"},
    }


# ─── Auth Token Verification ────────────────────────────────────────────────

MCP_AUTH_TOKEN = os.getenv("MCP_AUTH_TOKEN", "")


def _verify_auth(headers: dict) -> bool:
    """Verify auth token for HTTP transport. Skip if no token configured."""
    if not MCP_AUTH_TOKEN:
        return True
    auth = headers.get("authorization", headers.get("Authorization", ""))
    return auth == f"Bearer {MCP_AUTH_TOKEN}"


# ─── HTTP/SSE Transport (for remote access) ─────────────────────────────────

async def run_http_server(host: str = "0.0.0.0", port: int = 8765):
    """Run MCP server over HTTP with SSE support for remote IDE access."""
    try:
        from aiohttp import web
    except ImportError:
        sys.stderr.write("aiohttp not installed — HTTP transport disabled. Install with: pip install aiohttp\n")
        return

    async def handle_mcp_post(request: web.Request) -> web.Response:
        if not _verify_auth(dict(request.headers)):
            return web.json_response(
                {"error": "Unauthorized"}, status=401
            )
        try:
            body = await request.json()
            resp = await handle_request(body)
            if resp:
                return web.json_response(resp)
            return web.Response(status=204)
        except Exception as e:
            return web.json_response(
                {"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": str(e)}},
                status=400,
            )

    async def handle_sse(request: web.Request) -> web.StreamResponse:
        """SSE endpoint for streaming task updates."""
        if not _verify_auth(dict(request.headers)):
            return web.json_response({"error": "Unauthorized"}, status=401)

        task_id = request.query.get("task_id", "")
        response = web.StreamResponse(
            headers={"Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive"}
        )
        await response.prepare(request)

        last_check = ""
        for _ in range(120):  # 2 min max stream
            try:
                url = f"{SUPABASE_URL}/rest/v1/events?select=type,agent,content,created_at&order=created_at.desc&limit=5"
                if task_id:
                    url += f"&task_id=eq.{task_id}"
                if last_check:
                    url += f"&created_at=gt.{last_check}"

                async with httpx.AsyncClient() as c:
                    r = await c.get(url, headers=HEADERS, timeout=5.0)
                    if r.status_code == 200:
                        events = r.json()
                        if events:
                            last_check = events[0].get("created_at", last_check)
                            data = json.dumps(events)
                            await response.write(f"data: {data}\n\n".encode())
            except Exception:
                pass
            await asyncio.sleep(2)

        await response.write(b"event: done\ndata: stream_ended\n\n")
        return response

    async def handle_health(request: web.Request) -> web.Response:
        return web.json_response({"status": "ok", "server": "syndicate-mcp", "version": "0.3.0"})

    app = web.Application()
    app.router.add_post("/mcp", handle_mcp_post)
    app.router.add_get("/sse", handle_sse)
    app.router.add_get("/health", handle_health)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, host, port)
    await site.start()
    sys.stderr.write(f"MCP HTTP server listening on http://{host}:{port}\n")

    while True:
        await asyncio.sleep(3600)


# ─── Stdio Transport (standard) ─────────────────────────────────────────────

async def run_stdio():
    """Run MCP server over stdio (standard Cursor transport)."""
    reader = asyncio.StreamReader()
    protocol = asyncio.StreamReaderProtocol(reader)
    await asyncio.get_event_loop().connect_read_pipe(lambda: protocol, sys.stdin)
    transport, _ = await asyncio.get_event_loop().connect_write_pipe(
        asyncio.streams.FlowControlMixin, sys.stdout
    )
    writer = asyncio.StreamWriter(transport, None, reader, asyncio.get_event_loop())

    while True:
        try:
            line = await reader.readline()
            if not line:
                break
            header = line.decode().strip()
            if header.startswith("Content-Length:"):
                length = int(header.split(":")[1])
                await reader.readline()
                body = await reader.readexactly(length)
                resp = await handle_request(json.loads(body))
                if resp:
                    out = json.dumps(resp).encode()
                    writer.write(f"Content-Length: {len(out)}\r\n\r\n".encode() + out)
                    await writer.drain()
        except (asyncio.IncompleteReadError, ConnectionResetError):
            break
        except Exception as e:
            sys.stderr.write(f"MCP error: {e}\n")


async def main():
    """Run appropriate transport based on env config."""
    transport_mode = os.getenv("MCP_TRANSPORT", "stdio")

    if transport_mode == "http":
        port = int(os.getenv("MCP_PORT", "8765"))
        await run_http_server(port=port)
    elif transport_mode == "both":
        port = int(os.getenv("MCP_PORT", "8765"))
        await asyncio.gather(
            run_stdio(),
            run_http_server(port=port),
        )
    else:
        await run_stdio()


if __name__ == "__main__":
    asyncio.run(main())
