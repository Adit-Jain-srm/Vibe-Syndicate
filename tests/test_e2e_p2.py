"""P2+P3 Integration Tests."""
import asyncio
import os
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "syndicate-agent" / "src"))
sys.path.insert(0, str(Path(__file__).parent.parent / "syndicate-api" / "src"))
from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")


class TestOrchestrator:
    def test_imports(self):
        from syndicate_agent.orchestrator import SyndicateOrchestrator

        assert SyndicateOrchestrator

    def test_creates_task(self):
        from syndicate_agent.config import Config
        from syndicate_agent.orchestrator import SyndicateOrchestrator

        orch = SyndicateOrchestrator(Config.load())
        task = asyncio.run(orch.create_task("Test"))
        assert task.id  # UUID format
        assert task.status.value == "pending"


class TestMemoryEngine:
    def test_imports(self):
        from syndicate_agent.memory import MemoryEngine

        assert MemoryEngine

    def test_local_append(self):
        from syndicate_agent.memory import MemoryEngine

        m = MemoryEngine()
        m._local_append("project", "test", {"content": "test entry"})


class TestSelfImprovement:
    def test_imports(self):
        from syndicate_agent.self_improve import SelfImprovementEngine

        assert SelfImprovementEngine


class TestToolDiscovery:
    def test_imports(self):
        from syndicate_agent.tool_discovery import ToolDiscoveryEngine

        assert ToolDiscoveryEngine

    @pytest.mark.asyncio
    async def test_search_returns_list(self):
        from syndicate_agent.tool_discovery import ToolDiscoveryEngine

        engine = ToolDiscoveryEngine()
        results = await engine.search("react testing")
        assert isinstance(results, list)


class TestAPI:
    def test_app_imports(self):
        from syndicate_api.main import app

        assert app.title == "Syndicate API"

    @pytest.mark.asyncio
    async def test_health(self):
        from syndicate_api.main import app
        from httpx import ASGITransport, AsyncClient

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as c:
            r = await c.get("/health")
            assert r.status_code == 200

    @pytest.mark.asyncio
    async def test_create_task(self):
        from syndicate_api.main import app
        from httpx import ASGITransport, AsyncClient, ConnectTimeout

        async with AsyncClient(
            transport=ASGITransport(app=app), base_url="http://test"
        ) as c:
            try:
                r = await c.post(
                    "/api/tasks/",
                    json={"description": "test", "complexity": "simple"},
                )
                assert r.status_code == 200
                assert r.json()["id"].startswith("task_")
            except ConnectTimeout:
                pytest.skip("Supabase not reachable in test env")


class TestMCPServer:
    def test_mcp_imports(self):
        sys.path.insert(0, str(Path(__file__).parent.parent / "syndicate-mcp"))
        import importlib.util

        spec = importlib.util.spec_from_file_location(
            "server", Path(__file__).parent.parent / "syndicate-mcp" / "server.py"
        )
        assert spec is not None
