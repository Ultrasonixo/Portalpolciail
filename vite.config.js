import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // ===================================
  // ✅ ADICIONE ESTA SEÇÃO DE PROXY ✅
  // ===================================
  server: {
    proxy: {
      // Quando o frontend chamar /api/*, o Vite irá redirecionar para http://localhost:3000
      '/api': {
        target: 'http://localhost:3000', 
        changeOrigin: true, 
        secure: false,      
        // O rewrite não é necessário aqui, já que o backend espera '/api/...'
      },
    }
  }
});