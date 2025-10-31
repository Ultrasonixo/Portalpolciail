import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Importa os estilos CSS
import '../components/RelatoriosPage.css';
import '../components/AnaliseTendenciasPage.css';

// NOVO: Componente de Spinner de Carregamento
const LoadingSpinner = () => (
    <div className="loading-spinner-overlay">
        <div className="loading-spinner"></div>
    </div>
);

// AJUSTE: Componente SummaryCard melhorado
const SummaryCard = ({ title, value, change, icon, changeType = 'neutral' }) => {
    // Se o valor principal é N/A, simplifica o 'change'
    const displayValue = value || 'N/A';
    const displayChange = (value === 'N/A' && changeType !== 'neutral') ? 'Sem dados' : change;

    // Adiciona classe 'disabled' se for N/A
    const cardClass = `summary-card ${changeType} ${displayValue === 'N/A' ? 'disabled' : ''}`;
    
    return (
        <div className={cardClass}>
            <div className="summary-icon">
                <i className={`fas ${icon}`}></i>
            </div>
            <div className="summary-info">
                <span className="summary-title">{title}</span>
                <span className="summary-value">{displayValue}</span>
                
                {/* Só mostra a linha 'change' se 'displayChange' existir */}
                {displayChange && (
                    <span className="summary-change">
                        {changeType === 'increase' && '▲ '}
                        {changeType === 'decrease' && '▼ '}
                        {displayChange}
                    </span>
                )}
            </div>
        </div>
    );
};

// NOVO: Tooltip personalizado para o gráfico
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="custom-tooltip">
                <p className="tooltip-label">{label}</p>
                {payload.map(p => (
                    <p key={p.dataKey} style={{ color: p.color, margin: '0 0 4px 0', fontWeight: '500' }}>
                        {`${p.dataKey}: ${p.value}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// AJUSTE: Componente TrendsChart (legenda no topo e tooltip novo)
const TrendsChart = ({ data, types }) => (
    <div className="grafico-container">
        <ResponsiveContainer width="100%" height={400}>
            <AreaChart
                data={data}
                margin={{ top: 10, right: 30, left: 0, bottom: 40 }}
            >
                <defs>
                    {types.map(tipo => (
                        <linearGradient key={tipo.nome} id={`color${tipo.nome.replace(/[^a-zA-Z0-9]/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={tipo.cor} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={tipo.cor} stopOpacity={0}/>
                        </linearGradient>
                    ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                    dataKey="mes_ano_formatado" 
                    angle={-45} 
                    textAnchor="end"
                    height={70}
                    interval={0}
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    stroke="#cbd5e1"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} stroke="#cbd5e1" />
                
                {/* AJUSTE: Tooltip e Legenda */}
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={40} wrapperStyle={{paddingTop: '10px'}} />

                {types.map(tipo => (
                    <Area
                        key={tipo.nome}
                        type="monotone"
                        dataKey={tipo.nome}
                        stroke={tipo.cor}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill={`url(#color${tipo.nome.replace(/[^a-zA-Z0-9]/g, '')})`}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                    />
                ))}
            </AreaChart>
        </ResponsiveContainer>
    </div>
);

// --- Componente Principal (Lógica) ---
const AnaliseTendenciasPage = () => {
    const { token, logout } = useAuth();
    const navigate = useNavigate();
    const [tendencias, setTendencias] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTendencias = async () => {
            setLoading(true);
            setError(null);
            if (!token) {
                setError('Autenticação necessária.');
                setLoading(false);
                return;
            }
            try {
                // Simulação de delay para ver o spinner
                // await new Promise(resolve => setTimeout(resolve, 1000)); 

                const response = await fetch('/api/policia/relatorios/tendencias', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) {
                    if (logout && (response.status === 401 || response.status === 403)) logout();
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData.message || `Erro ${response.status} ao buscar tendências.`);
                }
                const data = await response.json();
                setTendencias(data);
            } catch (err) {
                setError(`Falha ao carregar dados: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchTendencias();
    }, [token, logout]);

    const colorPalette = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#00C49F", "#FFBB28", "#FF8042"];
    const getColor = (index) => colorPalette[index % colorPalette.length];

    // useMemo (Lógica de cálculo)
    const { dadosGrafico, tiposDeCrime, analise } = useMemo(() => {
        if (!tendencias) return { dadosGrafico: [], tiposDeCrime: [], analise: null };

        const dadosPorMes = {};
        const todosTipos = new Set();

        Object.entries(tendencias).forEach(([tipo, dadosMensais]) => {
            todosTipos.add(tipo);
            dadosMensais.forEach(({ mes_ano, contagem }) => {
                if (!dadosPorMes[mes_ano]) dadosPorMes[mes_ano] = { mes_ano };
                dadosPorMes[mes_ano][tipo] = contagem;
            });
        });

        const tiposArray = Array.from(todosTipos).sort();
        const coresPorTipo = Object.fromEntries(tiposArray.map((tipo, index) => [tipo, getColor(index)]));

        const formatarMesAno = (mesAno) => {
            if (!mesAno || !mesAno.includes('-')) return '';
            const [ano, mes] = mesAno.split('-');
            const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
            return `${meses[parseInt(mes, 10) - 1]}/${ano.slice(2)}`;
        };

        const dadosGraficoFinal = Object.values(dadosPorMes).map(mes => {
            const mesCompleto = { ...mes, mes_ano_formatado: formatarMesAno(mes.mes_ano) };
            tiposArray.forEach(tipo => {
                mesCompleto[tipo] = mesCompleto[tipo] || 0;
            });
            return mesCompleto;
        }).sort((a, b) => a.mes_ano.localeCompare(b.mes_ano));

        // AJUSTE: Valores padrão 'N/A' mais limpos
        let analiseCalculada = {
            maiorAumento: { tipo: 'N/A', variacao: null },
            maiorQueda: { tipo: 'N/A', variacao: null },
            maisFrequente: { tipo: 'N/A', contagem: 0 },
            resumo: 'Não há dados suficientes para uma análise de tendências.'
        };

        if (dadosGraficoFinal.length >= 2) {
            const ultimoMes = dadosGraficoFinal[dadosGraficoFinal.length - 1];
            const penultimoMes = dadosGraficoFinal[dadosGraficoFinal.length - 2];
            let maiorAumentoAbsoluto = 0;
            let maiorQuedaAbsoluta = 0;

            tiposArray.forEach(tipo => {
                const contagemAtual = ultimoMes[tipo] || 0;
                const contagemAnterior = penultimoMes[tipo] || 0;
                const variacao = contagemAtual - contagemAnterior;

                if (variacao > maiorAumentoAbsoluto) {
                    maiorAumentoAbsoluto = variacao;
                    analiseCalculada.maiorAumento = { tipo, variacao: `+${variacao}` };
                }
                if (variacao < maiorQuedaAbsoluta) {
                    maiorQuedaAbsoluta = variacao;
                    analiseCalculada.maiorQueda = { tipo, variacao: `${variacao}` };
                }
            });
            
            let maxContagem = -1;
            tiposArray.forEach(tipo => {
                const contagemAtual = ultimoMes[tipo] || 0;
                if (contagemAtual > maxContagem) {
                    maxContagem = contagemAtual;
                    analiseCalculada.maisFrequente = { tipo, contagem: contagemAtual };
                }
            });
            
            analiseCalculada.resumo = `Análise comparativa entre ${formatarMesAno(penultimoMes.mes_ano)} e ${formatarMesAno(ultimoMes.mes_ano)}.`;
        } else if (dadosGraficoFinal.length === 1) {
             analiseCalculada.resumo = `Dados disponíveis apenas para ${formatarMesAno(dadosGraficoFinal[0].mes_ano)}.`;
             
             // Popula "Mais Frequente" mesmo com um mês só
             let maxContagem = -1;
             tiposArray.forEach(tipo => {
                const contagemAtual = dadosGraficoFinal[0][tipo] || 0;
                if (contagemAtual > maxContagem) {
                    maxContagem = contagemAtual;
                    analiseCalculada.maisFrequente = { tipo, contagem: contagemAtual };
                }
            });
        }

        return {
            dadosGrafico: dadosGraficoFinal,
            tiposDeCrime: tiposArray.map(tipo => ({ nome: tipo, cor: coresPorTipo[tipo] })),
            analise: analiseCalculada
        };
    }, [tendencias]);

    // --- JSX (Renderização da Página) ---
    return (
        <div className="page-container reports-page">
            <header className="report-header">
                <h1 className="page-title">Análise de Tendências Criminais</h1>
                 <button onClick={() => navigate(-1)} className="nav-button">
                    <i className="fas fa-arrow-left"></i> Voltar
                </button>
            </header>

            <main className="report-content">
                {/* AJUSTE: Usa o Spinner */}
                {loading && <LoadingSpinner />}
                {error && <p className="error-message">{error}</p>}

                {!loading && !error && analise && (
                    <div className="widget">
                        <h2 className="content-title"><i className="fas fa-search-plus"></i> Resumo da Análise</h2>
                        <p className="content-subtitle">{analise.resumo}</p>
                        <div className="summary-grid">
                            <SummaryCard 
                                title="Maior Aumento"
                                value={analise.maiorAumento.tipo}
                                change={analise.maiorAumento.variacao}
                                icon="fa-arrow-trend-up"
                                changeType="increase"
                            />
                            <SummaryCard 
                                title="Maior Queda"
                                value={analise.maiorQueda.tipo}
                                change={analise.maiorQueda.variacao}
                                icon="fa-arrow-trend-down"
                                changeType="decrease"
                            />
                            <SummaryCard 
                                title="Mais Frequente (Últ. Mês)"
                                value={analise.maisFrequente.tipo}
                                change={`${analise.maisFrequente.contagem} casos`}
                                icon="fa-star"
                                // AJUSTE: Novo tipo "info" para cor azul
                                changeType="info"
                            />
                        </div>
                    </div>
                )}

                {/* AJUSTE: Verificação de dados mais limpa */}
                {!loading && !error && dadosGrafico.length > 0 && (
                    <div className="widget">
                        <h2 className="content-title"><i className="fas fa-chart-area"></i> Evolução Mensal de Ocorrências</h2>
                        <TrendsChart data={dadosGrafico} types={tiposDeCrime} />
                    </div>
                )}
                
                {/* AJUSTE: Novo "Empty State" estilizado */}
                {!loading && !error && dadosGrafico.length === 0 && (
                    <div className="widget empty-state-widget">
                        <i className="fas fa-chart-pie empty-state-icon"></i>
                        <h3 className="empty-state-title">Nenhum dado encontrado</h3>
                        <p className="empty-state-text">Não há dados de ocorrência suficientes para gerar uma análise de tendências.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AnaliseTendenciasPage;