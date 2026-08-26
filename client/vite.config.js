import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // Mirrors the "paths" entry in tsconfig.json - both must agree or an
    // import resolves for the type-checker but not the bundler
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Bootstrap's own SCSS emits ~25 mixed-decls deprecation warnings on
        // every build. They are not actionable from here - they come from
        // node_modules - and they bury any warning our own styles produce.
        // quietDeps silences dependencies only; our SCSS still reports.
        quietDeps: true,
      },
    },
  },
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
          socket: ['socket.io-client'],
          // ~1MB emoji dataset; also lazy-loaded (see EmojiPickerButton.jsx) so
          // it is fetched only when the composer's emoji button is opened, not
          // on every app load
          emoji: ['emoji-picker-react'],
        },
      },
    },
  },
})
