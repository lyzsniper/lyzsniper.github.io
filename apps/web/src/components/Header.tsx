import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/auth'
import ThemeToggle from '@/components/ThemeToggle'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useLanguageSwitch } from '@/i18n/useLanguageFromUrl'

const navItems = [
  { to: '/', labelKey: 'header:nav.home' },
  { to: '/blog', labelKey: 'header:nav.blog' },
  { to: '/tags', labelKey: 'header:nav.tags' },
  { to: '/music', labelKey: 'header:nav.music' },
]

export default function Header() {
  const { t } = useTranslation(['common', 'header'])
  const { prefixPath } = useLanguageSwitch()
  const [open, setOpen] = useState(false)
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const onLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header
      className="sticky top-0 z-40 backdrop-blur-md"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--bg-page) 75%, transparent)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <nav className="container-page h-14 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold text-[var(--fg-primary)] hover:opacity-80 transition"
        >
          <span className="w-6 h-6 rounded-md bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold">
            J
          </span>
          <span className="text-[15px] tracking-tight">Jensen.lyz</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={prefixPath(item.to)}
              end={item.to === '/'}
              className={({ isActive }) =>
                `h-8 px-3 inline-flex items-center rounded-md text-sm font-medium transition ${
                  isActive
                    ? 'text-[var(--fg-primary)] bg-[var(--bg-muted)]'
                    : 'text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-muted)]'
                }`
              }
            >
              {t(item.labelKey)}
            </NavLink>
          ))}
          {user && (
            <NavLink
              to={prefixPath('/admin')}
              className={({ isActive }) =>
                `h-8 px-3 inline-flex items-center rounded-md text-sm font-medium transition ${
                  isActive
                    ? 'text-[var(--fg-primary)] bg-[var(--bg-muted)]'
                    : 'text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] hover:bg-[var(--bg-muted)]'
                }`
              }
            >
              {t('header:nav.admin')}
            </NavLink>
          )}
        </div>

        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
          {user ? (
            <div className="hidden md:flex items-center gap-2 ml-1 pl-3 border-l" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="text-xs text-[var(--fg-tertiary)]">{user.username}</span>
              <button
                onClick={() => void onLogout()}
                className="btn btn-ghost btn-sm !w-9 !px-0"
                title={t('header:nav.logout')}
                aria-label={t('header:nav.logout')}
              >
                <LogOut size={14} strokeWidth={1.75} />
              </button>
            </div>
          ) : (
            <Link
              to={prefixPath('/login')}
              className="btn btn-secondary btn-sm hidden md:inline-flex ml-1"
            >
              {t('header:nav.login')}
            </Link>
          )}
          <button
            className="md:hidden btn btn-ghost btn-sm !w-9 !px-0"
            onClick={() => setOpen(!open)}
            aria-label={t('header:nav.menu')}
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div
          className="md:hidden border-t"
          style={{ borderColor: 'var(--border-subtle)', backgroundColor: 'var(--bg-page)' }}
        >
          <div className="container-page py-3 flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={prefixPath(item.to)}
                end={item.to === '/'}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `h-10 px-3 inline-flex items-center rounded-md text-sm font-medium ${
                    isActive
                      ? 'text-[var(--fg-primary)] bg-[var(--bg-muted)]'
                      : 'text-[var(--fg-secondary)]'
                  }`
                }
              >
                {t(item.labelKey)}
              </NavLink>
            ))}
            {user ? (
              <>
                <NavLink
                  to={prefixPath('/admin')}
                  onClick={() => setOpen(false)}
                  className="h-10 px-3 inline-flex items-center rounded-md text-sm font-medium text-[var(--fg-secondary)]"
                >
                  {t('header:nav.adminPanel')}
                </NavLink>
                <button
                  onClick={() => {
                    void onLogout()
                    setOpen(false)
                  }}
                  className="h-10 px-3 inline-flex items-center rounded-md text-sm font-medium text-[var(--fg-secondary)]"
                >
                  {t('header:nav.logout')}
                </button>
              </>
            ) : (
              <NavLink
                to={prefixPath('/login')}
                onClick={() => setOpen(false)}
                className="h-10 px-3 inline-flex items-center rounded-md text-sm font-medium text-[var(--fg-secondary)]"
              >
                {t('header:nav.login')}
              </NavLink>
            )}
          </div>
        </div>
      )}
    </header>
  )
}