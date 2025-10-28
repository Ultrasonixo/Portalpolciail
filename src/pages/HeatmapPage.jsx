// src/pages/HeatmapPage.jsx (Versão Final - Filtro Corrigido, Logs Removidos)

import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, ImageOverlay, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat'; // Importa a biblioteca leaflet.heat
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

// Dimensões e Limites
const MAP_IMAGE_WIDTH = 8192;
const MAP_IMAGE_HEIGHT = 8192;
const bounds = new L.LatLngBounds(new L.LatLng(-MAP_IMAGE_HEIGHT, 0), new L.LatLng(0, MAP_IMAGE_WIDTH));

// Cores por Crime (para os filtros)
const CRIME_TYPE_COLORS = {
    'Agressão': '#FF4500', 'Ameaça': '#FF6347', 'Desacato': '#FF7F50',
    'Desaparecimento': '#4682B4', 'Estelionato': '#FFD700', 'Extorsão': '#FF8C00',
    'Furto': '#FFFF00', 'Homicídio': '#FF0000', 'Latrocínio': '#8B0000',
    'Perturbação': '#FFC0CB', 'Posse/Porte Ilegal de Arma': '#00BFFF',
    'Roubo': '#FFA500', 'Sequestro': '#DC143C', 'Tráfico de Drogas': '#800080',
    'Vandalismo': '#808000', 'Veículo Recuperado': '#00FF00',
    'Violência Doméstica': '#B22222', 'Outros': '#AAAAAA', 'default': '#AAAAAA'
};

// --- COMPONENTE PARA A CAMADA DE HEATMAP (Com tentativa de otimização, sem logs) ---
const HeatmapLayerComponent = ({ points, options }) => {
    const map = useMap();

    useEffect(() => {
        if (!map || points.length === 0) return;

        let heatLayer = null;
        let canvasElement = null;

        try {
            heatLayer = L.heatLayer(points, options);
            heatLayer.addTo(map);

            // Tentativa de otimização (sem logs)
            canvasElement = heatLayer._canvas;
            if (canvasElement && canvasElement.getContext) {
                canvasElement.getContext('2d', { willReadFrequently: true });
                // console.log("Atributo 'willReadFrequently' definido..."); // Log removido
            } else {
                // console.warn("Não foi possível acessar o canvas..."); // Log removido
            }

        } catch (error) {
            console.error("Erro ao criar ou otimizar a camada de heatmap:", error);
            if (heatLayer && map.hasLayer(heatLayer)) {
                map.removeLayer(heatLayer);
            }
            return;
        }

        // Função de limpeza
        return () => {
            if (heatLayer && map.hasLayer(heatLayer)) {
                map.removeLayer(heatLayer);
            }
        };
    }, [map, points, options]);

    return null;
};


// --- COMPONENTE PRINCIPAL DA PÁGINA ---
const HeatmapPage = () => {
    const { token, logout } = useAuth();
    const navigate = useNavigate();
    const [allCrimeData, setAllCrimeData] = useState([]);
    const [crimeTypes, setCrimeTypes] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Busca os dados da API
    useEffect(() => {
        const fetchHeatmapData = async () => {
            setLoading(true); setError(null);
            if (!token) { setError('Token não encontrado.'); setLoading(false); return; }
            try {
                const response = await fetch('http://localhost:3000/api/crimes/heatmap-data', { headers: { 'Authorization': `Bearer ${token}` } });
                if (response.status === 401 || response.status === 403) { if (logout) logout(); throw new Error('Sessão inválida.'); }
                if (!response.ok) throw new Error(`Erro ${response.status} ao buscar dados.`);
                const data = await response.json();
                if (!Array.isArray(data)) throw new Error("Formato de dados inválido.");
                setAllCrimeData(data);
            } catch (err) { setError(`Falha ao buscar: ${err.message}`); }
            finally { setLoading(false); }
        };
        fetchHeatmapData();
    }, [token, logout]); // Adicionado logout como dependência

    // Processa os dados brutos para agrupar por tipo de crime
    useEffect(() => {
        if (allCrimeData.length > 0) {
            const types = allCrimeData.reduce((acc, crime) => {
                const typeRaw = crime?.tipo || 'Outros';
                const type = typeRaw.charAt(0).toUpperCase() + typeRaw.slice(1).toLowerCase();
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
        } else { setCrimeTypes({}); }
    }, [allCrimeData]);

    // Handler para mudança nos filtros
    const handleFilterChange = (type) => {
        setCrimeTypes(prev => ({ ...prev, [type]: { ...prev[type], visible: !prev[type].visible } }));
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
        // gradient: { 0.4: 'blue', 0.65: 'lime', 1: 'red' }
    }), []);


    // --- JSX COM LAYOUT ---
    return (
        <div className="page-container" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', position: 'relative' }}>

            {/* Botão Voltar e Mensagens */}
            <button
                onClick={() => navigate(-1)}
                style={{ position: 'absolute', top: -20, left: 20, zIndex: 1001, padding: '8px 12px', background: 'rgba(255,255,255,0.9)', border: '1px solid #ccc', borderRadius: '5px', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
            >
                <i className="fas fa-chevron-left"></i> Voltar
            </button>
            {loading && <p className="loading-overlay">Carregando dados...</p>}
            {error && <p className="error-overlay">{error}</p>}

            <div style={{ flexGrow: 1, width: '100%', height: '100%', position: 'relative' }}>
                <MapContainer
                    center={[-MAP_IMAGE_HEIGHT / 2, MAP_IMAGE_WIDTH / 2]}
                    zoom={0} minZoom={-2} maxZoom={5}
                    crs={L.CRS.Simple}
                    style={{ height: '100%', width: '100%', backgroundColor: '#000' }}
                    maxBounds={bounds} maxBoundsViscosity={1.0}
                >
                    <ImageOverlay url="/mapa_gta.png" bounds={bounds} opacity={0.7} />

                    {/* Renderiza a camada de heatmap */}
                    {!loading && !error && heatmapPoints.length > 0 && (
                        <HeatmapLayerComponent points={heatmapPoints} options={heatmapOptions} />
                    )}

                </MapContainer>

                {/* Painel de Filtros (Com lógica de clique corrigida) */}
                {!loading && !error && Object.keys(crimeTypes).length > 0 && (
                     <aside className="filter-panel">
                        {Object.entries(crimeTypes).sort((a, b) => b[1].count - a[1].count).map(([type, details]) => (
                            <div key={type} className="filter-item" data-visible={details.visible}>
                                <input
                                    type="checkbox"
                                    id={`filter-${type}`}
                                    checked={details.visible}
                                    onChange={() => handleFilterChange(type)} // Único handler
                                    style={{ marginRight: '8px', height: '16px', width: '16px', cursor: 'pointer' }}
                                />
                                <label htmlFor={`filter-${type}`} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}>
                                    <span className="color-box" style={{ backgroundColor: details.color }}></span>
                                    <span>{type} ({details.count})</span>
                                </label>
                            </div>
                        ))}
                    </aside>
                )}
            </div>
        </div>
    );
};

export default HeatmapPage;