import cron from 'node-cron'
import fs from 'node:fs'
import path from 'node:path'
import { config } from '../config.js'
import { logger } from '../lib/logger.js'
import { ingestMarkdownFile } from './ingest.js'

let task: cron.ScheduledTask | null = null

export function startScheduler(): void {
  if (task) return
  if (!cron.validate(config.cronPattern)) {
    logger.warn(
      { pattern: config.cronPattern },
      'invalid cron pattern, scheduler disabled',
    )
    return
  }
  task = cron.schedule(config.cronPattern, async () => {
    logger.info('cron: full scan start')
    if (!fs.existsSync(config.inboxDir)) return
    const files = fs
      .readdirSync(config.inboxDir)
      .filter((f) => f.endsWith('.md'))
    for (const f of files) {
      try {
        await ingestMarkdownFile(path.join(config.inboxDir, f), {
          source: 'cron',
        })
      } catch (err) {
        logger.error({ err, file: f }, 'cron: ingest failed')
      }
    }
  })
  logger.info({ pattern: config.cronPattern }, 'scheduler started')
}

export function stopScheduler(): void {
  if (task) {
    task.stop()
    task = null
  }
}
