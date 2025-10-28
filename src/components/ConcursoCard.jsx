// src/components/ConcursoCard.jsx

import React from 'react';
import './ConcursoCard.css';

const ConcursoCard = ({ concurso }) => {
    // 1. ADICIONADO 'descricao' à lista de propriedades
    const { titulo, vagas, data_encerramento, status, link_edital, valor, descricao } = concurso;

    const isEncerrado = status === 'Encerrado';

    const formatarData = (data) => {
        if (!data) return 'Não definida';
        const dataObj = new Date(data);
        dataObj.setMinutes(dataObj.getMinutes() + dataObj.getTimezoneOffset());
        return dataObj.toLocaleDateString('pt-BR');
    };

    return (
        <div className="concurso-card">
            <div className="card-header">
                <h3>{titulo}</h3>
                <span className={`status-tag status-${status.toLowerCase()}`}>
                    {status}
                </span>
            </div>
            
            <div className="card-body">
                {/* 2. ADICIONADO: Parágrafo para exibir a descrição */}
                <p className="card-description">{descricao}</p>

                <div className="info-row">
                    <span><i className="fas fa-briefcase"></i> {vagas} Vagas</span>
                    <span><i className="fas fa-calendar-times"></i> Encerra em: {formatarData(data_encerramento)}</span>
                </div>
                {valor && (
                    <div className="valor-row">
                        <span>{valor}</span>
                    </div>
                )}
            </div>

            <div className="card-footer">
                <button
                    onClick={() => window.open(link_edital, '_blank')}
                    className="btn-acessar-edital"
                    disabled={isEncerrado}
                >
                    {isEncerrado ? 'Concurso Encerrado' : 'Acessar Edital →'}
                </button>
            </div>
        </div>
    );
};

export default ConcursoCard;