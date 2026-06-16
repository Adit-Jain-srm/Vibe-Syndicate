"""P1 Tests — Band connectivity, API health, config loading."""

import pytest
from pathlib import Path


class TestConfig:
    """Test configuration loading."""

    def test_config_loads_defaults(self):
        from syndicate_agent.config import Config
        cfg = Config.load()
        assert cfg.band_ws_url == "wss://app.band.ai/api/v1/socket/websocket"
        assert cfg.band_rest_url == "https://app.band.ai/"
        assert cfg.gemini_model_coordinator == "gemini-2.5-flash-preview-05-20"
        assert cfg.claude_model == "claude-sonnet-4-20250514"

    def test_config_all_fields_present(self):
        from syndicate_agent.config import Config
        cfg = Config()
        fields = [
            "band_ws_url", "band_rest_url", "google_api_key",
            "gemini_model_coordinator", "gemini_model_specialist",
            "azure_openai_endpoint", "azure_openai_api_key",
            "azure_openai_deployment", "azure_openai_api_version",
            "supabase_url", "supabase_key",
        ]
        for field in fields:
            assert hasattr(cfg, field), f"Config missing field: {field}"


class TestTypes:
    """Test type definitions."""

    def test_task_creation(self):
        from syndicate_agent.types import Task, TaskStatus
        task = Task(id="test-1", description="Add auth")
        assert task.status == TaskStatus.PENDING
        assert task.plan is None
        assert task.subtasks == []

    def test_event_creation(self):
        from syndicate_agent.types import Event, EventType
        event = Event(type=EventType.TASK_CREATED, agent="nexus", content="Task received")
        assert event.type == EventType.TASK_CREATED
        assert event.timestamp  # should be auto-populated

    def test_review_verdict(self):
        from syndicate_agent.types import ReviewVerdict
        verdict = ReviewVerdict(passed=True, risk_level="low", summary="Clean code")
        assert verdict.passed is True
        assert verdict.findings == []

    def test_memory_entry(self):
        from syndicate_agent.types import MemoryEntry
        entry = MemoryEntry(content="Always use async", category="project", agent="reviewer")
        assert entry.tags == []
        assert entry.timestamp  # auto-populated

    def test_all_agent_roles(self):
        from syndicate_agent.types import AgentRole
        roles = list(AgentRole)
        assert len(roles) == 6
        assert AgentRole.NEXUS in roles
        assert AgentRole.REVIEWER in roles

    def test_all_event_types(self):
        from syndicate_agent.types import EventType
        types = list(EventType)
        assert len(types) == 13
        assert EventType.TASK_COMPLETE in types
        assert EventType.SKILL_EVOLVED in types


class TestPrompts:
    """Test that all prompt files exist and are non-empty."""

    def test_nexus_prompt_exists(self):
        path = Path(__file__).parent.parent / "src" / "syndicate_agent" / "prompts" / "nexus.md"
        assert path.exists()
        content = path.read_text()
        assert len(content) > 100
        assert "Nexus" in content

    def test_architect_prompt_exists(self):
        path = Path(__file__).parent.parent / "src" / "syndicate_agent" / "prompts" / "architect.md"
        assert path.exists()
        content = path.read_text()
        assert "Architect" in content

    def test_engineer_prompt_exists(self):
        path = Path(__file__).parent.parent / "src" / "syndicate_agent" / "prompts" / "engineer.md"
        assert path.exists()
        content = path.read_text()
        assert "Engineer" in content

    def test_reviewer_prompt_exists(self):
        path = Path(__file__).parent.parent / "src" / "syndicate_agent" / "prompts" / "reviewer.md"
        assert path.exists()
        content = path.read_text()
        assert "Reviewer" in content
        assert "DIFFERENT model" in content


class TestAPIHealth:
    """Test that the API scaffold imports and has correct routes."""

    def test_fastapi_app_imports(self):
        from syndicate_api.main import app
        assert app.title == "Syndicate API"

    def test_health_route_exists(self):
        from syndicate_api.main import app
        routes = [r.path for r in app.routes]
        assert "/health" in routes

    def test_api_routes_exist(self):
        from syndicate_api.main import app
        routes = [r.path for r in app.routes]
        assert "/api/tasks/" in routes or any("/api/tasks" in r for r in routes)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
