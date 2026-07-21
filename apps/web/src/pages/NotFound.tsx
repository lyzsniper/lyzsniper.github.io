import { useLayoutEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function NotFound() {
  const { t } = useTranslation('notfound')
  const location = useLocation()
  const navigate = useNavigate()

  // 用 useLayoutEffect 在 paint 之前同步把 location.state.status 标记成 404，
  // 让 PageTracker 能读到正确的 status（否则会先用 undefined → 200 记录一条，再被 404 覆盖）。
  useLayoutEffect(() => {
    const state = (location.state as { status?: number } | null) ?? null
    if (state?.status !== 404) {
      navigate(location.pathname + location.search, {
        replace: true,
        state: { ...(state || {}), status: 404 },
      })
    }
    // 仅在挂载时执行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="container-page py-24 md:py-32 text-center">
      <div className="text-display-xl text-[var(--fg-tertiary)] mb-4 font-mono">{t('code')}</div>
      <h1 className="text-display-md text-[var(--fg-primary)] mb-3">{t('title')}</h1>
      <p className="text-body text-[var(--fg-secondary)] mb-8 max-w-md mx-auto">
        {t('desc')}
      </p>
      <Link to="/" className="btn btn-primary">
        <Home size={14} /> {t('backHome')}
      </Link>
    </div>
  )
}