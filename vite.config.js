import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    hmr: {
      clientPort: 3000 // Force Vite to use the Vercel Dev port for WebSockets to prevent infinite reloads
    }
  }
});
