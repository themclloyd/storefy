import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

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
    react({
      // React 19 optimizations
      jsxRuntime: 'automatic'
    }),
  ],
  // Vite 7 optimizations
  optimizeDeps: {
    include: ['react', 'react-dom']
  }
}));
