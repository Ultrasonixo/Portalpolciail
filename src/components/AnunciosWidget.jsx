import React, { useState, useEffect } from 'react';
import './AnunciosWidget.css'; // Vamos criar este arquivo de estilo

const AnunciosWidget = () => {
    const [anuncios, setAnuncios] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnuncios = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/anuncios');
                const data = await response.json();
                setAnuncios(data);
            } catch (error) {
                console.error("Falha ao carregar anúncios:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAnuncios();
    }, []);

    // Função para formatar a data
    const formatDate = (dateString) => {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('pt-BR', options);
    };

    return (
        <div className="anuncios-widget">
            <h2 className="widget-title">Mural de Avisos</h2>
            {loading && <p>Carregando avisos...</p>}
            {!loading && anuncios.length === 0 && <p>Nenhum aviso recente.</p>}
            
            <div className="anuncios-list">
                {anuncios.map(anuncio => (
                    <div key={anuncio.id} className="anuncio-item">
                        <h3 className="anuncio-titulo">{anuncio.titulo}</h3>
                        <p className="anuncio-conteudo">{anuncio.conteudo}</p>
                        <div className="anuncio-meta">
                            <span>Publicado por: <strong>{anuncio.autor_nome || 'Sistema'}</strong></span>
                            <span>Em: {formatDate(anuncio.data_publicacao)}</span>
                        </div>
                        
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AnunciosWidget;