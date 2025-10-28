import React from 'react';
import { Link } from 'react-router-dom';
import './Hero.css';

function Hero() {
  return (
    <div className="hero-content">
      <h1>Secretaria Policia</h1>
      <h2>Portal Oficial</h2>
      <p>Servindo e protegendo a comunidade com excelência, transparência e compromisso.</p>
      <div className="hero-buttons">
        <Link to="/denunciar" className="btn btn-secondary">Denunciar Crime</Link>
        <Link to="/boletim" className="btn btn-primary">Registrar B.O.</Link>
      </div>
    </div>
  );
}
export default Hero;