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
import zhHome from './locales/zh/home.json'
import enHome from './locales/en/home.json'
import zhBlog from './locales/zh/blog.json'
import enBlog from './locales/en/blog.json'
import zhPost from './locales/zh/post.json'
import enPost from './locales/en/post.json'
import zhSearch from './locales/zh/search.json'
import enSearch from './locales/en/search.json'
import zhTags from './locales/zh/tags.json'
import enTags from './locales/en/tags.json'
import zhNotfound from './locales/zh/notfound.json'
import enNotfound from './locales/en/notfound.json'
import zhLogin from './locales/zh/login.json'
import enLogin from './locales/en/login.json'
import zhAdmin from './locales/zh/admin.json'
import enAdmin from './locales/en/admin.json'
import zhEditor from './locales/zh/editor.json'
import enEditor from './locales/en/editor.json'
import zhInbox from './locales/zh/inbox.json'
import enInbox from './locales/en/inbox.json'
import zhTagmanage from './locales/zh/tagmanage.json'
import enTagmanage from './locales/en/tagmanage.json'

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
    ns: ['common', 'header', 'footer', 'postcard', 'home', 'blog', 'post', 'search', 'tags', 'notfound', 'login', 'admin', 'editor', 'inbox', 'tagmanage'],
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
i18n.addResourceBundle('zh', 'home', zhHome, true, true)
i18n.addResourceBundle('en', 'home', enHome, true, true)
i18n.addResourceBundle('zh', 'blog', zhBlog, true, true)
i18n.addResourceBundle('en', 'blog', enBlog, true, true)
i18n.addResourceBundle('zh', 'post', zhPost, true, true)
i18n.addResourceBundle('en', 'post', enPost, true, true)
i18n.addResourceBundle('zh', 'search', zhSearch, true, true)
i18n.addResourceBundle('en', 'search', enSearch, true, true)
i18n.addResourceBundle('zh', 'tags', zhTags, true, true)
i18n.addResourceBundle('en', 'tags', enTags, true, true)
i18n.addResourceBundle('zh', 'notfound', zhNotfound, true, true)
i18n.addResourceBundle('en', 'notfound', enNotfound, true, true)
i18n.addResourceBundle('zh', 'login', zhLogin, true, true)
i18n.addResourceBundle('en', 'login', enLogin, true, true)
i18n.addResourceBundle('zh', 'admin', zhAdmin, true, true)
i18n.addResourceBundle('en', 'admin', enAdmin, true, true)
i18n.addResourceBundle('zh', 'editor', zhEditor, true, true)
i18n.addResourceBundle('en', 'editor', enEditor, true, true)
i18n.addResourceBundle('zh', 'inbox', zhInbox, true, true)
i18n.addResourceBundle('en', 'inbox', enInbox, true, true)
i18n.addResourceBundle('zh', 'tagmanage', zhTagmanage, true, true)
i18n.addResourceBundle('en', 'tagmanage', enTagmanage, true, true)

export default i18n
