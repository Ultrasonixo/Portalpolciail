// src/components/BoletimForm.jsx - AJUSTADO PARA RECEBER PROPS

import React, { useState, useEffect } from 'react'; // Adicionado useEffect
// import { useAuth } from '../context/AuthContext.jsx'; // REMOVIDO - Não usa mais o hook diretamente
import './BoletimForm.css';

// ✅ 1. RECEBE 'user' e 'token' COMO PROPS
function BoletimForm({ user, token }) { 

    // Estado do formulário - Nome/RG iniciam vazios
    const [formData, setFormData] = useState({
        nomeDenunciante: '', 
        rgDenunciante: '',   
        tipo: '',
        data_ocorrido: '', 
        local: '',
        descricao: '',
    });

    // ✅ 2. EFEITO PARA PREENCHER NOME/RG QUANDO 'user' ESTIVER DISPONÍVEL (vindo das props)
    useEffect(() => {
        if (user) {
            setFormData(prevData => ({
                ...prevData,
                nomeDenunciante: user.nome_completo || '',
                rgDenunciante: user.id_passaporte || '' // Assumindo que é id_passaporte
            }));
        }
    }, [user]); // Roda sempre que a prop 'user' mudar

    const [arquivos, setArquivos] = useState(null);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
    const [isSubmitting, setIsSubmitting] = useState(false); // Estado para desabilitar botão

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };
    
    const handleFileChange = (e) => {
        setArquivos(e.target.files);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatusMessage({ type: 'loading', text: 'Registrando ocorrência...' });
        setIsSubmitting(true); // Desabilita botão

        // Verifica se user e token (das props) existem
        if (!user || !user.id || !token) { 
            setStatusMessage({ type: 'error', text: 'Erro: Informações de autenticação ausentes.' });
            setIsSubmitting(false); // Reabilita botão
            return;
        }

        const dataParaEnviar = new FormData();
        dataParaEnviar.append('tipo', formData.tipo);
        dataParaEnviar.append('data_ocorrido', formData.data_ocorrido); 
        dataParaEnviar.append('local', formData.local);
        dataParaEnviar.append('descricao', formData.descricao);
        dataParaEnviar.append('usuario_id', user.id); // ID do usuário das props

        if (arquivos && arquivos.length > 0) {
            for (let i = 0; i < arquivos.length; i++) {
                dataParaEnviar.append('anexos', arquivos[i]);
            }
        }

        try {
            const response = await fetch('http://localhost:3000/api/boletim/registrar', {
                method: 'POST',
                 headers: {
                    // NÃO defina Content-Type ao enviar FormData
                     'Authorization': `Bearer ${token}` // ✅ 3. USA O TOKEN DAS PROPS
                 },
                body: dataParaEnviar,
            });

            const result = await response.json();
            if (!response.ok || !result.success) { // Verifica success também se o backend enviar
                 throw new Error(result.message || 'Falha ao registrar B.O.');
            }
            
            setStatusMessage({ type: 'success', text: result.message });
            
            // Limpa APENAS os campos preenchidos pelo usuário
            setFormData(prevData => ({ 
                ...prevData, // Mantém nome/rg
                tipo: '', 
                data_ocorrido: '', 
                local: '', 
                descricao: '' 
            }));
            setArquivos(null);
            // Limpa o input de arquivo (se precisar)
            const fileInput = document.getElementById('anexos');
             if (fileInput) fileInput.value = null;


        } catch (error) {
            console.error("Erro no submit do BoletimForm:", error);
            setStatusMessage({ type: 'error', text: error.message });
        } finally {
             setIsSubmitting(false); // Reabilita o botão
        }
    };

    // Não precisa mais do `if (!user)` aqui, pois BoletimPage já trata isso.
    // Se user for null/undefined inicialmente, o useEffect vai esperar.

    return (
        <div className="bo-page-container"> {/* Ou apenas a div do form */}
            <form className="bo-form-card" onSubmit={handleSubmit}>
                <div className="bo-form-header">
                    <i className="fas fa-file-alt form-icon"></i>
                    <h2>Registro de Boletim de Ocorrência</h2>
                    <p>Descreva o ocorrido para que a polícia possa investigar.</p>
                </div>

                {/* Mostra nome/rg dos dados pré-preenchidos */}
                <div className="user-info-box"> 
                    <div><label>Nome do Denunciante</label><p>{formData.nomeDenunciante || 'Carregando...'}</p></div>
                    <div><label>RG / Passaporte</label><p>{formData.rgDenunciante || 'Carregando...'}</p></div> 
                </div>

                <div className="form-row">
                    <div className="input-group">
                        <label htmlFor="tipo">Tipo de Ocorrência*</label>
                        <select id="tipo" name="tipo" value={formData.tipo} onChange={handleChange} required>
                            <option value="" disabled>Selecione o tipo</option>
                            {/* Adicione suas opções aqui */}
                            <option value="Roubo">Roubo</option>
                            <option value="Furto">Furto</option>
                            <option value="Agressão">Agressão</option>
                            <option value="PerdaDocumentos">Perda de Documentos</option>
                            <option value="Outros">Outros</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label htmlFor="data_ocorrido">Data e Hora Aproximada*</label> 
                        <input type="datetime-local" id="data_ocorrido" name="data_ocorrido" value={formData.data_ocorrido} onChange={handleChange} required />
                    </div>
                </div>

                <div className="input-group">
                    <label htmlFor="local">Local da Ocorrência*</label>
                    <input type="text" id="local" name="local" value={formData.local} onChange={handleChange} placeholder="Ex: Rua das Flores, 123, Bairro Central" required />
                </div>

                <div className="input-group">
                    <label htmlFor="descricao">Descrição Detalhada*</label>
                    <textarea id="descricao" name="descricao" value={formData.descricao} onChange={handleChange} rows="6" placeholder="Descreva com o máximo de detalhes o que aconteceu..." required></textarea>
                </div>

                <div className="input-group">
                    <label htmlFor="anexos">Anexar Evidências (Imagens/Vídeos)</label>
                    <input type="file" id="anexos" name="anexos" onChange={handleFileChange} multiple accept="image/*,video/*" />
                    <small>Você pode anexar até 5 arquivos.</small>
                </div>

                {/* Mensagem de status */}
                 {statusMessage.text && (
                     <div className={`status-message status-${statusMessage.type}`} style={{marginTop: '15px', textAlign: 'center'}}>
                         {statusMessage.text}
                     </div>
                 )}

                {/* Desabilita botão durante o envio */}
                <button type="submit" className="submit-bo-button" disabled={isSubmitting}> 
                    <i className="fas fa-paper-plane"></i> {isSubmitting ? 'Registrando...' : 'Registrar Ocorrência'}
                </button>

            </form>
        </div>
    );
}

export default BoletimForm;