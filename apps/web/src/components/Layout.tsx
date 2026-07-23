import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import Header from './Header'
import Footer from './Footer'
import Player from './Player'
import BackgroundFX from './BackgroundFX'
import ConstellationField from './ConstellationField'
import ScrollProgress from './ScrollProgress'
import { usePlayerStore, setupPlayerListeners } from '@/store/player'

export default function Layout() {
  const { t } = useTranslation('common')
  const location = useLocation()
  const playing = usePlayerStore((s) => s.playing)
  const isMusicPage = location.pathname.startsWith('/music')

  // 初始化全局音频监听（仅一次）
  useEffect(() => {
    setupPlayerListeners()
  }, [])

  // 播放器可见时给主体加底部间距，避免被遮挡
  const playerVisible = isMusicPage || playing

  return (
    <div className="min-h-screen flex flex-col">
      {/* 全局星座场（fixed z-0），内容统一浮于其上 */}
      <ConstellationField />
      <ScrollProgress />
      {/* key=pathname：路由切换时重挂载，重新观察新页面的 .reveal 元素 */}
      <BackgroundFX key={location.pathname} />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:btn focus:btn-primary"
      >
        {t('skipToContent')}
      </a>
      <Header />
      <main
        id="main"
        className="flex-1 relative z-[1]"
        style={{ paddingBottom: playerVisible ? '88px' : '0px' }}
      >
        <Outlet />
      </main>
      <div className="relative z-[1]">
        <Footer />
      </div>

      {/* 全局底部播放器（跨页面持久化） */}
      <Player />
    </div>
  )
}
