import React from 'react';
import './TosBlockedPage.css'; // Importa os estilos com as animações

/**
 * Componente que mostra uma tela de bloqueio quando os Termos de Serviço são recusados.
 * @param {object} props - As propriedades do componente.
 * @param {Function} props.onReRead - Função a ser chamada quando o botão para reler os termos é clicado.
 */
function TosBlockedPage({ onReRead }) {
  return (
    <div className="blocked-page-overlay">
      <div className="blocked-card">
        {/* Ícone de "X" para indicar o erro */}
        <div className="blocked-icon">
          {/* SVG ATUALIZADO para permitir animações de desenho */}
          <svg
            className="error-icon-svg"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 52 52"
          >
            <circle
              className="error-icon-circle"
              cx="26"
              cy="26"
              r="25"
              fill="none"
            />
            <path
              className="error-icon-cross"
              fill="none"
              d="M16,16 L36,36 M36,16 L16,36"
            />
          </svg>
        </div>

        {/* Conteúdo de texto */}
        <h2>Acesso Negado</h2>
        <p>
          Para utilizar os nossos serviços, é necessário ler e aceitar os Termos
          de Uso. Você optou por não concordar.
        </p>

        {/* Botão para voltar ao modal dos Termos */}
        <button className="btn-reread" onClick={onReRead}>
          Reler e Aceitar os Termos
        </button>
      </div>
    </div>
  );
}

export default TosBlockedPage;