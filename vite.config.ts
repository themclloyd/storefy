import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ command }) => ({
  server: {
    host: "localhost",
    port: 3000,
    strictPort: false, // Allow fallback to other ports
    open: true,
    hmr: {
      port: 3000,
      host: 'localhost'
    },
    // Security: Restrict file system access
    fs: {
      strict: true,
      allow: [
        // Allow access to project root
        path.resolve(__dirname),
        // Allow access to node_modules
        path.resolve(__dirname, 'node_modules'),
      ]
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
  // Configure source maps - completely disabled for security
  build: {
    sourcemap: false, // Never generate source maps for security
    minify: 'terser',
    terserOptions: {
      compress: {
        // Additional security options
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        drop_console: true,
        drop_debugger: true,
      },
      mangle: {
        // Obfuscate function and variable names
        toplevel: true,
        safari10: true,
      },
      format: {
        // Remove comments and make code harder to read
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
        },
        // Obfuscate chunk names for security
        chunkFileNames: 'assets/[hash].js',
        entryFileNames: 'assets/[hash].js',
        assetFileNames: 'assets/[hash].[ext]',
      },
    },
  },
}));
