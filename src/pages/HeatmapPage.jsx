import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, ImageOverlay, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat'; // Importa a biblioteca leaflet.heat
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Importa os CSS necessários para os componentes
import '../components/PoliceDashboard.css'; 
import '../components/Modal.css'; 
import '../components/AnaliseTendenciasPage.css'; // Para o spinner de loading

// --- [INÍCIO] COMPONENTES DE LAYOUT E MODAIS ---

// --- Modal: Reportar Bug (Copiado de PainelPolicia) ---
const ReportBugModal = ({ isOpen, onClose, token, logout }) => {
    const [description, setDescription] = useState('');
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description.trim()) { setStatusMessage({ type: 'error', text: 'Por favor, descreva o bug.' }); return; }
        setProcessing(true); setStatusMessage({ type: 'loading', text: 'Enviando relatório...' });

        try {
            // ✅ CORREÇÃO: Removido API_URL para usar caminho relativo
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
        } finally {
            if (!statusMessage.text.includes('sucesso')) {
                 setProcessing(false);
            }
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

// --- Componente Sidebar (Layout Tailwind) ---
const PainelPoliciaSidebar = ({ currentView, user, logout, onReportBugClick, isMobileMenuOpen, closeMobileMenu }) => {
    const userInitial = user?.nome_completo ? user.nome_completo[0].toUpperCase() : '?';
    const navigate = useNavigate();

    const NavButton = ({ viewName, icon, text }) => {
        const isActive = (currentView === 'heatmap' && viewName === 'relatorios') || currentView === viewName;

        const handleClick = () => {
            let newPath = `/policia/${viewName}`;
            if (viewName === 'dashboard') newPath = '/policia/dashboard';
            navigate(newPath);
            closeMobileMenu(); 
        };

        return (
            <button 
                onClick={handleClick}
                className={`sidebar-nav-button ${isActive ? 'active' : ''} flex items-center w-full px-4 py-3 text-sm font-medium rounded-md transition-colors ${
                    isActive
                        ? 'bg-indigo-600 text-white' 
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
            >
                <i className={`fas ${icon} w-5 text-center mr-3`}></i> 
                <span>{text}</span>
            </button>
        );
    };

    return (
        <>
            {/* Overlay Mobile */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/60 z-10 md:hidden"
                    onClick={closeMobileMenu}
                    aria-hidden="true"
                ></div>
            )}

            {/* Sidebar */}
            <aside 
                className={`w-64 fixed inset-y-0 left-0 bg-slate-800 text-slate-200 flex flex-col shadow-lg z-20 transform transition-transform duration-300 ease-in-out ${
                    isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                } md:translate-x-0`}
            >
                <div className="sidebar-header p-5 text-center border-b border-slate-700">
                    <h3 className="text-2xl font-semibold text-white">SSP-RP</h3>
                    <span className="text-sm text-slate-400">Painel de Controle</span>
                </div>

                <nav className="sidebar-nav flex-grow p-4 space-y-2 overflow-y-auto">
                    <NavButton viewName="dashboard" icon="fa-tachometer-alt" text="Dashboard" />
                    <NavButton viewName="boletins" icon="fa-file-alt" text="Boletins" />
                    <NavButton viewName="policiais" icon="fa-users" text="Policiais" />
                    <NavButton viewName="relatorios" icon="fa-chart-pie" text="Relatórios" />
                    
                    {user?.permissoes?.is_rh && (
                        <NavButton viewName="admin" icon="fa-user-shield" text="Administração" />
                    )}
                </nav>

                <div className="sidebar-footer p-4 border-t border-slate-700 mt-auto">
                    {user && (
                        <button onClick={() => { navigate(`/policia/perfil/${user.id}`); closeMobileMenu(); }} className="sidebar-profile-vertical flex items-center w-full p-2 rounded-md hover:bg-slate-700 mb-4">
                            <div className="profile-avatar-large w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-lg mr-3 flex-shrink-0">
                                <span>{userInitial}</span>
                            </div>
                            <div className="profile-info-vertical text-left overflow-hidden">
                                <span className="block font-semibold text-sm text-white truncate">{user.nome_completo || 'Usuário'}</span>
                                <small className="block text-xs text-slate-400">Ver Perfil</small>
                            </div>
                        </button>
                    )}
                    <button 
                        onClick={() => { onReportBugClick(); closeMobileMenu(); }} 
                        className="sidebar-btn bug-report-button w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-yellow-600/80 text-white hover:bg-yellow-700 mb-2"
                    >
                        <i className="fas fa-bug"></i> 
                        <span>Reportar Bug</span>
                    </button>
                    <button 
                        onClick={() => { logout(); closeMobileMenu(); }} 
                        className="sidebar-btn logout-button w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-red-600/80 text-white hover:bg-red-700"
                    >
                        <i className="fas fa-sign-out-alt"></i> 
                        <span>Sair</span>
                    </button>
                </div>
            </aside>
        </>
    );
};
// --- [FIM] COMPONENTES DE LAYOUT E MODAIS ---


// --- COMPONENTE DA CAMADA DE HEATMAP (COM CORREÇÃO DE "Source height 0") ---
const HeatmapLayerComponent = ({ points, options }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || points.length === 0) return;

        let heatLayer = null;
        let isLayerAdded = false;

        const tryAddLayer = () => {
            if (map.getSize().y > 0 && !isLayerAdded) {
                try {
                    heatLayer = L.heatLayer(points, options);
                    heatLayer.addTo(map);
                    isLayerAdded = true; 

                    // Esta é a otimização que o aviso do console sugere
                    const canvasElement = heatLayer._canvas;
                    if (canvasElement && canvasElement.getContext) {
                        canvasElement.getContext('2d', { willReadFrequently: true });
                    }
                    
                    map.off('resize', tryAddLayer);

                } catch (error) {
                    console.error("Erro ao criar camada de heatmap (na tentativa):", error.message);
                }
            }
        };

        tryAddLayer();

        if (!isLayerAdded) {
            map.on('resize', tryAddLayer);
        }

        return () => {
            map.off('resize', tryAddLayer);
            if (heatLayer && map.hasLayer(heatLayer)) {
                map.removeLayer(heatLayer);
            }
        };
        
    }, [map, points, options]); 

    return null;
};

// --- [NOVO] HEADER OTIMIZADO (COM FILTROS EMBUTIDOS) ---
const HeatmapHeader = ({
    crimeTypes,
    handleFilterChange,
    handleToggleAll,
    loading,
    error,
    onMenuClick, 
    onBackClick 
}) => {
    const getTextColor = (hexcolor) => {
        if (!hexcolor) return '#333';
        hexcolor = hexcolor.replace("#", "");
        const r = parseInt(hexcolor.substr(0, 2), 16);
        const g = parseInt(hexcolor.substr(2, 2), 16);
        const b = parseInt(hexcolor.substr(4, 2), 16);
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? '#374151' : '#ffffff';
    };
    
    const allVisible = useMemo(() => Object.values(crimeTypes).every(d => d.visible), [crimeTypes]);
    const hasFilters = Object.keys(crimeTypes).length > 0;

    return (
        <header className="bg-white shadow-sm p-4 flex flex-col md:flex-row md:items-center gap-4 z-10 flex-shrink-0">
            
            <div className="flex items-center justify-between md:justify-start flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button
                        className="md:hidden text-slate-600 hover:text-slate-900"
                        onClick={onMenuClick}
                        aria-label="Abrir menu"
                    >
                        <i className="fas fa-bars text-xl"></i>
                    </button>
                    <h1 className="text-xl font-bold text-slate-800 whitespace-nowrap">
                        Mapa de Calor
                    </h1>
                </div>

                <button
                    onClick={onBackClick}
                    className="md:hidden bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-md text-xs font-medium hover:bg-slate-50 transition-colors"
                >
                    <i className="fas fa-arrow-left mr-1"></i> 
                    Voltar
                </button>
            </div>
            
            <div className="flex-1 min-w-0">
                {hasFilters && !loading && !error && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handleToggleAll(!allVisible)}
                            title={allVisible ? 'Desmarcar Todos' : 'Marcar Todos'}
                            className={`flex-shrink-0 p-2 rounded-md text-sm font-medium transition-colors border ${
                                allVisible
                                ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                                : 'bg-white text-slate-500 hover:bg-slate-100 border-slate-300'
                            }`}
                        >
                            <i className={`fas ${allVisible ? 'fa-eye' : 'fa-eye-slash'} w-4 h-4`}></i>
                        </button>
                        
                        <div className="w-px h-6 bg-slate-300 flex-shrink-0 mx-1 hidden md:block"></div>

                        <div className="flex-1 flex flex-nowrap gap-2 overflow-x-auto p-1 scrollbar-thin">
                            {Object.entries(crimeTypes)
                                .sort((a, b) => b[1].count - a[1].count)
                                .map(([type, details]) => {
                                    const textColor = getTextColor(details.color);
                                    return (
                                        <label 
                                            key={type} 
                                            htmlFor={`filter-${type}`} 
                                            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap cursor-pointer transition-all duration-200 border
                                                ${ details.visible 
                                                    ? 'shadow-sm'
                                                    : 'bg-white text-slate-500 hover:bg-slate-100 border-slate-300'
                                                }`
                                            }
                                            style={details.visible ? { 
                                                backgroundColor: details.color, 
                                                color: textColor,
                                                borderColor: 'rgba(0,0,0,0.1)',
                                            } : {}}
                                        >
                                            <input
                                                type="checkbox"
                                                id={`filter-${type}`}
                                                checked={details.visible}
                                                onChange={() => handleFilterChange(type)}
                                                className="hidden"
                                            />
                                            <span>{type} ({details.count})</span>
                                        </label>
                                    );
                                })}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex-shrink-0 hidden md:block">
                <button
                    onClick={onBackClick}
                    className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                    <i className="fas fa-arrow-left mr-2"></i> 
                    Voltar
                </button>
            </div>
            
        </header>
    );
};


// --- SPINNER DE CARREGAMENTO (Tailwind) ---
const LoadingSpinner = () => (
    <div className="absolute inset-0 z-[1001] flex items-center justify-center bg-white/70 backdrop-blur-sm">
        <div className="loading-spinner"></div>
    </div>
);

// --- MENSAGEM DE ERRO (Tailwind) ---
const ErrorMessage = ({ error }) => (
    <div className="absolute inset-0 z-[1001] flex items-center justify-center bg-red-50/70 backdrop-blur-sm p-5">
        <p className="text-red-700 font-semibold text-center text-lg">{error}</p>
    </div>
);


// --- Componente interno para forçar os limites (maxBounds) ---
const SetMapBounds = ({ bounds }) => {
    const map = useMap();
    useEffect(() => {
        if (map) {
            map.setMaxBounds(bounds);
        }
    }, [map, bounds]);
    
    return null; 
};


// --- COMPONENTE PRINCIPAL DA PÁGINA (HEATMAP) ---
const HeatmapPage = () => {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [allCrimeData, setAllCrimeData] = useState([]);
    const [crimeTypes, setCrimeTypes] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isBugModalOpen, setIsBugModalOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // --- Definições do Mapa (usando useMemo para estabilidade) ---
    const MAP_IMAGE_WIDTH = 8192;
    const MAP_IMAGE_HEIGHT = 8192;
    
    const bounds = useMemo(() => 
        new L.LatLngBounds(
            new L.LatLng(-MAP_IMAGE_HEIGHT, 0), 
            new L.LatLng(0, MAP_IMAGE_WIDTH)
        ), [MAP_IMAGE_HEIGHT, MAP_IMAGE_WIDTH]); 

    const mapCenter = useMemo(() => 
        [-MAP_IMAGE_HEIGHT / 2, MAP_IMAGE_WIDTH / 2], 
        [MAP_IMAGE_HEIGHT, MAP_IMAGE_WIDTH]);

    const CRIME_TYPE_COLORS = useMemo(() => ({
        'Agressão': '#FF4500', 'Ameaça': '#FF6347', 'Desacato': '#FF7F50',
        'Desaparecimento': '#4682B4', 'Estelionato': '#FFD700', 'Extorsão': '#FF8C00',
        'Furto': '#FFFF00', 'Homicídio': '#FF0000', 'Latrocínio': '#8B0000',
        'Perturbação': '#FFC0CB', 'Posse/Porte Ilegal de Arma': '#00BFFF',
        'Roubo': '#FFA500', 'Sequestro': '#DC143C', 'Tráfico de Drogas': '#800080',
        'Vandalismo': '#808000', 'Veículo Recuperado': '#00FF00',
        'Violência Doméstica': '#B22222', 'Outros': '#AAAAAA', 'default': '#AAAAAA'
    }), []);
    // --- Fim Definições ---

    // Busca os dados da API
    useEffect(() => {
        const fetchHeatmapData = async () => {
            setLoading(true); setError(null);
            if (!token) { setError('Autenticação necessária.'); setLoading(false); return; }
            try {
                // Caminho relativo para a API (funcionará em produção)
                const response = await fetch('/api/crimes/heatmap-data', { 
                    headers: { 'Authorization': `Bearer ${token}` } 
                });
                
                if (response.status === 401 || response.status === 403) { 
                    if (logout) logout(); 
                    throw new Error('Sessão inválida.'); 
                }
                if (!response.ok) {
                    throw new Error(`Erro ${response.status} ao buscar dados.`);
                }
                const data = await response.json();
                if (!Array.isArray(data)) {
                    throw new Error("Formato de dados inválido.");
                }
                setAllCrimeData(data);
            } catch (err) { 
                setError(`Falha ao carregar: ${err.message}`); 
            }
            finally { setLoading(false); }
        };
        fetchHeatmapData();
    }, [token, logout]); 

    // Processa os dados brutos para agrupar por tipo de crime
    useEffect(() => {
        if (allCrimeData.length > 0) {
            const types = allCrimeData.reduce((acc, crime) => {
                const typeRaw = crime?.tipo || 'Outros';
                const type = typeRaw.charAt(0).toUpperCase() + typeRaw.slice(1); 
                if (!acc[type]) {
                    const colorKey = Object.keys(CRIME_TYPE_COLORS).find(key => key.toLowerCase() === type.toLowerCase());
                    acc[type] = {
                        color: CRIME_TYPE_COLORS[colorKey] || CRIME_TYPE_COLORS.default,
                        visible: true, count: 0
                    };
                }
                acc[type].count++;
                return acc;
            }, {});
            setCrimeTypes(types);
        } else { 
            setCrimeTypes({}); 
        }
    }, [allCrimeData, CRIME_TYPE_COLORS]);

    // Handler para mudança nos filtros
    const handleFilterChange = (type) => {
        setCrimeTypes(prev => ({ ...prev, [type]: { ...prev[type], visible: !prev[type].visible } }));
    };

    // Handler para Marcar/Desmarcar Todos
    const handleToggleAllFilters = (setAllToVisible) => {
        setCrimeTypes(prev => {
            const newTypes = { ...prev };
            Object.keys(newTypes).forEach(type => {
                newTypes[type] = { ...newTypes[type], visible: setAllToVisible };
            });
            return newTypes;
        });
    };

    // Prepara os pontos para o heatmap
    const heatmapPoints = useMemo(() => {
        const visibleTypes = Object.entries(crimeTypes)
            .filter(([, details]) => details.visible)
            .map(([type]) => type.toLowerCase());

        if (visibleTypes.length === 0) return [];

        return allCrimeData
            .filter(crime => {
                const typeRaw = crime?.tipo || 'Outros';
                return visibleTypes.includes(typeRaw.toLowerCase());
            })
            .map(crime => [ -crime.y, crime.x, 1 ]); // [Latitude, Longitude, Intensidade]
    }, [crimeTypes, allCrimeData]);

    // Opções do heatmap
    const heatmapOptions = useMemo(() => ({
        radius: 25,
        blur: 15,
        maxZoom: 4, 
    }), []);


    // --- JSX COM LAYOUT ---
    return (
        <div className="police-dashboard-container bg-slate-100">
            
            <PainelPoliciaSidebar
                currentView="heatmap"
                user={user}
                logout={logout}
                onReportBugClick={() => setIsBugModalOpen(true)}
                isMobileMenuOpen={isMobileMenuOpen}
                closeMobileMenu={() => setIsMobileMenuOpen(false)}
            />

            <main className="main-content !p-0 flex flex-col h-screen">
                
                <HeatmapHeader
                    crimeTypes={crimeTypes}
                    handleFilterChange={handleFilterChange}
                    handleToggleAll={handleToggleAllFilters}
                    loading={loading}
                    error={error}
                    onMenuClick={() => setIsMobileMenuOpen(true)}
                    onBackClick={() => navigate('/policia/relatorios')}
                />

                <div className="flex-1 relative overflow-hidden">
                    {loading && <LoadingSpinner />}
                    {error && <ErrorMessage error={error} />}
                    
                    <MapContainer
                        center={mapCenter}
                        zoom={0} 
                        minZoom={-2} 
                        maxZoom={5}
                        crs={L.CRS.Simple}
                        style={{ height: '100%', width: '100%', backgroundColor: '#000' }}
                        maxBoundsViscosity={1.0} 
                        zoomControl={true} 
                        className="z-0" 
                    >
                        <ImageOverlay url="/mapa_gta.png" bounds={bounds} opacity={0.7} />
                        
                        <SetMapBounds bounds={bounds} />

                        {!loading && !error && heatmapPoints.length > 0 && (
                            <HeatmapLayerComponent points={heatmapPoints} options={heatmapOptions} />
                        )}
                    </MapContainer>
                </div>
            </main>

            <ReportBugModal
                isOpen={isBugModalOpen}
                onClose={() => setIsBugModalOpen(false)}
                token={token}
                logout={logout}
            />
        </div>
    );
};

export default HeatmapPage;