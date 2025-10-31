import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from 'react-toastify';
import LocationPickerMap from '../components/LocationPickerMap.jsx'; 
import PainelRH from './PainelRH.jsx'; 
import HeatmapPage from './HeatmapPage.jsx';
import AnaliseTendenciasPage from './AnaliseTendenciasPage.jsx';

// Importa os gráficos do Recharts
import { 
    AreaChart, Area, PieChart, Pie, Cell, Tooltip, Legend, 
    ResponsiveContainer, XAxis, YAxis, CartesianGrid, Label
} from 'recharts';

// Importa os CSS necessários
import '../components/PoliceDashboard.css';
import '../components/BoletimDetailPage.css'; // (Import que você adicionou)
import '../components/ConsultaBoletins.css';
import '../components/RelatoriosPage.css';

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

// --- Componente: StatCardReports (Resumo Relatórios) ---
const StatCardReports = ({ title, value, icon, color }) => {
    const colorMap = {
        '#3b82f6': '#dbeafe', // blue
        '#f59e0b': '#fef3c7', // yellow/amber
        '#0ea5e9': '#cffafe', // cyan
        '#10b981': '#d1fae5', // green
        '#6b7280': '#f3f4f6', // gray
        '#ef4444': '#fee2e2', // red
        '#6366f1': '#e0e7ff', // indigo
    };
    const bgColor = colorMap[color] || '#f1f5f9'; 

    return (
        <div className="stat-card" style={{ '--icon-color': color, '--icon-bg': bgColor }}>
            <div className="stat-card-icon"><i className={`fas ${icon}`}></i></div>
            <div className="stat-card-info">
                <span className="stat-card-value">{value}</span>
                <span className="stat-card-title">{title}</span>
            </div>
        </div>
    );
};

// --- Componente: Cartão de Acesso (Relatórios Estratégicos) ---
const StrategicReportCard = ({ title, description, icon, onClick, disabled = false }) => {
    const handleClickDisabled = (e) => {
        e.preventDefault(); 
        toast.info('Funcionalidade em desenvolvimento...');
    };
    const cardClassName = `strategic-card ${disabled ? 'disabled' : ''}`;
    const rightIcon = disabled ? 'fa-lock' : 'fa-chevron-right';
    const handleClick = disabled ? handleClickDisabled : onClick;

    return (
        <div className={cardClassName} onClick={handleClick} style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
            <div className="strategic-card-icon"><i className={`fas ${icon}`}></i></div>
            <div className="strategic-card-content">
                <h3 className="strategic-card-title">{title}</h3>
                <p className="strategic-card-description">{description}</p>
            </div>
            <div className="strategic-card-arrow"><i className={`fas ${rightIcon}`}></i></div>
        </div>
    );
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
    <button onClick={onClick} className="quick-action-button">
        <i className={`fas ${icon}`}></i>
        <span>{text}</span>
    </button>
);

// --- Componente: AnuncioItem (Dashboard) ---
const AnuncioItem = ({ anuncio }) => {
    let tagColor = '#64748b'; 
    let tagName = 'Geral'; 
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
        case 'Rebaixamento': return { icon: 'fa-arrow-down', color: 'red' }; 
        case 'Demissão': return { icon: 'fa-user-slash', color: 'red' }; 
        case 'Aprovação': case 'Elogio': return { icon: 'fa-check', color: 'blue' };
        case 'Criação de Conta': return { icon: 'fa-user-plus', color: 'grey' };
        case 'Advertência': return { icon: 'fa-exclamation-triangle', color: 'orange' };
        case 'Atualização de Dados': return { icon: 'fa-pencil-alt', color: 'blue' }; 
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

// --- Funções de Modal Policial ---

// --- Modal: Reportar Bug ---
const ReportBugModal = ({ isOpen, onClose, token, logout }) => {
    const [description, setDescription] = useState('');
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description.trim()) { setStatusMessage({ type: 'error', text: 'Por favor, descreva o bug.' }); return; }
        setProcessing(true); setStatusMessage({ type: 'loading', text: 'Enviando relatório...' });

        try {
            const response = await fetch(`/api/policia/report-bug`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ description })
            });
            if (response.status === 401 || response.status === 403) { if (logout) logout(); throw new Error('Sessão inválida ou sem permissão.'); }
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Erro ao enviar relatório.');
            setStatusMessage({ type: 'success', text: result.message });
            setDescription('');
            setTimeout(() => { onClose(); setStatusMessage({ type: '', text: '' }); }, 2500);
        } catch (error) {
            setStatusMessage({ type: 'error', text: error.message });
            setProcessing(false); 
        }
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

// --- Modal: Location Picker ---
const LocationPickerModal = ({ isOpen, onClose, onLocationSelect, initialCoords, readOnly = false }) => {
    if (!isOpen) return null;
    const handleSelectAndClose = (coords) => {
        if (onLocationSelect && !readOnly) { onLocationSelect(coords); }
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

// --- Modal: Editar Perfil ---
const EditProfileModal = ({ isOpen, onClose, policial, onSave }) => {
    const [nomeCompleto, setNomeCompleto] = useState('');
    const [gmail, setGmail] = useState('');
    const [fotoFile, setFotoFile] = useState(null); 
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (policial) { setNomeCompleto(policial.nome_completo || ''); setGmail(policial.gmail || ''); }
        setFotoFile(null); setError(''); setProcessing(false);
    }, [policial, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault(); setProcessing(true); setError('');
        const formData = new FormData();
        formData.append('nome_completo', nomeCompleto); formData.append('gmail', gmail);
        if (fotoFile) { formData.append('foto', fotoFile); }

        try { await onSave(formData); } 
        catch (err) { setError(err.message || 'Erro ao salvar. Tente novamente.'); setProcessing(false); throw err; }
    };

    return (
        <div className="modal-overlay">
            <form className="modal-content" onSubmit={handleSubmit}>
                <div className="modal-header"><h3>Editar Perfil</h3><button type="button" onClick={onClose} className="close-btn" disabled={processing}>&times;</button></div>
                <div className="modal-body">
                    <div className="modal-form-group"><label htmlFor="nomeCompleto">Nome (Para o Painel)</label><input id="nomeCompleto" type="text" value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} disabled={processing} required/></div>
                    <div className="modal-form-group"><label htmlFor="gmail">E-mail de Contato (Gmail)</label><input id="gmail" type="email" value={gmail} onChange={(e) => setGmail(e.target.value)} disabled={processing} required/></div>
                    <div className="modal-form-group">
                        <label htmlFor="foto">Foto de Perfil (Opcional)</label>
                        <input id="foto" type="file" accept="image/png, image/jpeg, image/jpg" onChange={(e) => setFotoFile(e.target.files[0])} disabled={processing}/>
                        <p style={{fontSize: '0.8rem', color: '#64748b', marginTop: '5px'}}>Envie uma nova foto se quiser atualizá-la.</p>
                    </div>
                    {error && <p className="status-message status-error">{error}</p>}
                </div>
                <div className="modal-footer">
                    <button type="button" onClick={onClose} className="btn-secondary" disabled={processing}>Cancelar</button>
                    <button type="submit" className="btn-primary" disabled={processing}>{processing ? 'Salvando...' : 'Salvar Alterações'}</button>
                </div>
            </form>
        </div>
    );
};


// --- 1. Dashboard View (PoliceDashboard.jsx) ---
const DashboardView = ({ user, token, logout, setView }) => {
    const [stats, setStats] = useState({ totalBoletins: 0, boletinsAbertos: 0, policiaisAtivos: 0 });
    const [anunciosVisiveis, setAnunciosVisiveis] = useState([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        if (!token) { setLoadingData(false); return; }

        const fetchData = async () => {
            setLoadingData(true);
            const headers = { 'Authorization': `Bearer ${token}` };
            try {
                const [statsResponse, anunciosResponse] = await Promise.all([
                    fetch(`/api/policia/dashboard-stats`, { headers }),
                    fetch(`/api/anuncios`, { headers })
                ]);
                if (statsResponse.status === 401 || statsResponse.status === 403 || anunciosResponse.status === 401 || anunciosResponse.status === 403) { if (logout) logout(); throw new Error("Sessão inválida"); }
                if (!statsResponse.ok) throw new Error(`Estatísticas: ${statsResponse.statusText}`);
                if (!anunciosResponse.ok) throw new Error(`Anúncios: ${anunciosResponse.statusText}`);
                setStats(await statsResponse.json());
                const todosAnuncios = await anunciosResponse.json();
                const corporacaoUsuario = user?.corporacao;
                const anunciosFiltrados = todosAnuncios.filter(a => !a.corporacao || a.corporacao === 'GERAL' || a.corporacao === corporacaoUsuario);
                const anunciosOrdenadosLimitados = anunciosFiltrados.sort((a, b) => new Date(b.data_publicacao) - new Date(a.data_publicacao)).slice(0, 4);
                setAnunciosVisiveis(anunciosOrdenadosLimitados);
            } catch (error) {
                if (error.message !== "Sessão inválida") { console.error(`Falha ao carregar dados: ${error.message}`); }
            } finally { setLoadingData(false); }
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
const ConsultaBoletinsView = ({ user, token, logout, setView }) => {
    const [boletins, setBoletins] = useState([]);
    const [filtro, setFiltro] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchBoletins = async () => {
            setLoading(true); setError(null);
            if (!token) { setError('Erro de autenticação: Token não encontrado.'); setLoading(false); return; }
            const headers = { 'Authorization': `Bearer ${token}` };

             try {
                 const response = await fetch(`/api/policia/boletins`, { headers }); 
                 if (response.status === 401 || response.status === 403) { if (logout) logout(); throw new Error('Sessão expirou ou é inválida. Faça login novamente.'); }
                 if (!response.ok) { const errData = await response.json().catch(() => ({message: `Erro ${response.status}`})); throw new Error(errData.message || 'Falha ao carregar os boletins.'); }
                 const data = await response.json();
                 setBoletins(data);
             } catch (err) { console.error("Erro ao buscar boletins:", err); setError(err.message); } finally { setLoading(false); }
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

    const handleViewClick = (boId) => {
        setView('boletimDetail', { boletimId: boId, startInEditMode: false });
    };
    
    const handleEditClick = (boId, startInEdit) => {
        setView('boletimDetail', { boletimId: boId, startInEditMode: startInEdit });
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
                                                <button onClick={() => handleViewClick(bo.id)} className="btn-action view" title="Visualizar Detalhes">
                                                    <i className="fas fa-eye"></i>
                                                </button>

                                                {/* ✅ 1. CORREÇÃO DE PERMISSÃO (Lista): 
                                                    Usa 'podeAssumirBO' OU 'podeEditarBO' para mostrar o botão */}
                                                {(user?.permissoes?.podeAssumirBO || user?.permissoes?.podeEditarBO) && (
                                                    <button
                                                        onClick={() => handleEditClick(bo.id, !!bo.policial_responsavel_id)}
                                                        className="btn-action edit"
                                                        // O title muda dependendo se o BO já foi assumido
                                                        title={bo.policial_responsavel_id ? 
                                                                (user?.permissoes?.podeEditarBO ? "Editar Boletim" : "Ver Detalhes") 
                                                                : (user?.permissoes?.podeAssumirBO ? "Assumir Caso" : "Ver Detalhes")}
                                                        // Desabilita o botão se não tiver a permissão específica
                                                        disabled={
                                                            (bo.policial_responsavel_id && !user?.permissoes?.podeEditarBO) ||
                                                            (!bo.policial_responsavel_id && !user?.permissoes?.podeAssumirBO)
                                                        }
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
    const { boletimId, startInEditMode } = navProps;
    const [boletim, setBoletim] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [novoSuspeito, setNovoSuspeito] = useState({ nome: '', passaporte: '', status: 'Investigado' });
    const [arquivosParaUpload, setArquivosParaUpload] = useState([]);
    const [error, setError] = useState(null);
    const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

    // ✅ 2. CORREÇÃO DE PERMISSÃO (Detalhes):
    // As permissões agora vêm do objeto 'user'
    const isResponsavelPeloCaso = boletim?.policial_responsavel_id === user?.id;
    const podeAssumir = user?.permissoes?.podeAssumirBO && boletim && !boletim.policial_responsavel_id;
    const podeEditarCampos = user?.permissoes?.podeEditarBO && isResponsavelPeloCaso && isEditing;


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
            const response = await fetch(`/api/policia/boletins/${boletimId}`, { headers });
            if (response.status === 401 || response.status === 403) { if (logout) logout(); throw new Error('Sessão expirou.'); }
            if (!response.ok) { let errorMsg = `Erro ${response.status}.`; try { const d = await response.json(); errorMsg = d.message || errorMsg; } catch (e) {} throw new Error(errorMsg); }
            const data = await response.json();
            setBoletim(data);
            
            // ✅ 3. CORREÇÃO DE PERMISSÃO (fetchData):
            // Só permite entrar em 'modo de edição' automaticamente se o usuário tiver a permissão
            if (user?.permissoes?.podeEditarBO) {
                 setIsEditing(startInEditMode === true && data.policial_responsavel_id === user?.id);
            } else {
                 setIsEditing(false); // Garante que esteja falso se não tiver permissão
            }
            
        } catch (err) { setError(`Falha ao carregar: ${err.message}`); setBoletim(null); }
        finally { setLoading(false); }
    }, [boletimId, user?.id, user?.permissoes?.podeEditarBO, logout, startInEditMode]); // Adicionada permissão

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
            const response = await fetch(`/api/policia/boletins/${boletimId}`, {
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
        if (!podeAssumir) return; // Checagem de permissão já está em 'podeAssumir'
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
        const toastId = toast.loading("Assumindo caso...");
        try {
            const response = await fetch(`/api/policia/boletins/${boletimId}/assumir`, {
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
            
            // ✅ 4. CORREÇÃO DE PERMISSÃO (handleAssumir):
            // Só entra em modo de edição após assumir se também tiver permissão de editar
            if (user?.permissoes?.podeEditarBO) {
                setIsEditing(true);
            }
            
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
        // 'podeAssumir' já inclui a verificação de permissão
        if (podeAssumir) {
            return ( <button type="button" onClick={handleAssumirCaso} className="btn-assumir"><i className="fas fa-gavel"></i> Assumir Caso</button> );
        }
        
        // ✅ 5. CORREÇÃO DE PERMISSÃO (Botão Editar):
        // Troca a checagem de 'isCivil' pela permissão 'podeEditarBO'
        if (isResponsavelPeloCaso && user?.permissoes?.podeEditarBO) {
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
                    ) : ( <p style={{color: '#999', textAlign: 'center'}}>Aguardando Policial assumir.</p> )}

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
                            readOnly={true}
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
                                <a href={imagem.startsWith('http') ? imagem : imagem} target="_blank" rel="noopener noreferrer" title="Ver imagem ampliada">
                                    <img src={imagem.startsWith('http') ? imagem : imagem} alt={`Anexo ${imagem}`} />
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
const ListaPoliciaisView = ({ user, token, logout, setView }) => {
    // ... (Inalterado) ...
    const [policiais, setPoliciais] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtroNome, setFiltroNome] = useState('');

    useEffect(() => {
        const fetchPoliciais = async () => {
            setLoading(true); setError(null);
            if (!token) { setError('Erro de autenticação: Token não encontrado.'); setLoading(false); return; }
            const headers = { 'Authorization': `Bearer ${token}` }; 

            try {
                const response = await fetch(`/api/policia/policiais`, { headers }); 
                 if (response.status === 401 || response.status === 403) { if (logout) logout(); throw new Error('Sessão expirou ou é inválida. Faça login novamente.'); }
                if (!response.ok) { const errData = await response.json().catch(() => ({ message: `Erro ${response.status}` })); throw new Error(errData.message || 'Falha ao carregar a lista de policiais.'); }
                const data = await response.json();
                setPoliciais(data);
            } catch (err) { console.error("Erro ao buscar policiais:", err); setError(err.message); } finally { setLoading(false); }
         };

         fetchPoliciais();
    }, [token, logout]); 

    const policiaisFiltrados = policiais.filter(p =>
        p.nome_completo.toLowerCase().includes(filtroNome.toLowerCase())
    );

    const handleViewProfile = (policialId) => {
        setView('profile', { policialId: policialId });
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
    // ... (Inalterado) ...
    const profileId = navProps.policialId || user.id; 
    
    const [policial, setPolicial] = useState(null);
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false); 
    const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        if (!token || !profileId) { setError("Usuário não autenticado ou perfil não encontrado."); setLoading(false); return; }
        setLoading(true); setError(null);
        const headers = { 'Authorization': `Bearer ${token}` };

        try {
            const [perfilResponse, historicoResponse] = await Promise.all([
                fetch(`/api/policia/perfil/${profileId}`, { headers }),
                fetch(`/api/policia/perfil/${profileId}/historico`, { headers })
            ]);

            if (perfilResponse.status === 401 || perfilResponse.status === 403 || historicoResponse.status === 401 || historicoResponse.status === 403 ) { if (logout) logout(); throw new Error('Sessão inválida ou expirada. Faça login novamente.'); }
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
            const response = await fetch(`/api/policia/perfil/self`, {
                method: 'PUT', headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (!response.ok) {
                const errData = await response.json();
                if (response.status === 401 || response.status === 403) { if (logout) logout(); throw new Error('Sessão inválida ao salvar. Faça login novamente.'); }
                throw new Error(errData.message || 'Falha ao salvar.');
            }
            const data = await response.json();
            await fetchData(); 
            setIsEditModalOpen(false);
            toast.update(toastId, { render: "Perfil atualizado!", type: 'success', isLoading: false, autoClose: 2000, icon: <AnimatedCheckmark /> });
        } catch (err) {
            setError(err.message); 
            toast.update(toastId, { render: `Erro: ${err.message}`, type: 'error', isLoading: false, autoClose: 4000, icon: <AnimatedXMark /> });
            throw err;
        } finally { setLoading(false); }
    };

    if (loading) { return <div className="page-container" style={{ padding: '20px' }}><p>Carregando...</p></div>; }
    if (error && !policial) { return <div className="page-container" style={{ padding: '20px' }}><h1>Erro</h1><p className="error-message">{error}</p></div>; }
    if (!policial) { return <div className="page-container" style={{ padding: '20px' }}><h1>Ops!</h1><p>Policial não encontrado.</p></div>; }

    const avatarUrl = policial.foto_url ? (policial.foto_url.startsWith('http') ? policial.foto_url : policial.foto_url) : null;
    const canEdit = user.id === policial.id;
    const handleAvatarClick = () => { if (avatarUrl) setIsPhotoModalOpen(true); };

    return (
        <div className="page-container">
            {error && <p className="error-message" style={{ marginBottom: '15px' }}>Erro: {error}</p>}
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
const RelatoriosView = ({ user, token, logout, setView }) => {
    // ... (Inalterado, com a correção anterior do gráfico) ...
    const [view, setInternalView] = useState('resumo'); 
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [statsError, setStatsError] = useState(null);
    const [tendenciasData, setTendenciasData] = useState([]);
    const [loadingTendencias, setLoadingTendencias] = useState(true);
    const [pieChartTotal, setPieChartTotal] = useState(0); 
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const initialFormData = useMemo(() => ({
        tipo_relatorio: 'Ocorrência', unidade_responsavel: user?.divisao || user?.corporacao || '',
        status: 'Em Aberto', id_ocorrencia_associada: '', local_ocorrencia: '',
        data_hora_fato: '', natureza_ocorrencia: '', descricao_detalhada: '',
        testemunhas: '', suspeitos: '', vitimas: '', veiculos_envolvidos: '',
        objetos_apreendidos: '', medidas_tomadas: '', observacoes_autor: '',
        mapa_x: null, mapa_y: null,
    }), [user]);
    
    const [formData, setFormData] = useState(initialFormData);
    
    useEffect(() => {
        setFormData(initialFormData);
    }, [initialFormData]);

    const fetchReportData = useCallback(async () => {
        if (view !== 'resumo' || !user) return;
        setLoadingStats(true); setStatsError(null);
        if (!token) { setStatsError('Erro de autenticação.'); setLoadingStats(false); return; }
        try {
            const response = await fetch(`/api/policia/relatorios/estatisticas`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.status === 401 || response.status === 403) { if(logout) logout(); throw new Error('Sessão inválida.'); }
            if (!response.ok) throw new Error('Falha ao buscar dados.');
            const data = await response.json();
            setStats(data);
        } catch (err) { setStatsError(`Falha ao carregar: ${err.message}`); setStats(null); } finally { setLoadingStats(false); }
    }, [logout, view, user, token]);

    const fetchTendenciasData = useCallback(async () => {
        if (view !== 'resumo' || !token) return;
        setLoadingTendencias(true);
        try {
            const response = await fetch(`/api/policia/relatorios/tendencias`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                if (logout && (response.status === 401 || response.status === 403)) logout();
                throw new Error('Falha ao buscar tendências.');
            }
            const data = await response.json(); 

            const formatarMesAno = (mesAno) => {
                if (!mesAno || !mesAno.includes('-')) return '';
                const [ano, mes] = mesAno.split('-');
                const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
                return `${meses[parseInt(mes, 10) - 1]}/${ano.slice(2)}`;
            };
            
            const totalPorMes = {};
            Object.entries(data).forEach(([tipo, dadosMensais]) => {
                dadosMensais.forEach(({ mes_ano, contagem }) => {
                    if (!totalPorMes[mes_ano]) {
                        totalPorMes[mes_ano] = { mes_ano, Total: 0, name: formatarMesAno(mes_ano) };
                    }
                    totalPorMes[mes_ano].Total += contagem;
                });
            });
            const dadosGraficoTotal = Object.values(totalPorMes).sort((a, b) => a.mes_ano.localeCompare(b.mes_ano));
            setTendenciasData(dadosGraficoTotal);

        } catch (err) {
            console.error("Erro ao buscar tendências para o dashboard", err);
            toast.error('Não foi possível carregar o gráfico de tendências.');
        } finally {
            setLoadingTendencias(false);
        }
    }, [token, logout, view]);
    
    useEffect(() => {
        if (view === 'resumo' && user) {
            fetchReportData();
            fetchTendenciasData();
        }
    }, [user, view, fetchReportData, fetchTendenciasData]);

    const pieChartData = useMemo(() => {
        if (!stats || !stats.boletins) {
            setPieChartTotal(0); 
            return [];
        }
        
        const data = [
            { name: 'Aguardando', value: stats.boletins.aguardando || 0, color: '#f59e0b' },
            { name: 'Investigação', value: stats.boletins.investigacao || 0, color: '#0ea5e9' },
            { name: 'Resolvido', value: stats.boletins.resolvido || 0, color: '#10b981' },
            { name: 'Arquivado', value: stats.boletins.arquivado || 0, color: '#6b7280' },
            { name: 'Falso', value: stats.boletins.falso || 0, color: '#ef4444' },
        ];
        
        const totalBOCalc = stats.boletins.total || data.reduce((acc, item) => acc + item.value, 0);
        setPieChartTotal(totalBOCalc); 
        
        return data.filter(item => item.value > 0);
    }, [stats]);


    const handleInputChange = (e) => {
        const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleMapClick = (coords) => {
        setFormData(prev => ({ ...prev, mapa_x: coords.x, mapa_y: coords.y, })); setIsMapModalOpen(false);
    };
    const handleSubmitReport = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        if (!token) { toast.error('Erro: Token não encontrado.'); setIsSubmitting(false); return; }
        const dataToSend = { ...formData };
        const toastId = toast.loading("Enviando relatório...");

        try {
            const response = await fetch(`/api/policia/relatorios`, {
                method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
                body: JSON.stringify(dataToSend)
            });
            if (response.status === 401 || response.status === 403) { if(logout) logout(); throw new Error('Sessão inválida.'); }
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || `Erro ${response.status}`);
            
            toast.update(toastId, { render: 'Relatório enviado!', type: 'success', isLoading: false, autoClose: 2000, icon: <AnimatedCheckmark /> });
            setFormData(initialFormData);
        } catch (error) {
            toast.update(toastId, { render: `Erro: ${error.message}`, type: 'error', isLoading: false, autoClose: 4000, icon: <AnimatedXMark /> });
        } finally { setIsSubmitting(false); }
    };
    
    const renderInternalView = () => {
        switch(view) {
            case 'resumo':
                if (loadingStats) return <p className="loading-text">Carregando estatísticas...</p>;
                if (statsError) return <p className="error-message">{statsError}</p>;
                if (!stats) return <p className="empty-state">Não foi possível carregar as estatísticas.</p>;
                
                return (
                    <div className="report-view-content">
                        {/* 1. Stat Cards (Resumo de Ocorrências) */}
                        <h2 className="content-title"><i className="fas fa-file-medical-alt"></i> Resumo de Ocorrências</h2>
                        <div className="stat-grid">
                            <StatCardReports title="Total Registrados" value={stats.boletins?.total ?? 0} icon="fa-copy" color="#3b82f6" />
                            <StatCardReports title="Aguardando Análise" value={stats.boletins?.aguardando ?? 0} icon="fa-hourglass-start" color="#f59e0b" />
                            <StatCardReports title="Em Investigação" value={stats.boletins?.investigacao ?? 0} icon="fa-search" color="#0ea5e9" />
                            <StatCardReports title="Resolvidos" value={stats.boletins?.resolvido ?? 0} icon="fa-check-circle" color="#10b981" />
                            <StatCardReports title="Arquivados" value={stats.boletins?.arquivado ?? 0} icon="fa-archive" color="#6b7280" />
                            <StatCardReports title="Falsos" value={stats.boletins?.falso ?? 0} icon="fa-times-circle" color="#ef4444" />
                        </div>

                        {/* 2. Grid de Gráficos (Estilo Inspiração) */}
                        <div className="charts-grid-container">
                            
                            {/* Gráfico de Área */}
                            <div className="chart-card large-chart">
                                <h3 className="chart-title">Ocorrências Totais (Últimos Meses)</h3>
                                {loadingTendencias ? <p className="loading-text">Carregando gráfico...</p> : tendenciasData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={350}>
                                        <AreaChart data={tendenciasData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                                            <YAxis allowDecimals={false} stroke="#6b7280" fontSize={12} />
                                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '8px' }} />
                                            <Area 
                                                type="monotone" 
                                                dataKey="Total" 
                                                stroke="#4f46e5"
                                                fillOpacity={1} 
                                                fill="url(#colorTotal)" 
                                                strokeWidth={3} 
                                                dot={{ r: 5, strokeWidth: 2, fill: '#ffffff', stroke: '#4f46e5' }} 
                                                activeDot={{ r: 7, strokeWidth: 2, fill: '#ffffff', stroke: '#4f46e5' }}
                                                connectNulls={true}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : <p className="empty-state">Não há dados de meses anteriores para gerar tendências.</p>}
                            </div>

                            {/* Gráfico de Rosca (CORRIGIDO) */}
                            <div className="chart-card small-chart">
                                <h3 className="chart-title">Distribuição de Status (Total)</h3>
                                {pieChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={350}>
                                        <PieChart>
                                            <Pie
                                                data={pieChartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={90} 
                                                outerRadius={130}
                                                fill="#8884d8"
                                                paddingAngle={3}
                                                dataKey="value"
                                                nameKey="name"
                                                labelLine={false}
                                                label={false}
                                            >
                                                {pieChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }} />
                                            
                                            {pieChartData.length > 0 && (
                                                <Label 
                                                    content={({ viewBox }) => {
                                                        if (viewBox && viewBox.cx && viewBox.cy) {
                                                            const { cx, cy } = viewBox;
                                                            return (
                                                                <React.Fragment>
                                                                    <text x={cx} y={cy} dy={-5} textAnchor="middle" fill="#1e293b" fontSize="2.5rem" fontWeight="bold">
                                                                        {pieChartTotal}
                                                                    </text>
                                                                    <text x={cx} y={cy} dy={25} textAnchor="middle" fill="#64748b" fontSize="1rem">
                                                                        Total de B.Os
                                                                    </text>
                                                                </React.Fragment>
                                                            );
                                                        }
                                                        return null;
                                                    }} 
                                                    position="center" 
                                                />
                                            )}
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : <p className="empty-state">Não há boletins para exibir.</p>}
                            </div>
                        </div>

                        {/* 3. Stat Cards (Atividade Recente) */}
                        <h2 className="content-title" style={{marginTop: '30px'}}><i className="fas fa-history"></i> Atividade Recente (Últimos 30 Dias)</h2>
                        <div className="stat-grid">
                            <StatCardReports title="Promoções" value={stats.historico?.promocao ?? 0} icon="fa-arrow-up" color="#10b981" />
                            <StatCardReports title="Rebaixamentos" value={stats.historico?.rebaixamento ?? 0} icon="fa-arrow-down" color="#f59e0b" />
                            <StatCardReports title="Demissões" value={stats.historico?.demissao ?? 0} icon="fa-user-slash" color="#ef4444" />
                            <StatCardReports title="Novos Alistamentos" value={stats.historico?.aprovacao ?? 0} icon="fa-user-plus" color="#0ea5e9" />
                        </div>

                        {/* 4. Stat Cards (Efetivo RH) */}
                        {user?.permissoes?.is_rh && (
                            <>
                                <h2 className="content-title" style={{marginTop: '30px'}}><i className="fas fa-users-cog"></i> Resumo de Efetivo (RH)</h2>
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
                            <StrategicReportCard
                                title="Relatório de Criminalidade"
                                description="Análise de tipos de crime, comparativos mensais e mapas de calor."
                                icon="fa-map-marked-alt"
                                onClick={() => setView('heatmap')}
                            />
                             <StrategicReportCard
                                title="Análise de Tendências"
                                description="Identifique aumentos ou diminuições em atividades criminosas específicas."
                                icon="fa-chart-line"
                                onClick={() => setView('trends')}
                            />
                            <StrategicReportCard
                                title="Relatório de Eficiência Operacional"
                                description="Tempo médio de resposta, taxa de solução de casos e performance."
                                icon="fa-tachometer-alt"
                                disabled={true} 
                            />
                            <StrategicReportCard
                                title="Produtividade por Unidade"
                                description="Compare o desempenho entre diferentes divisões, distritos e corporações."
                                icon="fa-sitemap"
                                disabled={true}
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
        <div className="page-container reports-page" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>
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


// --- [INÍCIO] COMPONENTE PRINCIPAL (PAINEL POLICIA) ---
const PainelPolicia = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [currentView, setCurrentView] = useState('loading');
    const [navProps, setNavProps] = useState({});
    const [isBugModalOpen, setIsBugModalOpen] = useState(false);
    
    useEffect(() => {
        const path = location.pathname;
        
        if (path === '/policia/dashboard' || path === '/policia' || path === '/policia/') {
            setCurrentView('dashboard');
        } else if (path === '/policia/boletins') {
            setCurrentView('boletins');
        } else if (path.startsWith('/policia/boletim/')) {
            const id = path.split('/')[3];
            setCurrentView('boletimDetail');
            setNavProps({ boletimId: id, startInEditMode: location.state?.startInEditMode || false });
        } else if (path === '/policia/policiais') {
            setCurrentView('policiais');
        } else if (path.startsWith('/policia/perfil/')) {
            const id = path.split('/')[3] || (user ? user.id : null);
            if(id) { 
                setCurrentView('profile');
                setNavProps({ policialId: id });
            } else {
                setCurrentView('dashboard');
                if (location.pathname !== '/policia/dashboard') { 
                    navigate('/policia/dashboard', { replace: true });
                }
            }
        } else if (path === '/policia/relatorios') {
            setCurrentView('relatorios');
        } else if (path === '/policia/admin') {
            setCurrentView('admin');
        } else if (path === '/policia/logs') {
            setCurrentView('logs');
        }
        else if (path === '/policia/relatorios/criminalidade') {
            setCurrentView('heatmap');
        } else if (path === '/policia/relatorios/tendencias') {
            setCurrentView('trends');
        }
        else {
            setCurrentView('dashboard');
            if (location.pathname !== '/policia/dashboard') {
                navigate('/policia/dashboard', { replace: true });
            }
        }
    }, [location.pathname, user, navigate]);

    const setView = useCallback((view, props = {}) => {
        let newPath = '/policia/dashboard';
        if (view === 'boletimDetail') {
            newPath = `/policia/boletim/${props.boletimId}`;
        } else if (view === 'profile') {
            newPath = `/policia/perfil/${props.policialId}`;
        } else if (view === 'heatmap') {
            newPath = '/policia/relatorios/criminalidade';
        } else if (view === 'trends') {
            newPath = '/policia/relatorios/tendencias';
        } else if (view !== 'dashboard') {
            newPath = `/policia/${view}`;
        }

        if (location.pathname === newPath) {
             setCurrentView(view);
             setNavProps(props);
        } else {
            navigate(newPath, { state: props });
        }
    }, [navigate, location.pathname]);

    const renderView = () => {
        if (user?.permissoes?.is_rh && (currentView === 'admin' || currentView === 'logs')) {
             return (
                <PainelRH
                    user={user}
                    token={token}
                    logout={logout}
                    currentView={currentView}
                    setView={setView} 
                    navProps={navProps}
                />
            );
        }

        switch (currentView) {
            case 'dashboard':
                return <DashboardView user={user} token={token} logout={logout} setView={setView} />;
            case 'boletins':
                return <ConsultaBoletinsView user={user} token={token} logout={logout} setView={setView} />;
            case 'boletimDetail':
                return <BoletimDetailView user={user} token={token} logout={logout} setView={setView} navProps={navProps} />;
            case 'policiais':
                return <ListaPoliciaisView user={user} token={token} logout={logout} setView={setView} />;
            case 'profile':
                return <ProfileView user={user} token={token} logout={logout} setView={setView} navProps={navProps} />;
            case 'relatorios':
                return <RelatoriosView user={user} token={token} logout={logout} setView={setView} />;
            case 'heatmap':
                return <HeatmapPage />;
            case 'trends':
                return <AnaliseTendenciasPage />;
            default:
                return <DashboardView user={user} token={token} logout={logout} setView={setView} />;
        }
    };

    if (currentView === 'loading') {
        return (
            <div className="police-dashboard-container">
                <PainelPoliciaSidebar 
                    currentView={currentView} 
                    setView={() => {}} 
                    onReportBugClick={() => setIsBugModalOpen(true)} 
                    user={user} 
                    logout={logout} 
                />
                <main className="main-content">
                    <div className="page-container">
                        <p style={{textAlign: 'center', fontSize: '1.2rem', color: '#64748b'}}>Carregando...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <>
            <div className="police-dashboard-container">
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
            
            <ReportBugModal 
                isOpen={isBugModalOpen}
                onClose={() => setIsBugModalOpen(false)}
                token={token} 
                logout={logout}
            />
        </>
    );
};

// --- [INÍCIO] COMPONENTE SIDEBAR (INTERNALIZADO) ---
const PainelPoliciaSidebar = ({ currentView, setView, onReportBugClick, user, logout }) => {
    const userInitial = user?.nome_completo ? user.nome_completo[0].toUpperCase() : '?';

    const NavButton = ({ viewName, icon, text }) => {
        let isActive = currentView === viewName;
        if (viewName === 'relatorios' && (currentView === 'heatmap' || currentView === 'trends')) {
            isActive = true;
        }

        return (
            <button 
                onClick={() => setView(viewName)} 
                className={`sidebar-nav-button ${isActive ? 'active' : ''}`}
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