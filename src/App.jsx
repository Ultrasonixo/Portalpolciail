import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Ajustado para o caminho /design/ se você moveu
import './components/design/ToastifyCustom.css';

// Layouts e Proteção
import MainLayout from './components/MainLayout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AntiDevTools from './components/AntiDevTools.jsx';

// --- PÁGINAS PÚBLICAS E DE LOGIN ---
import HomePage from './pages/HomePage.jsx';
import BoletimPage from './pages/BoletimPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import LoginPolicial from './pages/LoginPolicial.jsx';
import RegisterPolicial from './pages/RegisterPolicial.jsx';
import ConcursosPage from './pages/ConcursosPage.jsx';
import JuridicoPage from './pages/Portaljuridico.jsx';
import SobreNosPage from './pages/SobreNosPage.jsx';
import ChangelogPage from './pages/ChangelogPage.jsx';
import Contato from './pages/ContatoPage.jsx';
import Termos from './pages/TermosPage.jsx';
import Privacidade from './pages/PrivacidadePage.jsx';
import OuvidoriaPage from './pages/OuvidoriaPage.jsx';

// --- PÁGINAS POLICIAIS (UNIFICADAS E ESPECIAIS) ---
import PainelPolicia from './pages/PainelPolicia.jsx'; // <-- [IMPORTANTE] O painel unificado
import AdminPanel from './pages/admin/AdminPanel.jsx'; // <-- [IMPORTANTE] O painel STAFF
import HeatmapPage from './pages/HeatmapPage.jsx'; // Mantido separado
import AnaliseTendenciasPage from './pages/AnaliseTendenciasPage.jsx'; // Mantido separado

import './App.css';

function App() {

  return (
    <>
      <ToastContainer
        position="bottom-right" autoClose={4000} hideProgressBar={false}
        newestOnTop={true} closeOnClick rtl={false} pauseOnFocusLoss
        draggable pauseOnHover theme="colored"
      />

      <Routes>
        {/* GRUPO 1: ROTAS DE AUTENTICAÇÃO POLICIAL (TELA CHEIA) */}
        <Route path="/policia/login" element={<LoginPolicial />} />
        <Route path="/policia/register" element={<RegisterPolicial />} />

        {/* GRUPO 2: ROTAS PÚBLICAS E CIVIS (COM HEADER E FOOTER) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/recuperar-senha" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/juridico" element={<JuridicoPage />} />
          <Route path="/concursos" element={<ConcursosPage />} />
          <Route path="/sobre-nos" element={<SobreNosPage />} />
          <Route path="/changelog" element={<ChangelogPage />} />
          <Route path="/termos" element={<Termos />} />
          <Route path="/contato" element={<Contato />} />
          <Route path="/ouvidoria" element={<OuvidoriaPage />} />
          <Route path="/privacidade" element={<Privacidade />} />
          <Route
            path="/boletim"
            element={<ProtectedRoute requiredType="civil"><BoletimPage /></ProtectedRoute>}
          />
        </Route>

        {/* --- [INÍCIO] ROTAS UNIFICADAS DA POLÍCIA --- */}
        
        {/* GRUPO 3: PAINEL POLICIAL UNIFICADO (Dashboard, Admin, Boletins, etc.) */}
        {/* O '/*' pega /policia, /policia/dashboard, /policia/admin, etc. e é gerenciado internamente pelo PainelPolicia */}
        <Route 
          path="/policia/*" 
          element={
            <ProtectedRoute requiredType="policial">
              <PainelPolicia />
            </ProtectedRoute>
          } 
        />

        {/* GRUPO 4: ROTAS DE RELATÓRIOS ESPECIAIS (Separadas, pois são páginas full-screen que quebram o layout do PainelPolicia) */}
        <Route 
            path="/policia/relatorios/criminalidade" 
            element={
              <ProtectedRoute requiredType="policial">
                <HeatmapPage />
              </ProtectedRoute>
            } 
        />
        <Route 
            path="/policia/relatorios/tendencias" 
            element={
              <ProtectedRoute requiredType="policial">
                <AnaliseTendenciasPage />
              </ProtectedRoute>
            } 
        />
        
        {/* --- [FIM] ROTAS UNIFICADAS DA POLÍCIA --- */}


        {/* === GRUPO 5: PAINEL STAFF (TUDO-EM-UM) === */}
        <Route 
            path="/staff/admin/*" 
            element={
                // Proteção que exige o tipo 'policial' E a permissão 'is_staff'
                <ProtectedRoute requiredPermission="is_staff">
                    <AdminPanel />
                </ProtectedRoute>
            } 
        />
        
        {/* Rota para qualquer caminho não encontrado */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
       {/* AntiDevTools pode ser mantido se desejado */}
       
    </>
  );
}

export default App;