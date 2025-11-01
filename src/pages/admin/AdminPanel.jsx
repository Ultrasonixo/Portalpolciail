import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Link, useNavigate, NavLink } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion'; 
import LogDetails from '../../components/LogDetails.jsx';

// Importa os estilos de CSS necessários
import '../../components/design/LogsPage.css'; // Para LogsView
import '../../components/Modal.css'; // Estilo dos Modais
import '../../components/GerenciarPolicialModal.css'; // Estilo da barra de busca
import '../../components/PoliceDashboard.css'; // Para estilos de tabela (recrutas-table)

// --- ÍCONES ANIMADOS (Para Toasts) ---
const AnimatedCheckmark = () => (
    <svg className="toast-icon-svg checkmark-svg" viewBox="0 0 52 52">
      <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
      <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
    </svg>
);
const AnimatedXMark = () => (
    <svg className="toast-icon-svg xmark-svg" viewBox="0 0 52 52">
      <g transform="translate(26 26)">
          <line className="xmark-line1" x1="-15" y1="-15" x2="15" y2="15" />
          <line className="xmark-line2" x1="-15" y1="15" x2="15" y2="-15" />
      </g>
    </svg>
);

// --- [INÍCIO] COMPONENTE DA SIDEBAR ---
const StaffSidebarInternal = ({ currentView, setView, isMobileMenuOpen, closeMobileMenu }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const canAccessTechPanel = user?.permissoes?.is_dev === true || user?.permissoes?.is_staff === true;

    const handleLogout = () => {
        logout();
        navigate('/'); 
    };

    const NavItem = ({ viewName, title, icon }) => {
        const isActive = currentView === viewName;
        return (
            <button 
                onClick={() => {
                    setView(viewName);
                    closeMobileMenu();
                }}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors w-full text-left ${
                    isActive ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
            >
                <i className={`fas ${icon} w-5 text-center ${isActive ? 'text-white' : 'text-slate-300'}`}></i>
                <span className={isActive ? 'text-white' : 'text-slate-300'}>{title}</span>
            </button>
        );
    };

    return (
        <aside className={`w-64 fixed inset-y-0 left-0 bg-slate-800 text-slate-200 flex flex-col shadow-lg z-20 transform transition-transform duration-300 ease-in-out ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}>
            {/* Cabeçalho */}
            <div className="p-5 text-center border-b border-slate-700 flex-shrink-0">
                <h3 className="text-2xl font-semibold text-white">Painel Staff</h3>
                <span className="text-sm text-slate-400">Administração Geral</span>
            </div>
            {/* Navegação */}
            <nav className="flex flex-col flex-grow p-4 space-y-2 overflow-y-auto">
                <NavItem viewName="dashboard" title="Visão Geral" icon="fa-tachometer-alt" />
                <NavItem viewName="manage_users" title="Gerenciar Usuários" icon="fa-users-cog" />
                <NavItem viewName="structure" title="Departamentos" icon="fa-sitemap" />
                <NavItem viewName="logs" title="Logs do Sistema" icon="fa-clipboard-list" />
                <NavItem viewName="bug_reports" title="Reportes de Bug" icon="fa-bug" />
                {canAccessTechPanel && (
                    <NavItem viewName="tech_panel" title="Painel Técnico" icon="fa-cogs" />
                )}
            </nav>
            {/* Rodapé */}
            <div className="p-4 border-t border-slate-700 mt-auto flex-shrink-0">
                {user && (
                    <div className="flex items-center gap-3 mb-4 p-2 rounded hover:bg-slate-700">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {user.nome_completo ? user.nome_completo[0].toUpperCase() : '?'}
                        </div>
                        <div className="text-sm overflow-hidden">
                            <span className="block font-semibold text-white truncate">{user.nome_completo || 'Staff'}</span>
                            <span className="block text-slate-400 text-xs truncate">{user.permissoes?.is_dev ? 'Desenvolvedor' : 'Staff'}</span>
                        </div>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-red-600/20 text-red-300 hover:bg-red-700 hover:text-white transition-colors"
                >
                    <i className="fas fa-sign-out-alt"></i><span>Sair</span>
                </button>
            </div>
        </aside>
    );
};
// --- [FIM] COMPONENTE DA SIDEBAR ---


// --- [INÍCIO] COMPONENTE CARD DE AÇÃO ---
const AdminActionCard = ({ title, description, icon, onClick, disabled = false }) => (
    <div
        className={`bg-white p-6 rounded-xl shadow-lg border border-slate-200 transition-all duration-300 flex flex-col h-full ${
            disabled
                ? 'opacity-60 bg-slate-100 cursor-not-allowed'
                : 'hover:shadow-xl hover:-translate-y-1.5 cursor-pointer hover:border-indigo-400'
        }`}
         onClick={!disabled ? onClick : undefined}
    >
        <div className="flex items-center gap-4 mb-4">
            <div className={`text-2xl p-3.5 rounded-lg ${disabled ? 'text-slate-400 bg-slate-200' : 'text-indigo-700 bg-indigo-100'}`}>
                <i className={`fas ${icon}`}></i>
            </div>
            <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
        </div>
        <p className="text-sm text-slate-600 mb-5 flex-grow">{description}</p>
        {!disabled && onClick && (
            <div className="mt-auto pt-4 text-center">
                 <button
                    onClick={onClick}
                    className={`w-full py-2 px-4 rounded-md text-sm font-semibold transition duration-200 ${disabled ? 'bg-slate-300 text-slate-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                    Gerenciar <i className="fas fa-arrow-right ml-2"></i>
                </button>
            </div>
        )}
        {disabled && (
             <div className="mt-auto pt-4 text-center">
                <span className="inline-block w-full py-2 px-4 rounded-md text-sm font-semibold bg-slate-200 text-slate-500">
                    <i className="fas fa-lock mr-2"></i> Em Breve
                </span>
            </div>
        )}
    </div>
);
// --- [FIM] COMPONENTE CARD DE AÇÃO ---


// --- [INÍCIO] VISÃO 1: VISÃO GERAL (DASHBOARD) ---
const DashboardView = ({ user, setView }) => {
    const canAccessTechPanel = user?.permissoes?.is_dev === true || user?.permissoes?.is_staff === true;

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-1">Visão Geral - Staff</h1>
                <p className="text-slate-600 text-lg">Selecione uma ferramenta administrativa abaixo.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                <AdminActionCard title="Gerenciamento de Usuários" description="Controle total sobre contas policiais e civis (promover, rebaixar, suspender, banir)." icon="fa-users-cog" onClick={() => setView('manage_users')} disabled={false}/>
                <AdminActionCard title="Departamentos e Hierarquia" description="Crie/edite Corporações (PM, PC), Patentes e Divisões." icon="fa-sitemap" onClick={() => setView('structure')} disabled={false}/>
                <AdminActionCard title="Logs do Sistema (Geral)" description="Visualize logs detalhados de logins, ações administrativas, alterações no sistema e mais." icon="fa-clipboard-list" onClick={() => setView('logs')}/>
                <AdminActionCard title="Reportes de Bug" description="Ver todos os bugs reportados por policiais e staff." icon="fa-bug" onClick={() => setView('bug_reports')}/>
                <AdminActionCard
                    title="Painel Técnico"
                    description="Gerar tokens globais, mudar nomes/logos, permissões, status. (Acesso Staff/Dev)."
                    icon="fa-cogs"
                    onClick={() => setView('tech_panel')}
                    disabled={!canAccessTechPanel}
                />
            </div>
        </div>
    );
};
// --- [FIM] VISÃO 1 ---


// --- [INÍCIO] VISÃO 2: GERENCIAR USUÁRIOS ---
const ManageUsersView = ({ onEditUser, onSuspendUser }) => {
    const { token, logout } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState('Todos'); 
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [initialSearchDone, setInitialSearchDone] = useState(false);


    const fetchUsers = useCallback(async (query, type) => {
        setIsLoading(true);
        setSearchResults([]); 
        
        const requiresMinLengthCheck = type !== 'Todos' && query && query.length < 2;

        if (requiresMinLengthCheck) {
             toast.warn("Digite pelo menos 2 caracteres para buscar por nome/passaporte.");
             setIsLoading(false);
             return;
        }

        const toastId = toast.loading(`Buscando por "${query || (type === 'Todos' ? 'todos os usuários' : type)}"...`);

        if (!token) {
            toast.update(toastId, { render: "Erro de autenticação", type: "error", isLoading: false, autoClose: 3000, icon: <AnimatedXMark /> });
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`/api/staff/search-users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ searchQuery: query, searchType: type }) 
            });

            if (response.status === 401 || response.status === 403) {
                if (logout) logout();
                throw new Error('Sessão inválida ou sem permissão.');
            }
            
            let data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro ao buscar usuários.');
            }
            
            // Parsear permissões de string JSON para objeto
            const usersWithParsedPerms = (data.users || []).map(user => {
                if (user.permissoes && typeof user.permissoes === 'string') {
                    try {
                        user.permissoes = JSON.parse(user.permissoes);
                    } catch (e) {
                        user.permissoes = {};
                    }
                } else if (!user.permissoes) {
                    user.permissoes = {};
                }
                return user;
            });
            
            setSearchResults(usersWithParsedPerms);
            
            if (initialSearchDone) { 
                 if (data.users.length === 0) {
                     toast.update(toastId, { render: "Nenhum usuário encontrado.", type: "info", isLoading: false, autoClose: 3000 });
                 } else {
                     toast.update(toastId, { render: `Encontrado(s) ${data.users.length} usuário(s).`, type: "success", isLoading: false, autoClose: 2000, icon: <AnimatedCheckmark /> });
                 }
            } else {
                 toast.dismiss(toastId); 
                 setInitialSearchDone(true);
            }

        } catch (err) {
            toast.update(toastId, { render: `Erro: ${err.message}`, type: "error", isLoading: false, autoClose: 4000, icon: <AnimatedXMark /> });
        } finally {
            setIsLoading(false);
        }
    }, [token, logout, initialSearchDone]);

    useEffect(() => {
        let mounted = true;
        
        if (!initialSearchDone && mounted) {
             fetchUsers(searchQuery, searchType);
        }

        return () => { mounted = false; };
        
    }, [fetchUsers]); 

    useEffect(() => {
        if (!searchQuery) {
             const delay = setTimeout(() => {
                 fetchUsers(searchQuery, searchType);
             }, 150);
             return () => clearTimeout(delay);
        }
        
    }, [searchType, fetchUsers]); 


    const handleSearchClick = (e) => {
        e.preventDefault();
        fetchUsers(searchQuery, searchType);
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-1">Gerenciamento de Usuários (Global)</h1>
                <p className="text-slate-600 text-lg">Controle total sobre contas policiais e civis.</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 mb-8">
                <form onSubmit={handleSearchClick} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-1">
                        <label htmlFor="searchQuery" className="block text-sm font-medium text-slate-700 mb-1">Buscar (Nome ou Passaporte)</label>
                        <input 
                            type="text" 
                            id="searchQuery" 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            placeholder="Digite o nome ou passaporte..." 
                            className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="searchType" className="block text-sm font-medium text-slate-700 mb-1">Tipo de Usuário</label>
                        <select 
                            id="searchType" 
                            value={searchType} 
                            onChange={(e) => setSearchType(e.target.value)} 
                            className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                            <option value="Todos">Todos</option>
                            <option value="Policial">Apenas Policiais</option>
                            <option value="Civil">Apenas Civis</option>
                        </select>
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full md:w-auto justify-center inline-flex items-center px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                        <i className={`fas ${isLoading ? 'fa-spinner fa-spin' : 'fa-search'} mr-2`}></i> {isLoading ? 'Buscando...' : 'Buscar'}
                    </button>
                </form>
            </div>
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nome</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Passaporte</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tipo / Corporação</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {isLoading && ( <tr><td colSpan={5} className="p-6 text-center text-slate-500">Buscando...</td></tr> )}
                            {!isLoading && searchResults.length === 0 && ( <tr><td colSpan={5} className="p-6 text-center text-slate-500">Nenhum usuário encontrado. Realize uma busca.</td></tr> )}
                            {!isLoading && searchResults.map((user) => (
                                <tr key={`${user.tipo}-${user.id}`} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{user.nome_completo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{user.passaporte}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {user.tipo}
                                        {user.corporacao && <span className="ml-2 text-xs font-semibold text-indigo-700">({user.corporacao})</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            (user.status === 'Aprovado' || user.status === 'Ativo') ? 'bg-green-100 text-green-800' :
                                            (user.status === 'Em Análise' || user.status === 'Suspenso') ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {user.status || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        {/* --- BOTÕES ATUALIZADOS --- */}
                                        <button onClick={() => onEditUser(user)} className="text-indigo-600 hover:text-indigo-900" title="Editar / Promover"><i className="fas fa-edit"></i></button>
                                        
                                        {/* Botão de Suspender/Banir (Policial) */}
                                        {user.tipo === 'Policial' && (
                                            <button onClick={() => onSuspendUser(user)} className="text-yellow-600 hover:text-yellow-900" title="Suspender/Banir"><i className="fas fa-user-clock"></i></button>
                                        )}
                                        
                                        {/* Botão de Banir (Civil) */}
                                        {user.tipo === 'Civil' && (
                                             <button onClick={() => onSuspendUser(user)} className="text-red-600 hover:text-red-900" title="Banir (Deletar)"><i className="fas fa-user-slash"></i></button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
         </div>
    );
};
// --- [FIM] VISÃO 2 ---


// --- [INÍCIO] VISÃO 3: LOGS DO SISTEMA / BUGS ---
const translateAction = (actionKey) => {
    const translations = {
        'Manage Career': 'Gerenciar Carreira',
        'Approve Recruit': 'Aprovar Recruta',
        'Reject Recruit': 'Reprovar Recruta',
        'Dismiss Policial': 'Demitir Policial',
        'Update Policial Data': 'Atualizar Dados',
        'Generate Registration Token': 'Gerar Token Reg.',
        'Create Announcement': 'Criar Anúncio',
        'Bug Report': 'Reporte de Bug',
        'Create Concurso': 'Criar Concurso',
        'Update Concurso': 'Atualizar Concurso',
        'Delete Concurso': 'Excluir Concurso',
        'Create Concurso (Fallback V2)': 'Criar Concurso (Fallback V2)',
        'Create Concurso (Fallback V1)': 'Criar Concurso (Fallback V1)',
        'Generate Global Token': 'Gerar Token Global',
        'Update Portal Settings': 'Atualizar Config. Portal',
        'Update Corp Permissions': 'Atualizar Permissões Corp.', 
        // Novas ações
        'Staff: Update User Data': 'Staff: Editou Usuário',
        'Staff: Update Rank': 'Staff: Alterou Patente',
        'Staff: Apply Action': 'Staff: Aplicou Ação',
        'Staff: Unban IP': 'Staff: Perdoou IP'
    };
    return translations[actionKey] || actionKey;
};

const LogsView = ({ defaultActionFilter = 'Todos' }) => {
    const { user, logout, token } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit] = useState(15);

    const [filters, setFilters] = useState({
        text: '',
        action: defaultActionFilter,
        date: ''
    });

    const uniqueActions = useMemo(() => {
        const allActionKeys = [
            'Manage Career', 'Approve Recruit', 'Reject Recruit', 'Dismiss Policial',
            'Update Policial Data', 'Generate Registration Token', 'Create Announcement',
            'Bug Report', 'Create Concurso', 'Update Concurso', 'Delete Concurso',
            'Create Concurso (Fallback V2)', 'Create Concurso (Fallback V1)',
            'Generate Global Token', 'Update Portal Settings',
            'Update Corp Permissions',
            // Novas ações
            'Staff: Update User Data', 'Staff: Update Rank', 'Staff: Apply Action', 'Staff: Unban IP',
        ];
        const translatedActions = allActionKeys
            .map(key => ({ key: key, translated: translateAction(key) }))
            .sort((a, b) => a.translated.localeCompare(b.translated));
        return [{ key: 'Todos', translated: 'Todas as Ações' }, ...translatedActions];
    }, []);

    const fetchLogs = useCallback(async (pageToFetch, currentFilters) => {
        setLoading(true); setError(null);
        if (!token) {
            setError('Erro de autenticação: Token não encontrado.'); setLoading(false); return;
        }
        const params = new URLSearchParams({
            page: pageToFetch, limit: limit, text: currentFilters.text,
            action: currentFilters.action === 'Todos' ? '' : currentFilters.action,
            date: currentFilters.date
        });
        try {
            const response = await fetch(`/api/admin/logs?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (response.status === 401 || response.status === 403) {
                if (logout) logout(); throw new Error('Sessão inválida ou sem permissão para ver logs.');
            }
            
            const textResponse = await response.text();
            let data;
            try {
                 data = JSON.parse(textResponse);
            } catch (jsonError) {
                throw new Error("Erro de comunicação. O servidor não respondeu com JSON.");
            }

            if (!response.ok) {
                throw new Error(data.message || 'Falha ao buscar logs.');
            }
            
            setLogs(data.logs || []); setTotalPages(data.totalPages || 1);
        } catch (err) {
            setError(`Falha ao carregar: ${err.message}`); setLogs([]);
        } finally { setLoading(false); }
    }, [token, limit, logout]);

    useEffect(() => {
        const timerId = setTimeout(() => { fetchLogs(currentPage, filters); }, 300);
        return () => clearTimeout(timerId);
    }, [currentPage, filters, fetchLogs]);

    useEffect(() => {
        setFilters(prev => ({ ...prev, action: defaultActionFilter }));
        setCurrentPage(1);
    }, [defaultActionFilter]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value })); setCurrentPage(1);
    };
    const clearFilters = () => {
        setFilters({ text: '', action: 'Todos', date: '' }); setCurrentPage(1);
    };
    const handlePreviousPage = () => { if (currentPage > 1) setCurrentPage(p => p - 1); };
    const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(p => p + 1); };
    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        try { return new Date(dateTimeString).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }); }
        catch (e) { return 'Inválida'; }
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-1">
                    {defaultActionFilter === 'Bug Report' ? 'Relatórios de Bug' : 'Logs de Auditoria (Geral)'}
                </h1>
                <p className="text-slate-600 text-lg">
                    {defaultActionFilter === 'Bug Report'
                        ? 'Lista de todos os bugs reportados por policiais.'
                        : 'Registro de ações administrativas e eventos do sistema.'}
                </p>
            </div>
            <div className="log-filters bg-white shadow-lg border border-slate-200 rounded-xl">
                <input type="text" name="text" placeholder="Buscar por texto, nome, IP..." value={filters.text} onChange={handleFilterChange} disabled={loading} />
                <select name="action" value={filters.action} onChange={handleFilterChange} disabled={loading} className="bg-white">
                    {uniqueActions.map(act => ( <option key={act.key} value={act.key}>{act.translated}</option> ))}
                </select>
                <input type="date" name="date" value={filters.date} onChange={handleFilterChange} disabled={loading} />
                <button onClick={clearFilters} className="clear-filters-btn" disabled={loading}>Limpar Filtros</button>
            </div>
            {loading && <p className="p-10 text-center text-slate-500">Carregando logs...</p>}
            {error && <p className="p-10 text-center text-red-600 bg-red-100 rounded-lg border border-red-300">{error}</p>}
            {!loading && !error && (
                <div className="logs-table-widget bg-white rounded-xl shadow-lg border border-slate-200 mt-8">
                    <div className="table-responsive">
                        <table className="logs-table min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Data/Hora</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Administrador</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ação</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Detalhes</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">IP</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {logs.length > 0 ? (
                                    logs.map(log => (
                                        <tr key={log.id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{formatDateTime(log.data_log)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{log.admin_nome || `ID ${log.usuario_id}`} ({log.admin_corporacao || 'N/A'})</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`log-action-tag log-action-${
                                                    (log.acao || 'unknown') // Fallback para ação desconhecida
                                                        .replace(/\s+/g, '-')
                                                        .replace(/[()]/g, '')
                                                        .replace(/\//g, '-')
                                                        .replace(/:/g, '') // Remove :
                                                        .replace(/é/g, 'e')
                                                        .toLowerCase()
                                                }`}>
                                                    {translateAction(log.acao)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700 log-details-cell">
                                                <div style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
                                                    <LogDetails action={log.acao} details={log.detalhes} />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{log.ip_address || 'N/A'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={5} className="p-6 text-center text-slate-500">Nenhum log encontrado com os filtros aplicados.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="pagination-controls bg-slate-50 px-6 py-3 flex justify-between items-center border-t border-slate-200">
                           <button onClick={handlePreviousPage} disabled={currentPage <= 1 || loading} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">
                                &laquo; Anterior
                           </button>
                            <span className="text-sm text-slate-600">Página {currentPage} de {totalPages}</span>
                            <button onClick={handleNextPage} disabled={currentPage >= totalPages || loading} className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed">
                                Próxima &raquo;
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
// --- [FIM] VISÃO 3 ---

// --- [INÍCIO] COMPONENTE DE TOGGLE (PermissionToggle) ---
const PermissionToggle = ({ label, description, isEnabled, onToggle, disabled = false }) => {
    return (
        <div className={`flex items-center justify-between py-4 border-b border-slate-200 last:border-b-0 ${disabled ? 'opacity-50' : ''}`}>
            <div className="max-w-xs">
                <label className="block text-sm font-medium text-slate-800">{label}</label>
                <p className="text-xs text-slate-500">{description}</p>
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={isEnabled}
                onClick={() => !disabled && onToggle(!isEnabled)}
                disabled={disabled}
                data-state={isEnabled ? 'checked' : 'unchecked'}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent 
                           transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2
                           ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
                           data-[state=checked]:bg-indigo-700 data-[state=unchecked]:bg-slate-300`}
            >
                <motion.span
                    aria-hidden="true"
                    className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 
                               transition duration-200 ease-in-out"
                    layout
                    animate={{ x: isEnabled ? 20 : 0 }} 
                />
            </button>
        </div>
    );
};
// --- [FIM] COMPONENTE DE TOGGLE ---


// --- [INÍCIO] MODAIS DE GERENCIAMENTO DE ESTRUTURA ---
const ManageCorporacoesModal = ({ isOpen, onClose, corporacoes, onRefresh }) => {
    const { token, logout } = useAuth();
    const [nome, setNome] = useState('');
    const [sigla, setSigla] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const resetForm = () => {
        setNome(''); setSigla(''); setEditingId(null);
    };

    const handleEditClick = (corp) => {
        setEditingId(corp.id);
        setNome(corp.nome);
        setSigla(corp.sigla);
    };

    const handleDelete = async (corp) => {
        if (!window.confirm(`Tem certeza que quer deletar a corporação "${corp.nome} (${corp.sigla})"?`)) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/staff/corporacoes/${corp.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 401 || response.status === 403) { logout(); throw new Error('Sessão inválida'); }
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            toast.success(data.message, { icon: <AnimatedCheckmark /> });
            onRefresh();
        } catch (err) { toast.error(err.message, { icon: <AnimatedXMark /> }); }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const url = editingId ? `/api/staff/corporacoes/${editingId}` : `/api/staff/corporacoes`;
        const method = editingId ? 'PUT' : 'POST';
        
        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ nome, sigla })
            });
            if (response.status === 401 || response.status === 403) { logout(); throw new Error('Sessão inválida'); }
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            toast.success(data.message, { icon: <AnimatedCheckmark /> });
            onRefresh();
            resetForm();
        } catch (err) { toast.error(err.message, { icon: <AnimatedXMark /> }); }
        setLoading(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="modal-overlay"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20, opacity: 0 }}
                        className="modal-content"
                        style={{ maxWidth: '500px' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2 className="text-xl font-semibold text-slate-800">{editingId ? 'Editar' : 'Adicionar'} Corporação</h2>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body space-y-4 max-h-[60vh] overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="modal-form-group">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                                        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md" required />
                                    </div>
                                    <div className="modal-form-group">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Sigla</label>
                                        <input type="text" value={sigla} onChange={(e) => setSigla(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md" required />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <h3 className="text-lg font-medium text-slate-700 mb-2">Corporações Atuais</h3>
                                    <ul className="divide-y divide-slate-200 border rounded-md max-h-[200px] overflow-y-auto">
                                        {corporacoes.map(corp => (
                                            <li key={corp.id} className="flex items-center justify-between p-2 hover:bg-slate-50">
                                                <span className="text-sm">{corp.nome} ({corp.sigla})</span>
                                                <div className="space-x-2">
                                                    <button type="button" onClick={() => handleEditClick(corp)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium" disabled={loading}>Editar</button>
                                                    <button type="button" onClick={() => handleDelete(corp)} className="text-xs text-red-600 hover:text-red-800 font-medium" disabled={loading}>Excluir</button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-b-lg flex justify-end gap-3">
                                <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Salvando...' : (editingId ? 'Salvar Mudanças' : 'Adicionar')}</button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const ManageSubItemsModal = ({ isOpen, onClose, onRefresh, corporacoes, items, title, endpoint }) => {
    const { token, logout } = useAuth();
    const [nome, setNome] = useState('');
    const [corporacaoSigla, setCorporacaoSigla] = useState('');
    const [ordem, setOrdem] = useState(0); 
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(false);
    // ✅ ETAPA 1: Estado para a nova permissão
    const [permissoes, setPermissoes] = useState({ podeAprovarRelatorio: false });
    
    const isPatentes = endpoint === 'patentes';

    useEffect(() => {
        if(isOpen && corporacoes.length > 0) {
            // Define a primeira corporação como padrão ao abrir
            if (!corporacaoSigla) { // Só define se não houver uma sigla
                setCorporacaoSigla(corporacoes[0].sigla);
            }
        }
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen, corporacoes]);

    const resetForm = () => {
        setNome(''); 
        setOrdem(0); 
        setEditingId(null);
        setPermissoes({ podeAprovarRelatorio: false }); // ✅ ETAPA 1: Reseta permissão
        if (corporacoes.length > 0) setCorporacaoSigla(corporacoes[0].sigla);
    };

    const handleEditClick = (item) => {
        setEditingId(item.id);
        setNome(item.nome);
        setCorporacaoSigla(item.corporacao_sigla);
        if (isPatentes) {
            setOrdem(item.ordem || 0);
            
            // ✅ ETAPA 1: Ler as permissões da patente ao clicar em Editar
            let parsedPerms = {};
            if (typeof item.permissoes === 'string') {
                try { parsedPerms = JSON.parse(item.permissoes); } catch (e) {}
            } else if (typeof item.permissoes === 'object' && item.permissoes !== null) {
                parsedPerms = item.permissoes;
            }
            setPermissoes({ podeAprovarRelatorio: !!parsedPerms.podeAprovarRelatorio });
        }
    };

    const handleDelete = async (item) => {
        if (!window.confirm(`Tem certeza que quer deletar "${item.nome}"?`)) return;
        setLoading(true);
        try {
            const response = await fetch(`/api/staff/${endpoint}/${item.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 401 || response.status === 403) { logout(); throw new Error('Sessão inválida'); }
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            toast.success(data.message, { icon: <AnimatedCheckmark /> });
            onRefresh();
        } catch (err) { toast.error(err.message, { icon: <AnimatedXMark /> }); }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const url = editingId ? `/api/staff/${endpoint}/${editingId}` : `/api/staff/${endpoint}`;
        const method = editingId ? 'PUT' : 'POST';
        
        // ✅ ETAPA 1: Adiciona 'permissoes' ao body se for uma patente
        const body = isPatentes 
            ? { nome, corporacao_sigla: corporacaoSigla, ordem, permissoes: JSON.stringify(permissoes) }
            : { nome, corporacao_sigla: corporacaoSigla };

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body)
            });
            if (response.status === 401 || response.status === 403) { logout(); throw new Error('Sessão inválida'); }
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            toast.success(data.message, { icon: <AnimatedCheckmark /> });
            onRefresh();
            resetForm();
        } catch (err) { toast.error(err.message, { icon: <AnimatedXMark /> }); }
        setLoading(false);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="modal-overlay"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20, opacity: 0 }}
                        className="modal-content"
                        style={{ maxWidth: '500px' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-4 border-b">
                            <h2 className="text-xl font-semibold text-slate-800">{editingId ? 'Editar' : 'Adicionar'} {title}</h2>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                                {/* Formulário */}
                                <div className={`grid ${isPatentes ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
                                    <div className={`${isPatentes ? 'col-span-3' : 'col-span-1'} sm:${isPatentes ? 'col-span-2' : 'col-span-1'}`}>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                                        <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md" required />
                                    </div>
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Corp.</label>
                                        <select value={corporacaoSigla} onChange={(e) => setCorporacaoSigla(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white" required>
                                            {corporacoes.map(c => <option key={c.sigla} value={c.sigla}>{c.sigla}</option>)}
                                        </select>
                                    </div>
                                    {isPatentes && (
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="block text-sm font-medium text-slate-700 mb-1">Ordem</label>
                                            <input type="number" value={ordem} onChange={(e) => setOrdem(parseInt(e.target.value, 10))} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
                                        </div>
                                    )}
                                </div>
                                
                                {/* ✅ ETAPA 1: Adicionar seletor de permissão */}
                                {isPatentes && (
                                    <div className="pt-4 border-t border-slate-200 mt-4">
                                        <h4 className="text-md font-semibold text-slate-800 mb-2">Permissões da Patente</h4>
                                        <PermissionToggle
                                            label="Aprovar Relatórios"
                                            description="Permite que usuários com esta patente aprovem/concluam relatórios."
                                            isEnabled={!!permissoes.podeAprovarRelatorio}
                                            onToggle={(newValue) => setPermissoes(prev => ({...prev, podeAprovarRelatorio: newValue}))}
                                            disabled={loading}
                                        />
                                    </div>
                                )}
                                
                                {/* Lista de Existentes */}
                                <div className="mt-4">
                                    <h3 className="text-lg font-medium text-slate-700 mb-2">{title}s Atuais</h3>
                                    <ul className="divide-y divide-y divide-slate-200 border rounded-md max-h-[200px] overflow-y-auto">
                                        {items.map(item => (
                                            <li key={item.id} className="flex items-center justify-between p-2 hover:bg-slate-50">
                                                <span className="text-sm">{item.nome} ({item.corporacao_sigla}) {isPatentes ? `[Ordem: ${item.ordem}]` : ''}
                                                    {/* ✅ ETAPA 1: Mostrar status da permissão */}
                                                    {isPatentes && item.permissoes?.podeAprovarRelatorio && (
                                                        <i className="fas fa-check-circle text-green-500 ml-2" title="Pode aprovar relatórios"></i>
                                                    )}
                                                </span>
                                                <div className="space-x-2">
                                                    <button type="button" onClick={() => handleEditClick(item)} className="text-xs text-indigo-600 hover:text-indigo-800 font-medium" disabled={loading}>Editar</button>
                                                    <button type="button" onClick={() => handleDelete(item)} className="text-xs text-red-600 hover:text-red-800 font-medium" disabled={loading}>Excluir</button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-b-lg flex justify-end gap-3">
                                <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Salvando...' : (editingId ? 'Salvar Mudanças' : 'Adicionar')}</button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
// --- [FIM] MODAIS DE GERENCIAMENTO DE ESTRUTURA ---


// --- [INÍCIO] VISÃO 4: DEPARTAMENTOS E HIERARQUIA ---
const StructureView = () => {
    const { token, logout, user, updateUserPermissions } = useAuth(); 
    const [structureData, setStructureData] = useState({ corporacoes: [], patentes: [], divisoes: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalState, setModalState] = useState(null); // 'corps', 'ranks', 'divs'

    const fetchStructureData = useCallback(async () => {
        setLoading(true);
        setError(null);
        if (!token) {
            setError('Erro de autenticação: Token não encontrado.');
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`/api/staff/structure`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 401 || response.status === 403) {
                if (logout) logout();
                throw new Error('Sessão inválida ou sem permissão.');
            }
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                throw new Error("Erro de comunicação com o servidor.");
            }
            if (!response.ok) {
                throw new Error(data.message || 'Falha ao buscar dados de estrutura.');
            }

            const processedCorps = (data.corporacoes || []).map(corp => ({
                ...corp,
                permissoes: typeof corp.permissoes === 'string' && corp.permissoes.startsWith('{')
                            ? JSON.parse(corp.permissoes)
                            : (typeof corp.permissoes === 'object' && corp.permissoes !== null ? corp.permissoes : {})
            }));
            
            // ✅ ETAPA 1: Adicionar parsing de permissões para patentes
            const processedPatentes = (data.patentes || []).map(patente => ({
                ...patente,
                permissoes: typeof patente.permissoes === 'string' && patente.permissoes.startsWith('{')
                            ? JSON.parse(patente.permissoes)
                            : (typeof patente.permissoes === 'object' && patente.permissoes !== null ? patente.permissoes : {})
            }));
            
            setStructureData({
                corporacoes: processedCorps,
                patentes: processedPatentes, // ✅ ETAPA 1: Usar patentes processadas
                divisoes: data.divisoes || []
            });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token, logout]);

    useEffect(() => {
        fetchStructureData();
    }, [fetchStructureData]);

    const handlePermissionChange = async (corpId, permKey, newValue) => {
        const adminUser = user;
        
        const currentCorp = structureData.corporacoes.find(c => c.id === corpId);
        if (!currentCorp) return;

        const newPermissions = {
            ...currentCorp.permissoes, 
            [permKey]: newValue         
        };
        const newPermissionsJson = JSON.stringify(newPermissions);

        setStructureData(prev => ({
            ...prev,
            corporacoes: prev.corporacoes.map(corp => 
                corp.id === corpId 
                ? { ...corp, permissoes: newPermissions } 
                : corp
            )
        }));
        
        const toastId = toast.loading("Salvando permissão...");
        try {
            const response = await fetch(`/api/staff/corporacoes/${corpId}/permissions`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ permissoes: newPermissionsJson }) 
            });

            if (response.status === 401 || response.status === 403) { if (logout) logout(); throw new Error('Sessão inválida.'); }
            
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Falha ao salvar no backend.');
            
            toast.update(toastId, { render: data.message, type: 'success', isLoading: false, autoClose: 2000, icon: <AnimatedCheckmark /> });
            
            if (currentCorp.sigla === user.corporacao) {
                updateUserPermissions(newPermissions);
            }

        } catch (err) {
            toast.update(toastId, { render: `Erro: ${err.message}`, type: 'error', isLoading: false, autoClose: 4000, icon: <AnimatedXMark /> });
            
            setStructureData(prev => ({
                ...prev,
                corporacoes: prev.corporacoes.map(corp => 
                    corp.id === corpId 
                    ? { ...corp, permissoes: currentCorp.permissoes } // Volta ao original
                    : corp
                )
            }));
        }
    };


    const handleManageCorps = () => setModalState('corps');
    const handleManageRanks = () => setModalState('ranks');
    const handleManageDivisions = () => setModalState('divs');
    
    const handleCloseModal = (refresh = false) => {
        setModalState(null);
        if (refresh) {
            fetchStructureData(); 
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-1">Departamentos e Hierarquia</h1>
                <p className="text-slate-600 text-lg">Gerencie a estrutura fundamental das corporações policiais.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                <AdminActionCard 
                    title="Gerenciar Corporações"
                    description="Criar, editar ou desativar corporações (ex: PM, PC, GCM)."
                    icon="fa-building"
                    onClick={handleManageCorps}
                    disabled={false}
                />
                <AdminActionCard 
                    title="Gerenciar Patentes"
                    description="Definir a lista global de patentes e a quais corporações se aplicam."
                    icon="fa-layer-group"
                    onClick={handleManageRanks}
                    disabled={false}
                />
                <AdminActionCard 
                    title="Gerenciar Divisões"
                    description="Criar e editar as divisões e unidades dentro de cada corporação."
                    icon="fa-sitemap"
                    onClick={handleManageDivisions}
                    disabled={false}
                />
            </div>

            <div className="mt-12">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Permissões da Corporação</h2>
                
                {loading && <p className="text-center text-slate-500">Carregando estrutura...</p>}
                {error && <p className="p-4 text-center text-red-600 bg-red-100 rounded-lg border border-red-300">{error}</p>}
                
                {!loading && !error && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {structureData.corporacoes.map(corp => (
                            <div key={corp.id} className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                                <h3 className="text-lg font-semibold text-slate-900 mb-1">{corp.nome} ({corp.sigla})</h3>
                                <p className="text-sm text-slate-500 mb-4">ID da Corporação: {corp.id}</p>
                                
                                <div className="space-y-2">
                                    <PermissionToggle
                                        label="Assumir B.O."
                                        description="Permite que membros assumam B.Os de civis."
                                        isEnabled={!!corp.permissoes.podeAssumirBO} 
                                        onToggle={(newValue) => handlePermissionChange(corp.id, 'podeAssumirBO', newValue)}
                                    />
                                    <PermissionToggle
                                        label="Editar B.O. (Investigar)"
                                        description="Permite que membros editem B.Os que assumiram."
                                        isEnabled={!!corp.permissoes.podeEditarBO} 
                                        onToggle={(newValue) => handlePermissionChange(corp.id, 'podeEditarBO', newValue)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <ManageCorporacoesModal 
                isOpen={modalState === 'corps'}
                onClose={() => handleCloseModal(false)}
                onRefresh={() => handleCloseModal(true)}
                corporacoes={structureData.corporacoes}
            />
            <ManageSubItemsModal 
                isOpen={modalState === 'ranks'}
                onClose={() => handleCloseModal(false)}
                onRefresh={() => handleCloseModal(true)}
                corporacoes={structureData.corporacoes}
                items={structureData.patentes}
                title="Patente"
                endpoint="patentes"
            />
            <ManageSubItemsModal 
                isOpen={modalState === 'divs'}
                onClose={() => handleCloseModal(false)}
                onRefresh={() => handleCloseModal(true)}
                corporacoes={structureData.corporacoes}
                items={structureData.divisoes}
                title="Divisão"
                endpoint="divisoes"
            />
        </div>
    );
};
// --- [FIM] VISÃO 4 ---


// --- [INÍCIO] VISÃO 5: PAINEL TÉCNICO ---
// ✅ ETAPA 1: Passa 'corporacoes' como prop
const TechPanelView = ({ setModal, corporacoes = [] }) => { 
    const { user, token, logout } = useAuth();
    const canAccessTech = user?.permissoes?.is_dev === true || user?.permissoes?.is_staff === true;

    // ✅ ETAPA 1: Define o estado inicial com base nas props
    const [tokenCorporacao, setTokenCorporacao] = useState(corporacoes.length > 0 ? corporacoes[0].sigla : ''); 
    const [tokenUses, setTokenUses] = useState(1);
    const [tokenDuration, setTokenDuration] = useState(24);
    const [generatedToken, setGeneratedToken] = useState('');
    const [isGeneratingToken, setIsGeneratingToken] = useState(false);
    const [portalSettings, setPortalSettings] = useState({
        header_title: '',
        header_subtitle: '',
        header_logo_url: '',
        footer_copyright: '',
        banner_images: [] 
    });
    const [logoFile, setLogoFile] = useState(null);
    const [isLoadingSettings, setIsLoadingSettings] = useState(true);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [newBannerFiles, setNewBannerFiles] = useState([]);
    const [isSavingBanners, setIsSavingBanners] = useState(false);
    const maxBanners = 10;

    // ✅ ETAPA 1: Define a corporação padrão assim que a lista for carregada
    useEffect(() => {
        if (!tokenCorporacao && corporacoes && corporacoes.length > 0) {
            setTokenCorporacao(corporacoes[0].sigla);
        }
    }, [corporacoes, tokenCorporacao]);

    // --- API Call: Buscar Configurações do Portal ---
    const fetchPortalSettings = useCallback(async () => {
        setIsLoadingSettings(true);
        try {
            const response = await fetch(`/api/public/portal-settings`);
            let data;
            try {
                data = await response.json();
            } catch (jsonError) {
                throw new Error("Erro de comunicação. O servidor não respondeu com JSON.");
            }
            if (!response.ok) throw new Error(data.message || 'Falha ao buscar configurações.');
            
            setPortalSettings({
                header_title: data.header_title || '',
                header_subtitle: data.header_subtitle || '',
                header_logo_url: data.header_logo_url || '',
                footer_copyright: data.footer_copyright || '',
                banner_images: Array.isArray(data.banner_images) ? data.banner_images : [] 
            });
        } catch (err) {
            toast.error(`Erro ao carregar configs: ${err.message}`, { icon: <AnimatedXMark /> });
        } finally {
            setIsLoadingSettings(false);
        }
    }, []); 

    useEffect(() => {
        if (canAccessTech) {
            fetchPortalSettings();
        }
    }, [canAccessTech, fetchPortalSettings]);

    // --- API Call: Salvar Configurações do Portal (Logo, Títulos) ---
    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setIsSavingSettings(true);
        const toastId = toast.loading("Salvando configurações...");

        if (!token) {
            toast.update(toastId, { render: "Erro de autenticação", type: "error", isLoading: false, autoClose: 3000, icon: <AnimatedXMark /> });
            setIsSavingSettings(false);
            return;
        }

        const formData = new FormData();
        formData.append('header_title', portalSettings.header_title);
        formData.append('header_subtitle', portalSettings.header_subtitle);
        formData.append('footer_copyright', portalSettings.footer_copyright);
        
        if (logoFile) {
            formData.append('header_logo_file', logoFile);
        }
        formData.append('old_logo_url', portalSettings.header_logo_url);

        try {
            const response = await fetch(`/api/staff/portal-settings`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            
            if (response.status === 401 || response.status === 403) { if (logout) logout(); throw new Error('Sessão inválida.'); }
            
            let result;
            try {
                result = await response.json();
            } catch (jsonError) {
                 throw new Error("Erro de comunicação. O servidor não respondeu com JSON.");
            }

            if (!response.ok) throw new Error(result.message || 'Falha ao salvar.');

            toast.update(toastId, { render: result.message, type: 'success', isLoading: false, autoClose: 3000, icon: <AnimatedCheckmark /> });
            
            if (result.new_logo_url) {
                setPortalSettings(prev => ({ ...prev, header_logo_url: result.new_logo_url }));
            }
            setLogoFile(null); 

        } catch (err) {
            toast.update(toastId, { render: `Erro: ${err.message}`, type: 'error', isLoading: false, autoClose: 4000, icon: <AnimatedXMark /> });
        } finally {
            setIsSavingSettings(false);
        }
    };
    
    // --- API Call: Gerar Token Global ---
    const handleGenerateTokenSubmit = async (e) => {
        e.preventDefault();
        setIsGeneratingToken(true);
        setGeneratedToken('');
        const toastId = toast.loading("Gerando token...");

        if (!token) {
            toast.update(toastId, { render: "Erro de autenticação", type: "error", isLoading: false, autoClose: 3000, icon: <AnimatedXMark /> });
            setIsGeneratingToken(false);
            return;
        }

        try {
            const response = await fetch(`/api/staff/generate-global-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    corporacao: tokenCorporacao,
                    max_uses: parseInt(tokenUses, 10),
                    duration_hours: parseInt(tokenDuration, 10)
                })
            });
            if (response.status === 401 || response.status === 403) { if (logout) logout(); throw new Error('Sessão inválida.'); }
            
            let result;
            try {
                result = await response.json();
            } catch (jsonError) {
                 throw new Error("Erro de comunicação. O servidor não respondeu com JSON.");
            }

            if (!response.ok) throw new Error(result.message || 'Falha ao gerar token.');

            toast.update(toastId, { render: result.message, type: 'success', isLoading: false, autoClose: 4000, icon: <AnimatedCheckmark /> });
            setGeneratedToken(result.token);
        } catch (err) {
            toast.update(toastId, { render: `Erro: ${err.message}`, type: 'error', isLoading: false, autoClose: 4000, icon: <AnimatedXMark /> });
        } finally {
            setIsGeneratingToken(false);
        }
    };
    
    // FUNÇÕES PARA GERENCIAR BANNERS
    const handleBannerFileChange = (e) => {
        const files = Array.from(e.target.files);
        const totalBanners = portalSettings.banner_images.length + files.length;
        if (totalBanners > maxBanners) {
            toast.error(`Limite de ${maxBanners} banners excedido. Você tem ${portalSettings.banner_images.length} e tentou adicionar ${files.length}.`, { icon: <AnimatedXMark /> });
            e.target.value = null; 
            setNewBannerFiles([]);
            return;
        }
        setNewBannerFiles(files);
    };

    const handleRemoveBanner = (imageUrlToRemove) => {
        if (!window.confirm("Tem certeza que deseja remover este banner? A remoção será permanente ao salvar.")) return;
        setPortalSettings(prev => ({
            ...prev,
            banner_images: prev.banner_images.filter(url => url !== imageUrlToRemove)
        }));
    };
    
    const handleRemoveNewFile = (fileNameToRemove) => {
        setNewBannerFiles(prev => prev.filter(file => file.name !== fileNameToRemove));
    };

    const handleSaveBanners = async () => {
        setIsSavingBanners(true);
        const toastId = toast.loading("Salvando banners...");
        const formData = new FormData();
        formData.append('existing_images', JSON.stringify(portalSettings.banner_images));
        newBannerFiles.forEach(file => {
            formData.append('banners', file); 
        });

        try {
            const response = await fetch(`/api/staff/banner-images`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.status === 401 || response.status === 403) { if (logout) logout(); throw new Error('Sessão inválida.'); }
            
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Falha ao salvar banners.');

            toast.update(toastId, { render: result.message, type: 'success', isLoading: false, autoClose: 3000, icon: <AnimatedCheckmark /> });
            setPortalSettings(prev => ({ ...prev, banner_images: result.banner_images || [] }));
            setNewBannerFiles([]); 

        } catch (err) {
            toast.update(toastId, { render: `Erro: ${err.message}`, type: 'error', isLoading: false, autoClose: 4000, icon: <AnimatedXMark /> });
            fetchPortalSettings();
        } finally {
            setIsSavingBanners(false);
        }
    };
    
    
    const handleManagePermissions = () => toast.info("Abrir modal Gerenciar Permissões (a implementar - requer is_dev?)");
    // Placeholder - Crie a função se ela não existir
    const handleViewServerStatus = () => toast.info("Função 'Ver Status do Sistema' não implementada.");


    if (!canAccessTech) {
        return (
            <div>
                <h1 className="text-3xl font-bold text-red-600 mb-1">Acesso Restrito</h1>
                <p className="text-slate-600 text-lg">Esta seção requer permissão de Staff ou Desenvolvedor.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-1">Painel Técnico</h1>
                <p className="text-slate-600 text-lg">Ferramentas avançadas de administração do sistema.</p>
            </div>

            {/* Grid principal (Token e Configs) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                
                {/* --- Formulário Gerador de Token Global --- */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b pb-3">Gerador de Token Global</h2>
                    <form onSubmit={handleGenerateTokenSubmit}>
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div className="col-span-3 sm:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Usos</label>
                                <input type="number" value={tokenUses} onChange={(e) => setTokenUses(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md" min="1" disabled={isGeneratingToken}/>
                            </div>
                            <div className="col-span-3 sm:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Duração (Horas)</label>
                                <input type="number" value={tokenDuration} onChange={(e) => setTokenDuration(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-md" min="1" disabled={isGeneratingToken}/>
                            </div>
                            <div className="col-span-3 sm:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Corporação</label>
                                {/* ✅ ETAPA 1: Dropdown dinâmico */}
                                <select 
                                    value={tokenCorporacao} 
                                    onChange={(e) => setTokenCorporacao(e.target.value)} 
                                    className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white" 
                                    disabled={isGeneratingToken || corporacoes.length === 0}
                                >
                                    {corporacoes.length === 0 ? (
                                        <option value="">Carregando...</option>
                                    ) : (
                                        corporacoes.map(corp => (
                                            <option key={corp.id} value={corp.sigla}>
                                                {corp.nome} ({corp.sigla})
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="w-full py-2 px-4 rounded-md text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50" disabled={isGeneratingToken}>
                            {isGeneratingToken ? <><i className="fas fa-spinner fa-spin mr-2"></i>Gerando...</> : <><i className="fas fa-key mr-2"></i>Gerar Token</>}
                        </button>
                        
                        {generatedToken && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Token Gerado:</label>
                                <input type="text" readOnly value={generatedToken} className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-100 text-slate-600 font-mono" onClick={(e) => e.target.select()}/>
                            </div>
                        )}
                    </form>
                </div>
                
                {/* --- Formulário Configurações do Portal --- */}
                <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b pb-3">Configurações do Portal</h2>
                    {isLoadingSettings ? <p className="text-slate-500">Carregando configurações...</p> : (
                        <form onSubmit={handleSaveSettings}>
                            <div className="space-y-4 mb-4">
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Título do Header</label>
                                    <input type="text" value={portalSettings.header_title} onChange={(e) => setPortalSettings({...portalSettings, header_title: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md" disabled={isSavingSettings}/>
                                </div>
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Subtítulo do Header</label>
                                    <input type="text" value={portalSettings.header_subtitle} onChange={(e) => setPortalSettings({...portalSettings, header_subtitle: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md" disabled={isSavingSettings}/>
                                </div>
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Texto Copyright Footer</label>
                                    <input type="text" value={portalSettings.footer_copyright} onChange={(e) => setPortalSettings({...portalSettings, footer_copyright: e.target.value})} className="w-full px-3 py-2 border border-slate-300 rounded-md" disabled={isSavingSettings}/>
                                </div>
                                
                                <div className="form-group">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Logo (Header/Footer)</label>
                                    <input 
                                        type="file" 
                                        accept="image/png, image/jpeg, image/gif, image/webp"
                                        onChange={(e) => setLogoFile(e.target.files[0])}
                                        className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                        disabled={isSavingSettings}
                                    />
                                    <small className="text-slate-500">Enviar novo logo. Deixe em branco para manter o atual: <span className="font-medium text-slate-700">{portalSettings.header_logo_url}</span></small>
                                </div>
                            </div>
                            <button type="submit" className="w-full py-2 px-4 rounded-md text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50" disabled={isSavingSettings}>
                                {isSavingSettings ? <><i className="fas fa-spinner fa-spin mr-2"></i>Salvando...</> : <><i className="fas fa-save mr-2"></i>Salvar Configurações</>}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* --- CARD GERENCIADOR DE BANNERS --- */}
            <div className="bg-white p-6 rounded-xl shadow-lg border border-slate-200 mb-8">
                 <h2 className="text-xl font-semibold text-slate-800 mb-4 border-b pb-3">Gerenciar Banners do Portal (Máx: {maxBanners})</h2>
                 {isLoadingSettings ? <p className="text-slate-500">Carregando banners...</p> : (
                    <div>
                        {/* 1. Lista de Banners Atuais */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">Banners Atuais ({portalSettings.banner_images.length})</label>
                            {portalSettings.banner_images.length === 0 ? (
                                <p className="text-sm text-slate-500 text-center italic py-4 bg-slate-50 rounded-md">Nenhum banner salvo.</p>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {portalSettings.banner_images.map((imgUrl) => (
                                        <div key={imgUrl} className="relative group border rounded-md overflow-hidden aspect-video">
                                            <img 
                                                src={imgUrl} 
                                                alt="Banner" 
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.onerror = null; e.target.src = "/brasao.png" }} // Fallback
                                            />
                                            <button
                                                onClick={() => handleRemoveBanner(imgUrl)}
                                                disabled={isSavingBanners}
                                                className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                                                title="Remover este banner"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* 2. Lista de Novos Banners (para upload) */}
                        {newBannerFiles.length > 0 && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 mb-2">Novos Banners para Adicionar ({newBannerFiles.length})</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                     {newBannerFiles.map((file) => (
                                        <div key={file.name} className="relative group border border-dashed border-blue-400 rounded-md overflow-hidden aspect-video">
                                             <img 
                                                src={URL.createObjectURL(file)} 
                                                alt={file.name} 
                                                className="w-full h-full object-cover opacity-70"
                                                onLoad={e => URL.revokeObjectURL(e.target.src)} // Limpa memória
                                            />
                                            <button
                                                onClick={() => handleRemoveNewFile(file.name)}
                                                disabled={isSavingBanners}
                                                className="absolute top-1 right-1 w-6 h-6 bg-gray-600 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-50 group-hover:opacity-100 transition-opacity"
                                                title="Cancelar este upload"
                                            >
                                                &times;
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. Input de Upload e Botão Salvar */}
                        <div className="flex flex-col sm:flex-row sm:items-end sm:gap-4 mt-6">
                            <div className="form-group flex-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Adicionar novos banners (Máx total: {maxBanners})</label>
                                <input 
                                    type="file" 
                                    multiple 
                                    accept="image/png, image/jpeg, image/gif, image/webp"
                                    onChange={handleBannerFileChange}
                                    disabled={isSavingBanners || portalSettings.banner_images.length >= maxBanners}
                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                                {portalSettings.banner_images.length >= maxBanners && (
                                    <small className="text-red-600">Você atingiu o limite de {maxBanners} banners. Remova um existente para adicionar outro.</small>
                                )}
                            </div>
                            <button 
                                onClick={handleSaveBanners}
                                className="w-full sm:w-auto py-2 px-6 rounded-md text-sm font-semibold bg-green-600 text-white hover:bg-green-700 disabled:opacity-50" 
                                disabled={isSavingBanners || (newBannerFiles.length === 0 && portalSettings.banner_images.length === (JSON.parse(localStorage.getItem('user_session') || '{}').banner_images || []).length)} // Desabilita se nada mudou
                            >
                                {isSavingBanners ? <><i className="fas fa-spinner fa-spin mr-2"></i>Salvando...</> : <><i className="fas fa-save mr-2"></i>Salvar Banners</>}
                            </button>
                        </div>
                    </div>
                 )}
            </div>
            {/* --- FIM DO CARD DE BANNERS --- */}


            {/* Cards Restantes (Acesso Dev) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 <AdminActionCard 
                    title="Gerenciar IPs Banidos" // <-- Card de Desban
                    description="Perdoar (desbanir) IPs que foram banidos do sistema."
                    icon="fa-network-wired"
                    onClick={() => setModal('manageBannedIPs', true)}
                    // ✅ CORREÇÃO APLICADA: Permite Staff e Dev
                    disabled={!user?.permissoes?.is_staff && !user?.permissoes?.is_dev}
                />
                 <AdminActionCard 
                    title="Gerenciar Permissões"
                    description="Definir quais cargos têm acesso a quais painéis (is_rh, is_staff, is_dev)."
                    icon="fa-user-shield"
                    onClick={handleManagePermissions}
                    disabled={!user?.permissoes?.is_dev} // Apenas Dev
                />
                 <AdminActionCard 
                    title="Status do Sistema"
                    description="Verificar status do servidor, ping, logs de erro e limpar cache."
                    icon="fa-server"
                    onClick={handleViewServerStatus}
                    disabled={!user?.permissoes?.is_dev} // Apenas Dev
                />
            </div>
        </div>
    );
};
// --- [FIM] VISÃO 5 ---


// --- [INÍCIO] NOVOS MODAIS DE GERENCIAMENTO DE USUÁRIO ---

// --- Modal: Editar Usuário (Unificado) ---
const EditUserModal = ({ isOpen, onClose, user: userToEdit, onSave, structureData, adminUser }) => {
    const { token, logout } = useAuth();
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPolicial, setIsPolicial] = useState(false);

    // Listas filtradas para selects
    const [patentesDisponiveis, setPatentesDisponiveis] = useState([]);
    const [divisoesDisponiveis, setDivisoesDisponiveis] = useState([]);

    useEffect(() => {
        if (isOpen && userToEdit) {
            setIsPolicial(userToEdit.tipo === 'Policial');
            
            // Define o formData inicial
            const baseData = {
                nome_completo: userToEdit.nome_completo || '',
                passaporte: userToEdit.passaporte || '',
            };
            
            if (userToEdit.tipo === 'Policial') {
                // Tenta parsear permissões existentes
                let userPerms = {};
                try {
                    // O 'userToEdit' da lista (search-users) agora inclui 'permissoes'
                    const permsString = userToEdit.permissoes;
                    
                    if (typeof permsString === 'string' && permsString.startsWith('{')) {
                        userPerms = JSON.parse(permsString);
                    } else if (typeof permsString === 'object' && permsString !== null) {
                        userPerms = permsString;
                    }
                } catch(e) {
                    // Erro ao parsear
                }

                // Preenche dados específicos de policial
                const policeData = {
                    ...baseData,
                    discord_id: userToEdit.discord_id || '',
                    telefone_rp: userToEdit.telefone_rp || '',
                    gmail: userToEdit.gmail || '',
                    corporacao: userToEdit.corporacao || '',
                    patente: userToEdit.patente || '',
                    divisao: userToEdit.divisao || '',
                    status: userToEdit.status || 'Em Análise', // <-- ADICIONADO
                    // ADICIONADO: Seta o estado das permissões
                    permissoes: {
                        is_staff: !!userPerms.is_staff,
                        is_rh: !!userPerms.is_rh,
                        is_dev: !!userPerms.is_dev
                    }
                };
                setFormData(policeData);

                // Filtra patentes e divisões para a corporação deste policial
                const corpSigla = userToEdit.corporacao;
                setPatentesDisponiveis(
                    (structureData.patentes || [])
                        .filter(p => p.corporacao_sigla === corpSigla)
                        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                        .map(p => p.nome)
                );
                setDivisoesDisponiveis(
                    (structureData.divisoes || [])
                        .filter(d => d.corporacao_sigla === corpSigla)
                        .map(d => d.nome)
                );

            } else { // é Civil
                // Preenche dados específicos de civil
                const civilData = {
                    ...baseData,
                    telefone_rp: userToEdit.telefone_rp || '', 
                    gmail: userToEdit.gmail || '', 
                    // Civis não têm status ou permissões editáveis aqui
                };
                setFormData(civilData);
                setPatentesDisponiveis([]);
                setDivisoesDisponiveis([]);
            }
        } else {
            // Limpa o formulário ao fechar
            setFormData({});
            setIsPolicial(false);
        }
    }, [isOpen, userToEdit, structureData]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Handler para os toggles de permissão
    const handlePermissionToggle = (perm) => {
        setFormData(prev => ({ 
            ...prev, 
            permissoes: { 
                ...prev.permissoes, 
                [perm]: !prev.permissoes[perm] 
            } 
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const toastId = toast.loading("Salvando dados do usuário...");
        
        // Determina o endpoint correto
        const endpoint = isPolicial ? `/api/staff/policial/${userToEdit.id}` : `/api/staff/civil/${userToEdit.id}`;

        try {
            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData) // formData agora inclui 'permissoes' e 'status'
            });
            if (response.status === 401 || response.status === 403) { if(logout) logout(); throw new Error('Sessão inválida'); }
            const data = await response.json();
            if (!response.ok) { throw new Error(data.message || 'Erro ao salvar'); }
            
            toast.update(toastId, { render: data.message, type: 'success', isLoading: false, autoClose: 3000, icon: <AnimatedCheckmark /> });
            onSave(); // Avisa o componente pai para recarregar a lista
            
        } catch (err) {
            toast.update(toastId, { render: `Erro: ${err.message}`, type: 'error', isLoading: false, autoClose: 4000, icon: <AnimatedXMark /> });
        } finally {
            setIsSubmitting(false);
        }
    };

    // O admin logado é DEV?
    const isAdminDev = adminUser?.permissoes?.is_dev === true;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="modal-overlay" // Reutiliza Modal.css
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20, opacity: 0 }}
                        className="modal-content" // Reutiliza Modal.css
                        style={{ maxWidth: '600px' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h3>Editando {userToEdit.tipo}: {userToEdit.nome_completo}</h3>
                            <button onClick={onClose} className="close-btn" disabled={isSubmitting}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                                
                                {/* --- SEÇÃO DE DADOS BÁSICOS --- */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="modal-form-group">
                                        <label>Nome Completo *</label>
                                        <input name="nome_completo" value={formData.nome_completo || ''} onChange={handleChange} disabled={isSubmitting} required />
                                    </div>
                                    <div className="modal-form-group">
                                        <label>Passaporte *</label>
                                        <input name="passaporte" value={formData.passaporte || ''} onChange={handleChange} disabled={isSubmitting} required />
                                    </div>
                                    
                                    <div className="modal-form-group">
                                        <label>Gmail</label>
                                        <input type="email" name="gmail" value={formData.gmail || ''} onChange={handleChange} disabled={isSubmitting} />
                                    </div>
                                    <div className="modal-form-group">
                                        <label>Telefone (RP)</label>
                                        <input name="telefone_rp" value={formData.telefone_rp || ''} onChange={handleChange} disabled={isSubmitting} />
                                    </div>
                                    
                                    {isPolicial && (
                                        <>
                                            <div className="modal-form-group">
                                                <label>Discord ID</label>
                                                <input name="discord_id" value={formData.discord_id || ''} onChange={handleChange} disabled={isSubmitting} />
                                            </div>
                                            <div className="modal-form-group">
                                                <label>Corporação</label>
                                                <input name="corporacao" value={formData.corporacao || ''} disabled={true} className="bg-slate-100" />
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* --- SEÇÃO DE CARREIRA (SÓ PARA POLICIAL) --- */}
                                {isPolicial && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200 mt-4">
                                        <div className="modal-form-group">
                                            <label>Patente (Promoção/Rebaixar)</label>
                                            <select name="patente" value={formData.patente || ''} onChange={handleChange} disabled={isSubmitting} className="bg-white">
                                                <option value="">-- Nenhuma --</option>
                                                {patentesDisponiveis.map(p => <option key={p} value={p}>{p}</option>)}
                                            </select>
                                        </div>
                                        <div className="modal-form-group">
                                            <label>Divisão</label>
                                            <select name="divisao" value={formData.divisao || ''} onChange={handleChange} disabled={isSubmitting} className="bg-white">
                                                <option value="">-- Nenhuma --</option>
                                                {divisoesDisponiveis.map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}
                                
                                {/* --- SEÇÃO DE STATUS E PERMISSÕES (SÓ PARA POLICIAL) --- */}
                                {isPolicial && (
                                    <div className="pt-4 border-t border-slate-200 mt-4">
                                        <h4 className="text-md font-semibold text-slate-800 mb-2">Status e Permissões</h4>
                                        <div className="modal-form-group">
                                            <label>Status da Conta</label>
                                            <select name="status" value={formData.status || 'Em Análise'} onChange={handleChange} disabled={isSubmitting} required className="bg-white">
                                                <option value="Em Análise">Em Análise</option>
                                                <option value="Aprovado">Aprovado (Ativo)</option>
                                                <option value="Reprovado">Reprovado</option>
                                                <option value="Suspenso">Suspenso</option>
                                                {/* ✅ CORREÇÃO APLICADA (Texto) */}
                                                <option value="Demitido">Banido</option>
                                            </select>
                                        </div>

                                        <PermissionToggle
                                            label="Staff"
                                            description="Acesso total ao Painel Staff (exceto painel técnico)."
                                            isEnabled={!!formData.permissoes?.is_staff}
                                            onToggle={() => handlePermissionToggle('is_staff')}
                                            disabled={isSubmitting || userToEdit.id === 1} // ID 1 é DEV fixo
                                        />
                                        <PermissionToggle
                                            label="Recursos Humanos (RH)"
                                            description="Acesso ao Painel de RH (alistamento, promoções, etc.)."
                                            isEnabled={!!formData.permissoes?.is_rh}
                                            onToggle={() => handlePermissionToggle('is_rh')}
                                            disabled={isSubmitting || userToEdit.id === 1}
                                        />
                                        <PermissionToggle
                                            label="Desenvolvedor (Dev)"
                                            description="Acesso ao Painel Técnico (configurações, tokens, etc.)."
                                            isEnabled={!!formData.permissoes?.is_dev}
                                            onToggle={() => handlePermissionToggle('is_dev')}
                                            disabled={isSubmitting || userToEdit.id === 1 || !isAdminDev} // Apenas Devs podem setar outros Devs
                                        />
                                    </div>
                                )}

                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>Cancelar</button>
                                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                                    {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// --- Modal: Suspender/Banir (Atualizado para Civis) ---
const SuspendBanModal = ({ isOpen, onClose, user: userToEdit, onSave }) => {
    const { token, logout } = useAuth();
    const [acao, setAcao] = useState('suspender'); 
    const [motivo, setMotivo] = useState('');
    const [duracaoHoras, setDuracaoHoras] = useState(24);
    const [banirIp, setBanirIp] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCivil, setIsCivil] = useState(false);

    // Opções de Ação
    const acoesDisponiveis = {
        Policial: [
            { value: 'suspender', label: 'Suspender Conta' },
            // ✅ CORREÇÃO APLICADA (Texto)
            { value: 'banir', label: 'Banir' }, 
            { value: 'reativar', label: 'Reativar (Aprovar)' }
        ],
        Civil: [
            { value: 'banir', label: 'Banir (Deletar)' },
            // Civis não podem ser suspensos ou reativados pois não têm status
        ]
    };

    useEffect(() => {
        if (isOpen && userToEdit) {
            const userTipo = userToEdit.tipo;
            setIsCivil(userTipo === 'Civil');

            // Define a ação padrão
            if (userTipo === 'Civil') {
                setAcao('banir'); // Civil só pode ser banido
            } else if (userToEdit.status === 'Aprovado' || userToEdit.status === 'Ativo') {
                setAcao('suspender');
            } else {
                setAcao('reativar'); // Se já estiver suspenso/reprovado
            }
            
            setMotivo('');
            setDuracaoHoras(24);
            setBanirIp(false);
        }
    }, [isOpen, userToEdit]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!motivo) {
            toast.warn("O motivo é obrigatório para esta ação.");
            return;
        }
        setIsSubmitting(true);
        const toastId = toast.loading("Aplicando ação...");

        const bodyData = {
            acao: acao,
            motivo: motivo,
            duracaoHoras: acao === 'suspender' ? duracaoHoras : null,
            banirIp: acao === 'banir' ? banirIp : false
        };

        try {
            const response = await fetch(`/api/staff/user/${userToEdit.tipo}/${userToEdit.id}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(bodyData)
            });
            if (response.status === 401 || response.status === 403) { if(logout) logout(); throw new Error('Sessão inválida'); }
            const data = await response.json();
            if (!response.ok) { throw new Error(data.message || 'Erro ao aplicar ação'); }
            
            toast.update(toastId, { render: data.message, type: 'success', isLoading: false, autoClose: 3000, icon: <AnimatedCheckmark /> });
            onSave(); // Recarrega a lista

        } catch (err) {
            toast.update(toastId, { render: `Erro: ${err.message}`, type: 'error', isLoading: false, autoClose: 4000, icon: <AnimatedXMark /> });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !userToEdit) return null;

    // Atualiza as opções do select com base no tipo
    const opcoesAtuais = acoesDisponiveis[userToEdit.tipo] || [];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="modal-overlay"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20, opacity: 0 }}
                        className="modal-content"
                        style={{ maxWidth: '500px' }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h3>Punição / Reversão</h3>
                            <button onClick={onClose} className="close-btn" disabled={isSubmitting}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <p className="mb-4"><strong>Usuário:</strong> {userToEdit.nome_completo} ({userToEdit.passaporte})</p>
                                
                                <div className="modal-form-group">
                                    <label>Ação</label>
                                    <select 
                                        name="acao" 
                                        value={acao} 
                                        onChange={(e) => setAcao(e.target.value)} 
                                        disabled={isSubmitting || isCivil} // Desabilita o select se for civil (só há 1 opção)
                                        required 
                                        className="bg-white"
                                    >
                                        {opcoesAtuais.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>

                                {acao === 'suspender' && !isCivil && (
                                    <div className="modal-form-group">
                                        <label>Duração da Suspensão (em horas)</label>
                                        <input type="number" name="duracaoHoras" value={duracaoHoras} onChange={(e) => setDuracaoHoras(e.target.value)} min="1" disabled={isSubmitting} required />
                                    </div>
                                )}
                                
                                {acao === 'banir' && (
                                    <div className="modal-form-group flex items-center gap-2 mt-4">
                                        <input type="checkbox" id="banirIp" name="banirIp" checked={banirIp} onChange={(e) => setBanirIp(e.target.checked)} disabled={isSubmitting} className="w-4 h-4" />
                                        <label htmlFor="banirIp" className="mb-0 font-medium text-red-700">Banir por IP (Ação permanente)</label>
                                    </div>
                                )}

                                <div className="modal-form-group">
                                    <label>Motivo *</label>
                                    <textarea name="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} required disabled={isSubmitting} placeholder="Ex: Quebra de conduta..." />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>Cancelar</button>
                                <button type="submit" className={acao === 'reativar' ? "btn-primary" : "btn-danger"} disabled={isSubmitting || !motivo}>
                                    {isSubmitting ? 'Aplicando...' : (acao === 'reativar' ? 'Confirmar Reativação' : 'Confirmar Punição')}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// --- [NOVO] Modal para Gerenciar IPs Banidos ---
const ManageBannedIPsModal = ({ isOpen, onClose, token, logout }) => {
    const [bannedIPs, setBannedIPs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchBannedIPs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/staff/banned-ips`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 401 || response.status === 403) { if (logout) logout(); throw new Error('Sessão inválida'); }
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao buscar IPs banidos.');
            setBannedIPs(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token, logout]);

    useEffect(() => {
        if (isOpen) {
            fetchBannedIPs();
        }
    }, [isOpen, fetchBannedIPs]);

    const handleUnban = async (banId) => {
        if (!window.confirm("Tem certeza que deseja perdoar (desbanir) este IP?")) return;
        
        const toastId = toast.loading("Perdoando IP...");
        try {
            const response = await fetch(`/api/staff/banned-ips/${banId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 401 || response.status === 403) { if (logout) logout(); throw new Error('Sessão inválida'); }
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erro ao perdoar IP.');
            
            toast.update(toastId, { render: data.message, type: 'success', isLoading: false, autoClose: 3000, icon: <AnimatedCheckmark /> });
            fetchBannedIPs(); // Recarrega a lista
        } catch (err) {
            toast.update(toastId, { render: `Erro: ${err.message}`, type: 'error', isLoading: false, autoClose: 4000, icon: <AnimatedXMark /> });
        }
    };

    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        try { return new Date(dateTimeString).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' }); }
        catch (e) { return 'Inválida'; }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="modal-overlay"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.95, y: 20, opacity: 0 }}
                        className="modal-content"
                        style={{ maxWidth: '800px' }} // Modal mais largo
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h3>Gerenciar IPs Banidos</h3>
                            <button onClick={onClose} className="close-btn">&times;</button>
                        </div>
                        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            {loading && <p className="p-10 text-center text-slate-500">Carregando...</p>}
                            {error && <p className="p-10 text-center text-red-600">{error}</p>}
                            {!loading && !error && bannedIPs.length === 0 && (
                                <p className="p-10 text-center text-slate-500">Nenhum IP banido encontrado.</p>
                            )}
                            {!loading && !error && bannedIPs.length > 0 && (
                                <div className="table-responsive">
                                    <table className="recrutas-table">
                                        <thead>
                                            <tr>
                                                <th>IP</th>
                                                <th>Motivo</th>
                                                <th>Data</th>
                                                <th>Ação</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bannedIPs.map(ban => (
                                                <tr key={ban.id}>
                                                    <td className="font-mono">{ban.ip}</td>
                                                    <td>{ban.motivo}</td>
                                                    <td>{formatDateTime(ban.data_banimento)}</td>
                                                    <td>
                                                        <button 
                                                            onClick={() => handleUnban(ban.id)} 
                                                            className="btn-secondary" 
                                                            style={{backgroundColor: '#10b981', borderColor: '#10b981'}}
                                                            title="Perdoar este IP"
                                                        >
                                                            Perdoar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" onClick={onClose} className="btn-secondary">Fechar</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
// --- [FIM] NOVOS MODAIS DE GERENCIAMENTO DE USUÁRIO ---


// --- COMPONENTE PRINCIPAL DA PÁGINA (ADMINPANEL) ---
function AdminPanel() {
    const { user, logout, isLoading, token } = useAuth(); 
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [currentView, setCurrentView] = useState('dashboard'); 
    
    // Estados para os Modais de Usuário
    const [selectedUser, setSelectedUser] = useState(null);
    const [modalState, setModalState] = useState({
        editUser: false,
        suspendUser: false,
        manageBannedIPs: false, 
    });
    
    // Estado para dados de Estrutura (passar para os modais)
    const [structureData, setStructureData] = useState({ corporacoes: [], patentes: [], divisoes: [] });
    const [loadingStructure, setLoadingStructure] = useState(true); 

    const hasAdminPermission = user?.type === 'policial' && (user?.permissoes?.is_staff === true || user?.permissoes?.is_city_admin === true);
    
    // Handler para fechar todos os modais de usuário
    const handleCloseUserModals = (refresh = false) => {
        setModalState({ editUser: false, suspendUser: false, manageBannedIPs: false });
        setSelectedUser(null);
        if (refresh) {
            // Força um "refresh" da view atual (ManageUsersView)
            setCurrentView(''); 
            setTimeout(() => setCurrentView('manage_users'), 0); 
        }
    };

    // Handler para fechar modais do TechPanel
    const handleCloseTechModals = (refresh = false) => {
         setModalState({ editUser: false, suspendUser: false, manageBannedIPs: false });
         if (refresh) {
            setCurrentView(''); 
            setTimeout(() => setCurrentView('tech_panel'), 0); 
         }
    };
    
    // Handlers para ABRIR os modais de usuário
    const handleOpenEditModal = (user) => {
        setSelectedUser(user);
        setModalState(prev => ({ ...prev, editUser: true }));
    };

    const handleOpenSuspendModal = (user) => {
        setSelectedUser(user);
        setModalState(prev => ({ ...prev, suspendUser: true }));
    };

    // Handler para abrir modal de IP Banido (do TechPanel)
    const handleOpenBannedIPsModal = () => {
         setModalState(prev => ({ ...prev, manageBannedIPs: true }));
    };

    // Hook para carregar dados da Estrutura (necessário para os modais)
    useEffect(() => {
        const fetchStructureData = async () => {
            if (isLoading || !token) return; 
            
            setLoadingStructure(true);
            try {
                const response = await fetch(`/api/staff/structure`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('Falha ao carregar estrutura.');
                const data = await response.json();
                
                const processedCorps = (data.corporacoes || []).map(corp => ({
                    ...corp,
                    permissoes: typeof corp.permissoes === 'string' && corp.permissoes.startsWith('{')
                                ? JSON.parse(corp.permissoes)
                                : (typeof corp.permissoes === 'object' && corp.permissoes !== null ? corp.permissoes : {})
                }));
                
                // ✅ ETAPA 1: Adicionar parsing de permissões para patentes
                const processedPatentes = (data.patentes || []).map(patente => ({
                    ...patente,
                    permissoes: typeof patente.permissoes === 'string' && patente.permissoes.startsWith('{')
                                ? JSON.parse(patente.permissoes)
                                : (typeof patente.permissoes === 'object' && patente.permissoes !== null ? patente.permissoes : {})
                }));

                setStructureData({
                    corporacoes: processedCorps,
                    patentes: processedPatentes, // ✅ ETAPA 1: Usar patentes processadas
                    divisoes: data.divisoes || []
                });
            } catch (err) {
                toast.error("Não foi possível carregar os dados de patentes/divisões.", { icon: <AnimatedXMark /> });
            } finally {
                setLoadingStructure(false);
            }
        };

        fetchStructureData();
    }, [isLoading, token]); 

    // Verificação de Acesso
    useEffect(() => {
        if (!isLoading) { 
            if (!user || user.type === 'civil' || !hasAdminPermission) {
                 if (user) {
                     toast.error("Acesso de Staff/RH deve ser feito pelo Login Policial.");
                     logout(); 
                 }
                 navigate('/policia/login', { replace: true }); 
            }
        }
    }, [user, hasAdminPermission, navigate, logout, isLoading]); 


    if (isLoading || !user || user.type !== 'policial' || !hasAdminPermission || loadingStructure) {
         return (
             <div className="flex min-h-screen items-center justify-center bg-slate-100">
                 <div className="p-6 md:p-10 text-center">
                     <p className="text-lg text-slate-600">Carregando e verificando permissões...</p>
                 </div>
             </div>
        );
    }

    const renderCurrentView = () => {
        switch (currentView) {
            case 'dashboard':
                return <DashboardView user={user} setView={setCurrentView} />;
            case 'manage_users':
                return (
                    <ManageUsersView 
                        onEditUser={handleOpenEditModal}
                        onSuspendUser={handleOpenSuspendModal}
                    />
                );
            case 'structure':
                return <StructureView />;
            case 'logs':
                return <LogsView key="logs" defaultActionFilter="Todos" />;
            case 'bug_reports':
                return <LogsView key="bugs" defaultActionFilter="Bug Report" />;
            case 'tech_panel':
                // ✅ ETAPA 1: Passa as corporações para o painel técnico
                return <TechPanelView 
                            setModal={() => handleOpenBannedIPsModal()} 
                            corporacoes={structureData.corporacoes} 
                       />;
            default:
                return <DashboardView user={user} setView={setCurrentView} />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-100">
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-10 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-hidden="true"
                ></div>
            )}

            <StaffSidebarInternal
                currentView={currentView}
                setView={setCurrentView}
                isMobileMenuOpen={isMobileMenuOpen}
                closeMobileMenu={() => setIsMobileMenuOpen(false)}
            />

            <main className="md:pl-64 transition-all duration-300 ease-in-out">
                 <div className="p-4 md:hidden flex justify-end sticky top-0 bg-slate-100/80 backdrop-blur-sm z-10 border-b border-slate-200">
                     <button
                        className="p-2 rounded-md text-slate-600 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        onClick={() => setIsMobileMenuOpen(true)}
                        aria-label="Abrir menu"
                    >
                        <i className="fas fa-bars text-2xl"></i>
                    </button>
                 </div>

                <div className="p-6 md:p-10">
                    {renderCurrentView()}
                </div>
            </main>

            {/* --- Renderização dos Novos Modais --- */}
            <EditUserModal 
                isOpen={modalState.editUser}
                onClose={() => handleCloseUserModals(false)}
                onSave={() => handleCloseUserModals(true)}
                user={selectedUser}
                structureData={structureData}
                adminUser={user} // Passa o admin logado para checar permissão de DEV
            />
            
            <SuspendBanModal
                isOpen={modalState.suspendUser}
                onClose={() => handleCloseUserModals(false)}
                onSave={() => handleCloseUserModals(true)}
                user={selectedUser}
            />

            <ManageBannedIPsModal
                isOpen={modalState.manageBannedIPs}
                onClose={() => handleCloseTechModals(false)}
                token={token}
                logout={logout}
            />

        </div>
    );
}

export default AdminPanel;