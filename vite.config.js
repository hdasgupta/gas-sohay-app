import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    target: 'es2015', // Transpiles modern JS features down to standard syntax
    cssCodeSplit: false,
    outDir: 'dist',
  },
});

