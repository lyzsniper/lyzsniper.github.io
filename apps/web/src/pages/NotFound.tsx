import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="pt-24 px-6 max-w-md mx-auto text-center pb-20">
      <h1 className="font-orbitron text-7xl font-black neon-text-purple mb-4">
        404
      </h1>
      <p className="text-text-secondary mb-8">页面不存在</p>
      <Link
        to="/"
        className="px-6 py-2 rounded border border-neon-blue neon-text-blue hover:bg-neon-blue/10"
      >
        回到首页
      </Link>
    </div>
  )
}
