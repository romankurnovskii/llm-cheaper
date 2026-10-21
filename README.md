# llm-price

> Fast, agent-friendly CLI tool to query the cheapest LLM providers and discover cheaper similar models across 230+ providers.

Powered by [models.dev](https://models.dev). Features zero background daemons, local 30-minute TTL caching (`~/.config/llm-price/cache.json`), and dual output formats (human-readable tables or machine-parsable JSON for AI agents).

---

## Installation

```bash
# Clone and install locally
git clone https://github.com/romankurnovskii/llm-price.git
cd llm-price
npm install
npm run build
npm link
```

Or run directly via `npx`:
```bash
npx tsx src/bin.ts --help
```

---

## Usage

### 1. Find the Cheapest Provider for a Specific Model

Compare input, output, and prompt-cache pricing across all providers hosting that model:

```bash
llm-price best deepseek-chat
```

Output:
```text
🔍 Model: DeepSeek V3/Deepseek Chat (deepseek/deepseek-chat)
Found across 6 provider(s):

Rank    Provider       Input ($/1M)  Output ($/1M)  Cache Read ($/1M)  Context  
--------------------------------------------------------------------------------
⭐ #1   nano-gpt       $0.1          $0.425         $0.05              128k     
   #2   edenai         $0.15         $0.6           $0.003             131k     
   #3   orcarouter     $0.22         $0.66          $0.007             1000k    
   #4   openrouter     $0.2574       $1.0287        -                  164k     
   #5   kilo           $0.2574       $1.0287        -                  128k     
   #6   anyapi         Free/0        Free/0         -                  1000k    

💡 Cheapest: nano-gpt ($0.1 / $0.425 per 1M tokens)
```

#### JSON Output (for AI Agents)
```bash
llm-price best deepseek-chat --json
```

---

### 2. Find Cheaper Similar Alternative Models

When you want to reduce LLM costs without sacrificing capability, `similar` searches within the same capability tier (e.g. reasoning flagship, fast lightweight, general flagship) and highlights percentage savings:

```bash
llm-price similar claude-3-5-sonnet
```

Output:
```text
🎯 Base Model: Claude-Sonnet-3.5 (anthropic/claude-3-5-sonnet-20241022)
   Base Cost: $2.6 in / $13 out on poe

🔥 Cheaper Similar Alternatives (5 options):

Model                     Provider     Input ($/1M)  Output ($/1M)  Savings   Notes                                
-------------------------------------------------------------------------------------------------------------------
Llama-3.3-70B-Instruct    pendra       Free/0        Free/0         🟢 -100%  Equal or larger context (128k tokens)
Meta Llama 3.1 8B Instru  atomic-chat  Free/0        Free/0         🟢 -100%  Same general tier                    
ALLaM-2-7b                groq         Free/0        Free/0         🟢 -100%  Same general tier                    
...
```

For agent scripts:
```bash
llm-price similar claude-3-5-sonnet --json
```

---

### 3. Force Cache Refresh

Cache automatically expires after 30 minutes. To force update immediately:

```bash
llm-price refresh
```

---

## License

MIT © [Roman Kurnovskii](https://romankurnovskii.com)
