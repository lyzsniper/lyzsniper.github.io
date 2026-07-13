import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { MessageCircle, Send } from 'lucide-react'
import { api, type Comment as CommentType } from '@/lib/api'

interface Props {
  postId: number
}

interface CommentNode extends CommentType {
  children: CommentNode[]
}

function buildTree(comments: CommentType[]): CommentNode[] {
  const map = new Map<number, CommentNode>()
  for (const c of comments) map.set(c.id, { ...c, children: [] })
  const roots: CommentNode[] = []
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  return roots
}

function formatDate(d: string, locale: string) {
  try {
    return new Date(d).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return d
  }
}

export default function CommentSection({ postId }: Props) {
  const { t, i18n } = useTranslation(['common', 'post'])
  const [comments, setComments] = useState<CommentType[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [author, setAuthor] = useState('')
  const [website, setWebsite] = useState('')
  const [body, setBody] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [replyTo, setReplyTo] = useState<number | null>(null)

  const load = useCallback(() => {
    api
      .listComments(postId)
      .then((r) => setComments(r.comments))
      .catch(() => setComments([]))
  }, [postId])

  useEffect(() => {
    api
      .listComments(postId)
      .then((r) => setComments(r.comments))
      .catch(() => setComments([]))
  }, [postId, load])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    try {
      await api.createComment({
        postId,
        parentId: replyTo,
        author,
        website: website || undefined,
        body,
      })
      setBody('')
      setAuthor('')
      setWebsite('')
      setReplyTo(null)
      setSuccess(t('comment:success') ?? '评论已提交，审核通过后显示')
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common:error'))
    } finally {
      setSubmitting(false)
    }
  }

  const roots = buildTree(comments)

  function renderNode(node: CommentNode, depth: number) {
    return (
      <li key={node.id} className={depth === 0 ? '' : 'pl-4'} style={{ borderLeft: depth === 0 ? 'none' : '1px solid var(--border-subtle)' }}>
        <article className="py-3">
          <header className="flex items-center gap-2 text-xs text-[var(--fg-tertiary)] mb-1.5">
            {node.website ? (
              <a
                href={node.website}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--accent)] hover:underline"
              >
                {node.author}
              </a>
            ) : (
              <span className="font-medium text-[var(--fg-secondary)]">{node.author}</span>
            )}
            <time className="font-mono">{formatDate(node.createdAt, i18n.language)}</time>
            <button
              type="button"
              onClick={() => setReplyTo(replyTo === node.id ? null : node.id)}
              className="ml-auto text-[var(--fg-tertiary)] hover:text-[var(--accent)] transition-colors"
            >
              {t('comment:reply') ?? '回复'}
            </button>
          </header>
          <p className="text-sm text-[var(--fg-secondary)] leading-relaxed whitespace-pre-wrap">{node.body}</p>
          {replyTo === node.id && (
            <p className="mt-1 text-xs text-[var(--fg-tertiary)]">
              {t('comment:replyingTo', { name: node.author }) ?? `回复 @${node.author}`}
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="ml-2 underline"
              >
                ×
              </button>
            </p>
          )}
        </article>
        {node.children.length > 0 && (
          <ul className="space-y-0">{node.children.map((c) => renderNode(c, depth + 1))}</ul>
        )}
      </li>
    )
  }

  return (
    <section
      className="mt-16 pt-8"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
      aria-label={t('comment:title') ?? 'Comments'}
    >
      <h2 className="text-sm font-medium text-[var(--fg-tertiary)] uppercase tracking-wider mb-4 flex items-center gap-2">
        <MessageCircle size={14} />
        {t('comment:title') ?? 'Comments'} ({comments.length})
      </h2>

      {roots.length > 0 ? (
        <ul className="space-y-0 mb-8">{roots.map((r) => renderNode(r, 0))}</ul>
      ) : (
        <p className="text-sm text-[var(--fg-tertiary)] mb-8 italic">
          {t('comment:empty') ?? '还没有评论，来做第一个吧。'}
        </p>
      )}

      <form onSubmit={submit} className="surface-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-[var(--fg-primary)] flex items-center gap-1.5">
            <Send size={13} />
            {t('comment:write') ?? '写下你的评论'}
          </h3>
          {replyTo && (
            <span className="text-xs text-[var(--fg-tertiary)]">
              {t('comment:replyingToShort') ?? '回复中'}
              <button type="button" onClick={() => setReplyTo(null)} className="ml-1 underline">×</button>
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder={t('comment:authorPlaceholder') ?? '昵称 *'}
            maxLength={60}
            required
            className="input-field"
          />
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder={t('comment:websitePlaceholder') ?? '个人网站（可选）'}
            type="url"
            className="input-field"
          />
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t('comment:bodyPlaceholder') ?? '说说你的想法…（2-5000 字）'}
          rows={4}
          minLength={2}
          maxLength={5000}
          required
          className="input-field resize-y"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-500">{success}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary btn-sm disabled:opacity-50"
          >
            {submitting ? (t('comment:submitting') ?? '提交中…') : (t('comment:submit') ?? '提交评论')}
          </button>
        </div>
      </form>
    </section>
  )
}
