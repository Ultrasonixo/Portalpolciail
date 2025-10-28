// src/components/LogDetails.jsx (Completo com formatação e container no default)

import React from 'react';
import './design/LogsPage.css'; // Reutilizando o CSS da página de logs

// Componente auxiliar para item de detalhe (Label: Valor)
const DetailItem = ({ label, value }) => (
    <div className="detail-item">
        <span className="detail-label">{label}:</span>
        <span className="detail-value">{value || 'N/A'}</span> {/* Mostra N/A se o valor for nulo/vazio */}
    </div>
);

// Componente principal que formata os detalhes
const LogDetails = ({ action, details }) => {

    // Se 'details' não for um objeto (ou for null/undefined), mostra como texto simples DENTRO do container
    if (!details || typeof details !== 'object') {
        return (
            <div className="details-container raw-details">
                {details || 'Nenhum detalhe disponível.'}
            </div>
        );
    }

    // Formata os detalhes com base no tipo de ação
    switch (action) {
        case 'Manage Career':
            return (
                <div className="details-container">
                    <DetailItem label="Policial" value={`${details.targetName || ''} (ID: ${details.targetUserId})`} />
                    <DetailItem label="Patente Anterior" value={details.previousRank} />
                    <DetailItem label="Nova Patente" value={<span style={{ color: '#10b981', fontWeight: 'bold' }}>{details.newRank}</span>} /> {/* Destaque verde */}
                </div>
            );

        case 'Approve Recruit':
        case 'Reject Recruit':
            return (
                <div className="details-container">
                    <DetailItem label="Recruta" value={`${details.targetName || ''} (ID: ${details.targetUserId})`} />
                    <DetailItem label="Novo Status" value={details.newStatus} />
                    {/* Mostra divisão e patente apenas se existirem nos detalhes (caso de aprovação) */}
                    {details.division && <DetailItem label="Divisão" value={details.division} />}
                    {details.rank && <DetailItem label="Patente Inicial" value={details.rank} />}
                </div>
            );

        case 'Dismiss Policial':
            return (
                <div className="details-container">
                    <DetailItem label="Policial Demitido" value={`${details.targetName || ''} (ID: ${details.targetUserId})`} />
                </div>
            );

        // Formatação para Geração de Token (verifica nomes alternativos das propriedades)
        case 'Generate Registration Token': // Confirme se o nome da ação no backend é exatamente este
        case 'Generate Token': // Ou este
            return (
                <div className="details-container">
                    <DetailItem label="Corporação" value={details.corp || details.targetCorp} />
                    <DetailItem label="Usos Permitidos" value={details.uses} />
                    <DetailItem label="Validade" value={`${details.duration || details.duration_hours} horas`} />
                    {/* Mostra o início do token apenas se a propriedade existir */}
                    {details.tokenStart && <DetailItem label="Início do Token" value={`${details.tokenStart}...`} />}
                </div>
            );

        // Formatação para Atualização de Dados
        case 'Update Policial Data':
             // Divide as alterações por '; ' e cria uma lista
             const changes = details.changes ? details.changes.split('; ').map((change, index) => <li key={index}>{change}</li>) : [];
             return (
                 <div className="details-container">
                    {/* Mostra nome se disponível, senão só ID */}
                    {details.targetName ? (
                         <DetailItem label="Policial Alvo" value={`${details.targetName} (ID: ${details.targetUserId})`} />
                    ) : (
                         <DetailItem label="Policial ID" value={details.targetUserId} />
                    )}
                    {/* Bloco para a lista de alterações */}
                    <div className="detail-item-full">
                         <span className="detail-label">Alterações:</span>
                         {changes.length > 0 ? (
                              <ul className="detail-changes-list">{changes}</ul>
                         ) : (
                              <span className='detail-value'> Nenhuma alteração registrada nos detalhes.</span>
                         )}
                    </div>
                 </div>
             );

        // Formatação para Criação de Anúncio
        case 'Create Announcement':
            return (
                <div className="details-container">
                    <DetailItem label="Título" value={details.title} />
                    <DetailItem label="ID Anúncio" value={details.announcementId} />
                    <DetailItem label="Alvo" value={details.targetCorp || 'Geral'} /> {/* Mostra 'Geral' se targetCorp for nulo/vazio */}
                </div>
            );

        // Formatação para Concursos (incluindo fallbacks)
        case 'Create Concurso':
        case 'Update Concurso':
        case 'Delete Concurso':
        case 'Create Concurso (Fallback V2)': // Adicionado
        case 'Create Concurso (Fallback V1)': // Adicionado
             return (
                 <div className="details-container">
                     <DetailItem label="Concurso ID" value={details.concursoId} />
                     {details.title && <DetailItem label="Título" value={details.title} />}
                     {/* Ajustado para mostrar N/A se 'corp' não existir nos fallbacks */}
                     <DetailItem label="Corporação" value={details.corp || 'N/A'} />
                 </div>
             );

        // Formatação para Bug Report
        case 'Bug Report':
             return (
                 <div className="details-container detail-item-full">
                     <span className="detail-label">Descrição do Bug:</span>
                     {/* Usa um bloco P para permitir quebras de linha do textarea */}
                     <p className='detail-value-block'>{details.description || 'Sem descrição.'}</p>
                 </div>
             );

        // Caso padrão: Nenhuma formatação específica encontrada, mostra o JSON DENTRO do container
        default:
            return (
                <div className="details-container">
                    {/* Usa <pre> para manter a formatação do JSON.stringify */}
                    <pre className="raw-details">{JSON.stringify(details, null, 2)}</pre>
                </div>
            );
    }
};

export default LogDetails;