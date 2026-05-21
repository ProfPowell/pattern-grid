import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/pattern-grid.js',
      formats: ['es'],
      fileName: () => 'pattern-grid.js',
    },
    outDir: 'dist',
    emptyOutDir: false,
  },
  server: {
    open: '/demo/index.html',
    cors: true,
  },
});
