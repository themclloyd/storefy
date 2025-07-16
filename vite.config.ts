import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "localhost", // changed from "::" to "localhost" for better compatibility
    port: 8080,
    open: true,
    hmr: {
      port: 8080,
      host: 'localhost'
    },
    watch: {
      usePolling: true,
      interval: 100
    }
  },
  publicDir: 'public',
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1000, // Increase warning limit to 1MB
    sourcemap: false, // Disable sourcemaps in production for smaller builds
    minify: 'esbuild', // Use esbuild for faster minification
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // UI Library chunks (split for better caching)
          'radix-core': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-popover',
            '@radix-ui/react-slot'
          ],
          'radix-forms': [
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-switch',
            '@radix-ui/react-slider',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group'
          ],
          'radix-layout': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-separator',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-aspect-ratio'
          ],
          'radix-misc': [
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-avatar',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-context-menu'
          ],

          // Form handling
          'form-vendor': [
            'react-hook-form',
            '@hookform/resolvers',
            'zod'
          ],

          // Data management
          'data-vendor': [
            '@tanstack/react-query',
            '@supabase/supabase-js'
          ],

          // Charts and visualization
          'chart-vendor': ['recharts'],

          // PDF and export utilities
          'export-vendor': ['jspdf', 'jspdf-autotable', 'html2canvas', 'papaparse'],

          // Utility libraries
          'utils-vendor': [
            'lucide-react',
            'date-fns',
            'clsx',
            'class-variance-authority',
            'tailwind-merge'
          ],

          // Analytics and monitoring
          'analytics-vendor': [
            '@vercel/analytics'
          ],

          // UI Enhancement libraries
          'ui-enhancement': [
            'cmdk',
            'sonner',
            'next-themes',
            'input-otp',
            'embla-carousel-react',
            'react-day-picker',
            'react-resizable-panels',
            'vaul'
          ]
        },
        // Optimize chunk naming for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace(/\.[^/.]+$/, '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') || [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `images/[name]-[hash].[ext]`;
          }
          if (/css/i.test(ext)) {
            return `css/[name]-[hash].[ext]`;
          }
          return `assets/[name]-[hash].[ext]`;
        }
      },
      // Enable tree-shaking for better optimization
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
      },
      // External dependencies that shouldn't be bundled
      external: (id) => {
        // Don't bundle Node.js built-ins
        return id.startsWith('node:');
      },
    },
    // Enable compression
    reportCompressedSize: true,
    // Optimize CSS
    cssCodeSplit: true,
    // Target modern browsers for smaller bundles
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
  },
}));
