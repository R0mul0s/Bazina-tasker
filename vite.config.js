import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Bundle analyzer - spustit pomocí npm run analyze
    mode === 'analyze' && visualizer({
      open: true,
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
      },
    },
  },
  build: {
    // Optimalizace bundlu
    rollupOptions: {
      output: {
        // Rozdělení chunks pro lepší caching
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-coreui': ['@coreui/react', '@coreui/coreui', '@coreui/icons', '@coreui/icons-react'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-charts': ['chart.js', 'react-chartjs-2'],
          'vendor-tiptap': ['@tiptap/react', '@tiptap/starter-kit'],
          'vendor-calendar': ['@fullcalendar/react', '@fullcalendar/daygrid', '@fullcalendar/timegrid', '@fullcalendar/interaction'],
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
        },
      },
    },
    // Optimalizace velikosti
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Odstranění console.log v produkci
        drop_debugger: true,
      },
    },
    // Rozdělit CSS do samostatných souborů
    cssCodeSplit: true,
    // Optimalizace obrázků - nastavení asset limit
    assetsInlineLimit: 4096, // 4kb - menší soubory budou inline
    // Source maps pro debugging
    sourcemap: false,
  },
  // Optimalizace pro development
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@coreui/react',
      '@supabase/supabase-js',
    ],
  },
}))
