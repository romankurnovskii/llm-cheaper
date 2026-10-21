export interface ModelCost {
  input?: number
  output?: number
  cache_read?: number
  cache_write?: number
  [key: string]: unknown
}

export interface ModelLimit {
  context?: number
  output?: number
}

export interface ModelInfo {
  id: string
  name?: string
  description?: string
  family?: string
  attachment?: boolean
  reasoning?: boolean
  tool_call?: boolean
  structured_output?: boolean
  temperature?: boolean
  knowledge?: string
  release_date?: string
  last_updated?: string
  modalities?: {
    input?: string[]
    output?: string[]
  }
  open_weights?: boolean
  limit?: ModelLimit
  cost?: ModelCost
  canonical_model_id?: string
  status?: string
}

export interface ProviderInfo {
  id: string
  name?: string
  doc?: string
  env?: string[]
  npm?: string
  models: Record<string, ModelInfo>
}

export type ModelsDevApiResponse = Record<string, ProviderInfo>

export interface NormalizedModelEntry {
  providerId: string
  providerName: string
  modelId: string
  canonicalId: string
  displayName: string
  family?: string
  cost: {
    input: number
    output: number
    cacheRead: number
    effectiveScore: number
  }
  hasPricing: boolean
  contextLimit: number
  outputLimit: number
  reasoning: boolean
  toolCall: boolean
  raw: ModelInfo
}

export interface ProviderComparisonResult {
  query: string
  canonicalId: string
  displayName: string
  cheapestProvider: NormalizedModelEntry
  allProviders: NormalizedModelEntry[]
}

export interface AlternativeRecommendation {
  modelId: string
  canonicalId: string
  displayName: string
  providerId: string
  cost: {
    input: number
    output: number
    cacheRead: number
  }
  contextLimit: number
  reasoning: boolean
  toolCall: boolean
  savingsPercent: number
  reason: string
}

export interface SimilarModelsResult {
  baseModel: NormalizedModelEntry
  cheaperAlternatives: AlternativeRecommendation[]
}
