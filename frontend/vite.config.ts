import { defineConfig } from 'vite';

export default defineConfig({
  // Опции сервера
  server: {
    port: 5174,
    open: true, // Автоматически открывать браузер
  },
  // Опции сборки
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
  },
  // Опции оптимизации
  optimizeDeps: {
    include: ['socket.io-client'],
  },
  // Алиасы для импортов
  resolve: {
    alias: {
      '@': '/src',
    },
  },
}); 