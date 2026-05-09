import { defineConfig } from 'vite';

export default defineConfig({
  // Ścieżka bazowa dla GitHub Pages. 
  // Zmień 'zip-game' na nazwę swojego repozytorium na GitHubie.
  base: '/ade-zip-game/', 
  
  build: {
    target: 'esnext',
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Usunięcie console.log w produkcji
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        // Generowanie pojedynczych, przewidywalnych plików bez zbędnych hashy 
        // (przydatne przy cache'owaniu PWA w przyszłości)
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  }
});