import React, { useState, useEffect } from 'react';
import ConcursoCard from '../components/ConcursoCard.jsx';
import './ConcursosPage.css';

function ConcursosPage() {
    const [concursos, setConcursos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchConcursos = async () => {
            try {
                const response = await fetch('http://localhost:3000/api/concursos');
                if (!response.ok) {
                    throw new Error('Não foi possível buscar os concursos.');
                }
                const data = await response.json();
                setConcursos(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchConcursos();
    }, []);

    return (
        <div className="concursos-page">
            <div className="page-header">
                <h1>Concursos Públicos</h1>
                <p>Confira as oportunidades para se juntar à força policial.</p>
            </div>
            
            <div className="concursos-list">
                {loading && <p>Carregando concursos...</p>}
                {error && <p className="error-message">{error}</p>}
                {!loading && concursos.length === 0 && <p>Nenhum concurso aberto no momento.</p>}
                {concursos.map(concurso => (
                    <ConcursoCard key={concurso.id} concurso={concurso} />
                ))}
            </div>
        </div>
    );
}

export default ConcursosPage;