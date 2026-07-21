import { useEffect } from 'react'

/**
 * 全局视觉增强（挂载于 Layout，全站生效）：
 * 1. reveal-on-scroll 观察器：.reveal 进入视口时加 .visible
 * 2. glow-card 事件委托：鼠标在 .glow-card 上移动时写入 --mx/--my，
 *    驱动光标光晕与边框聚光（无需各组件自行绑定）
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

    // glow-card 光标坐标（事件委托，动态内容同样生效）
    const onMouseMove = (e: MouseEvent) => {
      const card = (e.target as HTMLElement | null)?.closest?.('.glow-card')
      if (!(card instanceof HTMLElement)) return
      const r = card.getBoundingClientRect()
      card.style.setProperty('--mx', `${e.clientX - r.left}px`)
      card.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    document.addEventListener('mousemove', onMouseMove, { passive: true })

    return () => {
      clearTimeout(timer)
      observer.disconnect()
      document.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  return null
}
