import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      // Socket.io needs proxying too, with ws:true for the websocket upgrade.
      // Without this the client connects to the Vite dev server instead of the
      // API and no realtime event ever arrives - which also made VITE_SOCKET_URL
      // necessary in dev. With it, same-origin works in dev exactly as it does
      // in production.
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
        secure: false,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split vendor code so app changes don't invalidate the whole bundle
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          bootstrap: ['react-bootstrap'],
          socket: ['socket.io-client'],
        },
      },
    },
  },
})
