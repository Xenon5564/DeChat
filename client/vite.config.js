import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/socket.io': {
        target: 'https://localhost:3000',
        ws: true,
        secure: false,
        changeOrigin: true,
      },
      '/upload': {
        target: 'https://localhost:3000',
        secure: false,
        changeOrigin: true,
      },

      '/uploads': {
        target: 'https://localhost:3000',
        secure: false,
        changeOrigin: true,
      }
    }
  }
})
