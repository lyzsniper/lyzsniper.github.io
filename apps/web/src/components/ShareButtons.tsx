import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Share2, Link, Check, Twitter } from 'lucide-react'

interface Props {
  url: string
  title: string
}

export default function ShareButtons({ url, title }: Props) {
  const { t } = useTranslation(['common', 'post'])
  const [copied, setCopied] = useState(false)

  const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`

  const open = (href: string) => window.open(href, '_blank', 'noopener,noreferrer,width=600,height=500')

  const weibo = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(fullUrl)}&title=${encodeURIComponent(title)}`
  const twitterShare = `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(title)}`
  const zhihu = `https://www.zhihu.com/share?url=${encodeURIComponent(fullUrl)}&title=${encodeURIComponent(title)}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = fullUrl
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-[var(--fg-tertiary)] flex items-center gap-1.5 mr-1">
        <Share2 size={13} />
        {t('post:share') ?? 'Share'}
      </span>
      <button
        type="button"
        onClick={() => open(weibo)}
        className="btn btn-ghost btn-sm"
        aria-label="Share to Weibo"
      >
        <span className="w-4 h-4 rounded-full bg-red-500 inline-flex items-center justify-center text-white text-[10px] font-bold">微</span>
        {t('post:shareWeibo') ?? '微博'}
      </button>
      <button
        type="button"
        onClick={() => open(twitterShare)}
        className="btn btn-ghost btn-sm"
        aria-label="Share to X / Twitter"
      >
        <Twitter size={13} />
        Twitter
      </button>
      <button
        type="button"
        onClick={() => open(zhihu)}
        className="btn btn-ghost btn-sm"
        aria-label="Share to Zhihu"
      >
        <span className="w-4 h-4 rounded-full bg-blue-500 inline-flex items-center justify-center text-white text-[10px] font-bold">知</span>
        {t('post:shareZhihu') ?? '知乎'}
      </button>
      <button
        type="button"
        onClick={copyLink}
        className="btn btn-ghost btn-sm"
        aria-label="Copy link"
      >
        {copied ? <Check size={13} className="text-green-500" /> : <Link size={13} />}
        {copied ? (t('common:copied') ?? 'Copied!') : t('post:copyLink') ?? '复制链接'}
      </button>
    </div>
  )
}
