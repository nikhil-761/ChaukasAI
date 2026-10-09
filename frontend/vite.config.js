import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Pehli baar start tez ho aur beech me "optimizing dependencies" reload na aaye
  optimizeDeps: {
    include: ['react', 'react-dom/client', 'react-router-dom', 'leaflet', 'react-leaflet', 'lucide-react'],
  },
  server: {
    warmup: { clientFiles: ['./src/main.jsx', './src/App.jsx', './src/pages/*.jsx'] },
    // Backend (FastAPI) aane par /api requests yahan proxy ho jayengi
    proxy: { '/api': 'http://localhost:8000' },
  },
})
