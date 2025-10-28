import React from 'react';
import { Link } from 'react-router-dom';
// REMOVER: import './ServicesGrid.css'; // Removemos a importação do CSS antigo

// Definição das cores para reutilização
const serviceColors = {
    boletim: 'border-blue-600 text-blue-600',
    batalhoes: 'border-green-600 text-green-600',
    concursos: 'border-yellow-500 text-yellow-500',
    juridico: 'border-purple-600 text-purple-600',
};

function ServicesGrid() {
  return (
    // py-12 md:py-16: Padding vertical responsivo
    // text-center: Centraliza texto
    <main id="services" className="py-12 md:py-16 text-center">
      {/* text-3xl md:text-4xl: Tamanho do título responsivo */}
      {/* font-bold: Negrito */}
      {/* text-slate-800: Cor do texto */}
      {/* mb-10 md:mb-12: Margem inferior responsiva */}
      <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-10 md:mb-12">Serviços Disponíveis</h2>

      {/* Grid Responsivo */}
      {/* grid: Habilita grid layout */}
      {/* grid-cols-1 sm:grid-cols-2 lg:grid-cols-4: Define número de colunas por breakpoint */}
      {/* gap-8: Espaçamento entre os cards */}
      {/* max-w-6xl: Largura máxima */}
      {/* mx-auto: Centraliza o grid */}
      {/* px-4: Padding horizontal */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto px-4">

        {/* --- Card Boletim --- */}
        {/* bg-white: Fundo branco */}
        {/* p-8: Padding interno */}
        {/* rounded-lg: Bordas arredondadas */}
        {/* shadow-md hover:shadow-lg: Sombra com efeito hover */}
        {/* border-t-4: Borda superior */}
        {/* border-blue-600: Cor da borda (definida nas cores) */}
        {/* text-center: Alinhamento */}
        {/* no-underline: Remove sublinhado do link */}
        {/* text-slate-700: Cor do texto */}
        {/* transition-all duration-300: Efeito de transição suave */}
        {/* hover:-translate-y-1: Efeito de levantar no hover */}
        <Link to="/boletim" className={`bg-white p-8 rounded-lg shadow-md hover:shadow-lg border-t-4 ${serviceColors.boletim} text-center no-underline text-slate-700 transition-all duration-300 hover:-translate-y-1`}>
          {/* text-4xl mb-4: Tamanho e margem do ícone */}
          {/* text-blue-600: Cor do ícone */}
          <i className={`fas fa-file-alt text-4xl mb-4 ${serviceColors.boletim.split(' ')[1]}`}></i>
          {/* text-xl font-semibold mb-2: Estilo do título do card */}
          <h3 className="text-xl font-semibold mb-2 text-slate-800">Registrar B.O. Online</h3>
          {/* text-sm text-slate-600: Estilo da descrição */}
          <p className="text-sm text-slate-600">Registre um boletim de ocorrência de forma rápida e segura.</p>
        </Link>

        {/* --- Card Batalhões --- */}
        <Link to="/batalhoes" className={`bg-white p-8 rounded-lg shadow-md hover:shadow-lg border-t-4 ${serviceColors.batalhoes} text-center no-underline text-slate-700 transition-all duration-300 hover:-translate-y-1`}>
          <i className={`fas fa-shield-alt text-4xl mb-4 ${serviceColors.batalhoes.split(' ')[1]}`}></i>
          <h3 className="text-xl font-semibold mb-2 text-slate-800">Batalhões</h3>
          <p className="text-sm text-slate-600">Conheça as unidades especializadas da Polícia RP.</p>
        </Link>

        {/* --- Card Concursos --- */}
        <Link to="/concursos" className={`bg-white p-8 rounded-lg shadow-md hover:shadow-lg border-t-4 ${serviceColors.concursos} text-center no-underline text-slate-700 transition-all duration-300 hover:-translate-y-1`}>
          <i className={`fas fa-user-plus text-4xl mb-4 ${serviceColors.concursos.split(' ')[1]}`}></i>
          <h3 className="text-xl font-semibold mb-2 text-slate-800">Concursos Públicos</h3>
          <p className="text-sm text-slate-600">Faça parte da corporação. Confira os editais abertos.</p>
        </Link>

        {/* --- Card Jurídico --- */}
        <Link to="/juridico" className={`bg-white p-8 rounded-lg shadow-md hover:shadow-lg border-t-4 ${serviceColors.juridico} text-center no-underline text-slate-700 transition-all duration-300 hover:-translate-y-1`}>
          <i className={`fas fa-gavel text-4xl mb-4 ${serviceColors.juridico.split(' ')[1]}`}></i>
          <h3 className="text-xl font-semibold mb-2 text-slate-800">Portal Jurídico</h3>
          <p className="text-sm text-slate-600">Consulte leis, códigos e documentos oficiais.</p>
        </Link>
      </div>
    </main>
  );
}
export default ServicesGrid;