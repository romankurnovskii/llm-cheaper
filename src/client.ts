import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import type { ModelsDevApiResponse } from './types.js'

const DEFAULT_CACHE_DIR = path.join(os.homedir(), '.config', 'llm-price')
const DEFAULT_CACHE_FILE = path.join(DEFAULT_CACHE_DIR, 'cache.json')
const MODELS_DEV_URL = 'https://models.dev/api.json'
const DEFAULT_TTL_MS = 30 * 60 * 1000 // 30 minutes

export interface CacheMetadata {
  updatedAt: number
  data: ModelsDevApiResponse
}

export async function fetchRemoteData(): Promise<ModelsDevApiResponse> {
  const response = await fetch(MODELS_DEV_URL, {
    headers: {
      'User-Agent': 'llm-price-cli/1.0 (+https://github.com/romankurnovskii/llm-price)',
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch models from ${MODELS_DEV_URL}: ${response.status} ${response.statusText}`)
  }

  const json = (await response.json()) as ModelsDevApiResponse
  return json
}

export function loadCache(cachePath = DEFAULT_CACHE_FILE): CacheMetadata | null {
  try {
    if (!fs.existsSync(cachePath)) {
      return null
    }
    const raw = fs.readFileSync(cachePath, 'utf-8')
    const parsed = JSON.parse(raw) as CacheMetadata
    if (!parsed?.data || typeof parsed.updatedAt !== 'number') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveCache(data: ModelsDevApiResponse, cachePath = DEFAULT_CACHE_FILE): void {
  const dir = path.dirname(cachePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  const payload: CacheMetadata = {
    updatedAt: Date.now(),
    data,
  }
  fs.writeFileSync(cachePath, JSON.stringify(payload), 'utf-8')
}

export async function getModelsData(options?: {
  force?: boolean
  ttlMs?: number
  cachePath?: string
}): Promise<{ data: ModelsDevApiResponse; fromCache: boolean; ageMs: number }> {
  const cachePath = options?.cachePath ?? DEFAULT_CACHE_FILE
  const ttlMs = options?.ttlMs ?? DEFAULT_TTL_MS
  const force = options?.force ?? false

  const cached = loadCache(cachePath)
  const now = Date.now()

  if (!force && cached) {
    const ageMs = now - cached.updatedAt
    if (ageMs < ttlMs) {
      return { data: cached.data, fromCache: true, ageMs }
    }
  }

  try {
    const remoteData = await fetchRemoteData()
    saveCache(remoteData, cachePath)
    return { data: remoteData, fromCache: false, ageMs: 0 }
  } catch (error) {
    if (cached) {
      // Fallback to expired cache if offline or remote fails
      return {
        data: cached.data,
        fromCache: true,
        ageMs: now - cached.updatedAt,
      }
    }
    throw error
  }
}
