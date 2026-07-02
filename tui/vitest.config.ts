import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENV_VAR, TEST_ENV } from './src/libs/runtime/buildEnv.ts';

const tuiRoot = path.dirname(fileURLToPath(import.meta.url));
const srcRoot = path.join(tuiRoot, 'src');

export default defineConfig({
  resolve: {
    alias: {
      '@': srcRoot,
      '@backend': path.join(srcRoot, 'backend'),
      '@components': path.join(srcRoot, 'components'),
      '@contracts': path.join(srcRoot, 'contracts'),
      '@libs': path.join(srcRoot, 'libs'),
      '@state': path.join(srcRoot, 'state'),
      '@test': path.join(srcRoot, 'test'),
      '@theme': path.join(srcRoot, 'theme')
    }
  },
  test: {
    environment: 'node',
    env: {
      // Activates the `KQODE_ENV === 'test'` override seams (viewport, git status).
      [ENV_VAR]: TEST_ENV
    }
  }
});
