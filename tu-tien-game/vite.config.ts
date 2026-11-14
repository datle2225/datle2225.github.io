import { defineConfig } from 'vite';

// base './' để build chạy được dưới /tu-tien-game/play/ trên GitHub Pages.
export default defineConfig({
  base: './',
  build: {
    outDir: 'play',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: { manualChunks: { phaser: ['phaser'] } },
    },
  },
  test: { include: ['tests/**/*.test.ts'] },
});
