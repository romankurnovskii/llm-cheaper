#!/usr/bin/env node
import { Command } from 'commander'
import { getModelsData } from './client.js'
import { formatComparisonTable, formatSimilarTable } from './formatters.js'
import { compareProvidersForModel, findSimilarCheaperModels, normalizeEntries } from './matcher.js'

const program = new Command()

program
  .name('llm-price')
  .description('CLI tool to query cheapest LLM providers and find cheaper similar alternative models')
  .version('1.0.0')

program
  .command('best <model>')
  .description('Find and rank providers offering the specified model by lowest price')
  .option('-j, --json', 'Output results as JSON for agent automation')
  .option('-f, --force', 'Force refresh data cache from models.dev')
  .action(async (modelQuery: string, options: { json?: boolean; force?: boolean }) => {
    try {
      const { data, fromCache } = await getModelsData({ force: options.force })
      const entries = normalizeEntries(data)
      const comparison = compareProvidersForModel(modelQuery, entries)

      if (!comparison) {
        if (options.json) {
          console.log(JSON.stringify({ error: `Model matching "${modelQuery}" not found` }))
        } else {
          console.error(`❌ Model matching "${modelQuery}" not found across providers.`)
        }
        process.exitCode = 1
        return
      }

      if (options.json) {
        console.log(
          JSON.stringify(
            {
              ...comparison,
              fromCache,
            },
            null,
            2,
          ),
        )
      } else {
        console.log(formatComparisonTable(comparison))
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`Error: ${message}`)
      process.exitCode = 1
    }
  })

program
  .command('similar <model>')
  .description('Find cheaper similar models in the same capability tier')
  .option('-n, --limit <number>', 'Maximum number of alternatives to show', '5')
  .option('-j, --json', 'Output results as JSON for agent automation')
  .option('-f, --force', 'Force refresh data cache from models.dev')
  .action(async (modelQuery: string, options: { limit?: string; json?: boolean; force?: boolean }) => {
    try {
      const { data, fromCache } = await getModelsData({ force: options.force })
      const entries = normalizeEntries(data)
      const limit = Number.parseInt(options.limit || '5', 10)
      const result = findSimilarCheaperModels(modelQuery, entries, limit)

      if (!result) {
        if (options.json) {
          console.log(JSON.stringify({ error: `Model matching "${modelQuery}" not found` }))
        } else {
          console.error(`❌ Model matching "${modelQuery}" not found.`)
        }
        process.exitCode = 1
        return
      }

      if (options.json) {
        console.log(
          JSON.stringify(
            {
              ...result,
              fromCache,
            },
            null,
            2,
          ),
        )
      } else {
        console.log(formatSimilarTable(result))
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`Error: ${message}`)
      process.exitCode = 1
    }
  })

program
  .command('refresh')
  .description('Force refresh local pricing cache from models.dev')
  .action(async () => {
    try {
      console.log('Fetching latest models and pricing from models.dev...')
      const { data } = await getModelsData({ force: true })
      const providerCount = Object.keys(data).length
      console.log(`✅ Successfully refreshed cache with ${providerCount} providers.`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`❌ Failed to refresh cache: ${message}`)
      process.exitCode = 1
    }
  })

program.parse()
