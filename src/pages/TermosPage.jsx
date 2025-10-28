// src/pages/TermosPage.jsx (Versão Simplificada com Link)
import React from 'react';
import '../components/LegalPage.css'; // Reutiliza o estilo

const pdfDirectUrl = '/Termo.pdf';

const TermosPage = () => {
  return (
    <div className="legal-page-wrapper">
      <div className="legal-container" style={{ textAlign: 'center' }}>
        <h1>Termos de Serviço</h1>
        <p className="legal-subtitle" style={{ marginBottom: '2rem' }}>
          Para visualizar nossos Termos de Serviço, por favor, clique no link abaixo. O documento será aberto num formato PDF.
        </p>
        <a
          href={pdfDirectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="contato-button email" // Reutiliza um estilo de botão
          style={{ display: 'inline-block', textDecoration: 'none' }}
        >
          Abrir Termos de Serviço (PDF)
        </a>
      </div>
    </div>
  );
};

export default TermosPage;