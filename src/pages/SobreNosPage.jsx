// src/pages/SobreNosPage.jsx

import React from 'react';
import '../components/SobreNosPage.css'; // Importa o nosso novo CSS

const SobreNosPage = () => {
    return (
        <div className="about-us-container">
            {/* --- SEÇÃO HERÓI COM O LOGO E TÍTULO --- */}
            <section className="hero-section">
                <img src="/pp11.png" alt="Logo do Roleplay" className="hero-logo" />
                <h1 className="hero-title">Nossa História</h1>
                <p className="hero-subtitle">
                    Construindo um universo de Roleplay imersivo, justo e inesquecível para todos os nossos jogadores.
                </p>
            </section>

            {/* --- GRID COM MISSÃO, VISÃO E VALORES --- */}
            <section className="values-grid">
                <div className="value-card">
                    <div className="value-icon"><i className="fas fa-bullseye"></i></div>
                    <h3>Nossa Missão</h3>
                    <p>
                        Proporcionar uma experiência de Roleplay de alta qualidade, focada na criação de histórias colaborativas, no respeito mútuo e na imersão contínua.
                    </p>
                </div>

                <div className="value-card">
                    <div className="value-icon"><i className="fas fa-eye"></i></div>
                    <h3>Nossa Visão</h3>
                    <p>
                        Ser a comunidade de Roleplay referência, reconhecida pela sua organização, inovação constante e por ser um ambiente acolhedor para jogadores novatos e veteranos.
                    </p>
                </div>

                <div className="value-card">
                    <div className="value-icon"><i className="fas fa-heart"></i></div>
                    <h3>Nossos Valores</h3>
                    <p>
                        Compromisso com a diversão, integridade nas ações, transparência da staff e paixão por contar grandes histórias juntos.
                    </p>
                </div>
            </section>

            {/* --- SEÇÃO COM A HISTÓRIA DETALHADA --- */}
            <section className="history-section">
                <h2>A Jornada do Nosso Servidor</h2>
                <p>
                    Fundado em [ANO DE FUNDAÇÃO], nosso servidor nasceu do sonho de um pequeno grupo de amigos apaixonados por Roleplay. O objetivo era simples: criar um lugar onde a qualidade da interpretação e a justiça das regras andassem de mãos dadas. Desde o início, focamos em construir uma base sólida, com sistemas únicos e uma equipe dedicada.
                </p>
                <p>
                    Com o passar do tempo, a comunidade cresceu, mas nossos princípios permaneceram os mesmos. Hoje, somos orgulhosos de ter um ambiente vibrante, onde cada jogador tem o poder de moldar o universo do jogo com suas ações e histórias. Continuamos a evoluir, sempre ouvindo o feedback da nossa comunidade para tornar esta a melhor experiência de RP possível.
                </p>
            </section>
        </div>
    );
};

export default SobreNosPage;