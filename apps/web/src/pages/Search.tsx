import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search as SearchIcon, FileText } from 'lucide-react'
import { api, type PostSummary } from '@/lib/api'

export default function Search() {
  const { t } = useTranslation(['common', 'search'])
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')
  const [results, setResults] = useState<PostSummary[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const term = params.get('q') ?? ''
    if (!term) {
      setResults([])
      return
    }
    setLoading(true)
    api
      .search(term)
      .then((r) => setResults(r.results))
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [params])

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const next = new URLSearchParams(params)
    if (q.trim()) next.set('q', q.trim())
    else next.delete('q')
    setParams(next)
  }

  return (
    <div className="container-page py-12 md:py-16">
      <div className="eyebrow mb-2">
        <SearchIcon size={12} className="text-[var(--accent)]" />
        {t('search:title')}
      </div>
      <h1 className="text-display-lg text-[var(--fg-primary)] mb-8">{t('search:title')}</h1>

      <form onSubmit={onSubmit} className="mb-10">
        <div className="relative">
          <SearchIcon
            size={14}
            strokeWidth={1.75}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-tertiary)] pointer-events-none"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('search:placeholder')}
            className="input !pl-9"
            autoFocus
          />
        </div>
      </form>

      {loading && <p className="text-sm text-[var(--fg-tertiary)] py-12 text-center">{t('search:searching')}</p>}

      {!loading && params.get('q') && (
        <>
          <p className="text-xs text-[var(--fg-tertiary)] mb-4">
            {t('search:results', { count: results.length })}
          </p>
          <div className="space-y-2">
            {results.map((p) => (
              <Link
                key={p.id}
                to={`/blog/${p.slug}`}
                className="surface-card-interactive p-5 block group"
              >
                <h2 className="text-base font-semibold text-[var(--fg-primary)] group-hover:text-[var(--accent)] transition-colors">
                  {p.title}
                </h2>
                {p.summary && (
                  <p className="mt-1.5 text-body-sm text-[var(--fg-secondary)] line-clamp-2">
                    {p.summary}
                  </p>
                )}
                <div className="text-xs text-[var(--fg-tertiary)] mt-2 font-mono">{p.slug}</div>
              </Link>
            ))}
          </div>
          {results.length === 0 && (
            <div className="surface-card p-16 text-center">
              <FileText size={28} className="mx-auto mb-3 text-[var(--fg-tertiary)]" strokeWidth={1.5} />
              <p className="text-sm text-[var(--fg-secondary)]">{t('search:noResults')}</p>
            </div>
          )}
        </>
      )}

      {!params.get('q') && !loading && (
        <div className="surface-card p-16 text-center">
          <SearchIcon size={28} className="mx-auto mb-3 text-[var(--fg-tertiary)]" strokeWidth={1.5} />
          <p className="text-sm text-[var(--fg-secondary)]">{t('search:placeholder')}</p>
        </div>
      )}
    </div>
  )
}
