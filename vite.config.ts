import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Generate build ID based on current timestamp
const buildTime = new Date().toISOString();
const buildId = `B${Date.now().toString(36).toUpperCase()}`;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime),
    __BUILD_ID__: JSON.stringify(buildId),
    __APP_VERSION__: JSON.stringify('1.0.0'),
  },
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk - core libraries that rarely change
          'vendor': [
            'react',
            'react-dom',
            'react-router-dom',
            '@tanstack/react-query',
          ],
          // UI components chunk - Radix UI primitives
          'ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-accordion',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-select',
            '@radix-ui/react-switch',
            '@radix-ui/react-slider',
            '@radix-ui/react-progress',
            '@radix-ui/react-scroll-area',
          ],
          // Supabase chunk
          'supabase': [
            '@supabase/supabase-js',
          ],
          // Capacitor chunk - native features
          'capacitor': [
            '@capacitor/core',
            '@capacitor/app',
            '@capacitor/push-notifications',
          ],
          // Charts chunk - only needed on admin pages
          'charts': [
            'recharts',
          ],
        }
      }
    }
  }
}));
