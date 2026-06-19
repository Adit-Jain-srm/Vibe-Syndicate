#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
export PYTHONPATH="${PYTHONPATH:-src}"
export PYTHONUNBUFFERED=1
exec python -m syndicate_agent.main
