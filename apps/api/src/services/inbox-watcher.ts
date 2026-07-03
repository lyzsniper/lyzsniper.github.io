import chokidar from 'chokidar'
import path from 'node:path'
import fs from 'node:fs'
import { config } from '../config.js'
import { logger } from '../lib/logger.js'
import { ingestMarkdownFile } from './ingest.js'

let watcher: chokidar.FSWatcher | null = null

export function startInboxWatcher(): void {
  if (watcher) return

  // 确保 inbox 目录存在
  fs.mkdirSync(config.inboxDir, { recursive: true })

  watcher = chokidar.watch(path.join(config.inboxDir, '**/*.md'), {
    ignoreInitial: false,
    awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
  })

  watcher.on('add', async (file) => {
    logger.info({ file }, 'inbox: new file')
    try {
      await ingestMarkdownFile(file, { source: 'inbox' })
    } catch (err) {
      logger.error({ err, file }, 'inbox: ingest failed')
    }
  })

  watcher.on('change', async (file) => {
    logger.info({ file }, 'inbox: file changed')
    try {
      await ingestMarkdownFile(file, { source: 'inbox' })
    } catch (err) {
      logger.error({ err, file }, 'inbox: re-ingest failed')
    }
  })

  watcher.on('error', (err) => {
    logger.error({ err }, 'inbox watcher error')
  })

  logger.info({ dir: config.inboxDir }, 'inbox watcher started')
}

export function stopInboxWatcher(): void {
  if (watcher) {
    void watcher.close()
    watcher = null
  }
}
