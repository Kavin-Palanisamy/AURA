import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, existsSync, mkdirSync, cpSync } from 'fs';

// Custom plugin to ensure manifest.json and icons are copied to dist
function chromeExtensionPlugin() {
  return {
    name: 'chrome-extension-plugin',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');
      if (!existsSync(distDir)) {
        mkdirSync(distDir, { recursive: true });
      }

      // Copy manifest.json
      const manifestSrc = resolve(__dirname, 'manifest.json');
      const manifestDest = resolve(distDir, 'manifest.json');
      if (existsSync(manifestSrc)) {
        copyFileSync(manifestSrc, manifestDest);
      }

      // Copy icons directory if it exists in public
      const iconsSrc = resolve(__dirname, 'public/icons');
      const iconsDest = resolve(distDir, 'icons');
      if (existsSync(iconsSrc)) {
        cpSync(iconsSrc, iconsDest, { recursive: true });
      }
    }
  };
}

export default defineConfig({
  base: '',
  plugins: [
    react(),
    chromeExtensionPlugin()
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/index.html'),
        serviceWorker: resolve(__dirname, 'src/background/serviceWorker.ts'),
        content: resolve(__dirname, 'src/content/content.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'serviceWorker') {
            return 'background/serviceWorker.js';
          }
          if (chunkInfo.name === 'content') {
            return 'content/content.js';
          }
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  }
});
