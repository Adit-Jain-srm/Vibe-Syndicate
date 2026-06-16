"""Test configuration — loads .env for local test runs."""
from pathlib import Path

import pytest


def pytest_configure(config):
    """Load .env file into os.environ for tests."""
    env_path = Path(__file__).parent.parent / ".env"
    if env_path.exists():
        import os
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, value = line.partition("=")
                os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))
