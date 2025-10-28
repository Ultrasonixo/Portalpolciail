import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// --- CSS NECESSÁRIO para react-pdf ---
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Importa os estilos da página
import '../components/LegalPage.css'; 

// Configuração do worker do PDF
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs?url";
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

// --- Ícones para os controlos (SVG) ---
const ZoomInIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>);
const ZoomOutIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>);
const DownloadIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>);
const PrevIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>);
const NextIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>);


function PrivacidadePage() {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0); // Estado para o zoom

  const pdfFile = "/Politica_de_Privacidade.pdf"; // <<< Use o nome correto do seu ficheiro PDF

  function onDocumentLoadSuccess({ numPages: nextNumPages }) {
    setNumPages(nextNumPages);
    setPageNumber(1);
  }

  const goToPrevPage = () => setPageNumber(p => Math.max(p - 1, 1));
  const goToNextPage = () => setPageNumber(p => Math.min(p + 1, numPages || 1));
  
  const zoomIn = () => setScale(s => Math.min(s + 0.2, 2.0)); // Zoom máximo de 200%
  const zoomOut = () => setScale(s => Math.max(s - 0.2, 0.6)); // Zoom mínimo de 60%

  return (
    <div className="legal-page-wrapper">
      <div className="legal-container">
        <h1>Política de Privacidade</h1>
        <p className="legal-subtitle">
          Entenda como as suas informações são utilizadas e protegidas.
        </p>

        <div className="pdf-document-viewer">
          {/* Barra de Ferramentas do PDF */}
          {numPages && (
            <div className="pdf-toolbar">
              <div className="pdf-tool-group">
                <button onClick={goToPrevPage} disabled={pageNumber <= 1} className="pdf-tool-btn">
                  <PrevIcon />
                </button>
                <span className="page-indicator">
                  {pageNumber} / {numPages}
                </span>
                <button onClick={goToNextPage} disabled={pageNumber >= numPages} className="pdf-tool-btn">
                  <NextIcon />
                </button>
              </div>
              <div className="pdf-tool-group">
                <button onClick={zoomOut} disabled={scale <= 0.6} className="pdf-tool-btn">
                  <ZoomOutIcon />
                </button>
                <button onClick={zoomIn} disabled={scale >= 2.0} className="pdf-tool-btn">
                  <ZoomInIcon />
                </button>
                <a href={pdfFile} download="Politica_de_Privacidade.pdf" className="pdf-tool-btn download">
                  <DownloadIcon />
                </a>
              </div>
            </div>
          )}

          <div className="pdf-document-container">
            <Document
              file={pdfFile}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={<p className="pdf-status-message">A carregar o documento...</p>}
              error={<p className="pdf-status-message error">Falha ao carregar o PDF. Verifique se o ficheiro <strong>{pdfFile}</strong> existe na pasta 'public'.</p>}
              className="pdf-document"
            >
              <Page
                pageNumber={pageNumber}
                scale={scale} // Aplica o zoom
                renderTextLayer={false}
                className="pdf-page"
              />
            </Document>
          </div>
        </div>

      </div>
    </div>
  );
}

export default PrivacidadePage;