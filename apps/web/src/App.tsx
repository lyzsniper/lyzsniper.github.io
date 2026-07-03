import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Blog from './pages/Blog'
import Post from './pages/Post'
import Tags from './pages/Tags'
import Search from './pages/Search'
import Admin from './pages/Admin'
import Editor from './pages/Editor'
import Inbox from './pages/Inbox'
import TagManage from './pages/TagManage'
import NotFound from './pages/NotFound'
import { useTranslation } from 'react-i18next'

export default function App() {
  const { i18n } = useTranslation()
  const location = useLocation()
  useEffect(() => {
    const lng = location.pathname.startsWith('/en') ? 'en' : 'zh'
    if (i18n.language !== lng) {
      void i18n.changeLanguage(lng)
    }
  }, [location.pathname, i18n])

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<Post />} />
        <Route path="/tags" element={<Tags />} />
        <Route path="/tags/:tag" element={<Tags />} />
        <Route path="/search" element={<Search />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/editor" element={<Editor />} />
        <Route path="/admin/editor/:slug" element={<Editor />} />
        <Route path="/admin/inbox" element={<Inbox />} />
        <Route path="/admin/tags" element={<TagManage />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
