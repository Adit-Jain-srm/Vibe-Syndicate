FROM python:3.12-slim

WORKDIR /app

COPY syndicate-agent/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY syndicate-agent/src/ ./src/
COPY agent_config.yaml .
COPY .env .

ENV PYTHONPATH=/app/src
ENV PYTHONUNBUFFERED=1

CMD ["python", "-m", "syndicate_agent.main"]
