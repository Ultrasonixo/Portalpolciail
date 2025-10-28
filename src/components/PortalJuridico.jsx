import React from 'react';
import './PortalJuridico.css'; // Mantém a importação do CSS

export default function PortalJuridico() {
  return (
    // Usa a classe .page-container padrão para consistência (opcional)
    <div className="page-container portal-juridico-page">

      {/* Seção "Em Desenvolvimento" (Mantém como está) */}
      <section className="coming-soon-section">
        <div className="coming-soon-content">
          <div className="coming-soon-icon">
            <i className="fas fa-tools"></i>
          </div>
          <h2>Em Desenvolvimento</h2>
          <p>Esta seção está sendo preparada e estará disponível em breve com informações e serviços legais relevantes.</p>
        </div>
      </section>

    </div>
  );
}