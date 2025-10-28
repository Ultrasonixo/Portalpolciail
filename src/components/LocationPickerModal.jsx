// src/components/LocationPickerModal.jsx

import React from 'react';
import LocationPickerMap from './LocationPickerMap.jsx';
import './Modal.css'; // Certifique-se que este CSS existe e estiliza o modal

const LocationPickerModal = ({
    isOpen,
    onClose,
    onLocationSelect, // Função para retornar as coordenadas selecionadas
    initialCoords,    // Coordenadas iniciais para exibir/centralizar
    readOnly = false  // Modo de visualização apenas
}) => {
    if (!isOpen) return null;

    // Função interna para lidar com a seleção e fechar o modal
    const handleSelectAndClose = (coords) => {
        if (onLocationSelect && !readOnly) {
            onLocationSelect(coords); // Chama a função passada por props
        }
        onClose(); // Fecha o modal após o clique (ou apenas fecha se for readOnly)
    };

    return (
        <div className="modal-overlay" onClick={onClose}> {/* Fecha ao clicar fora */}
            <div
                className="modal-content"
                style={{ width: '100%', maxWidth: '1000px', height: '70vh', display: 'flex', flexDirection: 'column' }} // Estilo para altura flexível
                onClick={(e) => e.stopPropagation()} // Impede fechar ao clicar dentro
            >
                <div className="modal-header">
                    <h3>{readOnly ? 'Visualizar Localização' : 'Selecionar Localização no Mapa'}</h3>
                    <button onClick={onClose} className="close-btn">&times;</button>
                </div>
                <div className="modal-body" style={{ padding: 0, flexGrow: 1, height: '100%' }}> {/* Ocupa espaço restante */}
                    <LocationPickerMap
                        initialCoords={initialCoords}
                        // Se for readOnly, passamos uma função vazia para onLocationSelect dentro do mapa
                        // A seleção real é feita aqui no handleSelectAndClose
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

export default LocationPickerModal;