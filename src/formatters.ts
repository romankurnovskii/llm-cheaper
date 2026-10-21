import type { ProviderComparisonResult, SimilarModelsResult } from './types.js'

export function formatComparisonTable(result: ProviderComparisonResult): string {
  const lines: string[] = []
  lines.push(`\n🔍 Model: ${result.displayName} (${result.canonicalId})`)
  lines.push(`Found across ${result.allProviders.length} provider(s):\n`)

  const headers = ['Rank', 'Provider', 'Input ($/1M)', 'Output ($/1M)', 'Cache Read ($/1M)', 'Context']
  const rows: string[][] = []

  result.allProviders.forEach((p, idx) => {
    const isCheapest = idx === 0
    const prefix = isCheapest ? '⭐ ' : '   '
    rows.push([
      `${prefix}#${idx + 1}`,
      p.providerId,
      p.cost.input > 0 ? `$${p.cost.input}` : 'Free/0',
      p.cost.output > 0 ? `$${p.cost.output}` : 'Free/0',
      p.cost.cacheRead > 0 ? `$${p.cost.cacheRead}` : '-',
      p.contextLimit > 0 ? `${Math.round(p.contextLimit / 1000)}k` : '-',
    ])
  })

  // Format aligned columns
  const colWidths = headers.map((h, i) => {
    const maxRowLen = rows.reduce((max, r) => Math.max(max, (r[i] ?? '').length), 0)
    return Math.max(h.length, maxRowLen)
  })

  const formatRow = (cols: string[]) =>
    cols
      .map((c, i) => {
        const width = colWidths[i] ?? 10
        return c.padEnd(width + 2)
      })
      .join('')

  lines.push(formatRow(headers))
  lines.push(colWidths.map((w) => '-'.repeat(w + 2)).join(''))
  for (const r of rows) {
    lines.push(formatRow(r))
  }

  lines.push(
    `\n💡 Cheapest: ${result.cheapestProvider.providerId} ($${result.cheapestProvider.cost.input} / $${result.cheapestProvider.cost.output} per 1M tokens)`,
  )
  return lines.join('\n')
}

export function formatSimilarTable(result: SimilarModelsResult): string {
  const lines: string[] = []
  const base = result.baseModel
  lines.push(`\n🎯 Base Model: ${base.displayName} (${base.canonicalId})`)
  lines.push(`   Base Cost: $${base.cost.input} in / $${base.cost.output} out on ${base.providerId}\n`)

  if (result.cheaperAlternatives.length === 0) {
    lines.push('No cheaper similar alternatives found in this tier.')
    return lines.join('\n')
  }

  lines.push(`🔥 Cheaper Similar Alternatives (${result.cheaperAlternatives.length} options):\n`)

  const headers = ['Model', 'Provider', 'Input ($/1M)', 'Output ($/1M)', 'Savings', 'Notes']
  const rows: string[][] = []

  for (const alt of result.cheaperAlternatives) {
    rows.push([
      alt.displayName.slice(0, 24),
      alt.providerId,
      alt.cost.input > 0 ? `$${alt.cost.input}` : 'Free/0',
      alt.cost.output > 0 ? `$${alt.cost.output}` : 'Free/0',
      `🟢 -${alt.savingsPercent}%`,
      alt.reason.slice(0, 35),
    ])
  }

  const colWidths = headers.map((h, i) => {
    const maxRowLen = rows.reduce((max, r) => Math.max(max, (r[i] ?? '').length), 0)
    return Math.max(h.length, maxRowLen)
  })

  const formatRow = (cols: string[]) =>
    cols
      .map((c, i) => {
        const width = colWidths[i] ?? 10
        return c.padEnd(width + 2)
      })
      .join('')

  lines.push(formatRow(headers))
  lines.push(colWidths.map((w) => '-'.repeat(w + 2)).join(''))
  for (const r of rows) {
    lines.push(formatRow(r))
  }

  return lines.join('\n')
}
