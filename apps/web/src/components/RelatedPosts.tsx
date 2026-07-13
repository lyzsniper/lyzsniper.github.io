import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { api } from '@/lib/api'

interface RelatedItem {
  slug: string
  title: string
  score: number
}

interface Props {
  slug: string
}

export default function RelatedPosts({ slug }: Props) {
  const { t } = useTranslation(['common', 'post'])
  const [items, setItems] = useState<RelatedItem[]>([])

  useEffect(() => {
    setItems([])
    api
      .getRelated(slug)
      .then((r) => setItems(r.related))
      .catch(() => setItems([]))
  }, [slug])

  if (items.length === 0) return null

  return (
    <section
      className="mt-16 pt-8"
      style={{ borderTop: '1px solid var(--border-subtle)' }}
      aria-label={t('post:relatedPosts') ?? 'Related posts'}
    >
      <h2 className="text-sm font-medium text-[var(--fg-tertiary)] uppercase tracking-wider mb-4 flex items-center gap-2">
        <ArrowRight size={14} />
        {t('post:relatedPosts') ?? 'Related Posts'}
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <li key={item.slug}>
            <Link
              to={`/blog/${item.slug}`}
              className="block surface-card-interactive p-4 group"
            >
              <span className="text-sm font-medium text-[var(--fg-primary)] group-hover:text-[var(--accent)] transition-colors leading-snug">
                {item.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
