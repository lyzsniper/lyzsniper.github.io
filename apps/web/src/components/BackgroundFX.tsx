import { useEffect } from 'react'

/**
 * 仅保留 reveal-on-scroll 观察器，去掉粒子/扫描线等赛博特效。
 * 主题切换由 document.documentElement 上的 .dark / .light 类驱动。
 */
export default function BackgroundFX() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    )
    const timer = setTimeout(() => {
      document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
    }, 50)
    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [])

  return null
}