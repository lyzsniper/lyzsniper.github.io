import { Link } from 'react-router-dom'
import { Github, Mail, Phone, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation(['common', 'footer'])
  const year = new Date().getFullYear()

  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-subtle)',
      }}
      className="mt-20"
    >
      <div className="container-page py-14">
        <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr] gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-6 h-6 rounded-md bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold">
                J
              </span>
              <span className="text-sm font-semibold">Jensen.lyz</span>
            </div>
            <p className="text-sm text-[var(--fg-secondary)] max-w-xs leading-relaxed">
              {t('footer:bio')}
            </p>
          </div>

          <div>
            <h4 className="eyebrow mb-4">{t('footer:sections.nav')}</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="/#about" className="text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition">
                  {t('footer:links.about')}
                </a>
              </li>
              <li>
                <a href="/#projects" className="text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition">
                  {t('footer:links.projects')}
                </a>
              </li>
              <li>
                <Link to="/blog" className="text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition">
                  {t('footer:links.blog')}
                </Link>
              </li>
              <li>
                <Link to="/tags" className="text-[var(--fg-secondary)] hover:text-[var(--fg-primary)] transition">
                  {t('footer:links.tags')}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="eyebrow mb-4">{t('footer:sections.contact')}</h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2 text-[var(--fg-secondary)]">
                <Mail size={13} strokeWidth={1.75} className="text-[var(--fg-tertiary)]" />
                <a href="mailto:jensenlyz@163.com" className="hover:text-[var(--fg-primary)] transition">
                  jensenlyz@163.com
                </a>
              </li>
              {/* <li className="flex items-center gap-2 text-[var(--fg-secondary)]">
                <Phone size={13} strokeWidth={1.75} className="text-[var(--fg-tertiary)]" />
                <span>{t('footer:contact.phone')}</span>
              </li> */}
              <li className="flex items-center gap-2 text-[var(--fg-secondary)]">
                <MapPin size={13} strokeWidth={1.75} className="text-[var(--fg-tertiary)]" />
                <span>{t('footer:contact.location')}</span>
              </li>
              <li className="flex items-center gap-2 text-[var(--fg-secondary)]">
                <Github size={13} strokeWidth={1.75} className="text-[var(--fg-tertiary)]" />
                <a
                  href="https://github.com/lyzsniper"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--fg-primary)] transition"
                >
                  github.com/lyzsniper
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div
          className="mt-12 pt-6 flex items-center justify-between flex-wrap gap-3 text-xs text-[var(--fg-tertiary)]"
          style={{ borderTop: '1px solid var(--border-subtle)' }}
        >
          <span>© {year} Jensen.lyz. All rights reserved.</span>
          <span>{t('footer:builtWith')}</span>
        </div>
      </div>
    </footer>
  )
}