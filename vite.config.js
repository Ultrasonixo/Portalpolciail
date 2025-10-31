import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.config/
export default defineConfig({
  plugins: [react()],
  
  server: {
    proxy: {
      // Redireciona /api/qualquercoisa para http://localhost:3000/api/qualquercoisa
      '/api': {
        target: 'http://localhost:3000', 
        changeOrigin: true, 
        secure: false,      
      },
      
      // ✅ NOVA REGRA ADICIONADA:
      // Redireciona /uploads/imagem.png para http://localhost:3000/uploads/imagem.png
      '/uploads': {
        target: 'http://localhost:3000', 
        changeOrigin: true, 
        secure: false,      
      },
    }
  }
});