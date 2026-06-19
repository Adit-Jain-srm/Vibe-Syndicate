@echo off
title Syndicate Agent Swarm
cd /d "%~dp0"
echo Starting Syndicate Swarm...
echo Press Ctrl+C to stop.
echo.
python -m syndicate_agent.main
pause
