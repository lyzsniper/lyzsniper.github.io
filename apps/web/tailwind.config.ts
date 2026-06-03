import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'neon-blue': '#00f5ff',
        'neon-purple': '#b829dd',
        'neon-pink': '#ff2d95',
        'neon-green': '#39ff14',
        'dark-bg': '#0a0a0f',
        'card-bg': 'rgba(15, 15, 25, 0.8)',
        'text-primary': '#ffffff',
        'text-secondary': '#a0a0b0',
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        'noto-sans': ['"Noto Sans SC"', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 20px rgba(0, 245, 255, 0.5), 0 0 40px rgba(0, 245, 255, 0.3)',
        'glow-purple': '0 0 20px rgba(184, 41, 221, 0.5), 0 0 40px rgba(184, 41, 221, 0.3)',
        'glow-pink': '0 0 20px rgba(255, 45, 149, 0.5), 0 0 40px rgba(255, 45, 149, 0.3)',
      },
    },
  },
  plugins: [],
} satisfies Config
