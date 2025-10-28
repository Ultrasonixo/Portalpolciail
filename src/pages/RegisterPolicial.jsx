import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Mantido Link para termos
import ReCAPTCHA from "react-google-recaptcha";
import { toast } from 'react-toastify'; // Importa toast
import AuthLayout from '../components/auth/AuthLayout.jsx';
import InputField from '../components/auth/InputField.jsx';
// Importe os ícones animados se quiser usá-los nos toasts aqui também
// import { AnimatedCheckmark, AnimatedXMark } from './path/to/icons'; // Ajuste o caminho

const RegisterPolicial = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        passaporte: '', nome_completo: '', discord_id: '',
        telefone_rp: '', gmail: '', senha: '', registration_token: '',
    });
    const [confirmarSenha, setConfirmarSenha] = useState('');
    // const [error, setError] = useState(''); // Usaremos toast para erros
    // const [success, setSuccess] = useState(''); // Usaremos toast para sucesso
    const [loading, setLoading] = useState(false);
    const [agreeToTerms, setAgreeToTerms] = useState(false); // <<< NOVO ESTADO PARA TERMOS
    const recaptchaRef = useRef(null);

    // Chave do site reCAPTCHA v2 (mantenha a sua)
    const RECAPTCHA_V2_SITE_KEY = "6LdTmO8rAAAAACFoivqHCsdgKlOSj3VEXfBOyYRn";

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleConfirmarSenhaChange = (e) => setConfirmarSenha(e.target.value);

    const handleSubmit = async (e) => {
        e.preventDefault();
        // setError(''); // Removido
        // setSuccess(''); // Removido

        // <<< VERIFICAÇÃO DOS TERMOS ADICIONADA >>>
        if (!agreeToTerms) {
            toast.error('Você deve concordar com os Termos de Serviço para se registrar.');
            // setError('Você deve concordar com os Termos de Serviço para se registrar.'); // Alternativa se não usar toast
            return; // Interrompe o envio
        }
        // <<< FIM DA VERIFICAÇÃO >>>

        if (formData.senha !== confirmarSenha) {
            toast.error('As senhas não coincidem.');
            // setError('As senhas não coincidem.'); // Alternativa
            return;
        }
        if (!formData.registration_token) {
            toast.error("O Token de Registo é obrigatório.");
            // setError("O Token de Registo é obrigatório."); // Alternativa
            return;
        }

        const recaptchaToken = recaptchaRef.current.getValue();
        if (!recaptchaToken) {
            toast.error('Por favor, complete a verificação "Não sou um robô".');
            // setError('Por favor, complete a verificação "Não sou um robô".'); // Alternativa
            return;
        }

        setLoading(true);
        const toastId = toast.loading("Enviando alistamento..."); // Inicia toast de loading

        try {
            const response = await fetch('https://cnopol.vertexsystem.com.br/api/policia/register', { // Use a URL correta
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, recaptchaToken }),
            });
            const data = await response.json();
            if (!response.ok) {
                // Lança erro para o catch tratar e mostrar no toast
                throw new Error(data.message || 'Não foi possível realizar o registo.');
            }

            // Atualiza o toast para sucesso
            toast.update(toastId, {
                render: data.message + ' Redirecionando para login...',
                type: 'success',
                isLoading: false,
                autoClose: 3000 // Fecha após 3 segundos
                // icon: <AnimatedCheckmark /> // Opcional: Adicionar ícone
            });

            // Limpa o formulário e reseta
            setFormData({ passaporte: '', nome_completo: '', discord_id: '', telefone_rp: '', gmail: '', senha: '', registration_token: '' });
            setConfirmarSenha('');
            setAgreeToTerms(false); // Desmarca checkbox
            recaptchaRef.current.reset();

            // Redireciona após um pequeno delay para o toast ser visível
            setTimeout(() => navigate('/policia/login'), 3500);

        } catch (err) {
            console.error("Erro no registo policial:", err);
            // Atualiza o toast para erro
            toast.update(toastId, {
                render: `Erro: ${err.message}`,
                type: 'error',
                isLoading: false,
                autoClose: 5000 // Deixa o erro visível por mais tempo
                // icon: <AnimatedXMark /> // Opcional: Adicionar ícone
            });
            // setError(err.message); // Removido
            recaptchaRef.current.reset(); // Reseta reCAPTCHA no erro
            setLoading(false); // Libera o botão no erro
        }
        // finally não é mais necessário aqui por causa do setTimeout no sucesso
    };

    return (
        <AuthLayout
            title="Alistamento Policial"
            subtitle="Preencha os dados e insira o token fornecido pelo RH."
        >
            <form onSubmit={handleSubmit}>
                {/* Campos InputField (mantidos) */}
                <InputField label="Número do Passaporte" type="text" name="passaporte" value={formData.passaporte} onChange={handleChange} required autoComplete="off"/>
                <InputField label="Nome Completo" type="text" name="nome_completo" value={formData.nome_completo} onChange={handleChange} required autoComplete="name"/>
                <InputField label="Discord ID" type="text" name="discord_id" value={formData.discord_id} onChange={handleChange} required />
                <InputField label="Telefone (RP)" type="text" name="telefone_rp" value={formData.telefone_rp} onChange={handleChange} autoComplete="tel-national"/>
                <InputField label="Gmail" type="email" name="gmail" value={formData.gmail} onChange={handleChange} required autoComplete="email"/>
                <InputField label="Senha" type="password" name="senha" value={formData.senha} onChange={handleChange} required autoComplete="new-password"/>
                <InputField label="Confirmar Senha" type="password" name="confirmarSenha" value={confirmarSenha} onChange={handleConfirmarSenhaChange} required autoComplete="new-password"/>
                <InputField label="Token de Registo" type="text" name="registration_token" value={formData.registration_token} onChange={handleChange} placeholder="Insira o token recebido" required/>

                {/* Widget reCAPTCHA v2 (mantido) */}
                <div className="captcha-group" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', marginTop: '15px' }}>
                     <ReCAPTCHA
                       ref={recaptchaRef}
                       sitekey={RECAPTCHA_V2_SITE_KEY}
                     />
                </div>

                 {/* === CHECKBOX DE TERMOS ADICIONADA === */}
                 <div className="input-group terms-agreement" style={{ textAlign: 'left', display: 'flex', alignItems: 'center', marginBottom: '1.5rem', marginTop: '1rem' }}>
                    <input
                        type="checkbox"
                        id="agreeTermsPolice"
                        checked={agreeToTerms}
                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                        style={{ marginRight: '10px', width: 'auto', height: 'auto', cursor: 'pointer' }}
                    />
                    <label htmlFor="agreeTermsPolice" style={{ marginBottom: '0', fontWeight: 'normal', fontSize: '0.9rem', cursor: 'pointer', flexGrow: 1 }}>
                         Eu li e concordo com os <Link to="/termos" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold', color: '#3b82f6' }}>Termos de Serviço</Link>.
                    </label>
                    
                 </div>
                 {/* === FIM DA CHECKBOX DE TERMOS === */}

                {/* REMOVIDO: {error && ...} {success && ...} - Agora tratados pelo toast */}

                {/* O botão é desabilitado enquanto carrega OU se o sucesso já foi mostrado (para evitar duplo clique antes do redirect) */}
                <button type="submit" className="auth-button" disabled={loading}>
                    {loading ? 'Enviando Alistamento...' : 'Enviar Alistamento'}
                </button>
                <p className="auth-redirect-link">
                    Já tem uma conta? <Link to="/policia/login">Faça o login</Link>
                </p>
                <p className="auth-redirect-link">
                     <Link to="/">Voltar para o Portal Cidadão</Link>
                </p>
            </form>
        </AuthLayout>
    );
};

export default RegisterPolicial;