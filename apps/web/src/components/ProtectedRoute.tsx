import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { useTranslation } from 'react-i18next'

interface Props {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: Props) {
  const user = useAuthStore((s) => s.user)
  const loading = useAuthStore((s) => s.loading)
  const { t } = useTranslation('common')
  const location = useLocation()

  if (loading) {
    return (
      <div className="container-page py-32 text-center text-sm text-[var(--fg-tertiary)]">
        <div className="inline-block w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin mb-3" />
        <p>{t('auth.verifying')}</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}