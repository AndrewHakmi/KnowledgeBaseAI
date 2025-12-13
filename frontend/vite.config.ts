import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    allowedHosts: ['kb.studyninja.ru', 'kb.xteam.pro', 'localhost'],
    cors: true,
    proxy: {
      '/v1': 'http://fastapi:8000',
      '/ws': {
        target: 'ws://fastapi:8000',
        ws: true
      }
    },
  },
})
