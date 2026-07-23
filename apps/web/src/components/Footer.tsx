import { Link } from 'react-router-dom'
import { Github, Mail, MapPin, Music2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/** 小红书官方风格 logo（红底白字） */
function XiaohongshuIcon({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <rect x="0" y="0" width="24" height="24" rx="5" fill="#FF2442" />
      <text
        x="12"
        y="15.5"
        fontSize="9"
        fontWeight="700"
        fontFamily="'PingFang SC', 'Microsoft YaHei', sans-serif"
        fill="#ffffff"
        textAnchor="middle"
      >
        小红书
      </text>
    </svg>
  )
}

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
              <li className="flex items-center gap-2 text-[var(--fg-secondary)]">
                <XiaohongshuIcon size={13} />
                <a
                  href="https://www.xiaohongshu.com/user/profile/68d9def6000000002102d2e0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--fg-primary)] transition"
                >
                  AI前沿量子港
                </a>
              </li>
              <li className="flex items-center gap-2 text-[var(--fg-secondary)]">
                <Music2 size={13} strokeWidth={1.75} className="text-[var(--fg-tertiary)]" />
                {/* TODO: 替换为汽水音乐「AI前沿量子港」音乐人主页的真实分享链接 */}
                <a
                  href="https://qishui.douyin.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[var(--fg-primary)] transition"
                >
                  汽水音乐 · AI前沿量子港
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