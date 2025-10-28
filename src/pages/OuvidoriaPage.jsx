// src/pages/OuvidoriaPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx'; // Para pegar dados do usuário
import { toast } from 'react-toastify'; // Para feedback
import { useNavigate, useLocation, Link } from 'react-router-dom'; // Para redirecionamento e Link

// Ícones (Opcional)
const CheckmarkIcon = () => (<svg className="toast-icon-svg checkmark-svg" viewBox="-2 -2 56 56"><circle className="checkmark-circle" cx="26" cy="26" r="25"></circle><path className="checkmark-check" d="M14.1 27.2l7.1 7.2 16.7-16.8"></path></svg>);
const XmarkIcon = () => (<svg className="toast-icon-svg xmark-svg" viewBox="0 0 52 52"><g transform="translate(1, 1)"><line className="xmark-line1" x1="15" y1="15" x2="35" y2="35"></line><line className="xmark-line2" x1="35" y1="15" x2="15" y2="35"></line></g></svg>);

// Componente auxiliar para Input Field (melhora a reutilização)
const InputField = ({ id, name, label, type = "text", value, onChange, disabled, required, placeholder, maxLength, rows }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1">{label}{required && '*'}</label>
        {type === 'textarea' ? (
            <textarea
                id={id} name={name} rows={rows} value={value} onChange={onChange}
                disabled={disabled} required={required} placeholder={placeholder} maxLength={maxLength}
                className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out resize-vertical text-sm"
            />
        ) : (
            <input
                type={type} id={id} name={name} value={value} onChange={onChange}
                disabled={disabled} required={required} placeholder={placeholder} maxLength={maxLength}
                className="w-full px-4 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out text-sm"
            />
        )}
    </div>
);


function OuvidoriaPage() {
    const { user, token, isLoading } = useAuth(); // Adiciona isLoading
    const navigate = useNavigate();
    const location = useLocation(); // Pega a localização atual para redirect

    const [formData, setFormData] = useState({
        tipoManifestacao: 'Reclamação',
        assunto: '',
        descricao: '',
        identificacao: 'Anonima', // Começa como Anônima
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Efeito para definir identificação inicial baseada no login
    useEffect(() => {
        // Só roda depois que o estado de autenticação for carregado
        if (!isLoading) {
            // Se o usuário está logado E veio redirecionado do login para cá,
            // define como Identificada. Senão, mantém Anônima.
            // (Isso assume que a página de login redireciona de volta com algum state,
            // mas podemos simplificar e só checar se user existe ao carregar)
             if (user) {
                 // Poderíamos setar para 'Identificada' aqui, mas vamos deixar
                 // o usuário escolher explicitamente para maior clareza.
                 // setFormData(prev => ({ ...prev, identificacao: 'Identificada' }));
             }
        }
    }, [user, isLoading]); // Depende do user e isLoading


    const handleChange = (e) => {
        const { name, value } = e.target;

        // --- LÓGICA DE LOGIN PARA IDENTIFICAÇÃO ---
        if (name === 'identificacao') {
            if (value === 'Identificada') {
                if (!user && !isLoading) { // Se não logado E não carregando
                    toast.info("Faça login para se identificar.");
                    // Redireciona para login, passando a página atual para voltar
                    navigate('/login', { state: { from: location }, replace: true });
                    // Não muda o estado ainda, espera o usuário logar e voltar
                    return; // Interrompe a mudança de estado
                }
                // Se já está logado ou ainda está carregando, permite mudar para Identificada
                setFormData(prev => ({ ...prev, [name]: value }));
            } else { // Se selecionou Anônima
                setFormData(prev => ({ ...prev, [name]: value }));
            }
        } else {
            // Atualiza outros campos normalmente
            setFormData(prev => ({ ...prev, [name]: value }));
        }
        // --- FIM DA LÓGICA DE LOGIN ---
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.assunto || !formData.descricao) {
            toast.warning('Por favor, preencha o Assunto e a Descrição.');
            return;
        }
        // Se identificado, precisa estar logado (user existe)
        if (formData.identificacao === 'Identificada' && !user) {
             toast.error('Erro: Tentativa de envio identificado sem estar logado.');
             navigate('/login', { state: { from: location }, replace: true });
             return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading("Enviando manifestação...");

        // Monta os dados a serem enviados
        const dataToSend = {
            tipoManifestacao: formData.tipoManifestacao,
            assunto: formData.assunto,
            descricao: formData.descricao,
            identificacao: formData.identificacao,
            // Inclui dados do usuário APENAS se identificado
            ...(formData.identificacao === 'Identificada' && user && {
                usuarioId: user.id,
                nome: user.nome_completo,
                contato: user.gmail || user.telefone_rp || 'Não informado', // Pega o que tiver
            }),
             // Se anônimo, mas logado, ainda envia o ID (sem nome/contato)
             ...(formData.identificacao === 'Anonima' && user && {
                usuarioId: user.id,
            })
        };

        try {
            const response = await fetch('/api/ouvidoria/registrar', { // Endpoint a ser criado
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }) // Envia token se logado
                },
                body: JSON.stringify(dataToSend),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || `Erro ${response.status} ao enviar.`);

            toast.update(toastId, {
                render: result.message || "Manifestação enviada com sucesso!",
                type: 'success', isLoading: false, autoClose: 4000, icon: <CheckmarkIcon />
            });
            setFormData({ tipoManifestacao: 'Reclamação', assunto: '', descricao: '', identificacao: 'Anonima' });

        } catch (error) {
            console.error("Erro ao enviar ouvidoria:", error);
            toast.update(toastId, {
                render: `Erro: ${error.message}`,
                type: 'error', isLoading: false, autoClose: 5000, icon: <XmarkIcon />
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Mensagem de loading inicial enquanto verifica a autenticação
    if (isLoading) {
         return <div className="max-w-4xl mx-auto px-4 py-12 md:py-16 text-center text-slate-600">Carregando informações...</div>;
    }

    return (
        // Container com mais padding vertical
        <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">
            {/* Cabeçalho com mais espaçamento inferior */}
            <div className="text-center mb-12 md:mb-16">
                <i className="fas fa-headset text-5xl text-blue-600 mb-5"></i> {/* Ícone maior */}
                <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-3">Canal da Ouvidoria</h1>
                <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
                    Sua voz é importante. Registre aqui suas reclamações, sugestões ou elogios sobre nossos serviços ou conduta.
                </p>
            </div>

            {/* Card do Formulário com mais padding e sombra maior */}
            <div className="bg-white p-8 md:p-12 rounded-xl shadow-xl border border-slate-200">
                <form onSubmit={handleSubmit} className="space-y-8"> {/* Aumenta espaço entre campos */}
                    {/* Tipo de Manifestação - Select estilizado */}
                    <div>
                        <label htmlFor="tipoManifestacao" className="block text-sm font-medium text-slate-700 mb-2">Tipo de Manifestação</label>
                        <select
                            id="tipoManifestacao" name="tipoManifestacao" value={formData.tipoManifestacao}
                            onChange={handleChange} disabled={isSubmitting}
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 ease-in-out bg-white appearance-none text-sm" // appearance-none para customizar seta (requer plugin tailwind forms ou bg image)
                        >
                            <option>Reclamação</option>
                            <option>Sugestão</option>
                            <option>Elogio</option>
                        </select>
                    </div>

                    {/* Assunto */}
                    <InputField
                        id="assunto" name="assunto" label="Assunto" value={formData.assunto}
                        onChange={handleChange} disabled={isSubmitting} required
                        maxLength={150} placeholder="Descreva brevemente o tema principal"
                    />

                    {/* Descrição */}
                    <InputField
                        id="descricao" name="descricao" label="Descrição Detalhada" type="textarea" rows={10}
                        value={formData.descricao} onChange={handleChange} disabled={isSubmitting} required
                        placeholder="Descreva a situação com o máximo de detalhes possível. Inclua datas, locais e nomes, se aplicável e seguro."
                    />

                    {/* Identificação - Radios com melhor espaçamento e estilo */}
                    <fieldset className="space-y-3 pt-2">
                        <legend className="block text-sm font-medium text-slate-700 mb-2">Identificação</legend>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-y-3 gap-x-6">
                            <div className="flex items-center p-3 border border-slate-200 rounded-md hover:bg-slate-50 transition duration-150 ease-in-out flex-1">
                                <input
                                    id="anonima" name="identificacao" type="radio" value="Anonima"
                                    checked={formData.identificacao === 'Anonima'} onChange={handleChange} disabled={isSubmitting}
                                    className="h-4 w-4 text-blue-600 border-slate-400 focus:ring-blue-500 cursor-pointer"
                                />
                                <label htmlFor="anonima" className="ml-3 block text-sm text-slate-900 cursor-pointer flex-1">
                                    Anônima
                                </label>
                            </div>
                            <div className="flex items-center p-3 border border-slate-200 rounded-md hover:bg-slate-50 transition duration-150 ease-in-out flex-1">
                                <input
                                    id="identificada" name="identificacao" type="radio" value="Identificada"
                                    checked={formData.identificacao === 'Identificada'} onChange={handleChange} disabled={isSubmitting}
                                    className="h-4 w-4 text-blue-600 border-slate-400 focus:ring-blue-500 cursor-pointer"
                                />
                                <label htmlFor="identificada" className="ml-3 block text-sm text-slate-900 cursor-pointer flex-1">
                                    Identificada <span className="text-slate-500 text-xs">(Requer Login)</span>
                                </label>
                            </div>
                        </div>
                    </fieldset>

                    {/* Mostra dados do usuário se Identificado E Logado */}
                    {formData.identificacao === 'Identificada' && user && (
                        <div className="mt-6 p-4 border border-blue-200 bg-blue-50/50 rounded-lg animate-fadeIn space-y-3 text-sm">
                            <p className="font-medium text-slate-700">Enviando como:</p>
                            <p><strong className="text-slate-600">Nome:</strong> {user.nome_completo || 'N/A'}</p>
                            <p><strong className="text-slate-600">Contato Principal:</strong> {user.gmail || user.telefone_rp || 'Não informado'}</p>
                            <p className="text-xs text-slate-500 italic">Essas informações serão anexadas à sua manifestação.</p>
                        </div>
                    )}

                    {/* Aviso de Privacidade com mais destaque */}
                    <div className="text-xs text-slate-600 mt-6 text-center bg-slate-100 p-4 rounded-lg border border-slate-200">
                        {formData.identificacao === 'Anonima'
                            ? "Sua manifestação será registrada anonimamente. Não será possível acompanhar o andamento ou receber uma resposta direta."
                            : user ? "Suas informações de identificação serão tratadas com sigilo pela Ouvidoria." : "Faça login para se identificar e permitir acompanhamento."
                        }
                         <br/>Consulte nossa <Link to="/privacidade" className="text-blue-600 hover:underline font-medium">Política de Privacidade</Link>.
                    </div>

                    {/* Botão de Envio maior e com mais destaque */}
                    <div className="text-center pt-6">
                        <button
                            type="submit"
                            disabled={isSubmitting || (formData.identificacao === 'Identificada' && !user)} // Desabilita se identificado mas não logado
                            className="inline-flex items-center justify-center px-10 py-3 border border-transparent text-lg font-semibold rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60 disabled:cursor-not-allowed transition duration-150 ease-in-out transform hover:scale-105"
                        >
                            <i className={`fas ${isSubmitting ? 'fa-spinner fa-spin' : 'fa-paper-plane'} -ml-1 mr-3 h-5 w-5`}></i>
                            {isSubmitting ? 'Enviando...' : 'Enviar Manifestação'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default OuvidoriaPage;