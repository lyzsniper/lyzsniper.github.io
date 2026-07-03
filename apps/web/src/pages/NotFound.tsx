import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="container-page py-24 md:py-32 text-center">
      <div className="text-display-xl text-[var(--fg-tertiary)] mb-4 font-mono">404</div>
      <h1 className="text-display-md text-[var(--fg-primary)] mb-3">页面不存在</h1>
      <p className="text-body text-[var(--fg-secondary)] mb-8 max-w-md mx-auto">
        你访问的页面可能已被移动、删除，或者从未存在过。
      </p>
      <Link to="/" className="btn btn-primary">
        <Home size={14} /> 回到首页
      </Link>
    </div>
  )
}