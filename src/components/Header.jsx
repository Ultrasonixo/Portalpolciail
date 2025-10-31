import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

    // --- [NOVO] Estado para as configurações dinâmicas ---
    const [settings, setSettings] = useState({
        header_title: "Secretaria Policia",
        header_subtitle: "Portal Oficial",
        header_logo_url: "/brasao.png"
    });

    // --- [NOVO] Busca as configurações da API ---
    useEffect(() => {
        const fetchPortalSettings = async () => {
            try {
                // Rota pública, não precisa de token
                const response = await fetch('/api/public/portal-settings');
                if (!response.ok) {
                    throw new Error('Falha ao buscar configurações do portal.');
                }
                const data = await response.json();
                setSettings({
                    header_title: data.header_title || "Secretaria Policia",
                    header_subtitle: data.header_subtitle || "Portal Oficial",
                    header_logo_url: data.header_logo_url || "/brasao.png"
                });
            } catch (err) {
                console.error("Erro ao carregar configs do Header:", err.message);
                // Mantém os valores padrão em caso de erro
            }
        };

        fetchPortalSettings();
    }, []); // Roda apenas uma vez ao carregar o componente

    const handleLogout = () => {
        logout();
        navigate('/');
        setMobileMenuOpen(false);
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    }

    return (
        <header className="bg-white shadow-md flex justify-between items-center px-4 sm:px-8 py-3 sticky top-0 z-50">
            {/* --- Lado Esquerdo (Logo) --- */}
            <Link to="/" className="flex items-center gap-3 text-gray-800 hover:text-blue-600" onClick={closeMobileMenu}>
                {/* --- [ATUALIZADO] Logo Dinâmico --- */}
                <img 
                    src={settings.header_logo_url.startsWith('http') ? settings.header_logo_url : settings.header_logo_url} 
                    alt="Brasão da Polícia" 
                    className="h-10 w-auto" 
                    onError={(e) => { e.target.onerror = null; e.target.src = "/brasao.png" }} // Fallback
                />
                <div className="flex flex-col leading-tight">
                    {/* --- [ATUALIZADO] Título Dinâmico --- */}
                    <span className="text-lg sm:text-xl font-bold">{settings.header_title}</span>
                    <small className="text-xs sm:text-sm text-gray-600">{settings.header_subtitle}</small>
                </div>
            </Link>

            {/* --- Navegação Desktop (Escondida em mobile) --- */}
            <nav className="hidden lg:flex items-center gap-1">
                <NavLink to="/" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors ${isActive ? 'bg-blue-100 text-blue-700 font-semibold' : ''}`}><i className="fas fa-home mr-1"></i> Início</NavLink>
                <NavLink to="/boletim" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors ${isActive ? 'bg-blue-100 text-blue-700 font-semibold' : ''}`}><i className="fas fa-file-alt mr-1"></i> Boletim</NavLink>
                <NavLink to="/batalhoes" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors ${isActive ? 'bg-blue-100 text-blue-700 font-semibold' : ''}`}><i className="fas fa-shield-alt mr-1"></i> Batalhões</NavLink>
                <NavLink to="/concursos" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors ${isActive ? 'bg-blue-100 text-blue-700 font-semibold' : ''}`}><i className="fas fa-file-signature mr-1"></i> Concursos</NavLink>
                <NavLink to="/juridico" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors ${isActive ? 'bg-blue-100 text-blue-700 font-semibold' : ''}`}><i className="fas fa-gavel mr-1"></i> Jurídico</NavLink>
                {user && user.type === 'policial' && (
                    <NavLink to="/policia/dashboard" className={({ isActive }) => `px-3 py-2 rounded-md text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors ${isActive ? 'bg-blue-600 text-white font-semibold hover:bg-blue-700' : ''}`}>
                        <i className="fas fa-tachometer-alt mr-1"></i> Dashboard
                    </NavLink>
                )}
            </nav>

            {/* --- Ações do Usuário (Desktop - Escondido em mobile) --- */}
            <div className="hidden lg:flex items-center gap-4">
                {user ? (
                    <>
                        <div className="text-right text-sm">
                            <span className="block font-semibold text-gray-800">{user.nome_completo}</span>
                            <span className="block text-gray-500">{user.patente || user.cargo}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-800 font-medium py-2 px-3 rounded-md text-sm flex items-center gap-1 transition-colors border border-red-200 hover:border-red-300"
                        >
                            <i className="fas fa-sign-out-alt"></i> Sair
                        </button>
                    </>
                ) : (
                    <Link
                        to="/login"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md text-sm transition-colors"
                    >
                        Entrar
                    </Link>
                )}
            </div>

            {/* --- Botão do Menu Mobile (Apenas em telas menores que lg) --- */}
            <button
                onClick={toggleMobileMenu}
                className="lg:hidden text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 p-2 rounded-md"
                aria-label="Abrir menu"
            >
                {isMobileMenuOpen ? (
                    <i className="fas fa-times text-xl"></i>
                ) : (
                    <i className="fas fa-bars text-xl"></i>
                )}
            </button>

            {/* --- Menu Mobile (Overlay) --- */}
            <div
                className={`lg:hidden fixed inset-0 bg-gray-800/90 backdrop-blur-sm z-40 transition-opacity duration-300 ease-in-out ${
                    isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={toggleMobileMenu} // Fecha ao clicar fora
            >
                {/* Container do Menu */}
                <div
                    className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
                        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
                    onClick={(e) => e.stopPropagation()} // Impede fechar ao clicar dentro
                >
                    {/* Logo no topo do menu mobile */}
                    <div className="p-5 border-b border-gray-200">
                        <Link to="/" className="flex items-center gap-3 text-gray-800" onClick={closeMobileMenu}>
                             {/* --- [ATUALIZADO] Logo Dinâmico (Mobile) --- */}
                            <img 
                                src={settings.header_logo_url.startsWith('http') ? settings.header_logo_url : settings.header_logo_url} 
                                alt="Brasão da Polícia" 
                                className="h-8 w-auto" 
                                onError={(e) => { e.target.onerror = null; e.target.src = "/brasao.png" }} // Fallback
                            />
                            <div className="flex flex-col leading-tight">
                                {/* --- [ATUALIZADO] Título Dinâmico (Mobile) --- */}
                                <span className="text-md font-bold">{settings.header_title}</span>
                                <small className="text-xs text-gray-600">{settings.header_subtitle}</small>
                            </div>
                        </Link>
                    </div>

                    {/* Links no menu mobile */}
                    <nav className="flex flex-col p-4 space-y-2">
                         <NavLink to="/" onClick={closeMobileMenu} className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${isActive ? 'bg-blue-100 text-blue-700' : ''}`}><i className="fas fa-home w-5 mr-2 text-center"></i> Início</NavLink>
                         <NavLink to="/boletim" onClick={closeMobileMenu} className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${isActive ? 'bg-blue-100 text-blue-700' : ''}`}><i className="fas fa-file-alt w-5 mr-2 text-center"></i> Boletim</NavLink>
                         <NavLink to="/batalhoes" onClick={closeMobileMenu} className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${isActive ? 'bg-blue-100 text-blue-700' : ''}`}><i className="fas fa-shield-alt w-5 mr-2 text-center"></i> Batalhões</NavLink>
                         <NavLink to="/concursos" onClick={closeMobileMenu} className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${isActive ? 'bg-blue-100 text-blue-700' : ''}`}><i className="fas fa-file-signature w-5 mr-2 text-center"></i> Concursos</NavLink>
                         <NavLink to="/juridico" onClick={closeMobileMenu} className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 ${isActive ? 'bg-blue-100 text-blue-700' : ''}`}><i className="fas fa-gavel w-5 mr-2 text-center"></i> Jurídico</NavLink>
                        {user && user.type === 'policial' && (
                             <NavLink to="/policia/dashboard" onClick={closeMobileMenu} className={({ isActive }) => `block px-3 py-2 rounded-md text-base font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 ${isActive ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}`}>
                                <i className="fas fa-tachometer-alt w-5 mr-2 text-center"></i> Dashboard
                            </NavLink>
                        )}

                        {/* Ações do Usuário no Mobile */}
                        <div className="pt-4 mt-4 border-t border-gray-200">
                             {user ? (
                                <>
                                    <div className="px-3 mb-3">
                                        <span className="block font-semibold text-gray-800 text-sm">{user.nome_completo}</span>
                                        <span className="block text-gray-500 text-xs">{user.patente || user.cargo}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-800"
                                    >
                                        <i className="fas fa-sign-out-alt w-5 mr-2 text-center"></i> Sair
                                    </button>
                                </>
                            ) : (
                                <Link
                                    to="/login"
                                    onClick={closeMobileMenu}
                                    className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50 hover:text-blue-800"
                                >
                                    <i className="fas fa-sign-in-alt w-5 mr-2 text-center"></i> Entrar
                                </Link>
                            )}
                        </div>
                    </nav>
                </div>
            </div>
        </header>
    );
}
export default Header;