import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@config': path.resolve(__dirname, './src/config'),
      '@api': path.resolve(__dirname, './src/api'),
      '@ui': path.resolve(__dirname, './src/components/ui'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
      '@router': path.resolve(__dirname, './src/router'),
      '@modules': path.resolve(__dirname, './src/modules'),
      '@theme': path.resolve(__dirname, './src/theme'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@locales': path.resolve(__dirname, './src/locales'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@types': path.resolve(__dirname, './src/types'),
      '@components': path.resolve(__dirname, './src/components'),
    },
  },
});
