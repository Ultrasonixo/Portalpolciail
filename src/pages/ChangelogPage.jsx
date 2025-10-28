// src/pages/ChangelogPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Para verificar se é admin
import '../components/ChangelogPage.css'; // Criaremos este CSS

const ChangelogPage = () => {
    const { user } = useAuth(); // Pega o usuário logado
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Função para buscar as entradas do changelog
    useEffect(() => {
        const fetchChangelog = async () => {
            setLoading(true);
            setError(null);
            try {
                // Rota pública (ou ajuste se precisar de autenticação para ver)
                const response = await fetch('http://localhost:3000/api/changelog');
                if (!response.ok) {
                    throw new Error('Falha ao carregar o changelog.');
                }
                const data = await response.json();
                setEntries(data);
            } catch (err) {
                setError(err.message);
                console.error("Erro ao buscar changelog:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchChangelog();
    }, []); // Roda apenas uma vez ao montar

    // Função para formatar data
    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'Data Indisponível';
        try {
            return new Date(dateTimeString).toLocaleDateString('pt-BR', {
                year: 'numeric', month: 'long', day: 'numeric' // Formato mais legível
            });
        } catch (e) { return 'Data Inválida'; }
    };

    return (
        <div className="page-container changelog-page">
            <header className="page-header"> {/* Reutiliza estilo de ConcursosPage.css? */}
                <h1>Changelog do Portal</h1>
                <p>Acompanhe as últimas atualizações e novidades da plataforma.</p>
            </header>

            {loading && <p className="loading-message">Carregando atualizações...</p>}
            {error && <p className="error-message">{error}</p>}

            {!loading && !error && (
                <div className="changelog-list">
                    {entries.length === 0 ? (
                        <p className="empty-message">Nenhuma atualização registrada ainda.</p>
                    ) : (
                        entries.map(entry => (
                            <article key={entry.id} className="changelog-entry">
                                <header className="entry-header">
                                    <h2 className="entry-title">{entry.title}</h2>
                                    <div className="entry-meta">
                                        {entry.version && <span className="entry-version">Versão: {entry.version}</span>}
                                        <span className="entry-date">{formatDateTime(entry.created_at)}</span>
                                        {entry.author_name && <span className="entry-author">por {entry.author_name}</span>}
                                    </div>
                                </header>
                                {/* Usar dangerouslySetInnerHTML é uma opção se você confiar no conteúdo
                                    ou usar uma biblioteca como 'react-markdown' para formatar */}
                                <div className="entry-content" dangerouslySetInnerHTML={{ __html: entry.content.replace(/\n/g, '<br />') }}>
                                    {/* O replace \n por <br /> é uma formatação básica */}
                                </div>
                            </article>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default ChangelogPage;