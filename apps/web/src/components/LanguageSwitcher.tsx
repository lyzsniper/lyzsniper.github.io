import { Globe, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useState, useRef, useEffect } from 'react'
import { useLanguageSwitch } from '@/i18n/useLanguageFromUrl'

const LANGS = [
  { code: 'zh', label: '中文' },
  { code: 'en', label: 'English' },
] as const

export default function LanguageSwitcher() {
  const { t } = useTranslation('common')
  const { currentLng, switchLanguage } = useLanguageSwitch()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn btn-ghost btn-sm flex items-center gap-1.5"
        aria-label={t('language.switch')}
        aria-expanded={open}
      >
        <Globe size={14} strokeWidth={1.75} />
        <span className="text-xs font-medium">
          {currentLng === 'zh' ? '中' : 'EN'}
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 min-w-[140px] surface-card py-1 z-50"
        >
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              role="menuitem"
              onClick={() => {
                switchLanguage(l.code)
                setOpen(false)
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-[var(--bg-muted)] transition-colors"
            >
              <span>{l.label}</span>
              {currentLng === l.code && (
                <Check size={14} className="text-[var(--accent)]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}