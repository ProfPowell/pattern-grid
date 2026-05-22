import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: {
        'pattern-grid': 'src/pattern-grid.js',
        'seed-context': 'src/seed-context.js',
        'paint-worklet': 'src/paint-worklet.js',
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    outDir: 'dist',
    emptyOutDir: false,
  },
  server: {
    open: '/demo/index.html',
    cors: true,
  },
});
