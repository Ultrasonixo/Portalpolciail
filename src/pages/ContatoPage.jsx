import React from 'react';
import '../components/ContatoPage.css';

// Ícones
const MailIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
);
const DiscordIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19.54 0c1.356 0 2.46 1.104 2.46 2.46v19.08c0 1.356-1.104 2.46-2.46 2.46H4.46C3.104 24 2 22.896 2 21.54V2.46C2 1.104 3.104 0 4.46 0h15.08zM8.48 15.12h1.56c.78 0 1.44-.66 1.44-1.44v-1.56c0-.78-.66-1.44-1.44-1.44H8.48v4.44zm6.24-4.44h-1.56c-.78 0-1.44.66-1.44 1.44v1.56c0 .78.66 1.44 1.44 1.44h1.56v-4.44z"/></svg>
);


function ContatoPage() {
  return (
    <div className="contato-container">
      <div className="contato-header">
        <h1>Entre em Contato</h1>
        <p>Estamos aqui para ajudar. Escolha o melhor canal para falar com a equipe NextSystem.</p>
      </div>

      <div className="contato-options">
        <div className="contato-card">
          <div className="contato-icon discord">
            <DiscordIcon />
          </div>
          <h2>Discord (Suporte Rápido)</h2>
          <p>Para dúvidas, suporte técnico e interação com a comunidade, nosso Discord é o canal principal.</p>
          <a href="https://discord.gg/SEU-CONVITE-AQUI" target="_blank" rel="noopener noreferrer" className="contato-button discord">
            Entrar no Servidor
          </a>
        </div>

        <div className="contato-card">
          <div className="contato-icon email">
            <MailIcon />
          </div>
          <h2>E-mail (Assuntos Formais)</h2>
          <p>Para parcerias, denúncias ou outros assuntos formais, entre em contato pelo nosso e-mail oficial.</p>
          <a href="mailto:contato@nextsystem.com" className="contato-button email">
            contato@nextsystem.com
          </a>
        </div>
      </div>
    </div>
  );
}

export default ContatoPage;