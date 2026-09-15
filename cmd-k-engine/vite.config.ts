import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/cmd-k-engine/',
  plugins: [react()],
})
