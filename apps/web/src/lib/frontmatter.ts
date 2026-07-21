/**
 * 剥离 markdown 字符串开头的 YAML frontmatter（`---\n...\n---\n`），
 * 返回正文部分。若无 frontmatter 则原样返回。
 */
export function stripFrontmatter(md: string): string {
  const m = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/.exec(md)
  return m ? md.slice(m[0].length) : md
}

/**
 * 从 markdown 的 frontmatter 中提取指定 key（如 `tags`、`category`）的原始值字符串。
 * 返回单行去掉前后空白后的纯文本，可由调用方自行解析。
 */
export function getFrontmatterField(md: string, key: string): string | null {
  const fmMatch = /^---\r?\n([\s\S]*?)\r?\n---/.exec(md)
  if (!fmMatch) return null
  const lines = fmMatch[1].split(/\r?\n/)
  const re = new RegExp(`^${key}\\s*:\\s*(.*)$`, 'i')
  for (const line of lines) {
    const m = re.exec(line)
    if (m) return m[1].trim()
  }
  return null
}
