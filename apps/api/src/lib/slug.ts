/**
 * 把任意字符串转成 URL 友好的 slug
 * - 中文 → v1 简化为保留中文字符（拼音化留给将来）
 * - 多个空格/横线合并
 * - 去除前后空白
 */
export function toSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-一-龥]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
