import { defineConfig } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: {
    preset: '2023',
  },
  preset: {
    apple: { padding: 0.3 },
    maskable: { padding: 0.1, resizeOptions: { background: '#0a0a0a' } },
    transparent: { padding: 0.3, resizeOptions: { fit: 'contain' } },
  },
  images: ['public/avatar.png'],
})
