import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ command }) => ({
  server: {
    host: "localhost",
    port: 8080,
    open: true,
    hmr: {
      port: 8080,
      host: 'localhost'
    }
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Vite 7 optimizations
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  // Configure source maps - hidden for production, inline for development
  build: {
    sourcemap: command === 'serve' ? 'inline' : 'hidden',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: command === 'build',
        drop_debugger: command === 'build',
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
      },
    },
  },
}));
