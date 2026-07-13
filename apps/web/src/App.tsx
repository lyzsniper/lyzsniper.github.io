import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Blog from './pages/Blog'
import Post from './pages/Post'
import Tags from './pages/Tags'
import Search from './pages/Search'
import Admin from './pages/Admin'
import Editor from './pages/Editor'
import Inbox from './pages/Inbox'
import TagManage from './pages/TagManage'
import AdminStats from './pages/AdminStats'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import { useAuthStore } from './store/auth'
import { useTranslation } from 'react-i18next'

export default function App() {
  const fetchMe = useAuthStore((s) => s.fetchMe)

  useEffect(() => {
    fetchMe()
  }, [fetchMe])

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
        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/editor"
          element={
            <ProtectedRoute>
              <Editor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/editor/:slug"
          element={
            <ProtectedRoute>
              <Editor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/inbox"
          element={
            <ProtectedRoute>
              <Inbox />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tags"
          element={
            <ProtectedRoute>
              <TagManage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/stats"
          element={
            <ProtectedRoute>
              <AdminStats />
            </ProtectedRoute>
          }
        />
      </Route>
      {/* English routes — same components, /en prefix */}
      <Route element={<Layout />}>
        <Route path="/en" element={<Home />} />
        <Route path="/en/blog" element={<Blog />} />
        <Route path="/en/blog/:slug" element={<Post />} />
        <Route path="/en/tags" element={<Tags />} />
        <Route path="/en/tags/:tag" element={<Tags />} />
        <Route path="/en/search" element={<Search />} />
        <Route path="/en/login" element={<Login />} />
        <Route
          path="/en/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/en/admin/editor"
          element={
            <ProtectedRoute>
              <Editor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/en/admin/editor/:slug"
          element={
            <ProtectedRoute>
              <Editor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/en/admin/inbox"
          element={
            <ProtectedRoute>
              <Inbox />
            </ProtectedRoute>
          }
        />
        <Route
          path="/en/admin/tags"
          element={
            <ProtectedRoute>
              <TagManage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/en/admin/stats"
          element={
            <ProtectedRoute>
              <AdminStats />
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
