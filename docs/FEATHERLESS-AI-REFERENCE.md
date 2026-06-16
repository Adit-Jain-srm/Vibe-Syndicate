# Featherless AI — Setup & Reference

> **For**: Band of Agents Hackathon  
> **Promo Code**: `BOA26`  
> **Credits**: $25 (1 month Premium plan)  
> **Extracted**: June 15, 2026

---

## API Credentials

```
API Key: rc_3eceaf3d77acf249c7a385efc248213d2896b7ccfea9e40e56aff3ba92a7c597
Base URL: https://api.featherless.ai/v1
```

---

## What is Featherless AI?

Serverless AI inference platform. Partners with HuggingFace — hosts **25,000+ open-source models**. You don't pay per token; you pay a flat fee with a **concurrency model** (number of simultaneous connections).

### Key Value for This Hackathon
- **Specialized models**: Fine-tuned models for medical, legal, coding, uncommon languages, etc.
- **OpenAI-compatible API**: Drop-in replacement — same SDK, same syntax
- **Unlimited tokens**: Only limited by concurrent connections (4 channels on Premium)
- **Different agents, different models**: Use specialized open-source models per agent role

### Premium Plan (via BOA26 code)
| Feature | Value |
|---------|-------|
| Price | $25/month (FREE with code) |
| Concurrent connections | 4 |
| Tokens | Unlimited |
| Models | Full catalog access |
| Special access | Kimi K2.5, GLM5 |
| Validity | 1 month from activation |

### Concurrency Model Explained
- 4 "channels" of bandwidth
- Small models (~7B params) = 1 channel each → run 4 simultaneously
- Large models (Kimi K2 ~1T params) = uses all 4 channels
- **Plan accordingly for multi-agent setups**

---

## Quick Start

### Installation
```bash
pip install openai
```

### Python (OpenAI SDK — Preferred)
```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.featherless.ai/v1",
    api_key="rc_3eceaf3d77acf249c7a385efc248213d2896b7ccfea9e40e56aff3ba92a7c597",
)

response = client.chat.completions.create(
    model="Qwen/Qwen2.5-7B-Instruct",
    messages=[
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "Hello!"}
    ],
)
print(response.choices[0].message.content)
```

### Python (Direct Requests)
```python
import requests

response = requests.post(
    url="https://api.featherless.ai/v1/chat/completions",
    headers={
        "Content-Type": "application/json",
        "Authorization": "Bearer rc_3eceaf3d77acf249c7a385efc248213d2896b7ccfea9e40e56aff3ba92a7c597"
    },
    json={
        "model": "Qwen/Qwen2.5-7B-Instruct",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello! How are you?"}
        ]
    }
)
print(response.json()["choices"][0]["message"]["content"])
```

---

## Endpoints

| Endpoint | Purpose |
|----------|---------|
| `POST /v1/chat/completions` | Modern chat interface (preferred) |
| `POST /v1/completions` | Legacy completions endpoint |
| `GET /v1/models` | List available models |
| `POST /v1/tokenize` | Tokenize text |

---

## Recommended Models

| Model | Best For | Size |
|-------|----------|------|
| **Kimi K2.5** (kimi-k2.5) | Reasoning, complex tasks, agentic work | Very large (uses all 4 channels) |
| **GLM5** | General purpose | Large |
| **Qwen/Qwen2.5-7B-Instruct** | Fast, general chat | 7B (lightweight) |
| **Qwen/Qwen3-32B** | Tool calling, reasoning | 32B |
| DeepSeek models | Coding, reasoning | Various |
| Llama 3.1 models | General purpose | Various |
| Mistral models | Fast inference | Various |

### For Multi-Agent Hackathon (Suggested Mapping)
| Agent Role | Suggested Model | Rationale |
|------------|----------------|-----------|
| Planner/Coordinator | Kimi K2.5 or Qwen3-32B | Strong reasoning |
| Code Agent | DeepSeek Coder | Code-specialized |
| Reviewer/Critic | Qwen3-32B | Good instruction following |
| Summarizer | Qwen2.5-7B-Instruct | Fast, cheap (1 channel) |
| Domain Expert | Fine-tuned models on HuggingFace | Specialized knowledge |

---

## Tool/Function Calling

Featherless supports OpenAI-compatible function calling. Natively supported on:
- **Qwen family** (Qwen3-32B recommended)
- Other models with instruction-following can simulate via JSON mode

### Tool Calling Example
```python
from openai import OpenAI

client = OpenAI(
    base_url="https://api.featherless.ai/v1",
    api_key="rc_3eceaf3d77acf249c7a385efc248213d2896b7ccfea9e40e56aff3ba92a7c597",
)

tools = [
    {
        "type": "function",
        "function": {
            "name": "get_current_weather",
            "description": "Get the current weather in a given location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {
                        "type": "string",
                        "description": "The city and state, e.g. San Francisco, CA"
                    }
                },
                "required": ["location"]
            }
        }
    }
]

response = client.chat.completions.create(
    model="Qwen/Qwen3-32B",
    messages=[
        {"role": "user", "content": "What's the weather in San Francisco?"}
    ],
    tools=tools,
)

# Check for tool calls
message = response.choices[0].message
if message.tool_calls:
    for tool_call in message.tool_calls:
        print(f"Function: {tool_call.function.name}")
        print(f"Args: {tool_call.function.arguments}")
```

### Complete Tool Calling Flow
```python
import json
from openai import OpenAI

client = OpenAI(
    base_url="https://api.featherless.ai/v1",
    api_key="rc_3eceaf3d77acf249c7a385efc248213d2896b7ccfea9e40e56aff3ba92a7c597",
)

def run_with_tools(user_message, tools, available_functions):
    messages = [{"role": "user", "content": user_message}]
    
    # Step 1: Send request with tools
    response = client.chat.completions.create(
        model="Qwen/Qwen3-32B",
        messages=messages,
        tools=tools,
        max_tokens=4096,
    )
    
    response_message = response.choices[0].message
    tool_calls = response_message.tool_calls
    
    if tool_calls:
        messages.append(response_message)
        
        # Step 2: Execute each function call
        for tool_call in tool_calls:
            function_name = tool_call.function.name
            function_args = json.loads(tool_call.function.arguments)
            
            # Execute the function
            result = available_functions[function_name](**function_args)
            
            # Add result to conversation
            messages.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "name": function_name,
                "content": json.dumps(result),
            })
        
        # Step 3: Get final response
        final_response = client.chat.completions.create(
            model="Qwen/Qwen3-32B",
            messages=messages,
        )
        return final_response.choices[0].message.content
    else:
        return response_message.content
```

---

## Integration with Band SDK

Since Featherless is OpenAI-compatible, you can use it with Band's LangGraphAdapter:

```python
from langchain_openai import ChatOpenAI
from thenvoi.adapters import LangGraphAdapter

# Use Featherless as the LLM provider in a Band agent
llm = ChatOpenAI(
    model="Qwen/Qwen3-32B",
    base_url="https://api.featherless.ai/v1",
    api_key="rc_3eceaf3d77acf249c7a385efc248213d2896b7ccfea9e40e56aff3ba92a7c597",
)

adapter = LangGraphAdapter(
    llm=llm,
    checkpointer=InMemorySaver(),
    custom_section="Your agent system prompt here.",
)
```

---

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 401 | Unauthorized | Check API key |
| 400 | Bad request (your fault) | Check payload format |
| 500 | Internal server error (their fault) | Retry or contact support |

---

## Concurrency Planning for Multi-Agent Systems

With 4 channels on Premium:
- **Option A**: 4 small agents (7B models) running simultaneously
- **Option B**: 2 medium agents (32B) running simultaneously  
- **Option C**: 1 large agent (Kimi K2.5) at a time
- **Option D**: Mix — 1 medium (32B) + 2 small (7B) = 3 agents concurrent

**Strategy for hackathon**: Use smaller models for simple agents (summarizer, formatter) and reserve bandwidth for reasoning-heavy agents.

---

## Support & Contact

- **Email**: isaac@featherless.ai
- **Discord**: Handle `AIZK` (DM directly for fast response)
- **Docs**: https://featherless.ai/docs/overview
- **Model Catalog**: https://featherless.ai/models
- **Cookbook**: https://featherless.ai/docs/application-guides
- **Status**: https://featherless.ai/status
