import { readFileSync } from 'fs';

export default {
  globs: ['src/**/*.js'],
  exclude: ['src/**/*.test.js'],
  outdir: '.',
  dev: false,
  watch: false,
  litelement: false,
  fast: false,
  stencil: false,
  catalyst: false,
};
