import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'

const navItems = [
  { to: '/', label: '首页' },
  { to: '/blog', label: '博客' },
  { to: '/tags', label: '标签' },
  { to: '/admin', label: '管理' },
]

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-dark-bg/95 border-b border-neon-blue/20">
      <nav className="flex items-center justify-between px-6 py-4 md:px-12">
        <Link to="/" className="font-orbitron text-xl font-bold neon-text-blue">
          Jensen.lyz
        </Link>

        <ul className="hidden md:flex gap-8">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `hover:neon-text-blue transition ${
                    isActive ? 'neon-text-blue' : 'text-text-secondary'
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        <button
          className="md:hidden flex flex-col justify-between w-7 h-6"
          onClick={() => setOpen(!open)}
          aria-label="菜单"
          type="button"
        >
          <span className="h-0.5 w-full bg-neon-blue" />
          <span className="h-0.5 w-full bg-neon-blue" />
          <span className="h-0.5 w-full bg-neon-blue" />
        </button>
      </nav>

      {open && (
        <ul className="md:hidden flex flex-col gap-4 px-6 pb-4 bg-dark-bg/95">
          {navItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                onClick={() => setOpen(false)}
                className="block text-text-secondary hover:neon-text-blue"
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </header>
  )
}
