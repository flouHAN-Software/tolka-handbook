import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './': statik derleme sitenin herhangi bir klasöründen açılabilsin
export default defineConfig({
  base: './',
  plugins: [react()],
  // /api istekleri yerelde Worker'a (npm run server, 8787) gider; canlıda aynı alan adında
  server: { port: 5192, strictPort: true, proxy: { '/api': 'http://localhost:8787' } },
  preview: { port: 5193, strictPort: true }
});
