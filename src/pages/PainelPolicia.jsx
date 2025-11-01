import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from 'react-toastify';
import LocationPickerMap from '../components/LocationPickerMap.jsx'; 
import PainelRH from './PainelRH.jsx'; 
import HeatmapPage from './HeatmapPage.jsx';
import AnaliseTendenciasPage from './AnaliseTendenciasPage.jsx';
// ✅ Importar Framer Motion para o seletor de abas
import { motion, AnimatePresence } from 'framer-motion';

// Importa os gráficos do Recharts
import { 
    AreaChart, Area, PieChart, Pie, Cell, Tooltip, Legend, 
    ResponsiveContainer, XAxis, YAxis, CartesianGrid, Label
} from 'recharts';

// Importa os CSS necessários
import '../components/PoliceDashboard.css';
import '../components/BoletimDetailPage.css'; 
import '../components/ConsultaBoletins.css';
import '../components/RelatoriosPage.css';

// --- ÍCONES ANIMADOS (Reutilizados) ---
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

// --- MOCK DATA SIMULANDO API (Para conexão real futura) ---
const mockRelatorios = [
    {
        id: 1, titulo: "Operação Cerco Fechado", autor: "Agente Silva", autor_id: 101,
        data_envio: "2025-10-25T10:00:00Z", status: "pendente",
        resumo: "Relatório detalhando a operação de contenção de roubos na área central. Enfatiza a necessidade de mais efetivo noturno.",
        conteudo_completo: "Conteúdo completo do relatório 1. Necessidade de mais recursos no setor 3."
    },
    {
        id: 2, titulo: "Análise de Furtos de Veículos - Setembro", autor: "Oficial Souza", autor_id: 205,
        data_envio: "2025-09-30T15:30:00Z", status: "aprovado",
        resumo: "Estudo estatístico sobre a incidência de furtos de veículos no mês de Setembro, identificando os 3 bairros de maior risco.",
        conteudo_completo: "Conteúdo completo da análise aprovada. Recomendamos patrulhamento intensificado.",
        analisado_por: "Coronel Santos", data_aprovacao: "2025-10-01T11:00:00Z",
    },
    {
        id: 3, titulo: "Proposta de Novo Protocolo", autor: "Sargento Lima", autor_id: 312,
        data_envio: "2025-10-20T08:00:00Z", status: "rejeitado",
        resumo: "Sugestão de alteração no protocolo padrão de abordagem.",
        conteudo_completo: "Proposta rejeitada por requerer treinamento especializado que não está disponível no momento.",
        analisado_por: "Capitão Costa", data_aprovacao: "2025-10-21T14:00:00Z",
    },
    {
        id: 4, titulo: "Monitoramento de Grupos de Risco", autor: "Delegado Ferreira", autor_id: 401,
        data_envio: "2025-10-28T11:45:00Z", status: "pendente",
        resumo: "Relatório de inteligência sobre a atividade de dois grupos de interesse especial na região oeste.",
        conteudo_completo: "Conteúdo completo e sigiloso do relatório de monitoramento. Requer aprovação de nível superior para início das ações de campo.",
    },
];

const useRelatoriosData = (type, token) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true); setError(null);
        // Simulação de delay para a API
        await new Promise(resolve => setTimeout(resolve, 500)); 
        
        try {
            if (!token) throw new Error("Token não disponível.");
            
            if (type === 'pendente') {
                setData(mockRelatorios.filter(r => r.status === 'pendente'));
            } else if (type === 'analisado') {
                setData(mockRelatorios.filter(r => r.status === 'aprovado' || r.status === 'rejeitado'));
            } else {
                setData([]);
            }
        } catch (err) {
            console.error(`Erro ao buscar relatórios (${type}):`, err);
            setError(err.message || 'Falha ao carregar relatórios.');
        } finally {
            setLoading(false);
        }
    }, [type, token]);

    useEffect(() => { fetchData(); }, [fetchData]);

    return { data, loading, error, fetchData };
};
// --- FIM MOCK DATA HOOK ---


// --- Componente AUXILIAR: Detalhes do Relatório (Modal) ---
const RelatorioDetalhesModal = ({ isOpen, onClose, relatorio }) => {
    if (!isOpen || !relatorio) return null;

    const isAprovado = relatorio.status === 'aprovado';
    const isRejeitado = relatorio.status === 'rejeitado';

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '700px' }}>
                <div className="modal-header">
                    <h3>Detalhes do Relatório: {relatorio.titulo}</h3>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>
                <div className="modal-body space-y-4 p-5" style={{maxHeight: '80vh'}}>
                    <p className="text-sm text-gray-500">
                        Enviado por: <span className="font-medium text-gray-800">{relatorio.autor}</span> em <span className="font-medium text-gray-800">{new Date(relatorio.data_envio).toLocaleDateString()}</span>
                    </p>

                    <div className={`p-3 rounded-lg flex items-center gap-3 ${isAprovado ? 'bg-green-100 text-green-700' : isRejeitado ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        <i className={`fas ${isAprovado ? 'fa-check-circle' : isRejeitado ? 'fa-thumbs-down' : 'fa-hourglass-half'}`}></i>
                        <span className="font-semibold">Status: {relatorio.status.toUpperCase()}</span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mt-4">Conteúdo Completo</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 whitespace-pre-wrap text-gray-700 text-sm">
                        {relatorio.conteudo_completo}
                    </div>

                    {(isAprovado || isRejeitado) && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <p className="text-sm text-gray-500">
                                Analisado por: <span className="font-medium text-gray-800">{relatorio.analisado_por}</span> em <span className="font-medium text-gray-800">{new Date(relatorio.data_aprovacao).toLocaleDateString()}</span>
                            </p>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button onClick={onClose} className="btn-secondary">Fechar</button>
                </div>
            </div>
        </div>
    );
};


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