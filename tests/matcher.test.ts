import { describe, expect, it } from 'vitest'
import { compareProvidersForModel, findSimilarCheaperModels, normalizeEntries, searchModels } from '../src/matcher.js'
import type { ModelsDevApiResponse } from '../src/types.js'

const mockData: ModelsDevApiResponse = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    models: {
      'deepseek/deepseek-chat': {
        id: 'deepseek/deepseek-chat',
        name: 'DeepSeek V3',
        canonical_model_id: 'deepseek/deepseek-v3',
        cost: { input: 0.25, output: 0.95, cache_read: 0.1 },
        limit: { context: 64000, output: 8000 },
        reasoning: false,
        tool_call: true,
      },
      'anthropic/claude-3.5-sonnet': {
        id: 'anthropic/claude-3.5-sonnet',
        name: 'Claude 3.5 Sonnet',
        canonical_model_id: 'anthropic/claude-3-5-sonnet',
        cost: { input: 3.0, output: 15.0, cache_read: 0.3 },
        limit: { context: 200000, output: 8192 },
        reasoning: false,
        tool_call: true,
      },
    },
  },
  deepinfra: {
    id: 'deepinfra',
    name: 'DeepInfra',
    models: {
      'deepseek-ai/DeepSeek-V3': {
        id: 'deepseek-ai/DeepSeek-V3',
        name: 'DeepSeek V3',
        canonical_model_id: 'deepseek/deepseek-v3',
        cost: { input: 0.27, output: 1.1, cache_read: 0.08 },
        limit: { context: 64000, output: 8000 },
        reasoning: false,
        tool_call: true,
      },
    },
  },
  together: {
    id: 'together',
    name: 'Together AI',
    models: {
      'deepseek/deepseek-v3': {
        id: 'deepseek/deepseek-v3',
        name: 'DeepSeek V3',
        canonical_model_id: 'deepseek/deepseek-v3',
        cost: { input: 1.25, output: 1.25 },
        limit: { context: 64000, output: 8000 },
        reasoning: false,
        tool_call: true,
      },
    },
  },
}

describe('LLM Price Matcher & Recommender', () => {
  const entries = normalizeEntries(mockData)

  it('normalizes entries across providers', () => {
    expect(entries.length).toBe(4)
  })

  it('searches models by fuzzy or canonical id', () => {
    const results = searchModels('deepseek-v3', entries)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].canonicalId).toBe('deepseek/deepseek-v3')
  })

  it('compares providers and sorts by cheapest effective cost', () => {
    const comparison = compareProvidersForModel('deepseek-v3', entries)
    expect(comparison).not.toBeNull()
    if (!comparison) return

    expect(comparison.allProviders.length).toBe(3)
    // OpenRouter (0.25*0.7 + 0.95*0.3 = 0.46) vs DeepInfra (0.27*0.7 + 1.1*0.3 = 0.519) vs Together (1.25)
    expect(comparison.cheapestProvider.providerId).toBe('openrouter')
    expect(comparison.allProviders[0].providerId).toBe('openrouter')
    expect(comparison.allProviders[1].providerId).toBe('deepinfra')
    expect(comparison.allProviders[2].providerId).toBe('together')
  })

  it('finds cheaper similar alternative models in same capability tier', () => {
    const result = findSimilarCheaperModels('claude-3.5-sonnet', entries)
    expect(result).not.toBeNull()
    if (!result) return

    expect(result.baseModel.canonicalId).toBe('anthropic/claude-3-5-sonnet')
    expect(result.cheaperAlternatives.length).toBeGreaterThan(0)
    const topAlt = result.cheaperAlternatives[0]
    expect(topAlt.canonicalId).toBe('deepseek/deepseek-v3')
    expect(topAlt.savingsPercent).toBeGreaterThan(80)
  })
})
