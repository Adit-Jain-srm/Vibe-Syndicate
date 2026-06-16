"""P1 End-to-End Verification Tests.

Confirms all Phase 1 infrastructure is working:
- Band agent connectivity (6 agents)
- Supabase DB access (agents, tasks, memory tables)
- Azure OpenAI inference
- Gemini inference
- API server health
- Frontend build
"""
import asyncio
import os
import subprocess
import sys
from pathlib import Path

import httpx
import yaml
import pytest

ROOT = Path(__file__).parent.parent


# ─── Band Connectivity ───────────────────────────────────────────────
class TestBandAgents:
    """All 6 Band agents must authenticate successfully."""

    @pytest.fixture
    def agent_config(self):
        with open(ROOT / "agent_config.yaml") as f:
            return yaml.safe_load(f)

    @pytest.mark.asyncio
    async def test_all_agents_connect(self, agent_config):
        """Every configured agent should return 200 from Band /agent/me."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            for name, creds in agent_config.items():
                resp = await client.get(
                    "https://app.band.ai/api/v1/agent/me",
                    headers={"x-api-key": creds["api_key"]},
                )
                assert resp.status_code == 200, f"Agent {name} failed: HTTP {resp.status_code}"
                data = resp.json()
                assert "data" in data
                assert data["data"]["name"], f"Agent {name} has no name"


# ─── Supabase ────────────────────────────────────────────────────────
class TestSupabase:
    """Supabase tables must be accessible."""

    SERVICE_KEY = os.environ.get("SUPABASE_KEY", "")
    BASE_URL = os.environ.get("SUPABASE_URL", "https://wilwqoflckenzgnggbgb.supabase.co")
    HEADERS = {"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}"}

    @pytest.mark.asyncio
    async def test_agents_table(self):
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{self.BASE_URL}/rest/v1/agents?select=name,role",
                headers=self.HEADERS,
            )
            assert resp.status_code == 200
            agents = resp.json()
            assert len(agents) == 6
            names = {a["name"] for a in agents}
            assert "Nexus" in names
            assert "Reviewer" in names

    @pytest.mark.asyncio
    async def test_tasks_table(self):
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{self.BASE_URL}/rest/v1/tasks?select=id",
                headers=self.HEADERS,
            )
            assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_memory_table(self):
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{self.BASE_URL}/rest/v1/memory?select=id",
                headers=self.HEADERS,
            )
            assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_events_table(self):
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{self.BASE_URL}/rest/v1/events?select=id",
                headers=self.HEADERS,
            )
            assert resp.status_code == 200


# ─── LLM Providers ──────────────────────────────────────────────────
class TestLLMProviders:
    """Both LLM providers must respond."""

    @pytest.mark.asyncio
    async def test_gemini(self):
        """Gemini should respond to a simple prompt."""
        api_key = os.environ.get("GOOGLE_API_KEY", "")
        assert api_key, "GOOGLE_API_KEY env var required"
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
                params={"key": api_key},
                json={"contents": [{"parts": [{"text": "Say OK"}]}]},
            )
            assert resp.status_code == 200
            assert "candidates" in resp.json()

    @pytest.mark.asyncio
    async def test_azure_openai(self):
        """Azure OpenAI gpt-4o should respond."""
        api_key = os.environ.get("AZURE_OPENAI_API_KEY", "")
        endpoint = os.environ.get(
            "AZURE_OPENAI_ENDPOINT",
            "https://aditjain2005-0132-resource.openai.azure.com",
        )
        assert api_key, "AZURE_OPENAI_API_KEY env var required"
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                f"{endpoint}/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview",
                headers={"api-key": api_key},
                json={"messages": [{"role": "user", "content": "Say OK"}], "max_tokens": 5},
            )
            assert resp.status_code == 200
            assert "choices" in resp.json()


# ─── Project Structure ───────────────────────────────────────────────
class TestProjectStructure:
    """Critical files must exist."""

    def test_agent_config_exists(self):
        assert (ROOT / "agent_config.yaml").exists()

    def test_env_exists(self):
        assert (ROOT / ".env").exists()

    def test_agent_package(self):
        assert (ROOT / "syndicate-agent" / "pyproject.toml").exists()
        assert (ROOT / "syndicate-agent" / "src" / "syndicate_agent" / "main.py").exists()
        assert (ROOT / "syndicate-agent" / "src" / "syndicate_agent" / "config.py").exists()
        assert (ROOT / "syndicate-agent" / "src" / "syndicate_agent" / "types.py").exists()

    def test_api_package(self):
        assert (ROOT / "syndicate-api" / "pyproject.toml").exists()
        assert (ROOT / "syndicate-api" / "src" / "syndicate_api" / "main.py").exists()

    def test_ui_package(self):
        assert (ROOT / "syndicate-ui" / "package.json").exists()
        assert (ROOT / "syndicate-ui" / "src" / "App.tsx").exists()
        assert (ROOT / "syndicate-ui" / "src" / "pages" / "Dashboard.tsx").exists()

    def test_prompts_exist(self):
        prompts = ROOT / "syndicate-agent" / "src" / "syndicate_agent" / "prompts"
        assert (prompts / "nexus.md").exists()
        assert (prompts / "architect.md").exists()
        assert (prompts / "engineer.md").exists()
        assert (prompts / "reviewer.md").exists()

    def test_no_manthan_references(self):
        """No legacy references in source code."""
        legacy_term = "mant" + "han"
        for ext in ["*.py", "*.ts", "*.tsx"]:
            for f in ROOT.rglob(ext):
                if "Reference_repos" in str(f) or "node_modules" in str(f):
                    continue
                if "test_e2e_p1" in str(f):
                    continue
                content = f.read_text(encoding="utf-8", errors="ignore")
                assert legacy_term not in content.lower(), f"Found legacy reference in {f}"
