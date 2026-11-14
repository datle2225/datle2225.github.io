import { defineConfig } from 'vite';

// base './' để build chạy được dưới /tu-tien-game/play/ trên GitHub Pages.
export default defineConfig({
  base: './',
  build: {
    outDir: 'play',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      // Vite 8 (Rolldown) yêu cầu manualChunks là hàm
      output: { manualChunks: (id: string) => (id.includes('node_modules/phaser') ? 'phaser' : undefined) },
    },
  },
  test: { include: ['tests/**/*.test.ts'] },
});
