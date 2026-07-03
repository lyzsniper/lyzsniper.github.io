import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function NotFound() {
  const { t } = useTranslation('notfound')
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
