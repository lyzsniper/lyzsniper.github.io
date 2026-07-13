import { useEffect } from 'react'

interface HeadOptions {
  title?: string
  description?: string
  type?: string
  image?: string
  url?: string
  canonical?: string
  hreflang?: { lang: string; url: string }[]
  jsonLd?: Record<string, unknown>
  noindex?: boolean
}

const SITE_NAME = 'Jensen.lyz'
const ABSOLUTE = (p: string) => (p.startsWith('http') ? p : `${window.location.origin}${p}`)

/** 轻量 head 标签管理 — 不需要额外依赖 */
export function useHead(opts: HeadOptions) {
  useEffect(() => {
    const cleanups: Array<() => void> = []
    const head = document.head

    // 标题
    if (opts.title) {
      const full = opts.title.includes(SITE_NAME) ? opts.title : `${opts.title} — ${SITE_NAME}`
      document.title = full
      cleanups.push(() => { document.title = '' })
    }

    // 辅助函数：设置或插入 meta
    const setMeta = (attrs: Record<string, string>) => {
      const key = attrs.name ? `meta[name="${attrs.name}"]` : attrs.property ? `meta[property="${attrs.property}"]` : null
      if (!key) return
      const existing = document.querySelector(key) as HTMLMetaElement | null
      if (existing) {
        const before = existing.getAttribute('content')
        existing.setAttribute('content', attrs.content)
        cleanups.push(() => { if (before == null) existing.remove(); else existing.setAttribute('content', before) })
      } else {
        const el = document.createElement('meta')
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
        head.appendChild(el)
        cleanups.push(() => { el.remove() })
      }
    }

    // 辅助：设置 link
    const setLink = (attrs: Record<string, string>) => {
      const selector = attrs.href ? `link[href="${attrs.href}"]` : attrs.rel === 'canonical' ? 'link[rel="canonical"]' : null
      if (!selector) return
      const existing = document.querySelector(selector) as HTMLLinkElement | null
      if (existing) {
        for (const [k, v] of Object.entries(attrs)) existing.setAttribute(k, v)
        cleanups.push(() => { existing.remove() })
      } else {
        const el = document.createElement('link')
        for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
        head.appendChild(el)
        cleanups.push(() => { el.remove() })
      }
    }

    if (opts.description) {
      setMeta({ name: 'description', content: opts.description })
      setMeta({ property: 'og:description', content: opts.description })
      setMeta({ name: 'twitter:description', content: opts.description })
    }

    if (opts.title) {
      setMeta({ property: 'og:title', content: opts.title })
      setMeta({ name: 'twitter:title', content: opts.title })
    }

    const absoluteUrl = opts.url ? ABSOLUTE(opts.url) : window.location.href
    setMeta({ property: 'og:url', content: absoluteUrl })
    setMeta({ property: 'og:site_name', content: SITE_NAME })

    const type = opts.type ?? 'website'
    setMeta({ property: 'og:type', content: type })

    if (opts.image) {
      setMeta({ property: 'og:image', content: ABSOLUTE(opts.image) })
      setMeta({ name: 'twitter:image', content: ABSOLUTE(opts.image) })
      setMeta({ name: 'twitter:card', content: 'summary_large_image' })
    } else {
      setMeta({ name: 'twitter:card', content: 'summary' })
    }

    // hreflang
    if (opts.hreflang) {
      // 清理旧 hreflang
      document.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove())
      for (const l of opts.hreflang) {
        const el = document.createElement('link')
        el.setAttribute('rel', 'alternate')
        el.setAttribute('hreflang', l.lang)
        el.setAttribute('href', ABSOLUTE(l.url))
        head.appendChild(el)
        cleanups.push(() => { el.remove() })
      }
    }

    // canonical
    if (opts.canonical !== undefined) {
      if (opts.canonical === '') {
        document.querySelector('link[rel="canonical"]')?.remove()
      } else {
        setLink({ rel: 'canonical', href: ABSOLUTE(opts.canonical) })
      }
    }

    // noindex
    if (opts.noindex) {
      setMeta({ name: 'robots', content: 'noindex' })
    }

    // JSON-LD
    let jsonLdEl: HTMLScriptElement | null = null
    if (opts.jsonLd) {
      document.querySelectorAll('script[type="application/ld+json"][data-use-head]').forEach((el) => el.remove())
      jsonLdEl = document.createElement('script')
      jsonLdEl.setAttribute('type', 'application/ld+json')
      jsonLdEl.setAttribute('data-use-head', '1')
      jsonLdEl.textContent = JSON.stringify(opts.jsonLd)
      head.appendChild(jsonLdEl)
    }

    return () => {
      for (const fn of cleanups) fn()
      jsonLdEl?.remove()
    }
  }, [
    opts.title,
    opts.description,
    opts.type,
    opts.image,
    opts.url,
    opts.canonical,
    JSON.stringify(opts.hreflang),
    JSON.stringify(opts.jsonLd),
    opts.noindex,
  ])
}
