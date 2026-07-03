import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function useLanguageSwitch() {
  const { i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  const isEnglish = location.pathname.startsWith('/en')
  const currentLng: 'zh' | 'en' = isEnglish ? 'en' : 'zh'

  /** 返回当前语言对应的 URL 前缀（中文为空串，英文为 /en） */
  const langPrefix = isEnglish ? '/en' : ''

  /** 给任意路径加当前语言前缀 */
  const prefixPath = (path: string) => {
    if (path === '/') return isEnglish ? '/en' : '/'
    return `${langPrefix}${path}`
  }

  const switchLanguage = (target: 'zh' | 'en') => {
    if (target === currentLng) return
    let newPath: string
    if (target === 'en') {
      newPath = location.pathname.startsWith('/en')
        ? location.pathname
        : `/en${location.pathname === '/' ? '' : location.pathname}`
    } else {
      newPath = location.pathname.replace(/^\/en/, '') || '/'
    }
    void i18n.changeLanguage(target)
    navigate(newPath)
  }

  return { currentLng, switchLanguage, langPrefix, prefixPath }
}
