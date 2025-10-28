import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom'; // Mantido para links
import ReCAPTCHA from "react-google-recaptcha";
import { toast } from 'react-toastify';
import './Form.css'; // Assume que este CSS existe e está correto

// Ícones para o botão de ver a senha (mantidos)
const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);
const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" x2="22" y1="2" y2="22"></line></svg>
);

function RegisterForm() {
    const [formData, setFormData] = useState({
        id_passaporte: '', nome_completo: '', telefone_rp: '', gmail: '', senha: ''
    });
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [agreeToTerms, setAgreeToTerms] = useState(false); // <<< NOVO ESTADO PARA TERMOS
    const recaptchaRef = useRef(null);

    // Chave do site reCAPTCHA v2 (mantenha a sua)
    const RECAPTCHA_V2_SITE_KEY = "6LdTmO8rAAAAACFoivqHCsdgKlOSj3VEXfBOyYRn";

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // <<< VERIFICAÇÃO DOS TERMOS ADICIONADA >>>
        if (!agreeToTerms) {
            toast.error('Você deve concordar com os Termos de Serviço para se registrar.');
            return; // Interrompe o envio
        }
        // <<< FIM DA VERIFICAÇÃO >>>

        if (formData.senha !== confirmarSenha) {
            toast.error('As senhas não coincidem.');
            return;
        }

        const recaptchaToken = recaptchaRef.current.getValue();
        if (!recaptchaToken) {
            toast.error('Por favor, complete a verificação "Não sou um robô".');
            return;
        }

        setIsLoading(true);

        // Cria a promessa para o toast.promise
        const registerPromise = fetch('https://cnopol.vertexsystem.com.br/api/auth/register', { // Use a URL correta da sua API
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...formData, recaptchaToken }),
        }).then(async (response) => {
            const result = await response.json();
            if (!response.ok) {
                // Lança um erro com a mensagem do backend para o toast.promise capturar
                throw new Error(result.message || 'Ocorreu um erro ao registrar.');
            }
            return result; // Retorna o resultado em caso de sucesso
        });

        // Usa toast.promise para lidar com pending/success/error
        toast.promise(
            registerPromise,
            {
                pending: 'Registrando sua conta...',
                success: 'Conta criada com sucesso!',
                error: {
                    render({ data }) {
                        // 'data' aqui é o erro lançado pelo '.then' ou fetch
                        return data?.message || 'Erro desconhecido ao registrar.';
                    }
                }
            }
        ).then(() => {
            // Limpa o formulário APENAS se o registro for bem-sucedido
            setFormData({ id_passaporte: '', nome_completo: '', telefone_rp: '', gmail: '', senha: '' });
            setConfirmarSenha('');
            setAgreeToTerms(false); // Desmarca a checkbox
            recaptchaRef.current.reset();
        }).catch(() => {
            // Em caso de erro (já tratado pelo toast.promise), apenas reseta o reCAPTCHA
            recaptchaRef.current.reset();
        }).finally(() => {
            // Independentemente de sucesso ou erro, para o loading
            setIsLoading(false);
        });
    };

    return (
        <section className="form-section">
            <div className="form-box">
                <img src="/brasao.png" alt="Brasão" className="form-logo" />
                <h2>Criar Conta no Portal</h2>
                <p className="form-subtitle">Use os dados do seu personagem.</p>
                <form onSubmit={handleSubmit}>
                    {/* Campos de Input (mantidos) */}
                    <div className="input-group">
                        <label htmlFor="id_passaporte">ID / Passaporte</label>
                        <input type="text" id="id_passaporte" name="id_passaporte" value={formData.id_passaporte} onChange={handleChange} required autoComplete="off" />
                    </div>
                    <div className="input-group">
                        <label htmlFor="nome_completo">Nome Completo (Personagem)</label>
                        <input type="text" id="nome_completo" name="nome_completo" value={formData.nome_completo} onChange={handleChange} required autoComplete="name" />
                    </div>
                    <div className="input-group">
                        <label htmlFor="telefone_rp">Telefone (RP)</label>
                        <input type="text" id="telefone_rp" name="telefone_rp" value={formData.telefone_rp} onChange={handleChange} autoComplete="tel-national"/>
                    </div>
                    <div className="input-group">
                        <label htmlFor="gmail">Gmail (Real)</label>
                        <input type="email" id="gmail" name="gmail" value={formData.gmail} onChange={handleChange} required autoComplete="email"/>
                    </div>
                    <div className="input-group">
                        <label htmlFor="senha">Senha</label>
                         <div className="password-wrapper">
                            <input type={showPassword ? 'text' : 'password'} id="senha" name="senha" value={formData.senha} onChange={handleChange} required autoComplete="new-password"/>
                             <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>
                    <div className="input-group">
                        <label htmlFor="confirmarSenha">Confirmar Senha</label>
                        <div className="password-wrapper">
                            <input type={showConfirmPassword ? 'text' : 'password'} id="confirmarSenha" name="confirmarSenha" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} required autoComplete="new-password"/>
                             <button type="button" className="password-toggle-btn" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>

                    {/* reCAPTCHA (mantido) */}
                    <div className="captcha-group">
                        <ReCAPTCHA ref={recaptchaRef} sitekey={RECAPTCHA_V2_SITE_KEY} />
                    </div>

                    {/* === CHECKBOX DE TERMOS CORRIGIDA === */}
                    <div className="input-group terms-agreement" style={{ textAlign: 'left', display: 'flex', alignItems: 'center', marginBottom: '1.5rem', marginTop: '1rem' }}>
                    <input
                            type="checkbox"
                            id="agreeTermsPolice"
                            checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    style={{ marginRight: '10px', width: 'auto', height: 'auto', cursor: 'pointer' }}
                    />
                    <label htmlFor="agreeTermsPolice" style={{ marginBottom: '0', fontWeight: 'normal', fontSize: '0.9rem', cursor: 'pointer', flexGrow: 1 }}>
                    Eu li e concordo com os <a href="/Termo.pdf" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 'bold', color: '#3b82f6' }}>Termos de Serviço</a>.
                    </label>
                     </div>
                     {/* === FIM DA CHECKBOX CORRIGIDA === */}
                    {/* === FIM DA CHECKBOX DE TERMOS === */}

                    <button type="submit" className="submit-btn" disabled={isLoading}>
                        {isLoading ? 'Criando...' : 'Criar Conta'}
                    </button>
                </form>
                <div className="form-links">
                    <p>Já tem uma conta? <Link to="/login">Faça o login</Link></p>
                    <p><Link to="/policia/login">Acesso Policial</Link></p>
                </div>
            </div>
        </section>
    );
}

export default RegisterForm;