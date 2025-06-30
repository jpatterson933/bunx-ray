import { resolve } from 'path';
import analyze from 'rollup-plugin-analyzer';

export default {
  build: {
    outDir: 'dist-vite',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve('./src-vite/index.ts'),
      plugins: [
        analyze({ summaryOnly: true, json: true, filename: 'dist-vite/stats.json' })
      ]
    }
  }
}; 