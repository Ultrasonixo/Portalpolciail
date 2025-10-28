import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
// REMOVER: import './SeuMainLayout.css'; // Ou qualquer CSS antigo para este layout
// REMOVER: A importação de App.css se ela só continha .main-layout e .site-content

const MainLayout = () => {
    const { user, logout, isLoading } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        if (logout) {
            logout();
        }
    };

    return (
        // --- ALTERAÇÕES AQUI ---
        // min-h-screen: Garante altura mínima de 100% da tela
        // flex flex-col: Organiza Header, Main e Footer em coluna
        <div className="min-h-screen flex flex-col">
            {/* Passa user e isLoading para o Header */}
            <Header user={user} isLoading={isLoading} onLogout={handleLogout} />

            {/* --- ALTERAÇÕES AQUI --- */}
            {/* flex-grow: Faz esta seção ocupar todo o espaço vertical disponível */}
            <main className="flex-grow"> {/* Removida a classe 'content-public' se não usada mais */}
                <Outlet />
            </main>

            <Footer />
        </div>
        // --- FIM DAS ALTERAÇÕES ---
    );
};

export default MainLayout;