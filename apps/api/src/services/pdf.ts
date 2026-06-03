import { logger } from '../lib/logger.js'
import { config } from '../config.js'

/**
 * 导出 PDF — 占位实现
 * 完整实现需要 puppeteer-core + 系统 Chromium
 * 当前返回 HTML 包装的 buffer，标注 TODO
 */
export async function exportPdf(html: string): Promise<Buffer> {
  if (!config.pdfEnabled) {
    throw new Error('PDF export disabled')
  }

  // TODO: 接入 puppeteer-core 把 html 渲染成 PDF
  // 当前为占位实现，返回 HTML 包装
  logger.warn('PDF export not fully implemented. Returning HTML wrapper.')
  const wrapper = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>PDF</title>
<style>
body { font-family: 'Noto Sans SC', sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
</style>
</head>
<body>${html}</body>
</html>`
  return Buffer.from(wrapper, 'utf-8')
}
