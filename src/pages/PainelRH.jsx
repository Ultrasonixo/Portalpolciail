import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx'; // Importa o useAuth
import { toast } from 'react-toastify';
import LogDetails from '../components/LogDetails.jsx'; // LogsView depende disso
import { Link } from 'react-router-dom'; // Necessário para links dentro dos modais

// --- [CORREÇÃO] Define a URL base da sua API ---
const API_URL = 'http://localhost:5173';

// --- ÍCONES ANIMADOS (Necessários para os modais) ---
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

// --- Componente: ActionCard (Usado pelo AdminView) ---
const ActionCard = ({ title, description, icon, permission, onClick }) => {
    const { user } = useAuth();
    const hasPermission = user?.permissoes?.[permission] || user?.permissoes?.is_rh;
    
    const cardContent = (
        <div className={`action-card ${!hasPermission ? 'disabled' : ''}`}>
            <div className="action-card-icon"><i className={`fas ${icon}`}></i></div>
            <div className="action-card-info">
                <h3>{title}</h3>
                <p>{description}</p>
            </div>
        </div>
    );
    const handleClick = hasPermission ? onClick : undefined;
    return (<div onClick={handleClick} className="action-card-link" style={{cursor: hasPermission ? 'pointer' : 'not-allowed'}}>{cardContent}</div>);
};

// --- Helper: Tradução de Ações (Usado pelo LogsView) ---
const translations = {
    'Manage Career': 'Gerenciar Carreira', 'Approve Recruit': 'Aprovar Recruta',
    'Reject Recruit': 'Rejeitar Recruta', 'Dismiss Policial': 'Demitir Policial',
    'Update Policial Data': 'Atualizar Dados Policial', 'Generate Registration Token': 'Gerar Token',
    'Create Announcement': 'Criar Anúncio', 'Bug Report': 'Relatório de Bug',
    'Create Concurso': 'Criar Concurso', 'Update Concurso': 'Atualizar Concurso',
    'Delete Concurso': 'Excluir Concurso', 'Create Concurso (Fallback V2)': 'Criar Concurso (V2)',
    'Create Concurso (Fallback V1)': 'Criar Concurso (V1)', 'Todos': 'Todas as Ações',
};
const translateAction = (action) => translations[action] || action;


// --- [RH VIEW] 7. Admin View (AdminPage.jsx) ---
const AdminView = ({ user, setView, setAdminModal }) => {
    const navigateToLogs = () => {
        // [CORREÇÃO APLICADA] setView é usado para navegar e passar props
        setView('logs', { defaultActionFilter: 'Todos' });
    };

    return (
        <div className="page-container">
            <h1 className="page-title">Admin ({user.corporacao || 'RH Geral'})</h1>
            <p className="page-subtitle">Ferramentas de gerenciamento.</p>
            <div className="admin-hub-grid">
                {/* Botões agora usam setAdminModal para abrir modais */}
                <ActionCard title="Gerar Token" description="Crie tokens para alistamento." icon="fa-key" permission="is_rh" onClick={() => setAdminModal('generateToken', true)} />
                <ActionCard title="Aprovar Recrutas" description="Analise alistamentos." icon="fa-user-check" permission="is_rh" onClick={() => setAdminModal('recruitList', true)} />
                <ActionCard title="Promover / Rebaixar" description="Altere patente." icon="fa-user-shield" permission="is_rh" onClick={() => setAdminModal('promo', true)} />
                <ActionCard title="Gerenciar Policial" description="Edite dados." icon="fa-user-cog" permission="is_rh" onClick={() => setAdminModal('gerenciarPolicial', true)} />
                <ActionCard title="Gerenciar Concursos" description="Crie, edite, exclua." icon="fa-file-signature" permission="is_rh" onClick={() => setAdminModal('gerenciarConcursos', true)} />
                <ActionCard title="Anunciar" description="Crie anúncios." icon="fa-bullhorn" permission="is_rh" onClick={() => setAdminModal('anuncio', true)} />
                <ActionCard title="Demitir Policial" description="Remova acesso." icon="fa-user-slash" permission="is_rh" onClick={() => setAdminModal('demitir', true)} />
                <ActionCard title="Logs Auditoria" description="Visualize ações." icon="fa-clipboard-list" permission="is_rh" onClick={navigateToLogs} />
            </div>
        </div>
    );
};

// --- [RH VIEW] 8. Logs View (LogsPage.jsx) ---
const LogsView = ({ user, token, logout, navProps }) => {
    const defaultActionFilter = navProps.defaultActionFilter || 'Todos';

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
            'Create Concurso (Fallback V2)', 'Create Concurso (Fallback V1)'
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
            const response = await fetch(`${API_URL}/api/admin/logs?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    if (logout) logout(); throw new Error('Sessão inválida ou sem permissão.');
                }
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Falha ao buscar logs.');
            }
            const data = await response.json();
            setLogs(data.logs || []); setTotalPages(data.totalPages || 1);
        } catch (err) {
            console.error("Erro ao buscar logs:", err); setError(`Falha ao carregar: ${err.message}`); setLogs([]);
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
        <div className="page-container">
            <div className="page-header-logs">
                <div>
                    <h1 className="page-title">Logs de Auditoria ({user?.corporacao || 'RH Geral'})</h1>
                    <p className="page-subtitle">Registro de ações administrativas e reporte de bugs.</p>
                </div>
            </div>
            <div className="log-filters">
                <input type="text" name="text" placeholder="Buscar por texto, nome, IP..." value={filters.text} onChange={handleFilterChange} disabled={loading} />
                <select name="action" value={filters.action} onChange={handleFilterChange} disabled={loading}>
                    {uniqueActions.map(act => ( <option key={act.key} value={act.key}>{act.translated}</option> ))}
                </select>
                <input type="date" name="date" value={filters.date} onChange={handleFilterChange} disabled={loading} />
                <button onClick={clearFilters} className="clear-filters-btn" disabled={loading}>Limpar Filtros</button>
            </div>
            {loading && <p style={{ textAlign: 'center' }}>Carregando logs...</p>}
            {error && <p className="error-message" style={{ textAlign: 'center' }}>{error}</p>}
            {!loading && !error && (
                <div className="logs-table-widget">
                    <div className="table-responsive">
                        <table className="logs-table">
                            <thead>
                                <tr>
                                    <th style={{width: '150px'}}>Data/Hora</th>
                                    <th>Administrador</th>
                                    <th style={{width: '200px'}}>Ação</th> 
                                    <th>Detalhes</th>
                                    <th style={{width: '120px'}}>IP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length > 0 ? (
                                    logs.map(log => (
                                        <tr key={log.id}>
                                            <td>{formatDateTime(log.data_log)}</td>
                                            <td>{log.admin_nome || `ID ${log.usuario_id}`} ({log.admin_corporacao || 'N/A'})</td>
                                            <td>
                                                <span className={`log-action-tag log-action-${
                                                    log.acao
                                                        .replace(/\s+/g, '-') 
                                                        .replace(/[()]/g, '') 
                                                        .replace(/\//g, '-')  
                                                        .toLowerCase()
                                                }`}>
                                                    {translateAction(log.acao)}
                                                </span>
                                            </td>
                                            <td className="log-details-cell">
                                                <div style={{ wordBreak: 'break-word', whiteSpace: 'normal' }}>
                                                    <LogDetails action={log.acao} details={log.detalhes} />
                                                </div>
                                            </td>
                                            <td>{log.ip_address || 'N/A'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="5" style={{ textAlign: 'center', color: '#6c757d', padding: '20px' }}>Nenhum log encontrado.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="pagination-controls">
                           <button onClick={handlePreviousPage} disabled={currentPage <= 1 || loading}>&laquo; Anterior</button>
                            <span>Página {currentPage} de {totalPages}</span>
                            <button onClick={handleNextPage} disabled={currentPage >= totalPages || loading}>Próxima &raquo;</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


// --- [RH MODAL] Aprovação de Recruta ---
// [CORREÇÃO] Adicionado prop structureData
const ApprovalModal = ({ isOpen, recruta, onClose, onConfirm, structureData }) => {
    const [patente, setPatente] = useState('');
    const [patentesDisponiveis, setPatentesDisponiveis] = useState([]);
    const [divisao, setDivisao] = useState('');
    const [divisoesDisponiveis, setDivisoesDisponiveis] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen && recruta?.corporacao && structureData.patentes && structureData.divisoes) {
            const corpSigla = recruta.corporacao;
            
            // 1. Filtrar e ordenar Patentes do backend
            const patentes = structureData.patentes
                .filter(p => p.corporacao_sigla === corpSigla)
                .sort((a, b) => (a.ordem || 0) - (b.ordem || 0)) // Ordenar por 'ordem'
                .map(p => p.nome);

            setPatentesDisponiveis(patentes);
            setPatente(patentes[0] || ''); 

            // 2. Filtrar Divisões do backend
            const divisoes = structureData.divisoes
                .filter(d => d.corporacao_sigla === corpSigla)
                .map(d => d.nome);

            setDivisoesDisponiveis(divisoes);
            setDivisao(divisoes[0] || ''); 
        } else {
            setPatentesDisponiveis([]);
            setDivisoesDisponiveis([]);
        }
        setError('');
        setProcessing(false);
    }, [recruta, isOpen, structureData]); 

    if (!isOpen || !recruta) return null;

    const handleConfirmClick = () => {
        if (!patente || !divisao) {
            setError('Por favor, selecione a patente e a divisão.'); return;
        }
        setProcessing(true); setError('');
        onConfirm(recruta.id, divisao, patente);
        setProcessing(false); 
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Aprovar Recruta ({recruta.corporacao || 'N/A'})</h3>
                    <button onClick={onClose} className="close-btn" disabled={processing}>&times;</button>
                </div>
                <div className="modal-body">
                    <p>Aprovando <strong>{recruta.nome_completo}</strong> (Passaporte: {recruta.passaporte}).</p>
                    {error && <p className="status-message status-error">{error}</p>}
                    <div className="modal-form-group">
                        <label htmlFor="patenteAprovar">Selecione a Patente Inicial</label>
                        <select id="patenteAprovar" value={patente} onChange={(e) => setPatente(e.target.value)} required disabled={processing || patentesDisponiveis.length === 0}>
                            <option value="" disabled>{patentesDisponiveis.length > 0 ? 'Selecione a patente...' : 'Nenhuma patente encontrada'}</option>
                            {patentesDisponiveis.map(p => (<option key={p} value={p}>{p}</option>))}
                        </select>
                    </div>
                    <div className="modal-form-group">
                        <label htmlFor="divisaoAprovar">Selecione a Divisão</label>
                        <select id="divisaoAprovar" value={divisao} onChange={(e) => setDivisao(e.target.value)} required disabled={processing || divisoesDisponiveis.length === 0}>
                            <option value="" disabled>{divisoesDisponiveis.length > 0 ? 'Selecione a divisão...' : 'Nenhuma divisão encontrada'}</option>
                            {divisoesDisponiveis.map(d => (<option key={d} value={d}>{d}</option>))}
                        </select>
                    </div>
                </div>
                <div className="modal-footer">
                    <button onClick={onClose} className="btn-secondary" disabled={processing}>Cancelar</button>
                    <button onClick={handleConfirmClick} className="btn-primary" disabled={processing || !patente || !divisao}>
                        {processing ? 'Aprovando...' : 'Confirmar Aprovação'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- [RH MODAL] Gerenciar Policial ---
// [CORREÇÃO] Adicionado prop structureData
const GerenciarPolicialModal = ({ isOpen, onClose, token, logout, user, structureData }) => {
    const [view, setView] = useState('search');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);

    // [CORREÇÃO] Usar useMemo para filtrar listas baseadas no RH logado e nos dados passados
    const adminCorp = user?.corporacao;
    
    const patentesDisponiveis = useMemo(() => {
        return structureData.patentes
            .filter(p => p.corporacao_sigla === adminCorp)
            .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
            .map(p => p.nome);
    }, [structureData.patentes, adminCorp]);

    const divisoesDisponiveis = useMemo(() => {
        return structureData.divisoes
            .filter(d => d.corporacao_sigla === adminCorp)
            .map(d => d.nome);
    }, [structureData.divisoes, adminCorp]);
    
    useEffect(() => { 
         if (!isOpen) {
            setTimeout(() => {
                setView('search'); setSearchTerm(''); setSearchResults([]);
                setSelectedUser(null); setFormData({});
            }, 300);
        }
    }, [isOpen]);

    const handleSearch = async () => {
        if (searchTerm.length < 2) { toast.info("Digite pelo menos 2 caracteres."); setSearchResults([]); return; }
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/admin/search-policiais?query=${searchTerm}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.status === 401 || response.status === 403) { if(logout) logout(); throw new Error('Sessão inválida.'); }
            if (!response.ok) throw new Error('Falha ao buscar.');
            const data = await response.json();
            setSearchResults(data);
            if (data.length === 0) toast.info('Nenhum policial encontrado.');
        } catch (err) {
            toast.error(`Erro na busca: ${err.message}`, { icon: <AnimatedXMark /> });
        } finally { setLoading(false); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        const toastId = toast.loading("Salvando alterações...");

        try {
            const response = await fetch(`${API_URL}/api/admin/update-policial/${selectedUser.id}`, {
                method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
             if (response.status === 401 || response.status === 403) { if(logout) logout(); throw new Error('Sessão inválida.'); }
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Falha ao salvar.');

            toast.update(toastId, { render: data.message || "Dados atualizados!", type: 'success', isLoading: false, autoClose: 3000, icon: <AnimatedCheckmark /> });
            setLoading(false); 
            setTimeout(() => { 
                setView('search'); setSearchTerm(''); setSearchResults([]);
            }, 1500); 

        } catch (err) {
            toast.update(toastId, { render: `Erro ao salvar: ${err.message}`, type: 'error', isLoading: false, autoClose: 5000, icon: <AnimatedXMark /> });
            setLoading(false); 
        }
    };

    const selectUserToEdit = (user) => {
        setSelectedUser(user);
        setFormData({
            nome_completo: user.nome_completo || '', passaporte: user.passaporte || '',
            discord_id: user.discord_id || '', telefone_rp: user.telefone_rp || '',
            patente: user.patente || '', divisao: user.divisao || '',
       });
        setView('edit');
    };

     const handleFormChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
     };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{width: '90%', maxWidth: '600px'}}>
                <div className="modal-header">
                    <h3>{view === 'search' ? 'Gerenciar Dados Policial' : `Editando: ${selectedUser?.nome_completo || '...'}`}</h3>
                    <button onClick={onClose} className="close-btn" disabled={loading}>&times;</button>
                </div>

                {/* --- VISÃO DE BUSCA --- */}
                {view === 'search' && (
                    <>
                        <div className="modal-body">
                            <p>Pesquise pelo nome ou passaporte.</p>
                            <div className="modal-form-group">
                                <label htmlFor="search-gerenciar" style={{display: 'none'}}>Pesquisar</label>
                                <div className="search-bar-container">
                                    <input id="search-gerenciar" type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Nome ou passaporte..." />
                                    <button onClick={handleSearch} className="btn-primary" disabled={loading}> {loading ? '...' : 'Buscar'} </button>
                                </div>
                            </div>
                            {(searchResults.length > 0) && (
                                <ul className="search-results-list">
                                    {searchResults.map(p => (
                                        <li key={p.id} className="search-result-item">
                                            <div className="info"> <strong>{p.nome_completo}</strong> <small>{p.patente} ({p.passaporte})</small> </div>
                                            <button className="btn-secondary btn-edit" onClick={() => selectUserToEdit(p)}> Editar </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        <div className="modal-footer"> <button onClick={onClose} className="btn-secondary">Fechar</button> </div>
                    </>
                )}

                {/* --- VISÃO DE EDIÇÃO --- */}
                {view === 'edit' && selectedUser && ( 
                    <form onSubmit={handleSave}>
                        <div className="modal-body" style={{maxHeight: '60vh', overflowY: 'auto'}}>
                             <div className="modal-form-group"><label>Nome</label><input name="nome_completo" type="text" value={formData.nome_completo} onChange={handleFormChange} required /></div>
                             <div className="modal-form-group"><label>Passaporte</label><input name="passaporte" type="text" value={formData.passaporte} onChange={handleFormChange} required /></div>
                             <div className="modal-form-group"><label>Discord ID</label><input name="discord_id" type="text" value={formData.discord_id} onChange={handleFormChange} /></div>
                             <div className="modal-form-group"><label>Telefone (RP)</label><input name="telefone_rp" type="text" value={formData.telefone_rp} onChange={handleFormChange} /></div>

                            <div className="modal-form-group"><label>Patente</label><select name="patente" value={formData.patente} onChange={handleFormChange} required><option value="" disabled>Selecione...</option>{patentesDisponiveis.map(p => (<option key={p} value={p}>{p}</option>))}</select></div>
                            <div className="modal-form-group"><label>Divisão</label><select name="divisao" value={formData.divisao} onChange={handleFormChange} required><option value="" disabled>Selecione...</option>{divisoesDisponiveis.map(d => (<option key={d} value={d}>{d}</option>))}</select></div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" onClick={() => {setView('search');}} className="btn-secondary" disabled={loading}> Voltar </button>
                            <button type="submit" className="btn-primary" disabled={loading}> {loading ? 'Salvando...' : 'Salvar'} </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

// --- [RH MODAL] Lista de Recrutas ---
const RecruitListModal = ({ isOpen, onClose, onApproveClick, onRejectClick, token, logout }) => {
    const [recrutas, setRecrutas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchRecrutas = useCallback(async () => {
        setLoading(true); setError(''); setRecrutas([]);
        if (!token) {
            setError('Erro de autenticação: Token não encontrado.'); setLoading(false); return;
        }
        const headers = { 'Authorization': `Bearer ${token}` };
        try {
            const response = await fetch(`${API_URL}/api/admin/recrutas`, { headers }); 
            if (response.status === 401 || response.status === 403) {
                if (logout) logout();
                throw new Error('Sessão inválida. Faça login novamente.');
            }
            if (!response.ok) {
                const errData = await response.json().catch(() => ({ message: `Erro HTTP ${response.status}` }));
                throw new Error(errData.message || 'Falha ao buscar recrutas.');
            }
            setRecrutas(await response.json());
        } catch (err) {
            console.error("Erro no fetch de recrutas:", err);
            setError(err.message || 'Erro ao carregar recrutas.');
        } finally {
            setLoading(false);
        }
    }, [token, logout]);

    useEffect(() => {
        if (isOpen) {
            fetchRecrutas();
        }
    }, [isOpen, fetchRecrutas]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{maxWidth: '750px', minWidth: '600px'}}>
                <div className="modal-header">
                    <h3>Recrutas Pendentes de Análise</h3>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>
                <div className="modal-body">
                    {loading && <p style={{textAlign: 'center'}}>Carregando...</p>}
                    {error && <p className="error-message" style={{textAlign: 'center'}}>{error}</p>}
                    {!loading && !error && (
                        recrutas.length === 0 ? (
                            <p style={{textAlign: 'center', color: '#94a3b8'}}>Nenhum recruta pendente no momento.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="recrutas-table">
                                    <thead>
                                        <tr>
                                            <th>Nome Completo</th>
                                            <th>Passaporte</th>
                                            <th>Discord</th>
                                            <th style={{width: '210px'}}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recrutas.map(recruta => (
                                            <tr key={recruta.id}>
                                                <td>{recruta.nome_completo}</td>
                                                <td>{recruta.passaporte}</td>
                                                <td>{recruta.discord_id}</td>
                                                <td className="actions-cell">
                                                    <button onClick={() => onApproveClick(recruta)} className="action-btn approve">
                                                        <i className="fas fa-check"></i> Aprovar
                                                    </button>
                                                    <button onClick={() => onRejectClick(recruta.id)} className="action-btn reject">
                                                        <i className="fas fa-times"></i> Reprovar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}
                </div>
                 <div className="modal-footer">
                    <button onClick={onClose} className="btn-secondary">Fechar</button>
                </div>
            </div>
        </div>
    );
};

// --- [RH MODAL] Anúncio ---
// [ADICIONADO] Recebe a lista de corporações
const AnuncioModal = ({ isOpen, onClose, token, logout, user, corporacoes }) => {
    const [titulo, setTitulo] = useState('');
    const [conteudo, setConteudo] = useState('');
    const [corporacaoAlvo, setCorporacaoAlvo] = useState(null); 
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Mapeia corporações para opções, garantindo a opção 'Geral'
    const corpOptions = useMemo(() => {
        const options = [{ sigla: 'Geral', nome: 'Geral (Todas)' }];
        if (corporacoes && corporacoes.length > 0) {
            // Filtra duplicatas se houver
            const uniqueCorps = corporacoes.filter((corp, index, self) => 
                index === self.findIndex((c) => (
                    c.sigla === corp.sigla
                ))
            );
            options.push(...uniqueCorps);
        }
        return options;
    }, [corporacoes]);

    useEffect(() => {
        if (isOpen) {
            setTitulo('');
            setConteudo('');
            // Define o valor inicial como a corporação do RH logado, ou 'Geral' se não tiver
            const initialCorp = user?.corporacao || 'Geral'; 
            setCorporacaoAlvo(initialCorp === 'Geral' ? null : initialCorp); 
            setIsSubmitting(false);
        }
    }, [isOpen, user?.corporacao, corporacoes]); 

    const handleCorporacaoChange = (e) => {
        const selectedValue = e.target.value;
        const newValue = selectedValue === 'Geral' ? null : selectedValue;
        setCorporacaoAlvo(newValue);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!titulo || !conteudo) { toast.warning('Título e conteúdo são obrigatórios.'); return; }
        if (!token) { toast.error('Erro: Token não encontrado.', { icon: <AnimatedXMark /> }); return; }

        setIsSubmitting(true);
        const toastId = toast.loading("Publicando anúncio...");

        try {
            const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
            const response = await fetch(`${API_URL}/api/admin/anuncios`, { 
                method: 'POST', headers: headers,
                body: JSON.stringify({
                    titulo: titulo,
                    conteudo: conteudo,
                    corporacao: corporacaoAlvo 
                })
            });

             if (response.status === 401 || response.status === 403) {
                 if (logout) logout();
                 toast.update(toastId, { render: "Sessão inválida ou sem permissão.", type: "error", isLoading: false, autoClose: 5000, icon: <AnimatedXMark /> });
                 throw new Error('Sessão inválida.');
            }
            const result = await response.json();
            if (!response.ok) { throw new Error(result.message || 'Erro ao publicar.'); }
            toast.update(toastId, { render: result.message || "Anúncio publicado!", type: "success", isLoading: false, autoClose: 3000, icon: <AnimatedCheckmark /> });
            setTimeout(() => { onClose(true); }, 1500);

        } catch (error) {
            console.error("Erro ao publicar anúncio:", error);
            if (error.message !== 'Sessão inválida.') {
                 toast.update(toastId, { render: `Falha: ${error.message}`, type: "error", isLoading: false, autoClose: 5000, icon: <AnimatedXMark /> });
            }
        } finally {
             setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Criar Anúncio</h3>
                    <button onClick={() => onClose(false)} className="close-btn" disabled={isSubmitting}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="modal-form-group">
                            <label htmlFor="anuncioTitulo">Título *</label>
                            <input id="anuncioTitulo" type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} maxLength={255} required disabled={isSubmitting} />
                        </div>
                        <div className="modal-form-group">
                            <label htmlFor="anuncioConteudo">Conteúdo *</label>
                            <textarea id="anuncioConteudo" value={conteudo} onChange={(e) => setConteudo(e.target.value)} rows={6} required disabled={isSubmitting} />
                        </div>
                        <div className="modal-form-group">
                            <label htmlFor="anuncioCorporacao">Publicar Para</label>
                            <select
                                id="anuncioCorporacao"
                                // Usa 'Geral' para representar null na interface
                                value={corporacaoAlvo === null ? 'Geral' : corporacaoAlvo} 
                                onChange={handleCorporacaoChange} 
                                disabled={isSubmitting}
                            >
                                {corpOptions.map(corp => (
                                    <option key={corp.sigla} value={corp.sigla}>
                                        {corp.nome}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={() => onClose(false)} className="btn-secondary" disabled={isSubmitting}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Publicando...' : 'Publicar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- [RH MODAL] Demitir ---
const DemitirModal = ({ isOpen, onClose, token, logout, user }) => {
    const [policiais, setPoliciais] = useState([]);
    const [selectedPolicialId, setSelectedPolicialId] = useState('');
    const [selectedPolicialNome, setSelectedPolicialNome] = useState(''); 
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (isOpen && user?.corporacao) { 
            setSelectedPolicialId('');
            setSelectedPolicialNome('');
            setStatusMessage({ type: '', text: '' });
            setPoliciais([]);
            setLoading(true);

            if (!token) {
                setStatusMessage({ type: 'error', text: 'Token não encontrado.' });
                setLoading(false); return;
            }
            const headers = { 'Authorization': `Bearer ${token}` };

            const fetchPoliciais = async () => {
                try {
                    const response = await fetch(`${API_URL}/api/admin/lista-oficiais`, { headers }); 
                    if (response.status === 401 || response.status === 403) {
                         if (logout) logout(); throw new Error('Sessão inválida.');
                    }
                    if (!response.ok) {
                         const errData = await response.json().catch(()=>({message: `Erro ${response.status}`})); throw new Error(errData.message);
                    }
                    const data = await response.json();
                    setPoliciais(data.filter(p => p.id !== user.id));
                } catch (error) {
                    console.error("Erro ao buscar policiais para demissão:", error);
                    setStatusMessage({ type: 'error', text: `Erro ao carregar: ${error.message}` });
                } finally {
                    setLoading(false);
                }
            };
            fetchPoliciais();
        } else if (isOpen && !user?.corporacao) {
             setStatusMessage({ type: 'error', text: 'Admin sem corporação definida.' });
             setLoading(false);
        }
    }, [isOpen, user, token, logout]); 

    useEffect(() => {
        const policial = policiais.find(p => p.id === parseInt(selectedPolicialId));
        setSelectedPolicialNome(policial ? policial.nome_completo : '');
    }, [selectedPolicialId, policiais]);

    const handleConfirmarDemissao = async () => {
        if (!selectedPolicialId || !selectedPolicialNome) return;
        if (!window.confirm(`Tem certeza que deseja DEMITIR ${selectedPolicialNome}? Esta ação mudará o status para 'Reprovado' e registrará no histórico.`)) {
            return;
        }
        if (!token) { setStatusMessage({ type: 'error', text: 'Token não encontrado.' }); return; }
        const headers = { 'Authorization': `Bearer ${token}` }; 

        setProcessing(true);
        setStatusMessage({ type: 'loading', text: 'Processando demissão...' });

        try {
            const response = await fetch(`${API_URL}/api/admin/demitir/${selectedPolicialId}`, {
                method: 'PUT', 
                headers: headers 
            });
            if (response.status === 401 || response.status === 403) {
                 if (logout) logout(); throw new Error('Sessão inválida ou permissão negada.');
            }
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Erro ao processar demissão.');
            }
            setStatusMessage({ type: 'success', text: result.message });
            setTimeout(() => { onClose(true); }, 2500); // Fecha e indica refresh
        } catch (error) {
            console.error("Erro ao demitir:", error);
            setStatusMessage({ type: 'error', text: error.message || 'Falha ao demitir.' });
            setProcessing(false); // Libera no erro
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Demitir Policial ({user?.corporacao || 'N/A'})</h3>
                    <button onClick={onClose} className="close-btn" disabled={processing}>&times;</button>
                </div>
                <div className="modal-body">
                    {statusMessage.text && (
                        <p className={`status-message status-${statusMessage.type}`}>
                            {statusMessage.text}
                        </p>
                    )}
                    {!loading && !statusMessage.text.includes('Token') && !statusMessage.text.includes('Sessão') && (
                        <div className="modal-form-group">
                            <label htmlFor="policialDemitirSelect">Selecione o Policial a ser Demitido</label>
                            {policiais.length > 0 ? (
                                <select
                                    id="policialDemitirSelect"
                                    value={selectedPolicialId}
                                    onChange={(e) => setSelectedPolicialId(e.target.value)}
                                    required
                                    disabled={processing} 
                                >
                                    <option value="" disabled>Selecione...</option>
                                    {policiais.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.nome_completo} ({p.patente || 'N/A'})
                                        </option>
                                    ))}
                                </select>
                             ) : (
                                 <p style={{color: '#94a3b8'}}>Nenhum outro policial encontrado na sua corporação para demitir.</p>
                             )}
                        </div>
                    )}
                    {loading && <p>Carregando policiais...</p>}
                </div>
                <div className="modal-footer">
                    <button type="button" onClick={onClose} className="btn-secondary" disabled={processing}>Cancelar</button>
                    <button
                        type="button"
                        onClick={handleConfirmarDemissao}
                        className="btn-danger" 
                        disabled={processing || loading || !selectedPolicialId || policiais.length === 0}
                    >
                        {processing ? 'Processando...' : `Confirmar Demissão de ${selectedPolicialNome || '...'}`}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- [RH MODAL] Gerar Token ---
// [ADICIONADO] Recebe a lista de corporações
const GenerateTokenModal = ({ isOpen, onClose, token, logout, user, corporacoes }) => {
    const [maxUses, setMaxUses] = useState(1);
    const [durationHours, setDurationHours] = useState(24);
    const [generatedToken, setGeneratedToken] = useState('');
    const [processing, setProcessing] = useState(false); 
    
    // Filtra corporações apenas com a sigla e inclui 'N/A' (embora o token de RH seja para a corporação dele)
    const corpSiglas = useMemo(() => {
        let options = [];
        
        // Se o RH tem corporação, ele só pode gerar tokens para ela
        if (user?.corporacao) {
             options = [{ sigla: user.corporacao, nome: user.corporacao }];
        } else if (corporacoes && corporacoes.length > 0) {
             // Se o RH não tiver corporação (RH Geral), usamos a lista de todas
             options = corporacoes.map(c => ({ sigla: c.sigla, nome: c.nome }));
        } else {
             // Fallback
             options = [{ sigla: 'PM', nome: 'PM' }];
        }
        
        return options;
    }, [corporacoes, user?.corporacao]);
    
    // Define a corporação inicial como a do usuário ou a primeira da lista
    const [tokenCorporacao, setTokenCorporacao] = useState(user?.corporacao || (corpSiglas.length > 0 ? corpSiglas[0].sigla : 'PM'));
    
    useEffect(() => { 
        if (isOpen) {
            setGeneratedToken('');
            setProcessing(false);
            setMaxUses(1); setDurationHours(24);
            // Redefine a corporação para o RH logado ao abrir
            setTokenCorporacao(user?.corporacao || (corpSiglas.length > 0 ? corpSiglas[0].sigla : 'PM'));
        }
    }, [isOpen, user?.corporacao, corpSiglas]);

    const handleGenerate = async () => {
        if (maxUses < 1) { toast.warning('Quantidade deve ser 1 ou mais.'); return; }
        if (durationHours <= 0) { toast.warning('Duração deve ser positiva.'); return; }
        if (!tokenCorporacao) { toast.error('Corporação para o token não definida.', { icon: <AnimatedXMark /> }); return; }
        
        setProcessing(true); setGeneratedToken('');
        if (!token) {
            toast.error('Erro: Token admin não encontrado.', { icon: <AnimatedXMark /> }); setProcessing(false); return;
        }
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
        const toastId = toast.loading("Gerando token...");

        try {
            const response = await fetch(`${API_URL}/api/admin/generate-token`, { 
                method: 'POST', headers: headers,
                body: JSON.stringify({ 
                    max_uses: parseInt(maxUses, 10), 
                    duration_hours: parseInt(durationHours, 10),
                    corporacao: tokenCorporacao // Envia a corporação
                })
            });
            if (response.status === 401 || response.status === 403) { if (logout) logout(); throw new Error('Sessão inválida.'); }
            const result = await response.json();
            if (!response.ok) { throw new Error(result.message || 'Erro ao gerar token.'); }

            setGeneratedToken(result.token); 
            toast.update(toastId, { render: result.message || `Token gerado!`, type: 'success', isLoading: false, autoClose: 4000, icon: <AnimatedCheckmark /> });
        } catch (error) {
            console.error("Erro ao gerar token:", error);
            toast.update(toastId, { render: `Erro: ${error.message}`, type: 'error', isLoading: false, autoClose: 5000, icon: <AnimatedXMark /> });
        } finally {
            setProcessing(false); 
        }
    };

    const copyToClipboard = () => {
        if (generatedToken) {
            navigator.clipboard.writeText(generatedToken)
                .then(() => {
                    toast.info("Token copiado para a área de transferência!");
                })
                .catch(err => {
                    console.error('Erro ao copiar:', err);
                    toast.error('Falha ao copiar. Selecione manualmente.', { icon: <AnimatedXMark /> });
                });
        }
    };

    if (!isOpen) return null;
    
    const styles = {
        inputRow: { display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'flex-end', },
        inputGroupFlex: { flex: 1, },
        tokenDisplayWrapper: { marginTop: '15px', marginBottom: '15px', },
        tokenDisplayBox: { display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: '#e9ecef', padding: '8px 12px', borderRadius: '6px', border: '1px solid #ced4da', },
        tokenInput: { flexGrow: 1, border: 'none', backgroundColor: 'transparent', fontSize: '0.9rem', fontFamily: 'monospace', color: '#495057', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', },
        copyButton: { flexShrink: 0, padding: '6px 12px', fontSize: '0.85rem', }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Gerar Token ({user?.corporacao || 'N/A'})</h3>
                    <button onClick={onClose} className="close-btn" disabled={processing}>&times;</button>
                </div>
                <div className="modal-body">
                    <p>Gere um token para registo na corporação.</p>
                    
                    {/* Seleção de Corporação */}
                    <div className="modal-form-group">
                        <label>Corporação Alvo</label>
                        <select 
                            value={tokenCorporacao} 
                            onChange={(e) => setTokenCorporacao(e.target.value)} 
                            disabled={processing || user?.corporacao} // Desabilita se o RH tem corporação definida
                        >
                            {corpSiglas.map(c => (
                                <option key={c.sigla} value={c.sigla}>
                                    {c.nome}
                                </option>
                            ))}
                        </select>
                        {user?.corporacao && (
                            <small style={{color: '#6c757d', display: 'block', marginTop: '5px'}}>Você está gerando para sua corporação ({user.corporacao}).</small>
                        )}
                    </div>
                    
                    <div style={styles.inputRow}>
                         <div className="modal-form-group" style={styles.inputGroupFlex}>
                            <label>Qtde. Usos</label>
                            <input type="number" min="1" value={maxUses} onChange={(e) => setMaxUses(parseInt(e.target.value, 10) || 1)} disabled={processing} />
                         </div>
                         <div className="modal-form-group" style={styles.inputGroupFlex}>
                             <label>Validade (horas)</label>
                             <input type="number" min="1" value={durationHours} onChange={(e) => setDurationHours(parseInt(e.target.value, 10) || 1)} disabled={processing} />
                         </div>
                    </div>
                    {generatedToken && (
                        <div style={styles.tokenDisplayWrapper}>
                            <label style={{display:'block',marginBottom:'8px',fontWeight:600}}>Token Gerado:</label>
                            <div style={styles.tokenDisplayBox}>
                                <input type="text" readOnly value={generatedToken} style={styles.tokenInput} onClick={(e) => e.target.select()} />
                                <button type="button" onClick={copyToClipboard} className="btn-secondary" style={styles.copyButton} disabled={processing}>
                                    <i className="far fa-copy" style={{ marginRight: '5px' }}></i> Copiar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button type="button" onClick={onClose} className="btn-secondary" disabled={processing}>Fechar</button>
                    <button type="button" onClick={handleGenerate} className="btn-primary" disabled={processing || !tokenCorporacao}>
                        {processing ? 'Gerando...' : 'Gerar Novo Token'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- [RH MODAL] Promover/Rebaixar ---
const PromoverRebaixarModal = ({ isOpen, onClose, token, logout, user, structureData }) => {
    const [view, setView] = useState('search');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({ acao: 'Promoção', novaPatente: '' });
    const [loading, setLoading] = useState(false);

    // [CORREÇÃO] Usar useMemo para filtrar listas baseadas no RH logado e nos dados passados
    const adminCorp = user?.corporacao;
    const patentesDisponiveis = useMemo(() => {
        return structureData.patentes
            .filter(p => p.corporacao_sigla === adminCorp)
            .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
            .map(p => p.nome);
    }, [structureData.patentes, adminCorp]);


    useEffect(() => { 
         if (!isOpen) {
            setTimeout(() => {
                setView('search'); setSearchTerm(''); setSearchResults([]);
                setSelectedUser(null);
                setFormData({ acao: 'Promoção', novaPatente: '' });
            }, 300);
        }
    }, [isOpen]);

    const handleSearch = async () => {
        if (searchTerm.length < 2) { toast.info("Digite pelo menos 2 caracteres."); setSearchResults([]); return; }
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/admin/search-policiais?query=${searchTerm}`, { headers: { 'Authorization': `Bearer ${token}` } }); 
            if (response.status === 401 || response.status === 403) { if(logout) logout(); throw new Error('Sessão inválida.'); }
            if (!response.ok) throw new Error('Falha ao buscar.');
            // Filtra os resultados para mostrar apenas policiais da mesma corporação do RH logado
            const data = await response.json();
            const filteredData = data.filter(p => p.corporacao === adminCorp);
            setSearchResults(filteredData);
            if (filteredData.length === 0) toast.info('Nenhum policial encontrado na sua corporação.');
        } catch (err) {
            toast.error(`Erro na busca: ${err.message}`, { icon: <AnimatedXMark /> });
        } finally { setLoading(false); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!formData.novaPatente) {
             toast.warning('Selecione a nova patente.'); return;
        }
        setLoading(true);
        const toastId = toast.loading("Aplicando alteração...");

        const bodyData = {
            policialId: selectedUser.id, acao: formData.acao, novaPatente: formData.novaPatente
        };

        try {
            const response = await fetch(`${API_URL}/api/admin/gerenciar-policial`, { 
                method: 'PUT', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData)
            });
             if (response.status === 401 || response.status === 403) { if(logout) logout(); throw new Error('Sessão inválida.'); }
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Falha ao salvar.');

            toast.update(toastId, { render: data.message || `${formData.acao} aplicada!`, type: 'success', isLoading: false, autoClose: 3000, icon: <AnimatedCheckmark /> });
            setLoading(false); 
            setTimeout(() => { 
                setView('search'); setSearchTerm(''); setSearchResults([]);
                onClose(true); // Fecha o modal e avisa que atualizou
            }, 1500);

        } catch (err) {
            toast.update(toastId, { render: `Erro: ${err.message}`, type: 'error', isLoading: false, autoClose: 5000, icon: <AnimatedXMark /> });
            setLoading(false); 
        }
    };

    const selectUserToAction = (user) => {
        setSelectedUser(user);
        setFormData({
             acao: 'Promoção',
             novaPatente: ''
        });
         setView('action');
     };

    const handleFormChange = (e) => {
         setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
     };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{width: '90%', maxWidth: '600px'}}>
                <div className="modal-header">
                     <h3>{view === 'search' ? 'Promover / Rebaixar' : `${formData.acao} de ${selectedUser?.nome_completo || '...'}`}</h3>
                    <button onClick={onClose} className="close-btn" disabled={loading}>&times;</button>
                </div>
                {view === 'search' && (
                    <>
                        <div className="modal-body">
                             <p>Pesquise pelo nome ou passaporte. *Apenas policiais da sua corporação ({adminCorp}) serão exibidos.</p>
                             <div className="modal-form-group">
                                 <label htmlFor="search-promo" style={{display: 'none'}}>Pesquisar</label>
                                 <div className="search-bar-container">
                                     <input id="search-promo" type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Nome ou passaporte..." />
                                     <button onClick={handleSearch} className="btn-primary" disabled={loading}> {loading ? '...' : 'Buscar'} </button>
                                 </div>
                             </div>
                             {(searchResults.length > 0) && (
                                 <ul className="search-results-list">
                                     {searchResults.map(p => (
                                         <li key={p.id} className="search-result-item">
                                             <div className="info"> <strong>{p.nome_completo}</strong> <small>{p.patente} ({p.passaporte})</small> </div>
                                             <button className="btn-secondary btn-edit" onClick={() => selectUserToAction(p)}> Gerenciar </button>
                                         </li>
                                     ))}
                                 </ul>
                             )}
                        </div>
                        <div className="modal-footer"> <button onClick={onClose} className="btn-secondary">Fechar</button> </div>
                    </>
                )}
                {view === 'action' && selectedUser && (
                    <form onSubmit={handleSave}>
                        <div className="modal-body">
                             <p><strong>Policial:</strong> {selectedUser.nome_completo}</p>
                             <p><strong>Patente Atual:</strong> {selectedUser.patente}</p>
                             <hr style={{border:'none', borderTop:'1px solid #e2e8f0', margin:'20px 0'}} />
                             <div className="modal-form-group"><label>Ação</label><select name="acao" value={formData.acao} onChange={handleFormChange}><option>Promoção</option><option>Rebaixamento</option></select></div>
                             <div className="modal-form-group"><label>Para a Patente *</label><select name="novaPatente" value={formData.novaPatente} onChange={handleFormChange} required><option value="" disabled>Selecione...</option>{patentesDisponiveis.map(p => (<option key={p} value={p}>{p}</option>))}</select></div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" onClick={() => {setView('search');}} className="btn-secondary" disabled={loading}> Voltar </button>
                            <button type="submit" className="btn-primary" disabled={loading}> {loading ? 'Salvando...' : `Confirmar ${formData.acao}`} </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

// --- [RH MODAL] Criar Concurso ---
const ConcursoModal = ({ isOpen, onClose, token, logout, user }) => {
    const [formData, setFormData] = useState({
        titulo: '', descricao: '', vagas: '', status: 'Aberto',
        data_abertura: '', data_encerramento: '', link_edital: '', valor: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    
    // Inclui a corporação do RH no formulário
    const corpoUsuario = user?.corporacao || '';

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    useEffect(() => {
        if(isOpen) {
            setFormData({
                titulo: '', descricao: '', vagas: '', status: 'Aberto',
                data_abertura: '', data_encerramento: '', link_edital: '', valor: ''
            });
            setError(''); setMessage(''); setLoading(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError(''); setMessage('');
        if (!formData.titulo || !formData.descricao || !formData.vagas || !formData.data_abertura || !formData.data_encerramento) {
             setError('Preencha todos os campos obrigatórios.');
             setLoading(false);
             return;
        }
        if (isNaN(parseInt(formData.vagas, 10)) || parseInt(formData.vagas, 10) < 0) {
            setError('Número de vagas inválido.');
            setLoading(false);
            return;
        }
        const toastId = toast.loading("Publicando concurso...");

        try {
            const response = await fetch(`${API_URL}/api/admin/concursos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                // Envia a corporação do RH junto com os dados
                body: JSON.stringify({...formData, corporacao: corpoUsuario})
            });
            const data = await response.json();
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) { if(logout) logout(); }
                throw new Error(data.message || 'Erro ao criar concurso.');
            }
            toast.update(toastId, { render: data.message, type: 'success', isLoading: false, autoClose: 3000, icon: <AnimatedCheckmark /> });
            setTimeout(() => onClose(true), 1500); // Fecha e indica refresh
        } catch (err) {
            toast.update(toastId, { render: `Erro: ${err.message}`, type: 'error', isLoading: false, autoClose: 4000, icon: <AnimatedXMark /> });
            setError(err.message); 
            setLoading(false); 
        }
    };

    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{width: '90%', maxWidth: '700px'}}>
                <div className="modal-header">
                    <h3>Publicar Novo Concurso ({corpoUsuario})</h3>
                    <button onClick={() => onClose(false)} className="close-btn" disabled={loading}>&times;</button>
                </div>
                {error && <p className="status-message status-error">{error}</p>}
                {message && <p className="status-message status-success">{message}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        <div className="modal-form-group"><label htmlFor="titulo">Título do Concurso*</label><input type="text" id="titulo" name="titulo" value={formData.titulo} onChange={handleChange} required disabled={loading} /></div>
                        <div className="modal-form-group"><label htmlFor="descricao">Descrição*</label><textarea id="descricao" name="descricao" value={formData.descricao} onChange={handleChange} rows="4" required disabled={loading}></textarea></div>
                        <div style={{ display:'flex', gap:'15px' }}>
                            <div className="modal-form-group" style={{ flex: 1 }}><label htmlFor="vagas">Número de Vagas*</label><input type="number" id="vagas" name="vagas" value={formData.vagas} onChange={handleChange} min="0" required disabled={loading} /></div>
                            <div className="modal-form-group" style={{ flex: 1 }}><label htmlFor="status">Status</label><select id="status" name="status" value={formData.status} onChange={handleChange} disabled={loading}><option value="Aberto">Aberto</option><option value="Encerrado">Encerrado</option></select></div>
                        </div>
                        <div style={{ display:'flex', gap:'15px' }}>
                            <div className="modal-form-group" style={{ flex: 1 }}><label htmlFor="data_abertura">Data de Abertura*</label><input type="date" id="data_abertura" name="data_abertura" value={formData.data_abertura} onChange={handleChange} required disabled={loading} /></div>
                            <div className="modal-form-group" style={{ flex: 1 }}><label htmlFor="data_encerramento">Data de Encerramento*</label><input type="date" id="data_encerramento" name="data_encerramento" value={formData.data_encerramento} onChange={handleChange} required disabled={loading} /></div>
                        </div>
                        <div className="modal-form-group"><label htmlFor="link_edital">Link do Edital</label><input type="url" id="link_edital" name="link_edital" value={formData.link_edital} onChange={handleChange} disabled={loading} placeholder="https://..."/></div>
                        <div className="modal-form-group"><label>Valor Inscrição (Opcional)</label><input type="text" name="valor" value={formData.valor} onChange={handleChange} disabled={loading} placeholder="R$ 50,00 ou Isento"/></div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={() => onClose(false)} className="btn-secondary" disabled={loading}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Publicando...' : 'Publicar Concurso'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- [RH MODAL] Editar Concurso ---
const EditConcursoModal = ({ isOpen, onClose, concursoId, token, logout, user }) => {
     const [formData, setFormData] = useState({
        titulo: '', descricao: '', vagas: '', status: 'Aberto',
        data_abertura: '', data_encerramento: '', link_edital: '', valor: '', corporacao: ''
    });
    const [loadingData, setLoadingData] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const corpoUsuario = user?.corporacao; // Corporação do RH logado

    const fetchConcursoData = useCallback(async () => {
        if (!concursoId) return;
        setLoadingData(true);
        if (!token) {
            toast.error('Erro: Token não encontrado.', { icon: <AnimatedXMark /> }); setLoadingData(false); return;
        }
        try {
            const response = await fetch(`${API_URL}/api/admin/concursos/${concursoId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.status === 401 || response.status === 403) { if(logout) logout(); throw new Error('Sessão inválida.'); }
            if (!response.ok) { const d=await response.json().catch(()=>{}); throw new Error(d?.message||`Erro ${response.status}`); }
            const data = await response.json();
            
            // Verifica permissão para edição (apenas se a corporação do concurso for a mesma do RH ou nula)
            if (data.corporacao && data.corporacao !== corpoUsuario) {
                 toast.error('Você não tem permissão para editar este concurso de outra corporação.', { icon: <AnimatedXMark /> });
                 onClose(false);
                 return;
            }
            
            const formatDate = (dateString) => dateString ? new Date(dateString).toISOString().split('T')[0] : '';
            setFormData({
                titulo: data.titulo || '', descricao: data.descricao || '', vagas: data.vagas || '', status: data.status || 'Aberto',
                data_abertura: formatDate(data.data_abertura), data_encerramento: formatDate(data.data_encerramento),
                link_edital: data.link_edital || '', valor: data.valor || '',
                corporacao: data.corporacao || '' // Guarda a corporação
            });
        } catch (error) {
            console.error("Erro fetch concurso:", error);
            toast.error(`Falha ao carregar: ${error.message}`, { icon: <AnimatedXMark /> });
        } finally { setLoadingData(false); }
    }, [concursoId, logout, token, corpoUsuario, onClose]);

    useEffect(() => {
        if (isOpen && concursoId) { fetchConcursoData(); }
        else { 
            setFormData({ titulo: '', descricao: '', vagas: '', status: 'Aberto', data_abertura: '', data_encerramento: '', link_edital: '', valor: '', corporacao: '' });
            setLoadingData(false); setIsSubmitting(false);
        }
    }, [isOpen, concursoId, fetchConcursoData]);

    const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.titulo || !formData.descricao || !formData.vagas || !formData.status || !formData.data_abertura || !formData.data_encerramento) {
             toast.warning('Preencha todos os campos obrigatórios.'); return;
        }
        setIsSubmitting(true);
        if (!token) { toast.error('Erro: Token não encontrado.', { icon: <AnimatedXMark /> }); setIsSubmitting(false); return; }

        const toastId = toast.loading("Salvando alterações...");
        try {
            const response = await fetch(`${API_URL}/api/admin/concursos/${concursoId}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                // Garante que a corporação seja enviada (embora não deva mudar)
                body: JSON.stringify({...formData, corporacao: formData.corporacao || corpoUsuario}) 
            });
            if (response.status === 401 || response.status === 403) { if(logout) logout(); throw new Error('Sessão inválida.'); }
            const result = await response.json();
            if (!response.ok) { throw new Error(result.message || `Erro ${response.status}`); }
            toast.update(toastId, { render: result.message || 'Concurso atualizado!', type: 'success', isLoading: false, autoClose: 3000, icon: <AnimatedCheckmark /> });
            setTimeout(() => { onClose(true); }, 1500); 
        } catch (error) {
            console.error("Erro ao atualizar concurso:", error);
            toast.update(toastId, { render: `Falha: ${error.message}`, type: 'error', isLoading: false, autoClose: 5000, icon: <AnimatedXMark /> });
            setIsSubmitting(false); 
        } 
    };

    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h3>Editar Concurso ({formData.corporacao || 'Geral'})</h3>
                    <button onClick={() => onClose(false)} className="close-btn" disabled={isSubmitting}>&times;</button>
                </div>
                {loadingData ? ( <div className="modal-body"><p>Carregando...</p></div> ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="modal-form-group"><label>Título *</label><input type="text" name="titulo" value={formData.titulo} onChange={handleChange} required disabled={isSubmitting} /></div>
                            <div className="modal-form-group"><label>Descrição *</label><textarea name="descricao" rows={4} value={formData.descricao} onChange={handleChange} required disabled={isSubmitting} /></div>
                            <div style={{ display:'flex', gap:'15px' }}>
                                <div className="modal-form-group" style={{ flex: 1 }}><label>Vagas *</label><input type="number" name="vagas" min="1" value={formData.vagas} onChange={handleChange} required disabled={isSubmitting}/></div>
                                <div className="modal-form-group" style={{ flex: 1 }}><label>Status *</label><select name="status" value={formData.status} onChange={handleChange} required disabled={isSubmitting}><option>Aberto</option><option>Encerrado</option></select></div>
                            </div>
                             <div style={{ display:'flex', gap:'15px' }}>
                                <div className="modal-form-group" style={{ flex: 1 }}><label>Data Abertura *</label><input type="date" name="data_abertura" value={formData.data_abertura} onChange={handleChange} required disabled={isSubmitting}/></div>
                                <div className="modal-form-group" style={{ flex: 1 }}><label>Data Encerramento *</label><input type="date" name="data_encerramento" value={formData.data_encerramento} onChange={handleChange} required disabled={isSubmitting}/></div>
                            </div>
                            <div className="modal-form-group"><label>Link Edital (URL)</label><input type="url" name="link_edital" value={formData.link_edital} onChange={handleChange} disabled={isSubmitting} placeholder="https://..."/></div>
                            <div className="modal-form-group"><label>Valor Inscrição</label><input type="text" name="valor" value={formData.valor} onChange={handleChange} disabled={isSubmitting} placeholder="R$ 50,00 ou Isento"/></div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" onClick={() => onClose(false)} className="btn-secondary" disabled={isSubmitting}>Cancelar</button>
                            <button type="submit" className="btn-primary" disabled={isSubmitting || loadingData}> {isSubmitting ? 'Salvando...' : 'Salvar'} </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

// --- [RH MODAL] Gerenciar Concursos ---
const GerenciarConcursosModal = ({ isOpen, onClose, onEditClick, onCreateClick, token, logout, user }) => {
    const [concursos, setConcursos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const corpoUsuario = user?.corporacao; // Corporação do RH logado

    const fetchConcursos = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const response = await fetch(`${API_URL}/api/concursos`); 
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Falha ao carregar concursos.');
            }
            const data = await response.json();
            setConcursos(data);
        } catch (err) {
            console.error("Erro ao buscar concursos no modal:", err);
            setError(`Erro ao carregar: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchConcursos();
        }
    }, [isOpen, fetchConcursos]);

    const handleDelete = async (concursoId, concursoTitulo) => {
        const concurso = concursos.find(c => c.id === concursoId);
        const canManage = !concurso.corporacao || concurso.corporacao === corpoUsuario;

        if (!canManage) {
             toast.error("Você não pode excluir um concurso de outra corporação ou geral.", { icon: <AnimatedXMark /> });
             return;
        }

        if (!window.confirm(`Tem certeza que deseja EXCLUIR o concurso "${concursoTitulo}"?`)) {
            return;
        }
        if (!token) { setError("Erro: Token não encontrado."); return; }
        setError(null);
        const toastId = toast.loading("Excluindo...");
        try {
            const response = await fetch(`${API_URL}/api/admin/concursos/${concursoId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 401 || response.status === 403) { if(logout) logout(); throw new Error('Acesso negado ou sessão inválida.'); }
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.message || 'Falha ao excluir.');
            }
            toast.update(toastId, { render: "Concurso excluído!", type: 'success', isLoading: false, autoClose: 2000, icon: <AnimatedCheckmark /> });
            fetchConcursos(); // Atualiza a lista
        } catch (err) {
            console.error("Erro ao excluir concurso:", err);
            toast.update(toastId, { render: `Erro: ${err.message}`, type: 'error', isLoading: false, autoClose: 4000, icon: <AnimatedXMark /> });
        }
    };

    const formatarData = (data) => {
        if (!data) return 'N/A';
        try {
             const date = new Date(data);
             date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
             return date.toLocaleDateString('pt-BR');
        } catch (e) { return 'Inválida'; }
    };
    
    // Filtra os concursos que o RH logado pode ver/gerenciar
    const concursosFiltrados = useMemo(() => {
        if (!corpoUsuario) return concursos; // RH Geral vê todos
        // RH de Corporação vê os dele e os gerais (corporacao: null)
        return concursos.filter(c => c.corporacao === corpoUsuario || c.corporacao === null);
    }, [concursos, corpoUsuario]);

    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '900px', minWidth: '700px' }}>
                <div className="modal-header">
                    <h3>Gerenciar Concursos</h3>
                    <button onClick={onCreateClick} className="btn-primary" style={{ marginLeft: 'auto', marginRight: '20px', padding: '8px 15px'}}>
                        <i className="fas fa-plus"></i> Criar Novo ({user?.corporacao || 'N/A'})
                    </button>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>
                <div className="modal-body">
                    {loading && <p style={{ textAlign: 'center' }}>Carregando concursos...</p>}
                    {error && <p className="status-message status-error" style={{ textAlign: 'center' }}>{error}</p>}

                    {!loading && !error && (
                        concursosFiltrados.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#6c757d' }}>Nenhum concurso encontrado para sua gestão.</p>
                        ) : (
                            <div className="table-responsive">
                                <table className="recrutas-table">
                                    <thead>
                                        <tr>
                                            <th>Título</th>
                                            <th>Corporação</th>
                                            <th>Status</th>
                                            <th>Vagas</th>
                                            <th>Encerramento</th>
                                            <th style={{width: '150px'}}>Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {concursosFiltrados.map(concurso => {
                                            const canManage = !concurso.corporacao || concurso.corporacao === corpoUsuario;
                                            return (
                                                <tr key={concurso.id}>
                                                    <td>{concurso.titulo}</td>
                                                    <td>{concurso.corporacao || 'Geral'}</td>
                                                    <td>
                                                        <span className={`status-tag status-${(concurso.status || '').toLowerCase().replace(' ', '-')}`} style={{color: 'white', padding: '3px 8px', fontSize: '0.75rem', borderRadius: '10px', backgroundColor: concurso.status === 'Aberto' ? '#28a745' : '#dc3545'}}>
                                                            {concurso.status}
                                                        </span>
                                                    </td>
                                                    <td>{concurso.vagas}</td>
                                                    <td>{formatarData(concurso.data_encerramento)}</td>
                                                    <td className="actions-cell">
                                                        <button
                                                            onClick={() => onEditClick(concurso.id)}
                                                            className="action-btn approve"
                                                            style={{backgroundColor: '#ffc107', color: '#333'}}
                                                            disabled={!canManage}
                                                            title={canManage ? "Editar Concurso" : "Você só pode editar concursos da sua corporação ou gerais"}
                                                        >
                                                            <i className="fas fa-edit"></i> Editar
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(concurso.id, concurso.titulo)}
                                                            className="action-btn reject"
                                                            disabled={!canManage}
                                                            title={canManage ? "Excluir Concurso" : "Você só pode excluir concursos da sua corporação ou gerais"}
                                                        >
                                                            <i className="fas fa-trash"></i> Excluir
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}
                </div>
                 <div className="modal-footer">
                    <button onClick={onClose} className="btn-secondary">Fechar</button>
                </div>
            </div>
        </div>
    );
};


// --- [INÍCIO] COMPONENTE PRINCIPAL (PAINEL RH) ---
const PainelRH = ({ user, token, logout, currentView, setView, navProps }) => {
    
    // --- Estado para a Estrutura (Patentes/Divisões/Corporações) ---
    // [NOVO] Adicionado estado para armazenar a estrutura
    const [structureData, setStructureData] = useState({ corporacoes: [], patentes: [], divisoes: [] });
    const [loadingStructure, setLoadingStructure] = useState(true);

    // --- Estado dos Modais de RH (Movido para cá) ---
    const [adminModals, setAdminModals] = useState({
        generateToken: false, recruitList: false, approval: false, gerenciarPolicial: false,
        promo: false, anuncio: false, demitir: false, gerenciarConcursos: false,
        createConcurso: false, editConcurso: false,
    });
    const [approvalRecruta, setApprovalRecruta] = useState(null);
    const [editConcursoId, setEditConcursoId] = useState(null);

    // Função unificada para abrir/fechar modais do admin
    const setAdminModal = (modalName, isOpen) => {
        setAdminModals(prev => ({ ...prev, [modalName]: isOpen }));
    };

    // --- Funções de Callback para Modais (RH) ---
    const handleOpenApprovalModal = (recruta) => {
        setApprovalRecruta(recruta); setAdminModal('recruitList', false); setAdminModal('approval', true);
    };

    const handleConfirmApprovalFinal = async (id, divisao, patente) => {
        if (!id || !divisao || !patente) { toast.warning("Dados incompletos."); return; }
        if (!token) { toast.error("Token não encontrado.", { icon: <AnimatedXMark /> }); return; }
        const toastId = toast.loading("Aprovando recruta...");
        try {
            const response = await fetch(`${API_URL}/api/admin/recrutas/${id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ novoStatus: 'Aprovado', divisao: divisao, patente: patente }),
            });
            if (response.status === 401 || response.status === 403) { if(logout) logout(); throw new Error('Sessão inválida.'); }
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || `Erro ${response.status} ao aprovar.`);
            toast.update(toastId, { render: 'Recruta aprovado!', type: 'success', isLoading: false, autoClose: 3000, icon: <AnimatedCheckmark /> });
            setAdminModal('approval', false); setApprovalRecruta(null);
            setAdminModal('recruitList', true);
        } catch (error) {
            console.error("[PainelRH] Erro ao aprovar:", error);
            toast.update(toastId, { render: `Erro: ${error.message}`, type: 'error', isLoading: false, autoClose: 5000, icon: <AnimatedXMark /> });
        }
    };
    
    const handleReprovar = async (id) => {
        if (!window.confirm("Reprovar este recruta?")) return;
        if (!token) { toast.error("Token não encontrado.", { icon: <AnimatedXMark /> }); return; }
        const toastId = toast.loading("Reprovando recruta...");
        try {
            const response = await fetch(`${API_URL}/api/admin/recrutas/${id}`, {
                method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ novoStatus: 'Reprovado' }),
            });
             if (response.status === 401 || response.status === 403) { if(logout) logout(); throw new Error('Sessão inválida.'); }
             const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Erro ao reprovar.');
            toast.update(toastId, { render: 'Recruta reprovado.', type: 'info', isLoading: false, autoClose: 3000 });
            setAdminModal('recruitList', false);
            setTimeout(() => setAdminModal('recruitList', true), 100); 
        } catch (error) {
             toast.update(toastId, { render: `Erro: ${error.message}`, type: 'error', isLoading: false, autoClose: 5000, icon: <AnimatedXMark /> });
        }
    };
    
    // Handlers para modais de concurso
    const openCreateConcursoModal = () => { setAdminModal('gerenciarConcursos', false); setAdminModal('createConcurso', true); };
    const closeCreateConcursoModal = (refreshNeeded) => { setAdminModal('createConcurso', false); if(refreshNeeded) setAdminModal('gerenciarConcursos', true); };
    const openEditConcursoModal = (concursoId) => { setEditConcursoId(concursoId); setAdminModal('gerenciarConcursos', false); setAdminModal('editConcurso', true); };
    const closeEditConcursoModal = (refreshNeeded) => { setAdminModal('editConcurso', false); setEditConcursoId(null); if(refreshNeeded) setAdminModal('gerenciarConcursos', true); };
    
    // --- Lógica de Busca de Estrutura (Centralizada para o RH) ---
    const fetchStructureData = useCallback(async () => {
        setLoadingStructure(true);
        if (!token) { setLoadingStructure(false); return; }
        try {
            // Reutiliza a API do Staff para buscar a estrutura
            const response = await fetch(`${API_URL}/api/staff/structure`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Falha ao carregar estrutura.');
            const data = await response.json();
            setStructureData(data);
        } catch (err) {
            console.error("Erro ao buscar estrutura:", err);
            toast.error('Erro ao carregar estrutura de RH.');
        } finally {
            setLoadingStructure(false);
        }
    }, [token, logout]); 

    useEffect(() => {
        // Apenas RH precisa carregar a estrutura para os modais
        if (user?.permissoes?.is_rh) {
            fetchStructureData();
        }
    }, [user, fetchStructureData]);
    // --- Fim da Lógica de Estrutura ---


    // --- Renderização da View Correta ---
    const renderView = () => {
      // Verifica se a estrutura está sendo carregada
      if (loadingStructure) {
          return <div className="page-container"><p style={{textAlign: 'center'}}>Carregando estrutura de departamentos...</p></div>;
      }
      
      switch (currentView) {
        case 'admin':
          return (
            <AdminView
              user={user}
              token={token}
              logout={logout}
              setView={setView}
              setAdminModal={setAdminModal}
            />
          );
        case 'logs':
          return (
            <LogsView
              user={user}
              token={token}
              logout={logout}
              navProps={navProps}
            />
          );
        default:
          // Se a view não for 'admin' nem 'logs', direciona para 'admin' por ser o painel RH
          setView('admin');
          return null;
      }
    };


    return (
        <>
            {/* O conteúdo da página (AdminView ou LogsView) */}
            {renderView()}

            {/* Renderiza TODOS os modais do Admin (RH) */}
            {user?.permissoes?.is_rh && !loadingStructure && (
                <>
                    <ApprovalModal
                        isOpen={adminModals.approval}
                        recruta={approvalRecruta}
                        onClose={() => setAdminModal('approval', false)}
                        onConfirm={handleConfirmApprovalFinal}
                        structureData={structureData} // <--- Passa o dado da estrutura
                    />
                    <GerenciarPolicialModal
                        isOpen={adminModals.gerenciarPolicial} 
                        onClose={() => setAdminModal('gerenciarPolicial', false)} 
                        token={token} logout={logout} user={user} 
                        structureData={structureData} // <--- Passa o dado da estrutura
                    />
                    <RecruitListModal
                        isOpen={adminModals.recruitList}
                        onClose={() => setAdminModal('recruitList', false)}
                        onApproveClick={handleOpenApprovalModal}
                        onRejectClick={handleReprovar}
                        token={token} logout={logout}
                    />
                    <AnuncioModal 
                        isOpen={adminModals.anuncio} 
                        onClose={(refresh) => setAdminModal('anuncio', false)} 
                        token={token} logout={logout} user={user} 
                        corporacoes={structureData.corporacoes} // <--- Passa corporações
                    />
                    <DemitirModal 
                        isOpen={adminModals.demitir} 
                        onClose={(refresh) => setAdminModal('demitir', false)} 
                        token={token} logout={logout} user={user} 
                    />
                    <GenerateTokenModal 
                        isOpen={adminModals.generateToken} 
                        onClose={() => setAdminModal('generateToken', false)} 
                        token={token} logout={logout} user={user} 
                        corporacoes={structureData.corporacoes} // <--- Passa corporações
                    />
                    <PromoverRebaixarModal 
                        isOpen={adminModals.promo} 
                        onClose={(refresh) => setAdminModal('promo', false)} 
                        token={token} logout={logout} user={user} 
                        structureData={structureData} // <--- Passa o dado da estrutura
                    />
                    <GerenciarConcursosModal 
                        isOpen={adminModals.gerenciarConcursos} 
                        onClose={() => setAdminModal('gerenciarConcursos', false)} 
                        onEditClick={openEditConcursoModal} 
                        onCreateClick={openCreateConcursoModal} 
                        token={token} logout={logout} user={user} 
                    />
                    <ConcursoModal 
                        isOpen={adminModals.createConcurso} 
                        onClose={closeCreateConcursoModal} 
                        token={token} logout={logout} 
                        user={user} // Adicionado para passar a corporação
                    />
                    <EditConcursoModal 
                        isOpen={adminModals.editConcurso} 
                        onClose={closeEditConcursoModal} 
                        concursoId={editConcursoId} 
                        token={token} logout={logout} 
                        user={user} // Adicionado para checagem de permissão
                    />
                </>
            )}
        </>
    );
};

export default PainelRH;