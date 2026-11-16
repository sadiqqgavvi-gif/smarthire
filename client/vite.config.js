import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Pin the dev port. Vite otherwise moves to 5174, 5175... when 5173 is taken, and the
    // new origin is not in the backend's CLIENT_ORIGINS or Google's authorised origins,
    // so Google sign-in fails with "The given origin is not allowed for the given client ID".
    // Failing loudly here is easier to diagnose than a silently different port.
    port: 5173,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        // React and the router change rarely, so keep them in their own long-cached chunk.
        manualChunks: {
          react: ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/tests/setup.js",
    globals: true,
  },
})
