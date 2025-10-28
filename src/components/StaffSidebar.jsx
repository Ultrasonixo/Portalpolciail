// src/components/StaffSidebar.jsx
import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx'; // Para logout e dados do usuário

const StaffSidebar = () => {
    const { user, logout } = useAuth();

    // Placeholder para permissões (ajuste conforme seu backend)
    const canAccessTechPanel = user?.permissoes?.is_dev === true; // Exemplo

    return (
        // Sidebar fixa com largura, fundo escuro, texto claro
        <aside className="w-64 fixed h-full bg-gray-800 text-gray-200 flex flex-col shadow-lg z-10"> {/* Largura w-64 = 256px */}
            {/* Cabeçalho da Sidebar */}
            <div className="p-6 text-center border-b border-gray-700">
                <h3 className="text-2xl font-semibold text-white">Painel Staff</h3>
                <span className="text-sm text-gray-400">Administração Geral</span>
            </div>

            {/* Navegação Principal */}
            <nav className="flex flex-col flex-grow p-4 space-y-2">
                {/* Link para o Dashboard do Staff (própria AdminPanel) */}
                <NavLink
                    to="/staff/admin" // Caminho base do painel staff
                    end // 'end' garante que só fica ativo na página exata
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                            isActive
                                ? 'bg-indigo-600 text-white shadow-md' // Cor Indigo para ativo
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`
                    }
                >
                    <i className="fas fa-tachometer-alt w-5 text-center"></i>
                    <span>Visão Geral</span>
                </NavLink>

                {/* Link para Gerenciamento de Usuários (Placeholder) */}
                 <NavLink
                    to="/staff/manage-users" // Rota futura
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                            isActive
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`
                    }
                 >
                    <i className="fas fa-users-cog w-5 text-center"></i>
                    <span>Gerenciar Usuários</span>
                 </NavLink>

                 {/* Link para Controle de Departamentos (Placeholder) */}
                 <NavLink
                    to="/staff/structure" // Rota futura
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                            isActive
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`
                    }
                 >
                    <i className="fas fa-sitemap w-5 text-center"></i>
                    <span>Departamentos</span>
                 </NavLink>

                 {/* Link para Logs (Pode levar para a página existente ou uma nova) */}
                  <NavLink
                    to="/staff/logs" // Rota para logs (pode ser /policia/logs ou uma nova)
                    className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                            isActive
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`
                    }
                 >
                    <i className="fas fa-clipboard-list w-5 text-center"></i>
                    <span>Logs do Sistema</span>
                 </NavLink>

                 {/* Link Condicional para Painel Técnico */}
                 {canAccessTechPanel && (
                      <NavLink
                        to="/staff/tech-panel" // Rota futura
                        className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                            isActive
                                ? 'bg-indigo-600 text-white shadow-md'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`
                    }
                     >
                        <i className="fas fa-server w-5 text-center"></i>
                        <span>Painel Técnico</span>
                     </NavLink>
                 )}

            </nav>

            {/* Rodapé da Sidebar */}
            <div className="p-4 border-t border-gray-700 mt-auto">
                {/* Informações do Staff Logado */}
                {user && (
                    <div className="flex items-center gap-3 mb-4 p-2 rounded hover:bg-gray-700">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                             {user.nome_completo ? user.nome_completo[0].toUpperCase() : '?'}
                        </div>
                        <div className="text-sm overflow-hidden">
                            <span className="block font-semibold text-white truncate">{user.nome_completo || 'Staff'}</span>
                            <span className="block text-gray-400 text-xs truncate">{user.cargo_staff || 'Admin'}</span> {/* Ajuste o campo do cargo */}
                        </div>
                    </div>
                )}
                {/* Botão de Logout */}
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-red-600/20 text-red-300 hover:bg-red-700 hover:text-white transition-colors"
                >
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Sair</span>
                </button>
            </div>
        </aside>
    );
};

export default StaffSidebar;