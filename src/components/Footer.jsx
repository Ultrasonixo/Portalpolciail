import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Define a URL base da sua API (do server.js)
const API_URL = 'http://localhost:3000';

function Footer() {
    const { user } = useAuth();
    const portalLinkTarget = user && user.type === 'policial' ? '/policia/dashboard' : '/policia/login';

    // --- [NOVO] Estado para as configurações dinâmicas ---
    const [settings, setSettings] = useState({
        header_title: "Secretaria de Segurança",
        header_subtitle: "Portal Oficial",
        header_logo_url: "/brasao.png",
        footer_copyright: `© ${new Date().getFullYear()} Consolação Paulista Roleplay. Todos os direitos reservados.`
    });

    // --- [NOVO] Busca as configurações da API ---
    useEffect(() => {
        const fetchPortalSettings = async () => {
            try {
                // Rota pública, não precisa de token
                const response = await fetch(`${API_URL}/api/public/portal-settings`);
                if (!response.ok) {
                    throw new Error('Falha ao buscar configurações do portal.');
                }
                const data = await response.json();
                setSettings({
                    header_title: data.header_title || "Secretaria de Segurança",
                    header_subtitle: data.header_subtitle || "Portal Oficial",
                    header_logo_url: data.header_logo_url || "/brasao.png",
                    footer_copyright: data.footer_copyright || `© ${new Date().getFullYear()} Consolação Paulista Roleplay. Todos os direitos reservados.`
                });
            } catch (err) {
                console.error("Erro ao carregar configs do Footer:", err.message);
                // Mantém os valores padrão em caso de erro
            }
        };

        fetchPortalSettings();
    }, []); // Roda apenas uma vez ao carregar o componente

    return (
        <footer className="bg-indigo-900 text-indigo-100 text-sm py-16">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex flex-col md:flex-row flex-wrap justify-between gap-10 mb-10 text-center md:text-left">

                    {/* --- Coluna Sobre --- */}
                    <div className="flex-[2] min-w-[250px] flex flex-col items-center md:items-start">
                        {/* --- [ATUALIZADO] Logo Dinâmico --- */}
                        <Link to="/" className="flex items-center gap-3 text-white mb-4 no-underline">
                            <img 
                                src={settings.header_logo_url.startsWith('http') ? settings.header_logo_url : `${API_URL}${settings.header_logo_url}`} 
                                alt="Brasão da Polícia" 
                                className="h-10 w-auto" 
                                onError={(e) => { e.target.onerror = null; e.target.src = "/brasao.png" }} // Fallback
                            />
                            <div className="flex flex-col leading-tight">
                                {/* --- [ATUALIZADO] Títulos Dinâmicos --- */}
                                <span className="font-bold text-lg">{settings.header_title}</span>
                                <small className="opacity-80">{settings.header_subtitle}</small>
                            </div>
                        </Link>
                        
                        <p className="leading-relaxed opacity-80">
                            Servindo e protegendo a comunidade com excelência, transparência e compromisso.
                        </p>
                        
                        <div className="flex gap-4 mt-5 justify-center md:justify-start">
                            <a href="https://discord.gg/cno" target="_blank" rel="noopener noreferrer" className="text-white text-2xl transition-all duration-300 hover:text-yellow-400 hover:-translate-y-1">
                                <i className="fab fa-discord"></i>
                            </a>
                            <a href="#" target="_blank" rel="noopener noreferrer" className="text-white text-2xl transition-all duration-300 hover:text-yellow-400 hover:-translate-y-1">
                                <i className="fab fa-twitter"></i>
                            </a>
                            <a href="#" target="_blank" rel="noopener noreferrer" className="text-white text-2xl transition-all duration-300 hover:text-yellow-400 hover:-translate-y-1">
                                <i className="fab fa-youtube"></i>
                            </a>
                        </div>
                    </div>

                    {/* --- Colunas de Links (Institucional) --- */}
                    <div className="flex-1 min-w-[180px]">
                        <h3 className="text-white text-base font-semibold mb-5 flex items-center gap-2 justify-center md:justify-start">
                            <i className="fas fa-link"></i> Institucional
                        </h3>
                        <ul className="list-none p-0 m-0 space-y-3">
                            <li><Link to={portalLinkTarget} className="opacity-80 transition-all duration-300 hover:opacity-100 hover:pl-1 no-underline">Portal Secretaria</Link></li>
                            <li><Link to="/ouvidoria" className="opacity-80 transition-all duration-300 hover:opacity-100 hover:pl-1 no-underline">Ouvidoria</Link></li>
                            <li><Link to="/concursos" className="opacity-80 transition-all duration-300 hover:opacity-100 hover:pl-1 no-underline">Concursos</Link></li>
                            <li><Link to="/staff/admin" className="opacity-80 transition-all duration-300 hover:opacity-100 hover:pl-1 no-underline">Administração</Link></li>
                        </ul>
                    </div>

                    {/* --- Colunas de Links (Comunidade) --- */}
                    <div className="flex-1 min-w-[180px]">
                        <h3 className="text-white text-base font-semibold mb-5 flex items-center gap-2 justify-center md:justify-start">
                             <i className="fas fa-users"></i> Comunidade
                        </h3>
                        <ul className="list-none p-0 m-0 space-y-3">
                            <li><a href="#" className="opacity-80 transition-all duration-300 hover:opacity-100 hover:pl-1 no-underline">Fórum da Cidade</a></li>
                            <li><a href="https://consolacao-network.gitbook.io/consolacaopnetwork/" className="opacity-80 transition-all duration-300 hover:opacity-100 hover:pl-1 no-underline">Regras do Servidor</a></li>
                            <li><a href="#" className="opacity-80 transition-all duration-300 hover:opacity-100 hover:pl-1 no-underline">Documentação</a></li>
                        </ul>
                    </div>

                    {/* --- Colunas de Links (Sistema) --- */}
                    <div className="flex-1 min-w-[180px]">
                        <h3 className="text-white text-base font-semibold mb-5 flex items-center gap-2 justify-center md:justify-start">
                            <i className="fas fa-building"></i> Sistema
                        </h3>
                        <ul className="list-none p-0 m-0 space-y-3">
                            <li><Link to="/sobre-nos" className="opacity-80 transition-all duration-300 hover:opacity-100 hover:pl-1 no-underline">Sobre Nós</Link></li>
                            <li><Link to="/contato" className="opacity-80 transition-all duration-300 hover:opacity-100 hover:pl-1 no-underline">Entre em Contato</Link></li>
                            <li><Link to="/termos" className="opacity-80 transition-all duration-300 hover:opacity-100 hover:pl-1 no-underline">Termos de Serviço</Link></li>
                            <li><Link to="/privacidade" className="opacity-80 transition-all duration-300 hover:opacity-100 hover:pl-1 no-underline">Política de Privacidade</Link></li>
                             <li><Link to="/changelog" className="opacity-80 transition-all duration-300 hover:opacity-100 hover:pl-1 no-underline">Change Log</Link></li>
                        </ul>
                    </div>
                </div>

                {/* --- Fundo do Footer --- */}
                <div className="border-t border-indigo-700/50 pt-5 text-center text-xs">
                    <p>
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 shadow-[0_0_5px_theme('colors.green.500')]"></span>
                         {/* --- [ATUALIZADO] Copyright Dinâmico --- */}
                        {settings.footer_copyright}
                    </p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;
