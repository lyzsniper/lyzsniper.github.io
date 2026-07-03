import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import zhCommon from './locales/zh/common.json'
import enCommon from './locales/en/common.json'
import zhHeader from './locales/zh/header.json'
import enHeader from './locales/en/header.json'
import zhFooter from './locales/zh/footer.json'
import enFooter from './locales/en/footer.json'
import zhPostcard from './locales/zh/postcard.json'
import enPostcard from './locales/en/postcard.json'

export const supportedLngs = ['zh', 'en'] as const
export const fallbackLng = 'zh'
export const defaultNS = 'common'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng,
    defaultNS,
    supportedLngs: [...supportedLngs],
    ns: ['common', 'header', 'footer', 'postcard'],
    detection: {
      order: ['path', 'localStorage', 'navigator'],
      lookupFromPathIndex: 0,
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    interpolation: { escapeValue: false },
  })

// 临时：把 zh/en common 同步加载
i18n.addResourceBundle('zh', 'common', zhCommon, true, true)
i18n.addResourceBundle('en', 'common', enCommon, true, true)
i18n.addResourceBundle('zh', 'header', zhHeader, true, true)
i18n.addResourceBundle('en', 'header', enHeader, true, true)
i18n.addResourceBundle('zh', 'footer', zhFooter, true, true)
i18n.addResourceBundle('en', 'footer', enFooter, true, true)
i18n.addResourceBundle('zh', 'postcard', zhPostcard, true, true)
i18n.addResourceBundle('en', 'postcard', enPostcard, true, true)

export default i18n
