---
name: llm-cheaper
description: "Find the cheapest LLM provider for a target model or discover cheaper similar alternative models in the same capability tier. Works with Claude Code, Cursor, Codex, OpenCode, and Antigravity. Triggers on: 'find cheapest provider for model X', 'compare LLM prices', 'cheaper model than X', 'cheaper alternative to claude/gpt/deepseek', 'which provider is cheapest for X', or querying model token pricing."
metadata:
  version: 1.0.0
---

# llm-cheaper

Agent skill to query real-time LLM token pricing across 230+ providers and suggest cheaper alternative models within the same capability tier.

Powered by [models.dev](https://models.dev) with a local 30-minute TTL cache in `~/.config/llm-cheaper/cache.json`.

---

## When to Use This Skill

- Deciding which API provider (e.g. OpenRouter, DeepInfra, Together, NanoGPT, Google, Groq) to route LLM calls to for the lowest cost.
- Finding cheaper alternative models (e.g., finding cheaper reasoning models to replace `o1` or cheaper general models to replace `claude-3-5-sonnet`).
- Comparing input token, output token, and prompt-cache read pricing across providers.
- Dynamic cost optimization in agent routers or autonomous pipelines.

---

## Prerequisites

Ensure `llm-cheaper` (or `llm-price`) CLI is available:

```bash
# Check if installed
which llm-cheaper || which llm-price

# If not installed, install globally:
npm install -g llm-cheaper
# or via Homebrew:
brew tap romankurnovskii/llm-cheaper https://github.com/romankurnovskii/llm-cheaper
brew install romankurnovskii/llm-cheaper/llm-cheaper
```

---

## CLI Commands for Agents

### 1. Find Cheapest Provider for a Specific Model

Run `llm-cheaper best <model> --json` to get ranked providers from cheapest to most expensive:

```bash
llm-cheaper best "deepseek-chat" --json
```

**JSON Output Schema:**
```json
{
  "query": "deepseek-chat",
  "canonicalId": "deepseek/deepseek-chat",
  "displayName": "DeepSeek V3/Deepseek Chat",
  "cheapestProvider": {
    "providerId": "nano-gpt",
    "providerName": "NanoGPT",
    "cost": {
      "input": 0.1,
      "output": 0.425,
      "cacheRead": 0.05,
      "effectiveScore": 0.1975
    },
    "contextLimit": 128000,
    "reasoning": false,
    "toolCall": true
  },
  "allProviders": [
    {
      "providerId": "nano-gpt",
      "cost": { "input": 0.1, "output": 0.425, "cacheRead": 0.05 }
    },
    {
      "providerId": "edenai",
      "cost": { "input": 0.15, "output": 0.6, "cacheRead": 0.003 }
    }
  ],
  "fromCache": true
}
```

*Note: Pricing is given in USD per 1 Million tokens.*

---

### 2. Discover Cheaper Alternative Models in Same Capability Tier

Run `llm-cheaper similar <model> --json` to get alternative models with similar reasoning/coding capabilities that reduce token costs:

```bash
llm-cheaper similar "claude-3-5-sonnet" --limit 5 --json
```

**JSON Output Schema:**
```json
{
  "baseModel": {
    "canonicalId": "anthropic/claude-3-5-sonnet-20241022",
    "displayName": "Claude-Sonnet-3.5",
    "providerId": "poe",
    "cost": { "input": 2.6, "output": 13.0 }
  },
  "cheaperAlternatives": [
    {
      "modelId": "deepseek-v3",
      "canonicalId": "deepseek/deepseek-v3",
      "displayName": "DeepSeek-V3",
      "providerId": "deepinfra",
      "cost": { "input": 0.32, "output": 0.89 },
      "savingsPercent": 88,
      "reason": "Same general-flagship tier"
    }
  ]
}
```

---

### 3. Force Refresh Pricing Cache

The local cache (`~/.config/llm-cheaper/cache.json`) updates lazily every 30 minutes. To explicitly refresh before a critical decision:

```bash
llm-cheaper refresh
```

---

## Agent Decision Rubric

When selecting an LLM provider:
1. **Model Matching**: Pass fuzzy names (e.g. `deepseek-v3`, `gpt-4o-mini`, `claude-3-7-sonnet`); the CLI resolves the canonical model ID automatically.
2. **Effective Cost**: The cheapest provider is ranked based on effective weighted token usage:
   $$\text{Score} = (\text{Input} \times 0.7) + (\text{Output} \times 0.3)$$
3. **Cache Read Consideration**: If the workload heavily utilizes prompt caching, check `cost.cacheRead` to pick the provider with the lowest cache hit rate.
4. **Context Constraints**: Check `contextLimit` to ensure the selected provider supports your required prompt window.
