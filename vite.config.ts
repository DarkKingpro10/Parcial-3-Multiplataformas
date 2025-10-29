import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
// const isDesktop = process.env.VITE_TARGET === 'desktop'

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    tailwindcss(),
  ],
  server: {
    host: '127.0.0.1',
    port: 5175,
  },
  // Importante para Electron: que los assets en index.html sean relativos a file://
  base: './',
})
