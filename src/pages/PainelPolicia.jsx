import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from 'react-toastify';
import LocationPickerMap from '../components/LocationPickerMap.jsx'; // Mantido separado
import LogDetails from '../components/LogDetails.jsx'; // Mantido separado

// Importa os CSS necessários (verifique se os caminhos estão corretos)
import '../components/PoliceDashboard.css';
import '../components/AdminPage.css';
import '../components/ListaPoliciaisPage.css';
import '../components/PoliceProfilePage.css';
import '../components/Timeline.css';
import '../components/ConsultaBoletins.css';
import '../components/BoletimDetailPage.css';
import '../components/RelatoriosPage.css';
import '../components/Modal.css';
import '../components/GerenciarPolicialModal.css';
import '../components/Design/LogsPage.css'; // Para o LogsView

// --- [INÍCIO] COMPONENTES INTERNOS ---
// Todos os componentes foram movidos para este arquivo

// --- [CORREÇÃO] Define a URL base da sua API (do server.js) ---
const API_URL = 'http://localhost:3000';

// --- ÍCONES ANIMADOS ---
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

// --- Componente: Cartão de Estatística (Resumo Relatórios) ---
const StatCardReports = ({ title, value, icon, color }) => (
    <div className="stat-card" style={{ '--icon-color': color }}>
        <div className="stat-card-icon"><i className={`fas ${icon}`}></i></div>
        <div className="stat-card-info">
            <span className="stat-card-value">{value}</span>
            <span className="stat-card-title">{title}</span>
        </div>
    </div>
);

// --- Componente: Cartão de Acesso (Relatórios Estratégicos) ---
const StrategicReportCard = ({ title, description, icon, to, disabled = false }) => {
    
    const handleClickDisabled = (e) => {
        e.preventDefault(); 
        toast.info('Funcionalidade em desenvolvimento...');
    };

    const cardClassName = `strategic-card ${disabled ? 'disabled' : ''}`;
    const rightIcon = disabled ? 'fa-lock' : 'fa-chevron-right';

    if (disabled) {
        return (
            <div className={cardClassName} onClick={handleClickDisabled}>
                <div className="strategic-card-icon"><i className={`fas ${icon}`}></i></div>
                <div className="strategic-card-content">
                    <h3 className="strategic-card-title">{title}</h3>
                    <p className="strategic-card-description">{description}</p>
                </div>
                <div className="strategic-card-arrow"><i className={`fas ${rightIcon}`}></i></div>
            </div>
        );
    }

    // [IMPORTANTE] Usa <Link> normal do react-router-dom para sair deste componente
    return (
        <Link to={to} className={cardClassName}>
            <div className="strategic-card-icon"><i className={`fas ${icon}`}></i></div>
            <div className="strategic-card-content">
                <h3 className="strategic-card-title">{title}</h3>
                <p className="strategic-card-description">{description}</p>
            </div>
            <div className="strategic-card-arrow"><i className={`fas ${rightIcon}`}></i></div>
        </Link>
    );
};


// --- Componente: ActionCard (Painel Admin) ---
const ActionCard = ({ title, description, icon, permission, onClick }) => {
    const { user } = useAuth();
    // [UNIFICAÇÃO] Permissão agora checa o 'user' do hook, não de prop
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


// --- Componente: StatCard (Dashboard) ---
const StatCardDashboard = ({ title, value, icon, color, loading }) => (
    <div
        className={`stat-card ${loading ? 'loading' : ''}`}
        style={{ '--card-color': color, '--card-shadow': `${color}40` }}
    >
        <div className="stat-info">
            <span className="stat-title">{title}</span>
            <span className="stat-value">{loading ? '...' : value}</span>
        </div>
        <div className="stat-icon-wrapper">
            <i className={`fas ${icon}`}></i>
        </div>
    </div>
);

// --- Componente: QuickActionButton (Dashboard) ---
const QuickActionButton = ({ icon, text, onClick }) => (
    // [UNIFICAÇÃO] Mudou de <Link> para <button>
    <button onClick={onClick} className="quick-action-button">
        <i className={`fas ${icon}`}></i>
        <span>{text}</span>
    </button>
);

// --- Componente: AnuncioItem (Dashboard) ---
const AnuncioItem = ({ anuncio }) => {
    let tagColor = '#64748b'; // Cor padrão 'Geral' ou sem tag
    let tagName = 'Geral'; // Começa com 'Geral' como padrão
    if (anuncio.corporacao && anuncio.corporacao !== 'GERAL') {
        tagName = anuncio.corporacao;
        if (anuncio.corporacao === 'PM') tagColor = '#dc2626'; 
        if (anuncio.corporacao === 'PC') tagColor = '#2563eb'; 
    }
    const formatarData = (data) => data ? new Date(data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Data inválida';

    return (
        <div className="anuncio-item">
            <div className="anuncio-header">
                <span className="anuncio-tag" style={{ backgroundColor: tagColor }}>
                    {tagName}
                </span>
            </div>
            {anuncio.titulo && <h4 className="anuncio-titulo">{anuncio.titulo}</h4>}
            <p className="anuncio-conteudo">{anuncio.conteudo}</p>
            <div className="anuncio-footer">
                <span>Por <strong>{anuncio.autor_nome || 'Admin'}</strong></span>
                <small>{formatarData(anuncio.data_publicacao)}</small>
            </div>
        </div>
    );
};

// --- Componente: Timeline (Perfil) ---
const getEventStyle = (eventType) => {
    switch (eventType) {
        case 'Promoção': return { icon: 'fa-arrow-up', color: 'green' };
        case 'Rebaixamento': return { icon: 'fa-arrow-down', color: 'red' }; // Corrigido
        case 'Demissão': return { icon: 'fa-user-slash', color: 'red' }; // Corrigido
        case 'Aprovação': case 'Elogio': return { icon: 'fa-check', color: 'blue' };
        case 'Criação de Conta': return { icon: 'fa-user-plus', color: 'grey' };
        case 'Advertência': return { icon: 'fa-exclamation-triangle', color: 'orange' };
        case 'Atualização de Dados': return { icon: 'fa-pencil-alt', color: 'blue' }; // Adicionado
        default: return { icon: 'fa-info-circle', color: 'grey' };
    }
};

const Timeline = ({ events }) => {
    if (!events || events.length === 0) {
        return <p className="empty-state">Nenhum evento registrado no histórico deste policial.</p>;
    }
    const formatarData = (data) => new Date(data).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return (
        <div className="timeline-container">
            {events.map((event, index) => {
                const { icon, color } = getEventStyle(event.tipo_evento);
                return (
                    <div key={index} className="timeline-item">
                        <div className={`timeline-icon ${color}`}><i className={`fas ${icon}`}></i></div>
                        <div className="timeline-content">
                            <h4>{event.tipo_evento}</h4>
                            <span className="timeline-date">{formatarData(event.data_evento)}</span>
                            <p>{event.descricao}</p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

// --- [INÍCIO] DAS "PÁGINAS" COMO COMPONENTES INTERNOS ---

// --- 1. Dashboard View (PoliceDashboard.jsx) ---
const DashboardView = ({ user, token, logout, setView, setAdminModal }) => {
    const [stats, setStats] = useState({ totalBoletins: 0, boletinsAbertos: 0, policiaisAtivos: 0 });
    const [anunciosVisiveis, setAnunciosVisiveis] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!token) {
             toast.error('Erro de autenticação. Faça login novamente.', { icon: <AnimatedXMark /> });
             setLoadingData(false);
             return;
        }

        const fetchData = async () => {
            setLoadingData(true);
            const headers = { 'Authorization': `Bearer ${token}` };
            try {
                const [statsResponse, anunciosResponse] = await Promise.all([
                    fetch(`${API_URL}/api/policia/dashboard-stats`, { headers }),
                    fetch(`${API_URL}/api/anuncios`, { headers })
                ]);

                if (statsResponse.status === 401 || statsResponse.status === 403 || anunciosResponse.status === 401 || anunciosResponse.status === 403) {
                    if (logout) logout();
                    toast.error('Sua sessão expirou ou é inválida. Faça login novamente.', { icon: <AnimatedXMark /> });
                    throw new Error("Sessão inválida");
                }

                if (!statsResponse.ok) throw new Error(`Estatísticas: ${statsResponse.statusText}`);
                if (!anunciosResponse.ok) throw new Error(`Anúncios: ${anunciosResponse.statusText}`);

                setStats(await statsResponse.json());
                const todosAnuncios = await anunciosResponse.json();
                
                // [UNIFICAÇÃO] Filtragem movida para cá
                const corporacaoUsuario = user?.corporacao;
                const anunciosFiltrados = todosAnuncios.filter(a => !a.corporacao || a.corporacao === 'GERAL' || a.corporacao === corporacaoUsuario);
                const anunciosOrdenadosLimitados = anunciosFiltrados.sort((a, b) => new Date(b.data_publicacao) - new Date(a.data_publicacao)).slice(0, 4);
                setAnunciosVisiveis(anunciosOrdenadosLimitados);

            } catch (error) {
                if (error.message !== "Sessão inválida") {
                    toast.error(`Falha ao carregar dados: ${error.message}`, { icon: <AnimatedXMark /> });
                }
            } finally {
                setLoadingData(false);
            }
        };

        fetchData();
    }, [token, user, logout]);

    const statCardsData = useMemo(() => [
        { title: 'Total de Boletins', value: stats.totalBoletins, icon: 'fa-file-alt', color: '#3b82f6' },
        { title: 'Boletins Abertos', value: stats.boletinsAbertos, icon: 'fa-exclamation-triangle', color: '#f59e0b' },
        { title: 'Concluídos', value: stats.totalBoletins - stats.boletinsAbertos, icon: 'fa-check-circle', color: '#10b981' },
        { title: 'Policiais Ativos', value: stats.policiaisAtivos, icon: 'fa-users', color: '#0ea5e9' }
    ], [stats]);

    return (
        <div className="page-container dashboard-container">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Visão geral das operações e estatísticas, {user?.nome_completo || 'Policial'}.</p>
            <div className="stats-grid">
                {statCardsData.map(stat => <StatCardDashboard key={stat.title} {...stat} loading={loadingData} />)}
            </div>
            <div className="dashboard-columns">
                <div className="column-left">
                    <div className="dashboard-widget">
                        <h3 className="widget-title">Ações Rápidas</h3>
                        <div className="quick-actions-grid">
                            {/* [UNIFICAÇÃO] Botões agora usam setView */}
                            <QuickActionButton onClick={() => setView('boletins')} icon="fa-file-signature" text="Consultar B.O.s" />
                            <QuickActionButton onClick={() => setView('policiais')} icon="fa-address-book" text="Ver Policiais" />
                            <QuickActionButton onClick={() => setView('relatorios')} icon="fa-pen-to-square" text="Relatórios" />
                            {user?.permissoes?.is_rh && (<QuickActionButton onClick={() => setView('admin')} icon="fa-user-shield" text="Administração" />)}
                        </div>
                    </div>
                </div>
                <div className="column-right">
                    <div className="dashboard-widget anuncios-widget">
                        <h3 className="widget-title">Anúncios Recentes</h3>
                        {loadingData ? (<p className="loading-text">Carregando anúncios...</p>) : 
                         anunciosVisiveis.length > 0 ? (
                            <div className="anuncios-list">
                                {anunciosVisiveis.map(anuncio => (<AnuncioItem key={anuncio.id} anuncio={anuncio} />))}
                            </div>
                        ) : (<p className="empty-state">Nenhum anúncio recente para sua corporação.</p>)}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- 2. Consulta Boletins View (ConsultaBoletinsPage.jsx) ---
const ConsultaBoletinsView = ({ user, token, logout, setView, setNavProps }) => {
    const [boletins, setBoletins] = useState([]);
    const [filtro, setFiltro] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBoletins = async () => {
            setLoading(true); setError(null);
            if (!token) {
                setError('Erro de autenticação: Token não encontrado.'); setLoading(false); return;
            }
            const headers = { 'Authorization': `Bearer ${token}` };

             try {
                 const response = await fetch(`${API_URL}/api/policia/boletins`, { headers }); 
                 if (response.status === 401 || response.status === 403) {
                     if (logout) logout();
                     throw new Error('Sua sessão expirou ou é inválida. Faça login novamente.');
                 }
                 if (!response.ok) {
                    const errData = await response.json().catch(() => ({message: `Erro ${response.status}`}));
                    throw new Error(errData.message || 'Falha ao carregar os boletins.');
                 }
                 const data = await response.json();
                 setBoletins(data);
             } catch (err) {
                 console.error("Erro ao buscar boletins:", err);
                 setError(err.message);
             } finally {
                 setLoading(false);
             }
         };

         fetchBoletins();
    }, [token, logout]);

    const formatarData = (data) => data ? new Date(data).toLocaleString('pt-BR') : 'Inválida';

    const boletinsFiltrados = boletins.filter(bo =>
        (bo.protocolo?.toLowerCase() || '').includes(filtro.toLowerCase()) ||
        (bo.tipo?.toLowerCase() || '').includes(filtro.toLowerCase()) ||
        (bo.denunciante_nome?.toLowerCase() || '').includes(filtro.toLowerCase()) ||
        (bo.denunciante_passaporte?.toString() || '').includes(filtro) ||
        (bo.status?.toLowerCase() || '').includes(filtro.toLowerCase())
    );

    // [UNIFICAÇÃO] Ação de clique
    const handleViewClick = (boId) => {
        setNavProps({ boletimId: boId, startInEditMode: false });
        setView('boletimDetail');
    };
    
    const handleEditClick = (boId, startInEdit) => {
        setNavProps({ boletimId: boId, startInEditMode: startInEdit });
        setView('boletimDetail');
    };

    return (
        <div className="page-container">
            <h1 className="page-title">Consulta de Boletins de Ocorrência</h1>
            <p className="page-subtitle">Visualize e filtre todos os boletins registrados no sistema.</p>

            <div className="search-container">
                <i className="fas fa-search search-icon"></i>
                <input
                    type="text"
                    placeholder="Buscar por protocolo, tipo, status, denunciante..."
                    className="search-input"
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                />
            </div>

            {loading && <p style={{textAlign: 'center'}}>Carregando boletins...</p>}
            {error && <p className="error-message" style={{textAlign: 'center'}}>{error}</p>}

            {!loading && !error && (
                <div className="boletins-table-widget">
                    <div className="table-responsive">
                        <table className="boletins-table">
                            <thead>
                                <tr>
                                    <th>Protocolo</th><th>Tipo</th><th>Denunciante</th>
                                    <th>Passaporte</th><th>Data</th><th>Status</th><th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {boletinsFiltrados.length > 0 ? (
                                    boletinsFiltrados.map(bo => (
                                        <tr key={bo.id}>
                                            <td>{bo.protocolo}</td>
                                            <td>{bo.tipo}</td>
                                            <td>{bo.denunciante_nome || 'N/A'}</td>
                                            <td>{bo.denunciante_passaporte || 'N/A'}</td>
                                            <td>{formatarData(bo.data_registro)}</td>
                                            <td><span className={`status-badge status-${(bo.status || 'desconhecido').toLowerCase().replace(/ /g, '-')}`}>{bo.status || 'N/A'}</span></td>

                                            <td className="actions-cell">
                                                {/* [UNIFICAÇÃO] Mudou de Link para button onClick */}
                                                <button onClick={() => handleViewClick(bo.id)} className="btn-action view" title="Visualizar Detalhes">
                                                    <i className="fas fa-eye"></i>
                                                </button>

                                                {user?.corporacao === 'PC' && (
                                                    <button
                                                        onClick={() => handleEditClick(bo.id, !!bo.policial_responsavel_id)}
                                                        className="btn-action edit"
                                                        title={bo.policial_responsavel_id ? "Editar Boletim" : "Assumir Caso"}
                                                    >
                                                        <i className={`fas ${bo.policial_responsavel_id ? 'fa-pencil-alt' : 'fa-gavel'}`}></i>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="7" style={{textAlign: 'center', color: '#64748b'}}>Nenhum boletim encontrado com os filtros aplicados.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- 3. Detalhe Boletim View (BoletimDetailPage.jsx) ---
const BoletimDetailView = ({ user, token, logout, setView, navProps }) => {
    const { boletimId, startInEditMode } = navProps; // Pega o ID das props
    const [boletim, setBoletim] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [novoSuspeito, setNovoSuspeito] = useState({ nome: '', passaporte: '', status: 'Investigado' });
    const [arquivosParaUpload, setArquivosParaUpload] = useState([]);
    const [error, setError] = useState(null);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

    const isCivil = user?.corporacao === 'PC';
    const isResponsavelPeloCaso = boletim?.policial_responsavel_id === user?.id;
    const podeAssumir = isCivil && boletim && !boletim.policial_responsavel_id;
    const podeEditarCampos = isCivil && isResponsavelPeloCaso && isEditing;

    // Lista de Tipos de Ocorrência
    const TIPOS_OCORRENCIA = [
        "Agressão", "Ameaça", "Desacato", "Desaparecimento", "Estelionato",
        "Extorsão", "Furto", "Homicídio", "Latrocínio", "Perturbação",
        "Posse/Porte Ilegal de Arma", "Roubo", "Sequestro", "Tráfico de Drogas",
        "Vandalismo", "Veículo Recuperado", "Violência Doméstica", "Outros"
    ];

    const fetchData = useCallback(async () => {
        setLoading(true); setError(null);
        if (!token) { setError('Erro: Token não encontrado.'); setLoading(false); return; }
        const headers = { 'Authorization': `Bearer ${token}` };
        try {
            const response = await fetch(`${API_URL}/api/policia/boletins/${boletimId}`, { headers });
            if (response.status === 401 || response.status === 403) { if (logout) logout(); throw new Error('Sessão expirou.'); }
            if (!response.ok) { let errorMsg = `Erro ${response.status}.`; try { const d = await response.json(); errorMsg = d.message || errorMsg; } catch (e) {} throw new Error(errorMsg); }
            const data = await response.json();
            setBoletim(data);
            // [UNIFICAÇÃO] Usa o 'startInEditMode' vindo das props
            setIsEditing(startInEditMode === true && data.policial_responsavel_id === user?.id);
        } catch (err) { setError(`Falha ao carregar: ${err.message}`); setBoletim(null); }
        finally { setLoading(false); }
    }, [boletimId, user?.id, logout, startInEditMode]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        if(!podeEditarCampos) return;
        const headers = { 'Authorization': `Bearer ${token}` };
        const formDataToSend = new FormData();
        formDataToSend.append('status', boletim.status);
        formDataToSend.append('unidade_policial', boletim.unidade_policial || '');
        formDataToSend.append('envolvidos_identificados', JSON.stringify(boletim.envolvidos_identificados || []));
        formDataToSend.append('relato_policial', boletim.relato_policial || '');
        formDataToSend.append('encaminhamento', boletim.encaminhamento || '');
        formDataToSend.append('observacoes_internas', boletim.observacoes_internas || '');
        formDataToSend.append('imagens_existentes', JSON.stringify(boletim.anexos_imagens || []));
        formDataToSend.append('tipo', boletim.tipo || 'Outros'); 
        formDataToSend.append('evidencias_coletadas', boletim.evidencias_coletadas || '');
        formDataToSend.append('mapa_x', boletim.mapa_x ?? null);
        formDataToSend.append('mapa_y', boletim.mapa_y ?? null);
        for (let i = 0; i < arquivosParaUpload.length; i++) { 
             formDataToSend.append('anexos', arquivosParaUpload[i]); 
        }

        const toastId = toast.loading("Salvando alterações...");
        try {
            const response = await fetch(`${API_URL}/api/policia/boletins/${boletimId}`, {
                method: 'PUT', headers: headers, body: formDataToSend,
            });
            if (response.status === 401 || response.status === 403) {
                if (logout) logout();
                toast.update(toastId, { render: "Sessão inválida. Faça login.", type: "error", isLoading: false, autoClose: 5000, icon: <AnimatedXMark /> });
                return;
            }
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Falha ao atualizar');
            toast.update(toastId, { render: result.message || "Boletim atualizado!", type: "success", isLoading: false, autoClose: 3000, icon: <AnimatedCheckmark /> });
            setIsEditing(false);
            setArquivosParaUpload([]);
            fetchData();
        } catch (error) {
            console.error("Erro ao atualizar boletim:", error);
            toast.update(toastId, { render: `Falha ao atualizar: ${error.message}`, type: "error", isLoading: false, autoClose: 5000, icon: <AnimatedXMark /> });
        }
    };

    const handleFileChange = (e) => { setArquivosParaUpload(Array.from(e.target.files).slice(0, 5)); };
    const removerImagemExistente = (nomeImagem) => { if (!podeEditarCampos) return; const novasImagens = boletim.anexos_imagens.filter(img => img !== nomeImagem); setBoletim({ ...boletim, anexos_imagens: novasImagens }); toast.info("Imagem marcada para remoção. Salve as alterações para confirmar."); };
    const handleInputChange = (e) => { if(!podeEditarCampos && e.target.name !== 'status') return; const { name, value } = e.target; setBoletim({ ...boletim, [name]: value }); };
    const adicionarSuspeito = () => { if(!podeEditarCampos) return; if (!novoSuspeito.nome || !novoSuspeito.passaporte) { toast.warning('Nome e passaporte são obrigatórios.'); return; } const novaLista = [...(boletim.envolvidos_identificados || []), novoSuspeito]; setBoletim({ ...boletim, envolvidos_identificados: novaLista }); setNovoSuspeito({ nome: '', passaporte: '', status: 'Investigado' }); };
    const removerSuspeito = (index) => { if(!podeEditarCampos) return; const novaLista = boletim.envolvidos_identificados.filter((_, i) => i !== index); setBoletim({ ...boletim, envolvidos_identificados: novaLista }); };

    const handleAssumirCaso = async () => {
        if (!podeAssumir) return;
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
        const toastId = toast.loading("Assumindo caso...");
        try {
            const response = await fetch(`${API_URL}/api/policia/boletins/${boletimId}/assumir`, {
                method: 'PUT', headers: headers,
            });
            if (response.status === 401 || response.status === 403) {
                if (logout) logout();
                toast.update(toastId, { render: "Sessão inválida.", type: "error", isLoading: false, autoClose: 5000, icon: <AnimatedXMark /> });
                return;
            }
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Erro desconhecido.");
            toast.update(toastId, { render: result.message || "Caso assumido!", type: "success", isLoading: false, autoClose: 3000, icon: <AnimatedCheckmark /> });
            await fetchData();
            setIsEditing(true);
        } catch (error) {
            console.error("Erro ao assumir caso:", error);
            toast.update(toastId, { render: `Falha ao assumir: ${error.message}`, type: "error", isLoading: false, autoClose: 5000, icon: <AnimatedXMark /> });
        }
    };

    const handleMapClick = (newCoords) => {
        setBoletim(prevBoletim => ({
            ...prevBoletim,
            mapa_y: newCoords.y,
            mapa_x: newCoords.x
        }));
        setIsLocationModalOpen(false);
    };
    
    if (error && !boletim) { return <div className="page-container"><h1>Erro</h1><p className="error-message">{error}</p><button onClick={() => setView('boletins')}>Voltar</button></div>; }
    if (loading) { return <div className="page-container"><h1>Carregando...</h1></div>; }
    if (!boletim) { return <div className="page-container"><h1>Boletim não encontrado.</h1><button onClick={() => setView('boletins')}>Voltar</button></div>; }

    const BotaoAcaoPrincipal = () => {
        if (podeAssumir) {
            return ( <button type="button" onClick={handleAssumirCaso} className="btn-assumir"><i className="fas fa-gavel"></i> Assumir Caso</button> );
        }
        if (isResponsavelPeloCaso && isCivil) {
            if (isEditing) {
                return (
                    <div className="form-actions">
                        <button type="submit" className="btn-save">Salvar Alterações</button>
                        <button type="button" onClick={() => { setIsEditing(false); fetchData(); }} className="btn-cancel">Cancelar Edição</button>
                    </div>
                );
            } else {
                return ( <button type="button" onClick={() => setIsEditing(true)} className="btn-edit"><i className="fas fa-pencil-alt"></i> Editar Caso</button> );
            }
        }
        return null;
    };
    
    const currentCoords = (boletim.mapa_x != null && boletim.mapa_y != null) ? { x: parseFloat(boletim.mapa_x), y: parseFloat(boletim.mapa_y) } : null;

    return (
        <div className="page-container">
            {/* [UNIFICAÇÃO] Mudou de navigate(-1) para setView */}
            <button type="button" onClick={() => setView('boletins')} className="back-button">&larr; Voltar para Lista</button>
            <h1 className="page-title">Boletim: {boletim.protocolo || 'N/A'}</h1>
            {error && <p className="error-message" style={{marginBottom: '15px'}}>{error}</p>}

            <form onSubmit={podeEditarCampos ? handleUpdate : (e) => e.preventDefault()} className="boletim-details-grid">
                {/* Card Denunciante */}
                <div className="details-card">
                    <div className="card-header"><i className="fas fa-user-tie"></i><h3>Info Denunciante</h3></div>
                    <div className="info-grid">
                        <strong>Nome:</strong> <span>{boletim.denunciante_nome || 'N/A'}</span>
                        <strong>Passaporte:</strong> <span>{boletim.denunciante_passaporte || 'N/A'}</span>
                        <strong>Telefone:</strong> <span>{boletim.denunciante_telefone || 'Não informado'}</span>
                        <strong>Gmail:</strong> <span>{boletim.denunciante_gmail || 'Não informado'}</span>
                    </div>
                    <hr/>
                    <strong>Relato:</strong>
                    <div className="descricao-box">{boletim.descricao || 'Sem descrição.'}</div>
                </div>

                {/* Card Gerenciamento Policial */}
                <div className="details-card">
                    <div className="card-header"><i className="fas fa-shield-alt"></i><h3>Gerenciamento Policial</h3></div>
                    {boletim.policial_responsavel_id ? (
                        <div className="info-grid">
                            <strong>Responsável:</strong> <span>{boletim.policial_responsavel_nome || 'N/A'} ({boletim.policial_responsavel_passaporte || 'N/A'})</span>
                            <strong>Data Assumida:</strong> <span>{boletim.data_assumido ? new Date(boletim.data_assumido).toLocaleString('pt-BR') : 'N/A'}</span>
                        </div>
                    ) : ( <p style={{color: '#999', textAlign: 'center'}}>Aguardando Policial Civil assumir.</p> )}

                    <div className="form-group">
                        <label>Status</label>
                        <select name="status" value={boletim.status || ''} onChange={handleInputChange} disabled={!podeEditarCampos}>
                            <option value="Aguardando Análise">Aguardando Análise</option>
                            <option value="Em Investigação">Em Investigação</option>
                            <option value="Resolvido">Resolvido</option>
                            <option value="Arquivado">Arquivado</option>
                            <option value="Falso">Falso</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Tipo de Ocorrência</label>
                        <select name="tipo" value={boletim.tipo || 'Outros'} onChange={handleInputChange} disabled={!podeEditarCampos}>
                            {TIPOS_OCORRENCIA.map(tipo => (
                                <option key={tipo} value={tipo}>{tipo}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Unidade Policial</label>
                        <input type="text" name="unidade_policial" value={boletim.unidade_policial || ''} onChange={handleInputChange} disabled={!podeEditarCampos} placeholder="Ex: 80ª DP"/>
                    </div>
                    <div className="form-group">
                        <label>Encaminhamento</label>
                        <input type="text" name="encaminhamento" value={boletim.encaminhamento || ''} onChange={handleInputChange} disabled={!podeEditarCampos} placeholder="Ex: Arquivado, Ministério Público"/>
                    </div>
                    <BotaoAcaoPrincipal />
                </div>

                {/* Card Localização */}
                <div className="details-card full-width">
                    <div className="card-header"><i className="fas fa-map-marker-alt"></i><h3>Localização da Ocorrência</h3></div>
                    <div style={{height: '250px', width: '100%', borderRadius: '8px', overflow: 'hidden'}}>
                        <LocationPickerMap 
                            initialCoords={currentCoords} 
                            readOnly={true} // O mapa pequeno é só visualização
                        />
                    </div>
                    {podeEditarCampos && (
                        <button 
                            type="button" 
                            onClick={() => setIsLocationModalOpen(true)} 
                            className="btn-secondary" 
                            style={{marginTop: '15px', width: '100%', background: '#6c757d', color: 'white'}}
                        >
                            <i className="fas fa-edit"></i> Alterar Localização no Mapa
                        </button>
                    )}
                    {!currentCoords && !podeEditarCampos && (
                        <p style={{textAlign: 'center', color: '#999', marginTop: '10px'}}>Nenhuma localização registrada.</p>
                    )}
                </div>

                {/* Card Envolvidos/Suspeitos */}
                <div className="details-card full-width">
                    <div className="card-header"><i className="fas fa-users"></i><h3>Envolvidos Identificados</h3></div>
                    {podeEditarCampos && (
                        <div className="add-suspeito-form">
                            <input type="text" placeholder="Nome do Envolvido" value={novoSuspeito.nome} onChange={e => setNovoSuspeito({...novoSuspeito, nome: e.target.value})} />
                            <input type="text" placeholder="Passaporte" value={novoSuspeito.passaporte} onChange={e => setNovoSuspeito({...novoSuspeito, passaporte: e.target.value})} />
                            <select value={novoSuspeito.status} onChange={e => setNovoSuspeito({...novoSuspeito, status: e.target.value})}>
                                <option>Investigado</option> <option>Preso</option> <option>Foragido</option>
                                <option>Liberado</option> <option>Vítima</option> <option>Testemunha</option>
                                <option>Outro</option>
                            </select>
                            <button type="button" onClick={adicionarSuspeito} className="btn-add-small" title="Adicionar Envolvido">+</button>
                        </div>
                    )}
                    <div className="table-responsive">
                        <table className="suspeitos-table">
                            <thead><tr><th>Nome</th><th>Passaporte</th><th>Status</th>{podeEditarCampos && <th>Ação</th>}</tr></thead>
                            <tbody>
                                {boletim.envolvidos_identificados?.map((s, index) => (
                                    <tr key={index}>
                                        <td>{s.nome}</td><td>{s.passaporte}</td><td>{s.status}</td>
                                        {podeEditarCampos && <td><button type="button" onClick={() => removerSuspeito(index)} className="btn-remover" title="Remover Envolvido">Remover</button></td>}
                                    </tr>
                                ))}
                                {!boletim.envolvidos_identificados?.length && (
                                    <tr><td colSpan={podeEditarCampos ? 4: 3} style={{textAlign: 'center', color: '#999'}}>Nenhum envolvido adicionado.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Card Evidências Anexadas */}
                <div className="details-card full-width">
                    <div className="card-header"><i className="fas fa-paperclip"></i><h3>Evidências Anexadas</h3></div>
                    <div className="form-group">
                        <label>Evidências Coletadas (Descrição)</label>
                        <textarea 
                            name="evidencias_coletadas" 
                            rows="4" 
                            value={boletim.evidencias_coletadas || ''} 
                            onChange={handleInputChange} 
                            disabled={!podeEditarCampos} 
                            placeholder={podeEditarCampos ? "Descreva as evidências físicas ou digitais coletadas..." : "Sem descrição de evidências."}
                        ></textarea>
                    </div>

                    <div className="galeria-imagens">
                        {boletim.anexos_imagens?.map(imagem => (
                            <div key={imagem} className="imagem-container">
                                {/* [UNIFICAÇÃO] Adiciona API_URL se não for http */}
                                <a href={imagem.startsWith('http') ? imagem : `${API_URL}${imagem}`} target="_blank" rel="noopener noreferrer" title="Ver imagem ampliada">
                                    <img src={imagem.startsWith('http') ? imagem : `${API_URL}${imagem}`} alt={`Anexo ${imagem}`} />
                                </a>
                                {podeEditarCampos && (
                                    <button type="button" className="btn-remover-img" onClick={() => removerImagemExistente(imagem)} title="Remover Imagem (ao salvar)">
                                        &times;
                                    </button>
                                )}
                            </div>
                        ))}
                        {!boletim.anexos_imagens?.length && <p style={{textAlign: 'center', color: '#999', marginTop: '10px'}}>Nenhuma imagem anexada.</p>}
                    </div>
                    {podeEditarCampos && (
                        <div className="form-group" style={{marginTop: '20px'}}>
                            <label htmlFor="anexos">Adicionar Novas Imagens (Anexos)</label>
                            <input type="file" id="anexos" name="anexos" multiple accept="image/*" onChange={handleFileChange} />
                        </div>
                    )}
                </div>

                {/* Cards Relato Policial e Observações */}
                <div className="details-card">
                    <div className="card-header"><i className="fas fa-file-alt"></i><h3>Relato Policial / Conclusão</h3></div>
                    <textarea name="relato_policial" rows="8" value={boletim.relato_policial || ''} onChange={handleInputChange} disabled={!podeEditarCampos} placeholder={podeEditarCampos ? "Descreva a investigação, ações tomadas e conclusão..." : "Sem relato."}></textarea>
                </div>
                <div className="details-card">
                    <div className="card-header"><i className="fas fa-archive"></i><h3>Observações Internas</h3></div>
                    <textarea name="observacoes_internas" rows="8" value={boletim.observacoes_internas || ''} onChange={handleInputChange} disabled={!podeEditarCampos} placeholder={podeEditarCampos ? "Anotações internas..." : "Sem observações."}></textarea>
                </div>
            </form>

            {/* Modal de Localização */}
            {podeEditarCampos && (
                <LocationPickerModal
                    isOpen={isLocationModalOpen}
                    onClose={() => setIsLocationModalOpen(false)}
                    onLocationSelect={handleMapClick}
                    initialCoords={currentCoords}
                    readOnly={false}
                />
            )}
        </div>
    );
};

// --- 4. Lista Policiais View (ListaPoliciaisPage.jsx) ---
const ListaPoliciaisView = ({ user, token, logout, setView, setNavProps }) => {
    const [policiais, setPoliciais] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtroNome, setFiltroNome] = useState('');

    useEffect(() => {
        const fetchPoliciais = async () => {
            setLoading(true); setError(null);
            if (!token) {
                setError('Erro de autenticação: Token não encontrado.'); setLoading(false); return;
            }
            const headers = { 'Authorization': `Bearer ${token}` }; 

            try {
                const response = await fetch(`${API_URL}/api/policia/policiais`, { headers }); 
                 if (response.status === 401 || response.status === 403) {
                     if (logout) logout();
                     throw new Error('Sua sessão expirou ou é inválida. Faça login novamente.');
                 }
                if (!response.ok) {
                     const errData = await response.json().catch(() => ({ message: `Erro ${response.status}` }));
                    throw new Error(errData.message || 'Falha ao carregar a lista de policiais.');
                }
                const data = await response.json();
                setPoliciais(data);
            } catch (err) {
                 console.error("Erro ao buscar policiais:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
         };

         fetchPoliciais();
    }, [token, logout]); 

    const policiaisFiltrados = policiais.filter(p =>
        p.nome_completo.toLowerCase().includes(filtroNome.toLowerCase())
    );

    // [UNIFICAÇÃO] Ação de clique
    const handleViewProfile = (policialId) => {
        setNavProps({ policialId: policialId });
        setView('profile');
    };

    return (
        <div className="page-container">
            <h1 className="page-title">Corpo Policial ({user?.corporacao || 'N/A'})</h1>
            <p className="page-subtitle">
                Lista de oficiais ativos na sua corporação.
            </p>

             <div className="search-container" style={{maxWidth: '400px', marginBottom: '25px'}}>
                 <i className="fas fa-search search-icon"></i>
                 <input
                     type="text"
                     placeholder="Filtrar por nome..."
                     className="search-input"
                     value={filtroNome}
                     onChange={(e) => setFiltroNome(e.target.value)}
                     style={{ borderRadius: '8px' }}
                 />
             </div>

            {loading && <p style={{textAlign: 'center'}}>Carregando lista de policiais...</p>}
            {error && <p className="error-message" style={{textAlign: 'center'}}>{error}</p>}

            {!loading && !error && (
                <div className="policiais-grid">
                    {policiaisFiltrados.length > 0 ? (
                         policiaisFiltrados.map(policial => (
                            // [UNIFICAÇÃO] Mudou de Link para div com onClick
                            <div key={policial.id} className="policial-card-link" onClick={() => handleViewProfile(policial.id)}>
                                <div className="policial-card">
                                    <div className="policial-avatar">
                                        <i className="fas fa-user-shield"></i>
                                    </div>
                                    <div className="policial-info">
                                        <h3 className="policial-nome">{policial.nome_completo}</h3>
                                        <p className="policial-patente">{policial.patente || 'Não definida'} ({policial.corporacao || 'N/A'})</p>
                                        <p className="policial-guarnicao">{policial.divisao || 'Sem divisão'}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#64748b'}}>Nenhum policial encontrado.</p>
                    )}
                </div>
            )}
        </div>
    );
};

// --- 5. Perfil Policial View (PoliceProfilePage.jsx) ---
const ProfileView = ({ user, token, logout, setView, navProps }) => {
    // [UNIFICAÇÃO] Pega o ID das props, ou usa o ID do próprio usuário logado
    const profileId = navProps.policialId || user.id; 
    
    const [policial, setPolicial] = useState(null);
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); 
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        if (!token || !profileId) {
            setError("Usuário não autenticado ou perfil não encontrado."); setLoading(false); return;
        }
        setLoading(true); setError(null);
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            const [perfilResponse, historicoResponse] = await Promise.all([
                fetch(`${API_URL}/api/policia/perfil/${profileId}`, { headers }),
                fetch(`${API_URL}/api/policia/perfil/${profileId}/historico`, { headers })
            ]);

            if (perfilResponse.status === 401 || perfilResponse.status === 403 || historicoResponse.status === 401 || historicoResponse.status === 403 ) {
                 if (logout) logout();
                 throw new Error('Sessão inválida ou expirada. Faça login novamente.');
            }
            if (!perfilResponse.ok) throw new Error('Erro ao buscar perfil.');
            if (!historicoResponse.ok) throw new Error('Erro ao buscar histórico.');

            const perfilData = await perfilResponse.json();
            const historicoData = await historicoResponse.json();
            setPolicial(perfilData);
            setHistorico(historicoData);
        } catch (error) { setError(error.message);
        } finally { setLoading(false); }
    }, [profileId, token, logout]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Efeito de 'focus'
    useEffect(() => {
        const handleFocus = () => {
            if (!isEditModalOpen) { fetchData(); } 
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [fetchData, isEditModalOpen]);

    const handleSaveProfile = async (formData) => {
        if (!token) throw new Error("Autenticação perdida.");
        setLoading(true); setError(null);
        const toastId = toast.loading("Salvando perfil...");
        try {
            const response = await fetch(`${API_URL}/api/policia/perfil/self`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (!response.ok) {
                const errData = await response.json();
                if (response.status === 401 || response.status === 403) {
                     if (logout) logout();
                     throw new Error('Sessão inválida ao salvar. Faça login novamente.');
                }
                throw new Error(errData.message || 'Falha ao salvar.');
            }
            const data = await response.json();
            await fetchData(); 
            setIsEditModalOpen(false);
            toast.update(toastId, { render: "Perfil atualizado!", type: 'success', isLoading: false, autoClose: 2000, icon: <AnimatedCheckmark /> });
        } catch (err) {
            setError(err.message); 
            toast.update(toastId, { render: `Erro: ${err.message}`, type: 'error', isLoading: false, autoClose: 4000, icon: <AnimatedXMark /> });
        } finally {
            setLoading(false); 
        }
    };

    if (loading) { return <div className="page-container" style={{ padding: '20px' }}><p>Carregando...</p></div>; }
    if (error && !policial) { return <div className="page-container" style={{ padding: '20px' }}><h1>Erro</h1><p className="error-message">{error}</p></div>; }
    if (!policial) { return <div className="page-container" style={{ padding: '20px' }}><h1>Ops!</h1><p>Policial não encontrado.</p></div>; }

    const avatarUrl = policial.foto_url ? (policial.foto_url.startsWith('http') ? policial.foto_url : `${API_URL}${policial.foto_url}`) : null;
    const canEdit = user.id === policial.id;
    const handleAvatarClick = () => { if (avatarUrl) setIsPhotoModalOpen(true); };

    return (
        <div className="page-container">
            {error && <p className="error-message" style={{ marginBottom: '15px' }}>Erro: {error}</p>}
            {/* [UNIFICAÇÃO] Botão de Voltar se não for o próprio perfil */}
            {!canEdit && (
                <button type="button" onClick={() => setView('policiais')} className="back-button" style={{marginBottom: '20px'}}>
                    &larr; Voltar para Lista
                </button>
            )}

            <div className="profile-grid">
                <aside className="profile-sidebar">
                    <div className="profile-card">
                        <div
                            className="profile-avatar"
                            onClick={handleAvatarClick}
                            style={{ cursor: avatarUrl ? 'pointer' : 'default' }}
                        >
                            {avatarUrl ? (
                                <img src={`${avatarUrl}?${Date.now()}`} alt="Foto de Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> 
                            ) : (
                                <i className="fas fa-user-tie" style={{ fontSize: '3.5rem', color: '#94a3b8' }}></i>
                            )}
                        </div>

                        <h3>{policial.nome_completo}</h3>
                        <p className="profile-passaporte">Passaporte: {policial.passaporte}</p>
                        <div className="profile-info-grid">
                            <strong>Patente:</strong><span>{policial.patente || 'Não definida'}</span>
                            <strong>Corporação:</strong><span>{policial.corporacao || 'N/A'}</span>
                            <strong>Divisão:</strong><span>{policial.divisao || 'Não definida'}</span>
                            <strong>Discord:</strong><span>{policial.discord_id || 'Não informado'}</span>
                            <strong>Telefone:</strong><span>{policial.telefone_rp || 'Não informado'}</span>
                            <strong>Status:</strong>
                            <span>
                                <span className={`status-pill status-${policial.status?.toLowerCase()}`}>
                                    {policial.status || 'N/A'}
                                </span>
                            </span>
                        </div>
                        {canEdit && (
                            <button onClick={() => setIsEditModalOpen(true)} className="btn-edit-profile" style={{ marginTop: '20px', background: 'none', border: 'none', cursor: 'pointer', color: '#0d6efd' }}>
                                Editar Perfil
                            </button>
                        )}
                    </div>
                </aside>

                <main className="profile-main-content">
                    <div className="content-widget">
                        <h2 className="widget-title"> Timeline do Policial</h2>
                        <Timeline events={historico} />
                    </div>
                </main>
            </div>

            {/* Modais */}
            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                policial={policial}
                onSave={handleSaveProfile}
            />
            {isPhotoModalOpen && avatarUrl && (
                <div className="photo-modal-overlay" onClick={() => setIsPhotoModalOpen(false)}>
                    <button className="photo-modal-close">&times;</button>
                    <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
                        <img src={`${avatarUrl}?${Date.now()}`} alt="Foto de Perfil (Ampliada)" />
                    </div>
                </div>
            )}
        </div>
    );
};

// --- 6. Relatórios View (RelatoriosPage.jsx) ---
const RelatoriosView = ({ user, token, logout, setView, setNavProps }) => {
    const [view, setInternalView] = useState('resumo'); // 'resumo', 'estrategico', 'registrar'
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [statsError, setStatsError] = useState(null);

    // [UNIFICAÇÃO] Dados do formulário movidos para cá
    const initialFormData = {
        tipo_relatorio: 'Ocorrência',
        unidade_responsavel: user?.divisao || user?.corporacao || '',
        status: 'Em Aberto', id_ocorrencia_associada: '', local_ocorrencia: '',
        data_hora_fato: '', natureza_ocorrencia: '', descricao_detalhada: '',
        testemunhas: '', suspeitos: '', vitimas: '', veiculos_envolvidos: '',
        objetos_apreendidos: '', medidas_tomadas: '', observacoes_autor: '',
        mapa_x: null, mapa_y: null,
    };
    const [formData, setFormData] = useState(initialFormData);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitMessage, setSubmitMessage] = useState({ type: '', text: '' });

    const fetchReportData = useCallback(async () => {
        if (view !== 'resumo' || !user) return;
        setLoadingStats(true); setStatsError(null);
        if (!token) {
            setStatsError('Erro de autenticação.'); setLoadingStats(false); return;
        }
        try {
            const response = await fetch(`${API_URL}/api/policia/relatorios/estatisticas`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 401 || response.status === 403) {
                if(logout) logout(); throw new Error('Sessão inválida.');
            }
            if (!response.ok) throw new Error('Falha ao buscar dados.');
            const data = await response.json();
            setStats(data);
        } catch (err) {
            setStatsError(`Falha ao carregar: ${err.message}`); setStats(null);
        } finally {
            setLoadingStats(false);
        }
    }, [logout, view, user, token]);

    useEffect(() => {
        if (view === 'resumo' && user) {
            fetchReportData();
        }
    }, [user, view, fetchReportData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleMapClick = (coords) => {
        setFormData(prev => ({ ...prev, mapa_x: coords.x, mapa_y: coords.y, }));
        setIsMapModalOpen(false);
    };

    const handleSubmitReport = async (e) => {
        e.preventDefault();
        setIsSubmitting(true); setSubmitMessage({ type: '', text: '' });
        if (!token) {
            setSubmitMessage({ type: 'error', text: 'Erro: Token não encontrado.' }); setIsSubmitting(false); return;
        }
        const dataToSend = { ...formData };
        const toastId = toast.loading("Enviando relatório...");

        try {
            const response = await fetch(`${API_URL}/api/policia/relatorios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
                body: JSON.stringify(dataToSend)
            });
            if (response.status === 401 || response.status === 403) {
                if(logout) logout(); throw new Error('Sessão inválida.');
            }
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || `Erro ${response.status}`);
            
            toast.update(toastId, { render: 'Relatório enviado!', type: 'success', isLoading: false, autoClose: 2000, icon: <AnimatedCheckmark /> });
            setFormData(initialFormData);
        } catch (error) {
            toast.update(toastId, { render: `Erro: ${error.message}`, type: 'error', isLoading: false, autoClose: 4000, icon: <AnimatedXMark /> });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // --- Renderização da View Interna ---
    const renderInternalView = () => {
        switch(view) {
            case 'resumo':
                if (loadingStats) return <p className="loading-text">Carregando estatísticas...</p>;
                if (statsError) return <p className="error-message">{statsError}</p>;
                if (!stats) return <p className="empty-state">Não foi possível carregar as estatísticas.</p>;
                return (
                    <div className="report-view-content">
                        <h2 className="content-title"><i className="fas fa-file-medical-alt"></i> Resumo de Ocorrências</h2>
                        <div className="stat-grid">
                            <StatCardReports title="Total Registrados" value={stats.boletins?.total ?? 0} icon="fa-copy" color="#3b82f6" />
                            <StatCardReports title="Aguardando Análise" value={stats.boletins?.aguardando ?? 0} icon="fa-hourglass-start" color="#f59e0b" />
                            <StatCardReports title="Em Investigação" value={stats.boletins?.investigacao ?? 0} icon="fa-search" color="#0ea5e9" />
                            <StatCardReports title="Resolvidos" value={stats.boletins?.resolvido ?? 0} icon="fa-check-circle" color="#10b981" />
                            <StatCardReports title="Arquivados" value={stats.boletins?.arquivado ?? 0} icon="fa-archive" color="#6b7280" />
                            <StatCardReports title="Falsos" value={stats.boletins?.falso ?? 0} icon="fa-times-circle" color="#ef4444" />
                        </div>
                        <h2 className="content-title"><i className="fas fa-history"></i> Atividade Recente (Últimos 30 Dias)</h2>
                        <div className="stat-grid">
                            <StatCardReports title="Promoções" value={stats.historico?.promocao ?? 0} icon="fa-arrow-up" color="#10b981" />
                            <StatCardReports title="Rebaixamentos" value={stats.historico?.rebaixamento ?? 0} icon="fa-arrow-down" color="#f59e0b" />
                            <StatCardReports title="Demissões" value={stats.historico?.demissao ?? 0} icon="fa-user-slash" color="#ef4444" />
                            <StatCardReports title="Novos Alistamentos" value={stats.historico?.aprovacao ?? 0} icon="fa-user-plus" color="#0ea5e9" />
                        </div>
                        {user?.permissoes?.is_rh && (
                            <>
                                <h2 className="content-title"><i className="fas fa-users-cog"></i> Resumo de Efetivo (RH)</h2>
                                <div className="stat-grid">
                                    <StatCardReports title="Efetivo PM" value={stats.efetivo?.PM ?? 0} icon="fa-shield-alt" color="#ef4444" />
                                    <StatCardReports title="Efetivo PC" value={stats.efetivo?.PC ?? 0} icon="fa-user-secret" color="#3b82f6" />
                                    <StatCardReports title="Efetivo GCM" value={stats.efetivo?.GCM ?? 0} icon="fa-hard-hat" color="#10b981" />
                                    <StatCardReports title="Total Efetivo" value={stats.efetivo?.total ?? 0} icon="fa-users" color="#6366f1" />
                                </div>
                            </>
                        )}
                    </div>
                );
            case 'estrategico':
                return (
                    <div className="report-view-content">
                        <h2 className="content-title"><i className="fas fa-brain"></i> Módulos de Inteligência</h2>
                        <p className="content-subtitle">
                            Acesse relatórios detalhados e análises estratégicas para auxiliar na tomada de decisão.
                        </p>
                        <div className="strategic-grid">
                            {/* [UNIFICAÇÃO] Estes usam <Link> pois navegam para rotas SEPARADAS */}
                            <StrategicReportCard
                                title="Relatório de Criminalidade"
                                description="Análise de tipos de crime, comparativos mensais e mapas de calor."
                                icon="fa-map-marked-alt"
                                to="/policia/relatorios/criminalidade" // Rota externa
                            />
                             <StrategicReportCard
                                title="Análise de Tendências"
                                description="Identifique aumentos ou diminuições em atividades criminosas específicas."
                                icon="fa-chart-line"
                                to="/policia/relatorios/tendencias" // Rota externa
                            />
                            <StrategicReportCard
                                title="Relatório de Eficiência Operacional"
                                description="Tempo médio de resposta, taxa de solução de casos e performance."
                                icon="fa-tachometer-alt"
                                to="#" disabled={true} 
                            />
                            <StrategicReportCard
                                title="Produtividade por Unidade"
                                description="Compare o desempenho entre diferentes divisões, distritos e corporações."
                                icon="fa-sitemap"
                                to="#" disabled={true}
                            />
                        </div>
                    </div>
                );
            case 'registrar':
                const TIPOS_OCORRENCIA = [ "Agressão", "Ameaça", "Desacato", "Desaparecimento", "Estelionato", "Extorsão", "Furto", "Homicídio", "Latrocínio", "Perturbação", "Posse/Porte Ilegal de Arma", "Roubo", "Sequestro", "Tráfico de Drogas", "Vandalismo", "Veículo Recuperado", "Violência Doméstica", "Outros" ];
                return (
                    <div className="report-view-content">
                        <div className="form-container">
                            <h2 className="content-title"><i className="fas fa-pencil-alt"></i> Registrar Relatório Narrativo</h2>
                            <p className="content-subtitle">Autor: {user?.nome_completo || 'N/A'}.</p>
                            <form onSubmit={handleSubmitReport} className="report-form">
                                <fieldset>
                                    <legend><i className="fas fa-info-circle"></i> Informações Básicas</legend>
                                    <div className="form-group-row">
                                        <div className="form-group">
                                            <label htmlFor="tipo_relatorio">Tipo</label>
                                            <select id="tipo_relatorio" name="tipo_relatorio" required value={formData.tipo_relatorio} onChange={handleInputChange} disabled={isSubmitting}>
                                                <option value="Ocorrência">Ocorrência</option> <option value="Patrulhamento">Patrulhamento</option>
                                                <option value="Interna">Interna</option> <option value="Administrativo">Administrativo</option>
                                                <option value="Armamento">Armamento</option> <option value="Viatura">Viatura</option>
                                                <option value="Pessoal">Pessoal</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="unidade_responsavel">Unidade Responsável</label>
                                            <input type="text" id="unidade_responsavel" name="unidade_responsavel" value={formData.unidade_responsavel} onChange={handleInputChange} disabled={isSubmitting} />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="status">Status Inicial</label>
                                            <select id="status" name="status" value={formData.status} onChange={handleInputChange} disabled={isSubmitting}>
                                                <option value="Em Aberto">Em Aberto</option> <option value="Em Análise">Em Análise</option> <option value="Concluído">Concluído</option>
                                            </select>
                                        </div>
                                    </div>
                                </fieldset>
                                <fieldset>
                                    <legend><i className="fas fa-map-marker-alt"></i> Localização</legend>
                                    <div className="form-group">
                                        <label htmlFor="local_ocorrencia">Local Descritivo</label>
                                        <input type="text" id="local_ocorrencia" name="local_ocorrencia" value={formData.local_ocorrencia} onChange={handleInputChange} placeholder="Endereço, Bairro, Ponto de Referência..." disabled={isSubmitting} />
                                    </div>
                                    <div className="form-group">
                                        <label>Localização no Mapa (Opcional)</label>
                                        <div className="location-display">
                                            {formData.mapa_x != null ? `Coords: X=${formData.mapa_x}, Y=${formData.mapa_y}` : 'Nenhuma localização definida no mapa.'}
                                        </div>
                                        <button type="button" onClick={() => setIsMapModalOpen(true)} className="btn-secondary btn-mapa" disabled={isSubmitting}>
                                            <i className="fas fa-map-marked-alt"></i> {formData.mapa_x != null ? 'Alterar no Mapa' : 'Selecionar no Mapa'}
                                        </button>
                                    </div>
                                </fieldset>
                                {formData.tipo_relatorio === 'Ocorrência' && (
                                    <fieldset>
                                        <legend><i className="fas fa-clipboard-list"></i> Detalhes da Ocorrência</legend>
                                        <div className="form-group-row">
                                            <div className="form-group">
                                                <label htmlFor="id_ocorrencia_associada">ID do B.O. (Opcional)</label>
                                                <input type="number" id="id_ocorrencia_associada" name="id_ocorrencia_associada" value={formData.id_ocorrencia_associada} onChange={handleInputChange} placeholder="ID" disabled={isSubmitting}/>
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="natureza_ocorrencia">Natureza *</label>
                                                <select id="natureza_ocorrencia" name="natureza_ocorrencia" required value={formData.natureza_ocorrencia} onChange={handleInputChange} disabled={isSubmitting}>
                                                    <option value="" disabled>-- Selecione um tipo --</option>
                                                    {TIPOS_OCORRENCIA.map(tipo => (<option key={tipo} value={tipo}>{tipo}</option>))}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label htmlFor="data_hora_fato">Data/Hora Fato</label>
                                                <input type="datetime-local" id="data_hora_fato" name="data_hora_fato" value={formData.data_hora_fato} onChange={handleInputChange} disabled={isSubmitting}/>
                                            </div>
                                        </div>
                                        <div className="form-group"><label htmlFor="descricao_detalhada">Descrição Detalhada *</label><textarea id="descricao_detalhada" name="descricao_detalhada" rows="6" required value={formData.descricao_detalhada} onChange={handleInputChange} disabled={isSubmitting}></textarea></div>
                                        <div className="form-group"><label htmlFor="testemunhas">Testemunhas</label><textarea id="testemunhas" name="testemunhas" rows="2" value={formData.testemunhas} onChange={handleInputChange} disabled={isSubmitting}></textarea></div>
                                        <div className="form-group"><label htmlFor="suspeitos">Suspeitos</label><textarea id="suspeitos" name="suspeitos" rows="2" value={formData.suspeitos} onChange={handleInputChange} disabled={isSubmitting}></textarea></div>
                                        <div className="form-group"><label htmlFor="vitimas">Vítimas</label><textarea id="vitimas" name="vitimas" rows="2" value={formData.vitimas} onChange={handleInputChange} disabled={isSubmitting}></textarea></div>
                                        <div className="form-group"><label htmlFor="veiculos_envolvidos">Veículos</label><textarea id="veiculos_envolvidos" name="veiculos_envolvidos" rows="2" value={formData.veiculos_envolvidos} onChange={handleInputChange} disabled={isSubmitting}></textarea></div>
                                        <div className="form-group"><label htmlFor="objetos_apreendidos">Objetos Apreendidos</label><textarea id="objetos_apreendidos" name="objetos_apreendidos" rows="2" value={formData.objetos_apreendidos} onChange={handleInputChange} disabled={isSubmitting}></textarea></div>
                                    </fieldset>
                                )}
                                {!['Pessoal', 'Administrativo', 'Armamento', 'Viatura'].includes(formData.tipo_relatorio) && (
                                    <fieldset>
                                        <legend><i className="fas fa-cogs"></i> Ações Policiais</legend>
                                        <div className="form-group">
                                            <label htmlFor="medidas_tomadas">Medidas Tomadas</label>
                                            <textarea id="medidas_tomadas" name="medidas_tomadas" rows="3" value={formData.medidas_tomadas} onChange={handleInputChange} disabled={isSubmitting}></textarea>
                                        </div>
                                    </fieldset>
                                )}
                                <fieldset>
                                    <legend>
                                        {formData.tipo_relatorio === 'Ocorrência' ? <><i className="far fa-comment-dots"></i> Observações</> : <><i className="fas fa-align-left"></i> Conteúdo *</>}
                                    </legend>
                                    <div className="form-group">
                                        <textarea
                                            id={formData.tipo_relatorio !== 'Ocorrência' ? "descricao_detalhada" : "observacoes_autor"}
                                            name={formData.tipo_relatorio !== 'Ocorrência' ? 'descricao_detalhada' : 'observacoes_autor'}
                                            rows={formData.tipo_relatorio === 'Ocorrência' ? 4 : 8}
                                            value={formData.tipo_relatorio === 'Ocorrência' ? formData.observacoes_autor : formData.descricao_detalhada}
                                            onChange={handleInputChange}
                                            disabled={isSubmitting}
                                            placeholder={formData.tipo_relatorio === 'Ocorrência' ? "Observações adicionais..." : "Descreva os detalhes..."}
                                            required={formData.tipo_relatorio !== 'Ocorrência'}
                                        />
                                    </div>
                                </fieldset>
                                {submitMessage.text && ( <p className={`submit-message ${submitMessage.type}`}>{submitMessage.text}</p> )}
                                <button type="submit" className="submit-button" disabled={isSubmitting}>
                                    <i className={`fas ${isSubmitting ? 'fa-spinner fa-spin' : 'fa-save'}`}></i>
                                    {isSubmitting ? 'Salvando...' : 'Salvar Relatório'}
                                </button>
                            </form>
                            <LocationPickerModal
                                isOpen={isMapModalOpen}
                                onClose={() => setIsMapModalOpen(false)}
                                onLocationSelect={handleMapClick}
                                initialCoords={formData.mapa_x != null ? { x: formData.mapa_x, y: formData.mapa_y } : null}
                                readOnly={false}
                            />
                        </div>
                    </div>
                );
            default:
                return <div>View não encontrada</div>;
        }
    };
    
    return (
        <div className="page-container reports-page" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
            <header className="report-header" style={{ flexShrink: 0 }}>
                <h1 className="page-title">Central de Relatórios</h1>
                <nav className="report-nav">
                    <button className={`nav-button ${view === 'resumo' ? 'active' : ''}`} onClick={() => setInternalView('resumo')}>
                        <i className="fas fa-chart-pie"></i> Resumo
                    </button>
                    <button className={`nav-button ${view === 'estrategico' ? 'active' : ''}`} onClick={() => setInternalView('estrategico')}>
                        <i className="fas fa-lightbulb"></i> Inteligência
                    </button>
                    <button className={`nav-button ${view === 'registrar' ? 'active' : ''}`} onClick={() => setInternalView('registrar')}>
                        <i className="fas fa-edit"></i> Registrar
                    </button>
                </nav>
            </header>
            <main className="report-content" style={{ flexGrow: 1, overflowY: 'auto' }}>
                {renderInternalView()}
            </main>
        </div>
    );
};

// --- 7. Admin View (RH Panel - AdminPage.jsx) ---
const AdminView = ({ user, token, logout, setView, setNavProps, setAdminModal }) => {
    // [UNIFICAÇÃO] Ações que navegam para outras views agora usam setView
    const navigateToLogs = () => {
        setNavProps({ defaultActionFilter: 'Todos' });
        setView('logs');
    };

    return (
        <div className="page-container">
            <h1 className="page-title">Admin ({user.corporacao || 'RH Geral'})</h1>
            <p className="page-subtitle">Ferramentas de gerenciamento.</p>
            <div className="admin-hub-grid">
                {/* [UNIFICAÇÃO] Botões agora usam setAdminModal para abrir modais */}
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

// --- 8. Logs View (LogsPage.jsx) ---
const LogsView = ({ user, token, logout, navProps }) => {
    // [UNIFICAÇÃO] Pega o filtro padrão das navProps
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

// --- [INÍCIO] COMPONENTES DE MODAL ---
// (Todos os modais são copiados para cá)

// --- Modal: Reportar Bug ---
const ReportBugModal = ({ isOpen, onClose, token, logout }) => {
    const [description, setDescription] = useState('');
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description.trim()) {
            setStatusMessage({ type: 'error', text: 'Por favor, descreva o bug.' });
            return;
        }
        setProcessing(true);
        setStatusMessage({ type: 'loading', text: 'Enviando relatório...' });

        try {
            const response = await fetch(`${API_URL}/api/policia/report-bug`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ description })
            });
            if (response.status === 401 || response.status === 403) {
                if (logout) logout();
                throw new Error('Sessão inválida ou sem permissão.');
            }
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Erro ao enviar relatório.');
            setStatusMessage({ type: 'success', text: result.message });
            setDescription('');
            setTimeout(() => { onClose(); setStatusMessage({ type: '', text: '' }); }, 2500);
        } catch (error) {
            setStatusMessage({ type: 'error', text: error.message });
            setProcessing(false); // Permite tentar de novo no erro
        }
        // Não reseta o processing no sucesso por causa do timeout
    };

    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Reportar um Bug</h3>
                    <button onClick={onClose} className="close-btn" disabled={processing}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <p>Encontrou um problema no sistema? Descreva-o com o máximo de detalhes possível.</p>
                        <div className="modal-form-group">
                            <label htmlFor="bugDescription">Descrição do Bug</label>
                            <textarea
                                id="bugDescription" value={description} onChange={(e) => setDescription(e.target.value)}
                                rows={8} placeholder="Ex: Ao tentar aprovar um recruta, a página deu erro 500..."
                                required disabled={processing}
                            />
                        </div>
                        {statusMessage.text && (
                            <p className={`status-message status-${statusMessage.type}`}>
                                {statusMessage.text}
                            </p>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={onClose} className="btn-secondary" disabled={processing}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={processing}>
                            {processing ? 'Enviando...' : 'Enviar Relatório'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Modal: Aprovação de Recruta ---
const ApprovalModal = ({ isOpen, recruta, onClose, onConfirm }) => {
    const [patente, setPatente] = useState('');
    const [patentesDisponiveis, setPatentesDisponiveis] = useState([]);
    const [divisao, setDivisao] = useState('');
    const [divisoesDisponiveis, setDivisoesDisponiveis] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    
    // [UNIFICAÇÃO] Listas agora são hardcoded aqui
    const patentesPorCorporacao = {
        PM: [ "Soldado 2º Classe", "Soldado 1º Classe", "Cabo", "3º Sargento", "2º Sargento", "1º Sargento", "Subtenente", "Aspirante-a-Oficial", "2º Tenente", "1º Tenente", "Capitão", "Major", "Tenente-Coronel", "Coronel" ],
        PC: [ "Agente", "Investigador", "Escrivão", "Inspetor", "Delegado" ],
        GCM: [ "GCM 3ª Classe", "GCM 2ª Classe", "GCM 1ª Classe", "Classe Distinta", "Subinspetor", "Inspetor", "Inspetor de divisão", "Inspetor de agrupamento", "Inspetor superintendente", "Sub Comadante", "Comadante Geral" ]
    };
    const divisoesPorCorporacao = {
        PM: [ "Corregedoria da Policia Militar - \"DPM\"", "37º Batalhão de Polícia Militar Metropolitano (37º BPM/M)", "37º Batalhão de Polícia Militar Metropolitano (37º BPM/M/ 1CIA)", "37º Batalhão de Polícia Militar Metropolitano (37º BPM/M/Força Tatica)", "15º Batalhão de Ações Especiais (15ºBaep)", "1º Companhia de Ações Especiais (1ºCaep)", "Comando de Aviação da Polícia Militar - “João Negrão”", "5º Batalhão de Polícia Rodoviária (5º BPRv)", "15° Grupamento de Bombeiro Militar (15° GBM)", "1º Batalhão de Polícia de Choque “Rondas Ostentivas Tobias de Aguiar”", "2º Batalhão de Polícia de Choque “Anchieta”", "3º Batalhão de Polícia de Choque “Humaitá”", "4T Batalhão de Polícia de Choque “Operações Especiais”", "5º Batalhão de Polícia de Choque “Canil”" ],
        PC: ["80ª Distrito de Policia Civil (80ªDP)", "Não definida"],
        GCM: ["Guarda Civil Municipal (GCM)", "Não definida"]
    };

    useEffect(() => {
        if (isOpen && recruta?.corporacao) {
            const patentes = patentesPorCorporacao[recruta.corporacao] || [];
            setPatentesDisponiveis(patentes);
            setPatente(patentes[0] || ''); 
            const divisoes = divisoesPorCorporacao[recruta.corporacao] || [];
            setDivisoesDisponiveis(divisoes);
            setDivisao(''); 
        } else {
            setPatentesDisponiveis([]);
            setDivisoesDisponiveis([]);
        }
        setError('');
        setProcessing(false);
    }, [recruta, isOpen]); // Removido dependências hardcoded

    if (!isOpen || !recruta) return null;

    const handleConfirmClick = () => {
        if (!patente || !divisao) {
            setError('Por favor, selecione a patente e a divisão.'); return;
        }
        setProcessing(true); setError('');
        onConfirm(recruta.id, divisao, patente);
        // O onConfirm (handleConfirmApprovalFinal) agora lida com fechar o modal e toasts
        setProcessing(false); // Reseta o processing localmente
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

// --- Modal: Gerenciar Policial ---
const GerenciarPolicialModal = ({ isOpen, onClose, token, logout, user }) => {
    const [view, setView] = useState('search');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(false);

    // [UNIFICAÇÃO] Adiciona listas de patentes e divisões
    const patentesPorCorporacao = {
        PM: [ "Soldado", "Cabo", "3º Sargento", "2º Sargento", "1º Sargento", "Subtenente", "Aspirante-a-Oficial", "2º Tenente", "1º Tenente", "Capitão", "Major", "Tenente-Coronel", "Coronel" ],
        PC: [ "Agente", "Investigador", "Escrivão", "Inspetor", "Delegado" ],
        GCM: [ "GCM 3ª Classe", "GCM 2ª Classe", "GCM 1ª Classe", "Subinspetor", "Inspetor" ]
    };
    const divisoesPorCorporacao = {
        PM: [ "Corregedoria da Policia Militar - \"DPM\"", "37º BPM/M", "37º BPM/M/ 1CIA", "37º BPM/M/Força Tatica", "15ºBaep", "1ºCaep", "Comando de Aviação", "5º BPRv", "15° GBM", "ROTA", "2º Choque", "3º Choque", "GATE/COE", "Canil", "Não definida" ],
        PC: ["80ª Distrito de Policia Civil (80ªDP)", "Não definida"],
        GCM: ["Guarda Civil Municipal (GCM)", "Não definida"]
    };
    
    useEffect(() => { /* Reset state on close */
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

    const adminCorp = user.corporacao;
    const patentesDisponiveis = patentesPorCorporacao[adminCorp] || [];
    const divisoesDisponiveis = divisoesPorCorporacao[adminCorp] || [];

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
                {view === 'edit' && selectedUser && ( // Adicionado selectedUser check
                    <form onSubmit={handleSave}>
                        <div className="modal-body" style={{maxHeight: '60vh', overflowY: 'auto'}}>
                            {/* Inputs: nome_completo, passaporte, discord_id, telefone_rp */}
                             <div className="modal-form-group"><label>Nome</label><input name="nome_completo" type="text" value={formData.nome_completo} onChange={handleFormChange} required /></div>
                             <div className="modal-form-group"><label>Passaporte</label><input name="passaporte" type="text" value={formData.passaporte} onChange={handleFormChange} required /></div>
                             <div className="modal-form-group"><label>Discord ID</label><input name="discord_id" type="text" value={formData.discord_id} onChange={handleFormChange} /></div>
                             <div className="modal-form-group"><label>Telefone (RP)</label><input name="telefone_rp" type="text" value={formData.telefone_rp} onChange={handleFormChange} /></div>

                            {/* Selects: patente, divisao */}
                            <div className="modal-form-group"><label>Patente</label><select name="patente" value={formData.patente} onChange={handleFormChange} required><option value="" disabled>Selecione...</option>{patentesDisponiveis.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                            <div className="modal-form-group"><label>Divisão</label><select name="divisao" value={formData.divisao} onChange={handleFormChange} required><option value="" disabled>Selecione...</option>{divisoesDisponiveis.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
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

// --- Modal: Lista de Recrutas ---
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

// --- Modal: Anúncio ---
const AnuncioModal = ({ isOpen, onClose, token, logout, user }) => {
    const [titulo, setTitulo] = useState('');
    const [conteudo, setConteudo] = useState('');
    const [corporacaoAlvo, setCorporacaoAlvo] = useState(null); 
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTitulo('');
            setConteudo('');
            const initialCorp = user?.corporacao || null;
            setCorporacaoAlvo(initialCorp); 
            setIsSubmitting(false);
        }
    }, [isOpen, user?.corporacao]); 

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
                                value={corporacaoAlvo === null ? 'Geral' : corporacaoAlvo}
                                onChange={handleCorporacaoChange} 
                                disabled={isSubmitting}
                            >
                                <option value="Geral">Geral (Todas)</option>
                                <option value="PM">PM</option>
                                <option value="PC">PC</option>
                                <option value="GCM">GCM</option>
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

// --- Modal: Demitir ---
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

// --- Modal: Gerar Token ---
const GenerateTokenModal = ({ isOpen, onClose, token, logout, user }) => {
    const [maxUses, setMaxUses] = useState(1);
    const [durationHours, setDurationHours] = useState(24);
    const [generatedToken, setGeneratedToken] = useState('');
    const [processing, setProcessing] = useState(false); 

    useEffect(() => { 
        if (isOpen) {
            setGeneratedToken('');
            setProcessing(false);
            setMaxUses(1); setDurationHours(24);
        }
    }, [isOpen]);

    const handleGenerate = async () => {
        if (maxUses < 1) { toast.warning('Quantidade deve ser 1 ou mais.'); return; }
        if (durationHours <= 0) { toast.warning('Duração deve ser positiva.'); return; }
        setProcessing(true); setGeneratedToken('');
        if (!token) {
            toast.error('Erro: Token admin não encontrado.', { icon: <AnimatedXMark /> }); setProcessing(false); return;
        }
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
        const toastId = toast.loading("Gerando token...");

        try {
            const response = await fetch(`${API_URL}/api/admin/generate-token`, { 
                method: 'POST', headers: headers,
                body: JSON.stringify({ max_uses: parseInt(maxUses, 10), duration_hours: parseInt(durationHours, 10) })
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
    
    // Estilos inline simples
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
                    <p>Gere um token para registo na corporação ({user?.corporacao || 'N/A'}).</p>
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
                    <button type="button" onClick={handleGenerate} className="btn-primary" disabled={processing || !user?.corporacao}>
                        {processing ? 'Gerando...' : 'Gerar Novo Token'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Modal: Promover/Rebaixar ---
const PromoverRebaixarModal = ({ isOpen, onClose, token, logout, user }) => {
    const [view, setView] = useState('search');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [formData, setFormData] = useState({ acao: 'Promoção', novaPatente: '' });
    const [loading, setLoading] = useState(false);

    // [UNIFICAÇÃO] Listas de patentes
    const patentesPorCorporacao = {
        PM: [ "Soldado", "Cabo", "3º Sargento", "2º Sargento", "1º Sargento", "Subtenente", "Aspirante-a-Oficial", "2º Tenente", "1º Tenente", "Capitão", "Major", "Tenente-Coronel", "Coronel" ],
        PC: [ "Agente", "Investigador", "Escrivão", "Inspetor", "Delegado" ],
        GCM: [ "GCM 3ª Classe", "GCM 2ª Classe", "GCM 1ª Classe", "Subinspetor", "Inspetor" ]
    };

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
            const data = await response.json();
            setSearchResults(data);
            if (data.length === 0) toast.info('Nenhum policial encontrado.');
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
                onClose(true); // Fecha o modal e avisa que atualizou (para o caso de listas)
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

    const patentesDisponiveis = selectedUser ? (patentesPorCorporacao[selectedUser.corporacao?.toUpperCase()] || []) : [];

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
                             <p>Pesquise pelo nome ou passaporte.</p>
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
                             <div className="modal-form-group"><label>Para a Patente *</label><select name="novaPatente" value={formData.novaPatente} onChange={handleFormChange} required><option value="" disabled>Selecione...</option>{patentesDisponiveis.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
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

// --- Modal: Criar Concurso ---
const ConcursoModal = ({ isOpen, onClose, token, logout }) => {
    const [formData, setFormData] = useState({
        titulo: '', descricao: '', vagas: '', status: 'Aberto',
        data_abertura: '', data_encerramento: '', link_edital: '', valor: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    useEffect(() => {
        if(isOpen) {
            // Reseta o formulário quando abre
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
                body: JSON.stringify(formData)
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
            setError(err.message); // Mantém o erro no modal também
            setLoading(false); // Libera o botão no erro
        }
    };

    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{width: '90%', maxWidth: '700px'}}>
                <div className="modal-header">
                    <h3>Publicar Novo Concurso</h3>
                    <button onClick={() => onClose(false)} className="close-btn" disabled={loading}>&times;</button>
                </div>
                {error && <p className="status-message status-error">{error}</p>}
                {message && <p className="status-message status-success">{message}</p>}
                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                        <div className="modal-form-group"><label htmlFor="titulo">Título do Concurso*</label><input type="text" id="titulo" name="titulo" value={formData.titulo} onChange={handleChange} required disabled={loading} /></div>
                        <div className="modal-form-group"><label htmlFor="descricao">Descrição*</label><textarea id="descricao" name="descricao" value={formData.descricao} onChange={handleChange} rows="4" required disabled={loading}></textarea></div>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div className="modal-form-group" style={{ flex: 1 }}><label htmlFor="vagas">Número de Vagas*</label><input type="number" id="vagas" name="vagas" value={formData.vagas} onChange={handleChange} min="0" required disabled={loading} /></div>
                            <div className="modal-form-group" style={{ flex: 1 }}><label htmlFor="status">Status</label><select id="status" name="status" value={formData.status} onChange={handleChange} disabled={loading}><option value="Aberto">Aberto</option><option value="Encerrado">Encerrado</option></select></div>
                        </div>
                        <div style={{ display: 'flex', gap: '15px' }}>
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

// --- Modal: Editar Concurso ---
const EditConcursoModal = ({ isOpen, onClose, concursoId, token, logout }) => {
     const [formData, setFormData] = useState({
        titulo: '', descricao: '', vagas: '', status: 'Aberto',
        data_abertura: '', data_encerramento: '', link_edital: '', valor: ''
    });
    const [loadingData, setLoadingData] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            const formatDate = (dateString) => dateString ? new Date(dateString).toISOString().split('T')[0] : '';
            setFormData({
                titulo: data.titulo || '', descricao: data.descricao || '', vagas: data.vagas || '', status: data.status || 'Aberto',
                data_abertura: formatDate(data.data_abertura), data_encerramento: formatDate(data.data_encerramento),
                link_edital: data.link_edital || '', valor: data.valor || ''
            });
        } catch (error) {
            console.error("Erro fetch concurso:", error);
            toast.error(`Falha ao carregar: ${error.message}`, { icon: <AnimatedXMark /> });
        } finally { setLoadingData(false); }
    }, [concursoId, logout, token]);

    useEffect(() => {
        if (isOpen && concursoId) { fetchConcursoData(); }
        else { 
            setFormData({ titulo: '', descricao: '', vagas: '', status: 'Aberto', data_abertura: '', data_encerramento: '', link_edital: '', valor: '' });
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
                body: JSON.stringify(formData)
            });
            if (response.status === 401 || response.status === 403) { if(logout) logout(); throw new Error('Sessão inválida.'); }
            const result = await response.json();
            if (!response.ok) { throw new Error(result.message || `Erro ${response.status}`); }
            toast.update(toastId, { render: result.message || 'Concurso atualizado!', type: 'success', isLoading: false, autoClose: 3000, icon: <AnimatedCheckmark /> });
            setTimeout(() => { onClose(true); }, 1500); 
        } catch (error) {
            console.error("Erro ao atualizar concurso:", error);
            toast.update(toastId, { render: `Falha: ${error.message}`, type: 'error', isLoading: false, autoClose: 5000, icon: <AnimatedXMark /> });
            setIsSubmitting(false); // Permite tentar de novo
        } 
    };

    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h3>Editar Concurso</h3>
                    <button onClick={() => onClose(false)} className="close-btn" disabled={isSubmitting}>&times;</button>
                </div>
                {loadingData ? ( <div className="modal-body"><p>Carregando...</p></div> ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="modal-form-group"><label>Título *</label><input type="text" name="titulo" value={formData.titulo} onChange={handleChange} required disabled={isSubmitting} /></div>
                            <div className="modal-form-group"><label>Descrição *</label><textarea name="descricao" rows={4} value={formData.descricao} onChange={handleChange} required disabled={isSubmitting} /></div>
                            <div style={{ display:'flex', gap:'15px' }}>
                                <div className="modal-form-group" style={{ flex:1 }}><label>Vagas *</label><input type="number" name="vagas" min="1" value={formData.vagas} onChange={handleChange} required disabled={isSubmitting}/></div>
                                <div className="modal-form-group" style={{ flex:1 }}><label>Status *</label><select name="status" value={formData.status} onChange={handleChange} required disabled={isSubmitting}><option>Aberto</option><option>Encerrado</option></select></div>
                            </div>
                             <div style={{ display:'flex', gap:'15px' }}>
                                <div className="modal-form-group" style={{ flex:1 }}><label>Data Abertura *</label><input type="date" name="data_abertura" value={formData.data_abertura} onChange={handleChange} required disabled={isSubmitting}/></div>
                                <div className="modal-form-group" style={{ flex:1 }}><label>Data Encerramento *</label><input type="date" name="data_encerramento" value={formData.data_encerramento} onChange={handleChange} required disabled={isSubmitting}/></div>
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

// --- Modal: Gerenciar Concursos ---
const GerenciarConcursosModal = ({ isOpen, onClose, onEditClick, onCreateClick, token, logout, user }) => {
    const [concursos, setConcursos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

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
                        concursos.length === 0 ? (
                            <p style={{ textAlign: 'center', color: '#6c757d' }}>Nenhum concurso encontrado.</p>
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
                                        {concursos.map(concurso => {
                                            const canManage = !concurso.corporacao || concurso.corporacao === user?.corporacao;
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
                                                            title={canManage ? "Editar Concurso" : "Você só pode editar concursos da sua corporação"}
                                                        >
                                                            <i className="fas fa-edit"></i> Editar
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(concurso.id, concurso.titulo)}
                                                            className="action-btn reject"
                                                            disabled={!canManage}
                                                            title={canManage ? "Excluir Concurso" : "Você só pode excluir concursos da sua corporação"}
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

// --- Modal: Editar Perfil ---
const EditProfileModal = ({ isOpen, onClose, policial, onSave }) => {
    const [nomeCompleto, setNomeCompleto] = useState('');
    const [gmail, setGmail] = useState('');
    const [fotoFile, setFotoFile] = useState(null); 
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (policial) {
            setNomeCompleto(policial.nome_completo || '');
            setGmail(policial.gmail || '');
        }
        setFotoFile(null); 
        setError('');
        setProcessing(false);
    }, [policial, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setError('');

        const formData = new FormData();
        formData.append('nome_completo', nomeCompleto);
        formData.append('gmail', gmail);
        
        if (fotoFile) {
            formData.append('foto', fotoFile); 
        }

        try {
            await onSave(formData);
            // O 'onSave' (handleSaveProfile) agora fecha o modal e mostra o toast
        } catch (err) {
            setError(err.message || 'Erro ao salvar. Tente novamente.');
            setProcessing(false); // Libera o botão no erro
        }
        // Não reseta o 'processing' no sucesso, pois o modal vai fechar
    };

    return (
        <div className="modal-overlay">
            <form className="modal-content" onSubmit={handleSubmit}>
                <div className="modal-header">
                    <h3>Editar Perfil</h3>
                    <button type="button" onClick={onClose} className="close-btn" disabled={processing}>&times;</button>
                </div>
                
                <div className="modal-body">
                    <div className="modal-form-group">
                        <label htmlFor="nomeCompleto">Nome (Para o Painel)</label>
                        <input
                            id="nomeCompleto"
                            type="text"
                            value={nomeCompleto}
                            onChange={(e) => setNomeCompleto(e.target.value)}
                            disabled={processing}
                            required
                        />
                    </div>
                    
                    <div className="modal-form-group">
                        <label htmlFor="gmail">E-mail de Contato (Gmail)</label>
                        <input
                            id="gmail"
                            type="email"
                            value={gmail}
                            onChange={(e) => setGmail(e.target.value)}
                            disabled={processing}
                            required
                        />
                    </div>

                    <div className="modal-form-group">
                        <label htmlFor="foto">Foto de Perfil (Opcional)</label>
                        <input
                            id="foto"
                            type="file"
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={(e) => setFotoFile(e.target.files[0])}
                            disabled={processing}
                        />
                        <p style={{fontSize: '0.8rem', color: '#64748b', marginTop: '5px'}}>
                            Envie uma nova foto se quiser atualizá-la.
                        </p>
                    </div>

                    {error && <p className="status-message status-error">{error}</p>}
                </div>
                
                <div className="modal-footer">
                    <button type="button" onClick={onClose} className="btn-secondary" disabled={processing}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn-primary" disabled={processing}>
                        {processing ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// --- Modal: Location Picker ---
const LocationPickerModal = ({ isOpen, onClose, onLocationSelect, initialCoords, readOnly = false }) => {
    if (!isOpen) return null;

    const handleSelectAndClose = (coords) => {
        if (onLocationSelect && !readOnly) {
            onLocationSelect(coords); 
        }
        onClose(); 
    };

    return (
        <div className="modal-overlay" onClick={onClose}> 
            <div
                className="modal-content"
                style={{ width: '100%', maxWidth: '1000px', height: '70vh', display: 'flex', flexDirection: 'column' }} 
                onClick={(e) => e.stopPropagation()} 
            >
                <div className="modal-header">
                    <h3>{readOnly ? 'Visualizar Localização' : 'Selecionar Localização no Mapa'}</h3>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>
                <div className="modal-body" style={{ padding: 0, flexGrow: 1, height: '100%' }}> 
                    <LocationPickerMap
                        initialCoords={initialCoords}
                        onLocationSelect={readOnly ? () => {} : handleSelectAndClose}
                        readOnly={readOnly}
                    />
                </div>
                {!readOnly && (
                    <div className="modal-footer" style={{ justifyContent: 'center' }}>
                        <p style={{ margin: 0, color: '#6c757d', fontSize: '0.9rem' }}>Clique no mapa para definir a localização.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


// --- [INÍCIO] COMPONENTE PRINCIPAL (PAINEL POLICIA) ---
// Este componente substitui PoliceLayout.jsx e gerencia todas as views policiais.
const PainelPolicia = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate(); // Para links externos (Heatmap/Trends)
    
    // --- Estado de Navegação Interna ---
    // 'dashboard', 'boletins', 'boletimDetail', 'policiais', 'profile', 'relatorios', 'admin', 'logs'
    const [currentView, setCurrentView] = useState('dashboard');
    // Props para navegação (ex: { boletimId: 123 } ou { policialId: 456 })
    const [navProps, setNavProps] = useState({});

    // --- Estado dos Modais ---
    const [isBugModalOpen, setIsBugModalOpen] = useState(false);
    // Modais do Admin/RH
    const [adminModals, setAdminModals] = useState({
        generateToken: false,
        recruitList: false,
        approval: false,
        gerenciarPolicial: false,
        promo: false,
        anuncio: false,
        demitir: false,
        gerenciarConcursos: false,
        createConcurso: false,
        editConcurso: false,
    });
    const [approvalRecruta, setApprovalRecruta] = useState(null);
    const [editConcursoId, setEditConcursoId] = useState(null);

    // Função unificada para abrir/fechar modais do admin
    const setAdminModal = (modalName, isOpen) => {
        setAdminModals(prev => ({ ...prev, [modalName]: isOpen }));
    };

    // --- Funções de Navegação Interna ---
    const setView = (view, props = {}) => {
        setCurrentView(view);
        setNavProps(props);
    };

    // --- Funções de Callback para Modais (RH) ---
    const handleOpenApprovalModal = (recruta) => {
        setApprovalRecruta(recruta);
        setAdminModal('recruitList', false); // Fecha lista
        setAdminModal('approval', true); // Abre aprovação
    };

    const handleConfirmApprovalFinal = async (id, divisao, patente) => {
        if (!id || !divisao || !patente) {
             toast.warning("Dados incompletos (ID, Divisão ou Patente)."); return;
        }
        if (!token) { toast.error("Token não encontrado.", { icon: <AnimatedXMark /> }); return; }
        const toastId = toast.loading("Aprovando recruta...");
        try {
            const response = await fetch(`${API_URL}/api/admin/recrutas/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ novoStatus: 'Aprovado', divisao: divisao, patente: patente }),
            });
            if (response.status === 401 || response.status === 403) { if(logout) logout(); throw new Error('Sessão inválida.'); }
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || `Erro ${response.status} ao aprovar.`);
            toast.update(toastId, { render: 'Recruta aprovado!', type: 'success', isLoading: false, autoClose: 3000, icon: <AnimatedCheckmark /> });
            setAdminModal('approval', false); // Fecha modal de aprovação
            setApprovalRecruta(null);
        } catch (error) {
            console.error("[PainelPolicia] Erro ao aprovar:", error);
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
            // Força refresh da lista de recrutas (se o modal de lista estiver aberto)
            // Esta é uma limitação, idealmente o RecruitListModal faria o refresh
        } catch (error) {
             toast.update(toastId, { render: `Erro: ${error.message}`, type: 'error', isLoading: false, autoClose: 5000, icon: <AnimatedXMark /> });
        }
    };
    
    // Handlers para modais de concurso
    const openCreateConcursoModal = () => { setAdminModal('gerenciarConcursos', false); setAdminModal('createConcurso', true); };
    const closeCreateConcursoModal = (refreshNeeded) => { setAdminModal('createConcurso', false); setAdminModal('gerenciarConcursos', true); };
    const openEditConcursoModal = (concursoId) => { setEditConcursoId(concursoId); setAdminModal('gerenciarConcursos', false); setAdminModal('editConcurso', true); };
    const closeEditConcursoModal = (refreshNeeded) => { setAdminModal('editConcurso', false); setEditConcursoId(null); setAdminModal('gerenciarConcursos', true); };

    // --- Renderização da View Correta ---
    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <DashboardView user={user} token={token} logout={logout} setView={setView} setAdminModal={setAdminModal} />;
            case 'boletins':
                return <ConsultaBoletinsView user={user} token={token} logout={logout} setView={setView} setNavProps={setNavProps} />;
            case 'boletimDetail':
                return <BoletimDetailView user={user} token={token} logout={logout} setView={setView} navProps={navProps} />;
            case 'policiais':
                return <ListaPoliciaisView user={user} token={token} logout={logout} setView={setView} setNavProps={setNavProps} />;
            case 'profile':
                return <ProfileView user={user} token={token} logout={logout} setView={setView} navProps={navProps} />;
            case 'relatorios':
                return <RelatoriosView user={user} token={token} logout={logout} setView={setView} setNavProps={setNavProps} />;
            case 'admin':
                return <AdminView user={user} token={token} logout={logout} setView={setView} setNavProps={setNavProps} setAdminModal={setAdminModal} />;
            case 'logs':
                return <LogsView user={user} token={token} logout={logout} navProps={navProps} />;
            default:
                return <DashboardView user={user} token={token} logout={logout} setView={setView} setAdminModal={setAdminModal} />;
        }
    };

    return (
        <>
            <div className="police-dashboard-container">
                {/* O Sidebar agora está internalizado e usa 'setView' */}
                <PainelPoliciaSidebar 
                    currentView={currentView} 
                    setView={setView} 
                    onReportBugClick={() => setIsBugModalOpen(true)} 
                    user={user} 
                    logout={logout} 
                />
                <main className="main-content">
                    {renderView()}
                </main>
            </div>
            
            {/* Renderiza o modal de Bug */}
            <ReportBugModal 
                isOpen={isBugModalOpen}
                onClose={() => setIsBugModalOpen(false)}
                token={token} 
                logout={logout}
            />

            {/* Renderiza TODOS os modais do Admin (RH) */}
            {user?.permissoes?.is_rh && (
                <>
                    <ApprovalModal
                        isOpen={adminModals.approval}
                        recruta={approvalRecruta}
                        onClose={() => setAdminModal('approval', false)}
                        onConfirm={handleConfirmApprovalFinal}
                    />
                    <GerenciarPolicialModal 
                        isOpen={adminModals.gerenciarPolicial} 
                        onClose={() => setAdminModal('gerenciarPolicial', false)} 
                        token={token} logout={logout} user={user} 
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
                    />
                    <PromoverRebaixarModal 
                        isOpen={adminModals.promo} 
                        onClose={(refresh) => setAdminModal('promo', false)} 
                        token={token} logout={logout} user={user} 
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
                    />
                    <EditConcursoModal 
                        isOpen={adminModals.editConcurso} 
                        onClose={closeEditConcursoModal} 
                        concursoId={editConcursoId} 
                        token={token} logout={logout} 
                    />
                </>
            )}
        </>
    );
};

// --- [INÍCIO] COMPONENTE SIDEBAR (INTERNALIZADO) ---
// (Baseado no Sidebar.jsx, mas modificado para usar setView)
const PainelPoliciaSidebar = ({ currentView, setView, onReportBugClick, user, logout }) => {
    const userInitial = user?.nome_completo ? user.nome_completo[0].toUpperCase() : '?';

    // Função auxiliar para criar links
    const NavButton = ({ viewName, icon, text }) => {
        const isActive = currentView === viewName;
        return (
            <button 
                onClick={() => setView(viewName)} 
                className={isActive ? 'active' : ''}
            >
                <i className={`fas ${icon}`}></i> 
                <span>{text}</span>
            </button>
        );
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <h3>SSP-RP</h3>
                <span>Painel de Controle</span>
            </div>

            <nav className="sidebar-nav">
                {/* [UNIFICAÇÃO] Links trocados por botões que chamam setView */}
                <NavButton viewName="dashboard" icon="fa-tachometer-alt" text="Dashboard" />
                <NavButton viewName="boletins" icon="fa-file-alt" text="Boletins" />
                <NavButton viewName="policiais" icon="fa-users" text="Policiais" />
                <NavButton viewName="relatorios" icon="fa-chart-pie" text="Relatórios" />
                
                {user?.permissoes?.is_rh && (
                    <NavButton viewName="admin" icon="fa-user-shield" text="Administração" />
                )}
            </nav>

            <div className="sidebar-footer">
                {user && (
                    // [UNIFICAÇÃO] Link do perfil agora usa setView
                    <button onClick={() => setView('profile', { policialId: user.id })} className="sidebar-profile-vertical">
                        <div className="profile-avatar-large">
                            <span>{userInitial}</span>
                        </div>
                        <div className="profile-info-vertical">
                            <span>{user.nome_completo || 'Usuário'}</span>
                            <small>Ver Perfil</small>
                        </div>
                    </button>
                )}
                <button onClick={onReportBugClick} className="sidebar-btn bug-report-button">
                    <i className="fas fa-bug"></i> 
                    <span>Reportar Bug</span>
                </button>
                <button onClick={logout} className="sidebar-btn logout-button">
                    <i className="fas fa-sign-out-alt"></i> 
                    <span>Sair</span>
                </button>
            </div>
        </aside>
    );
};

export default PainelPolicia;

