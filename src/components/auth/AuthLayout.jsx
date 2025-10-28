
import React from 'react';
import '../Auth.css';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="auth-container">
      <div className="auth-left-panel">
        <img src="/brasao.png" alt="Brasão Polícia" className="auth-logo-large" />
        <h1>Portal de Segurança</h1>
        <p>Acesso restrito para o gerenciamento das operações policiais e estatísticas.</p>
      </div>
      <div className="auth-right-panel">
        <div className="auth-form-container">
          <div className="form-header">
            <h2>{title}</h2>
            <p className="auth-subtitle">{subtitle}</p>
          </div>
          {children} {/* Aqui entrará o formulário de login ou registro */}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;