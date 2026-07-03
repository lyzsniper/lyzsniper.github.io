import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useAuthStore } from '@/store/auth'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const { login, user, loading, error, clearError } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/admin')
  }, [user, navigate])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    const ok = await login(username, password)
    if (ok) navigate('/admin')
  }

  return (
    <div className="container-page py-20 flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <div className="eyebrow mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            管理员登录
          </div>
          <h1 className="text-display-md text-[var(--fg-primary)]">
            登录以继续
          </h1>
        </div>

        <form onSubmit={onSubmit} className="surface-card p-6 space-y-4">
          {error && (
            <div
              className="px-3 py-2 rounded-md text-sm"
              style={{
                backgroundColor: 'rgba(220, 38, 38, 0.08)',
                color: '#dc2626',
                border: '1px solid rgba(220, 38, 38, 0.16)',
              }}
            >
              {error}
            </div>
          )}

          <label className="block">
            <span className="text-xs font-medium text-[var(--fg-secondary)] mb-1.5 block">
              用户名
            </span>
            <input
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
              placeholder="admin"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-[var(--fg-secondary)] mb-1.5 block">
              密码
            </span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••"
            />
          </label>

          <button
            type="submit"
            disabled={loading || !username || !password}
            className="btn btn-primary w-full mt-2"
          >
            {loading ? (
              '登录中…'
            ) : (
              <>
                登录 <ArrowRight size={14} />
              </>
            )}
          </button>

          <p className="text-xs text-[var(--fg-tertiary)] text-center pt-1">
            默认账号 <code className="font-mono">admin</code> /{' '}
            <code className="font-mono">admin123</code>
          </p>
        </form>
      </div>
    </div>
  )
}