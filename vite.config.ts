import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
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
  }
}));
