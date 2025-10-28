// src/components/AddChangelogModal.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from 'react-toastify'; // Usar toast para feedback
import './Modal.css'; // Reutilizar estilos do Modal

// Ícones para toast (opcional)
const AnimatedCheckmark = () => (<svg className="toast-icon-svg checkmark-svg" viewBox="0 0 52 52"><circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/><path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/></svg>);
const AnimatedXMark = () => (<svg className="toast-icon-svg xmark-svg" viewBox="0 0 52 52"><g transform="translate(26 26)"><line className="xmark-line1" x1="-15" y1="-15" x2="15" y2="15" /><line className="xmark-line2" x1="-15" y1="15" x2="15" y2="-15" /></g></svg>);


const AddChangelogModal = ({ isOpen, onClose }) => {
    const { token, logout } = useAuth();
    const [formData, setFormData] = useState({ title: '', content: '', version: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Limpa o formulário quando o modal abre
    useEffect(() => {
        if (isOpen) {
            setFormData({ title: '', content: '', version: '' });
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title || !formData.content) {
            toast.warning('Título e Conteúdo são obrigatórios.');
            return;
        }
        if (!token) {
            toast.error('Erro de autenticação.', { icon: <AnimatedXMark /> });
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading("Salvando entrada...");

        try {
            const response = await fetch('http://localhost:3000/api/admin/changelog', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.status === 401 || response.status === 403) {
                 if(logout) logout();
                 throw new Error('Sessão inválida ou sem permissão.');
            }

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || 'Erro ao salvar a entrada.');
            }

            toast.update(toastId, {
                render: result.message || "Entrada salva com sucesso!",
                type: 'success', isLoading: false, autoClose: 3000, icon: <AnimatedCheckmark />
            });
            onClose(true); // Fecha o modal e indica que algo foi atualizado

        } catch (error) {
            console.error("Erro ao salvar changelog:", error);
            toast.update(toastId, {
                render: `Erro: ${error.message}`,
                type: 'error', isLoading: false, autoClose: 5000, icon: <AnimatedXMark />
            });
            setIsSubmitting(false); // Permite tentar novamente em caso de erro
        }
        // finally não é mais necessário aqui
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '700px' }}>
                <div className="modal-header">
                    <h3>Adicionar Entrada no Changelog</h3>
                    <button onClick={() => onClose(false)} className="close-btn" disabled={isSubmitting}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="modal-form-group">
                            <label htmlFor="changelog-version">Versão (Opcional)</label>
                            <input
                                type="text"
                                id="changelog-version"
                                name="version"
                                value={formData.version}
                                onChange={handleChange}
                                placeholder="Ex: v1.2.1"
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="modal-form-group">
                            <label htmlFor="changelog-title">Título *</label>
                            <input
                                type="text"
                                id="changelog-title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="modal-form-group">
                            <label htmlFor="changelog-content">Conteúdo *</label>
                            <textarea
                                id="changelog-content"
                                name="content"
                                value={formData.content}
                                onChange={handleChange}
                                rows={10} // Aumenta o tamanho
                                required
                                disabled={isSubmitting}
                                placeholder="Descreva as mudanças. Você pode usar quebras de linha."
                            />
                             <small>Quebras de linha serão convertidas. Para formatação mais complexa (negrito, listas), considere usar Markdown e uma biblioteca para renderizar no frontend.</small>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" onClick={() => onClose(false)} className="btn-secondary" disabled={isSubmitting}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? 'Salvando...' : 'Salvar Entrada'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddChangelogModal;