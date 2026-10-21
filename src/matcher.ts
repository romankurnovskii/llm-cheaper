import type {
  AlternativeRecommendation,
  ModelsDevApiResponse,
  NormalizedModelEntry,
  ProviderComparisonResult,
  SimilarModelsResult,
} from './types.js'

export function normalizeEntries(apiData: ModelsDevApiResponse): NormalizedModelEntry[] {
  const list: NormalizedModelEntry[] = []

  for (const [providerId, provider] of Object.entries(apiData)) {
    if (!provider?.models) continue
    const providerName = provider.name || providerId

    for (const [modelId, model] of Object.entries(provider.models)) {
      if (!model) continue
      // If cost is undefined or null, pricing is unknown / unlisted
      const hasCost = model.cost !== undefined && model.cost !== null
      const input = model.cost?.input ?? null
      const output = model.cost?.output ?? null
      const cacheRead = model.cost?.cache_read ?? null

      const canonicalId = model.canonical_model_id || `${providerId}/${modelId}`

      // Effective weighted token cost per 1M: 70% input, 30% output
      let effectiveScore: number | null = null
      if (input !== null && output !== null) {
        effectiveScore = Number((input * 0.7 + output * 0.3).toFixed(4))
      }

      list.push({
        providerId,
        providerName,
        modelId,
        canonicalId,
        displayName: model.name || modelId,
        family: model.family,
        cost: {
          input: input ?? -1,
          output: output ?? -1,
          cacheRead: cacheRead ?? -1,
          effectiveScore: effectiveScore ?? -1,
        },
        hasPricing: hasCost && effectiveScore !== null,
        contextLimit: model.limit?.context ?? 0,
        outputLimit: model.limit?.output ?? 0,
        reasoning: Boolean(model.reasoning),
        toolCall: Boolean(model.tool_call),
        raw: model,
      })
    }
  }

  return list
}

export function searchModels(query: string, entries: NormalizedModelEntry[]): NormalizedModelEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return []

  // 1. Exact match on canonicalId or modelId
  const exact = entries.filter(
    (e) => e.canonicalId.toLowerCase() === q || e.modelId.toLowerCase() === q || e.displayName.toLowerCase() === q,
  )
  if (exact.length > 0) return exact

  // 2. Exact match on normalized base name
  const qClean = q.replace(/[-_.]/g, '')
  const cleanMatches = entries.filter((e) => {
    const cClean = e.canonicalId.toLowerCase().replace(/[-_.]/g, '')
    const mClean = e.modelId.toLowerCase().replace(/[-_.]/g, '')
    return cClean.includes(qClean) || mClean.includes(qClean)
  })
  if (cleanMatches.length > 0) return cleanMatches

  // 3. Substring match
  return entries.filter(
    (e) =>
      e.canonicalId.toLowerCase().includes(q) ||
      e.modelId.toLowerCase().includes(q) ||
      e.displayName.toLowerCase().includes(q),
  )
}

export function compareProvidersForModel(
  query: string,
  entries: NormalizedModelEntry[],
): ProviderComparisonResult | null {
  const matched = searchModels(query, entries)
  if (matched.length === 0) return null

  // Prefer match with pricing if available
  const matchWithPricing = matched.find((m) => m.hasPricing) ?? matched[0]
  if (!matchWithPricing) return null

  const canonicalId = matchWithPricing.canonicalId

  // Find all providers hosting this canonical model or matching ID
  const providersHosting = entries.filter(
    (e) => e.canonicalId === canonicalId || e.modelId === matchWithPricing.modelId,
  )

  if (providersHosting.length === 0) return null

  // Sort providers:
  // 1. Valid paid/free pricing first
  // 2. Lowest effective score (cheapest first)
  // 3. Unknown pricing last
  providersHosting.sort((a, b) => {
    if (a.hasPricing && !b.hasPricing) return -1
    if (!a.hasPricing && b.hasPricing) return 1
    if (a.cost.effectiveScore !== b.cost.effectiveScore) {
      return a.cost.effectiveScore - b.cost.effectiveScore
    }
    return a.cost.input - b.cost.input
  })

  const cheapest = providersHosting[0]
  if (!cheapest) return null

  return {
    query,
    canonicalId,
    displayName: matchWithPricing.displayName,
    cheapestProvider: cheapest,
    allProviders: providersHosting,
  }
}

// Capability-based grouping for similar cheaper alternatives
function getModelTier(entry: NormalizedModelEntry): {
  tier: string
  reasoning: boolean
  largeContext: boolean
} {
  const reasoning = entry.reasoning
  const largeContext = entry.contextLimit >= 128000
  const family = (entry.family || '').toLowerCase()
  const id = (entry.canonicalId || entry.modelId).toLowerCase()

  if (
    reasoning ||
    id.includes('r1') ||
    id.includes('o1') ||
    id.includes('o3') ||
    id.includes('reasoning') ||
    id.includes('thinking')
  ) {
    return { tier: 'reasoning-flagship', reasoning: true, largeContext }
  }

  if (
    id.includes('mini') ||
    id.includes('flash') ||
    id.includes('haiku') ||
    id.includes('lite') ||
    id.includes('small')
  ) {
    return { tier: 'fast-lightweight', reasoning: false, largeContext }
  }

  if (
    id.includes('opus') ||
    id.includes('sonnet') ||
    id.includes('gpt-4') ||
    id.includes('v3') ||
    family.includes('claude') ||
    family.includes('gpt')
  ) {
    return { tier: 'general-flagship', reasoning, largeContext }
  }

  return { tier: 'general', reasoning, largeContext }
}

export function findSimilarCheaperModels(
  query: string,
  entries: NormalizedModelEntry[],
  maxResults = 5,
): SimilarModelsResult | null {
  const comparison = compareProvidersForModel(query, entries)
  if (!comparison) return null

  // Ensure base has pricing for calculation; if cheapest has no pricing, find one with pricing
  const base = comparison.allProviders.find((p) => p.hasPricing) || comparison.cheapestProvider
  if (!base?.hasPricing) return null

  const baseTier = getModelTier(base)
  const baseEffective = base.cost.effectiveScore

  // Find candidate models across unique canonical models that have pricing
  const uniqueCanonicalMap = new Map<string, NormalizedModelEntry>()
  for (const entry of entries) {
    if (!entry.hasPricing) continue
    if (entry.canonicalId === base.canonicalId) continue // Skip the base model itself

    const existing = uniqueCanonicalMap.get(entry.canonicalId)
    if (!existing || entry.cost.effectiveScore < existing.cost.effectiveScore) {
      uniqueCanonicalMap.set(entry.canonicalId, entry)
    }
  }

  const recommendations: AlternativeRecommendation[] = []

  for (const candidate of uniqueCanonicalMap.values()) {
    const candidateTier = getModelTier(candidate)

    // Must be cheaper
    if (candidate.cost.effectiveScore >= baseEffective) continue

    // Require matching reasoning capabilities if base is reasoning
    if (baseTier.reasoning && !candidateTier.reasoning) continue

    // Calculate savings against base
    const savingsPercent = Math.round(((baseEffective - candidate.cost.effectiveScore) / (baseEffective || 1)) * 100)

    if (savingsPercent <= 0) continue

    let reason = `Same ${candidateTier.tier} tier`
    if (candidate.reasoning && base.reasoning) {
      reason = 'Matching deep reasoning capability at lower token cost'
    } else if (candidate.contextLimit >= base.contextLimit && base.contextLimit > 0) {
      reason = `Equal or larger context (${Math.round(candidate.contextLimit / 1000)}k tokens)`
    }

    recommendations.push({
      modelId: candidate.modelId,
      canonicalId: candidate.canonicalId,
      displayName: candidate.displayName,
      providerId: candidate.providerId,
      cost: {
        input: candidate.cost.input,
        output: candidate.cost.output,
        cacheRead: candidate.cost.cacheRead,
      },
      contextLimit: candidate.contextLimit,
      reasoning: candidate.reasoning,
      toolCall: candidate.toolCall,
      savingsPercent,
      reason,
    })
  }

  // Sort by savings (highest savings first)
  recommendations.sort((a, b) => b.savingsPercent - a.savingsPercent)

  return {
    baseModel: base,
    cheaperAlternatives: recommendations.slice(0, maxResults),
  }
}
