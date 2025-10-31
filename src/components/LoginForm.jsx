import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ReCAPTCHA from "react-google-recaptcha";
import { toast } from 'react-toastify';

// O CSS do formulário é o 'Form.css', que mantém o design atual.
import './Form.css';

// --- FUNÇÃO AUXILIAR PARA PEGAR O TOKEN DA URL ---
// (Não é mais usada para o fluxo de CÓDIGO, mas pode ser mantida)
// function useQuery() {
//     return new URLSearchParams(useLocation().search);
// }

// --- ÍCONES (Mantidos) ---
const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);
const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" x2="22" y1="2" y2="22"></line></svg>
);

// <<< ÍCONES ANIMADOS PARA AS NOTIFICAÇÕES >>>
const CheckmarkIcon = () => (
    <svg className="toast-icon-svg checkmark-svg" viewBox="-2 -2 56 56">
        <circle className="checkmark-circle" cx="26" cy="26" r="25"></circle>
        <path className="checkmark-check" d="M14.1 27.2l7.1 7.2 16.7-16.8"></path>
    </svg>
);
const XmarkIcon = () => (
    <svg className="toast-icon-svg xmark-svg" viewBox="0 0 52 52">
      <g transform="translate(1, 1)">
          <line className="xmark-line1" x1="15" y1="15" x2="35" y2="35"></line>
          <line className="xmark-line2" x1="35" y1="15" x2="15" y2="35"></line>
      </g>
    </svg>
);


function LoginForm() {
    // ESTADO CENTRAL PARA CONTROLE DE VISÃO: 'login', 'forgot', 'verify_code', 'reset_password'
    const [currentStep, setCurrentStep] = useState('login');

    // ESTADOS PARA LOGIN
    const [id_passaporte, setIdPassaporte] = useState('');
    const [senha, setSenha] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    // ESTADOS PARA RECUPERAÇÃO/RESET
    const [email, setEmail] = useState(''); 
    const [code, setCode] = useState('');   
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [verifiedResetToken, setVerifiedResetToken] = useState(null); // Armazena o JWT da Etapa 2

    const [isLoading, setIsLoading] = useState(false); 
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const recaptchaRef = useRef(null);

    const RECAPTCHA_V2_SITE_KEY = "6LdTmO8rAAAAACFoivqHCsdgKlOSj3VEXfBOyYRn";
    const from = location.state?.from?.pathname || "/";
    
    // --- FUNÇÃO PRINCIPAL DE LOGIN ---
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const recaptchaToken = recaptchaRef.current.getValue();
        if (!recaptchaToken) {
            toast.error(
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <XmarkIcon />
                    <span style={{ marginLeft: '10px' }}>Por favor, complete a verificação.</span>
                </div>,
                { icon: false } 
            );
            setIsLoading(false);
            recaptchaRef.current.reset();
            return;
        }

        const loginPromise = fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_passaporte, senha, recaptchaToken }),
        }).then(async (response) => {
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || `Erro ${response.status}`);
            if (!result.token || !result.usuario) throw new Error("Resposta inválida do servidor.");
            return result;
        });

        toast.promise(loginPromise, {
            pending: 'Autenticando...',
            success: { render() { return ( <div style={{ display: 'flex', alignItems: 'center' }}><CheckmarkIcon /><span style={{ marginLeft: '10px' }}>Login efetuado com sucesso!</span></div>); }, icon: false },
            error: { render({ data }) { return ( <div style={{ display: 'flex', alignItems: 'center' }}><XmarkIcon /><span style={{ marginLeft: '10px' }}>{data.message}</span></div>); }, icon: false }
        }).then((result) => {
            login(result, 'civil');
            navigate(from, { replace: true });
        }).catch(() => {
            recaptchaRef.current.reset();
        }).finally(() => {
            setIsLoading(false);
        });
    };
    
    // --- ETAPA 1: SOLICITAR CÓDIGO (FORGOT PASSWORD) ---
    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        if (!email) { toast.warning('O campo E-mail é obrigatório.'); return; }
        setIsLoading(true);
        const toastId = toast.loading("Verificando e-mail...");

        try {
            const response = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                 throw new Error(result.message || 'Erro ao processar a solicitação.');
            }
            
            toast.update(toastId, {
                render: result.message || "E-mail enviado! Verifique sua caixa de entrada.",
                type: 'success', isLoading: false, autoClose: 5000, icon: <CheckmarkIcon />
            });
            
            setCurrentStep('verify_code'); // Muda para a etapa de verificação

        } catch (err) {
            toast.update(toastId, {
                render: `Falha: ${err.message}`,
                type: 'error', isLoading: false, autoClose: 5000, icon: <XmarkIcon />
            });
        } finally {
            setIsLoading(false); // ✅ CORRIGIDO: Adicionado finally
        }
    };
    
    // --- ETAPA 2: VERIFICAR O CÓDIGO (NOVA FUNÇÃO) ---
    const handleVerifyCodeSubmit = async (e) => {
        e.preventDefault();
        if (!email || !code) { toast.error('E-mail e Código são obrigatórios.'); return; }
        
        setIsLoading(true);
        const toastId = toast.loading("Verificando código...");

        try {
            const response = await fetch('/api/auth/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }), 
            });
            
            const result = await response.json();
            if (!response.ok) {
                 throw new Error(result.message || 'Erro ao verificar o código.');
            }
            
            toast.update(toastId, {
                render: result.message || "Código correto! Crie sua nova senha.",
                type: 'success', isLoading: false, autoClose: 3000, icon: <CheckmarkIcon />
            });
            
            setVerifiedResetToken(result.resetToken); // Salva o JWT seguro
            setCurrentStep('reset_password'); // MUDA PARA A ETAPA DE REDEFINIÇÃO
            setCode(''); // Limpa o código

        } catch (err) {
            toast.update(toastId, {
                render: `Falha: ${err.message}`,
                type: 'error', isLoading: false, autoClose: 6000, icon: <XmarkIcon />
            });
        } finally {
            setIsLoading(false); // ✅ CORRIGIDO: Adicionado finally
        }
    };
    
    // --- ETAPA 3: REDEFINIR A SENHA (NOVA FUNÇÃO) ---
    const handleResetPasswordSubmit = async (e) => {
        e.preventDefault();
        if (novaSenha !== confirmarSenha) { toast.error('As senhas não coincidem.'); return; }
        if (novaSenha.length < 8) { toast.error('A senha deve ter no mínimo 8 caracteres.'); return; }
        if (!verifiedResetToken) { toast.error('Erro de sessão. Tente solicitar o código novamente.'); return; }
        
        setIsLoading(true);
        const toastId = toast.loading("Redefinindo senha...");

        try {
            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resetToken: verifiedResetToken, newPassword: novaSenha }), 
            });
            
            const result = await response.json();
            if (!response.ok) {
                 throw new Error(result.message || 'Erro ao redefinir a senha.');
            }
            
            toast.update(toastId, {
                render: result.message || "Senha redefinida! Redirecionando para o login...",
                type: 'success', isLoading: false, autoClose: 3000, icon: <CheckmarkIcon />
            });
            
            // ✅ CORRIGIDO: A função de timeout agora também para o loading
            setTimeout(() => { 
                setIsLoading(false);
                setCurrentStep('login');
                // Limpa todos os campos
                setEmail(''); setCode(''); setNovaSenha(''); setConfirmarSenha('');
                setVerifiedResetToken(null);
            }, 3500);

        } catch (err) {
            toast.update(toastId, {
                render: `Falha: ${err.message}`,
                type: 'error', isLoading: false, autoClose: 6000, icon: <XmarkIcon />
            });
            setIsLoading(false); // ✅ CORRIGIDO: Parar o loading no erro
        }
        // ✅ CORRIGIDO: Removido o finally, pois o 'try' tem um timeout
    };


    // --- RENDERIZAÇÃO CONDICIONAL ---
     
    // 1. Visão de Verificação de Código (Etapa 2)
    if (currentStep === 'verify_code') {
        return (
            <section className="form-section">
                <div className="form-box">
                    <img src="/brasao.png" alt="Brasão" className="form-logo" />
                    <h2>Confirmar Acesso</h2>
                    <p className="form-subtitle">Digite o código enviado para {email}.</p>
                    
                    <form onSubmit={handleVerifyCodeSubmit}>
                        
                        <div className="input-group">
                            <label htmlFor="email">Gmail Cadastrado (Confirmação)</label>
                            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"/>
                        </div>

                        <div className="input-group">
                            <label htmlFor="code">Código de 6 Dígitos</label>
                            <input type="text" id="code" value={code} onChange={(e) => setCode(e.target.value)} required autoComplete="one-time-code" maxLength="6"/>
                        </div>

                        <button type="submit" className="submit-btn" disabled={isLoading}>
                            {isLoading ? 'Verificando...' : 'Verificar Código'}
                        </button>
                    </form>
                    <p className="auth-redirect-link" style={{marginTop: '25px'}}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setCurrentStep('login'); }}>&larr; Voltar ao Login</a>
                    </p>
                </div>
            </section>
        );
    }
    
    // 2. Visão de Redefinição de Senha (Etapa 3)
    if (currentStep === 'reset_password') {
        return (
            <section className="form-section">
                <div className="form-box">
                    <img src="/brasao.png" alt="Brasão" className="form-logo" />
                    <h2>Redefinir Senha</h2>
                    <p className="form-subtitle">Código verificado! Crie sua nova senha.</p>
                    
                    <form onSubmit={handleResetPasswordSubmit}>
                        <div className="input-group">
                            <label htmlFor="novaSenha">Nova Senha (mín. 8 caracteres)</label>
                            <div className="password-wrapper">
                                <input type={showPassword ? 'password' : 'text'} id="novaSenha" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required autoComplete="new-password"/>
                                <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>
                        
                        <div className="input-group">
                            <label htmlFor="confirmarSenha">Confirmar Nova Senha</label>
                            <div className="password-wrapper">
                                <input type={showPassword ? 'password' : 'text'} id="confirmarSenha" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} required autoComplete="new-password"/>
                                <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="submit-btn" disabled={isLoading}>
                            {isLoading ? 'Redefinindo...' : 'Confirmar Nova Senha'}
                        </button>
                    </form>
                    <p className="auth-redirect-link" style={{marginTop: '25px'}}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setCurrentStep('login'); }}>&larr; Voltar ao Login</a>
                    </p>
                </div>
            </section>
        );
    }
    
    // 3. Visão de Esqueci a Senha (Etapa 1: Pedir o código)
    if (currentStep === 'forgot') {
        return (
            <section className="form-section">
                <div className="form-box">
                    <img src="/brasao.png" alt="Brasão" className="form-logo" />
                    <h2>Esqueceu a Senha?</h2>
                    <p className="form-subtitle">Informe seu Gmail para receber o código de 6 dígitos.</p>
                    <form onSubmit={handleForgotSubmit}>
                        <div className="input-group">
                            <label htmlFor="email">Gmail Cadastrado</label>
                            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"/>
                        </div>
                        
                        <button type="submit" className="submit-btn" disabled={isLoading}>
                            {isLoading ? 'Enviando...' : 'Solicitar Código'}
                        </button>
                        
                        <p className="auth-redirect-link" style={{marginTop: '25px'}}>
                            <a href="#" onClick={(e) => { e.preventDefault(); setCurrentStep('login'); }}>&larr; Voltar ao Login</a>
                        </p>
                    </form>
                </div>
            </section>
        );
    }


    // 4. Visão Padrão: Login
    return (
        <section className="form-section">
            <div className="form-box">
                <img src="/brasao.png" alt="Brasão" className="form-logo" />
                <h2>Acesso Cidadão</h2>
                <p className="form-subtitle">Use seu passaporte e senha para entrar.</p>
                
                <form onSubmit={handleLoginSubmit}>
                    <div className="input-group">
                        <label htmlFor="id_passaporte">ID / Passaporte</label>
                        <input type="text" id="id_passaporte" value={id_passaporte} onChange={(e) => setIdPassaporte(e.target.value)} required autoComplete="username"/>
                    </div>
                    
                    <div className="input-group">
                        <label htmlFor="senha">Senha</label>
                        <div className="password-wrapper">
                            <input type={showPassword ? 'text' : 'password'} id="senha" value={senha} onChange={(e) => setSenha(e.target.value)} required autoComplete="current-password"/>
                            <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>

                    <div className="captcha-group">
                         <ReCAPTCHA ref={recaptchaRef} sitekey={RECAPTCHA_V2_SITE_KEY} />
                    </div>

                    <button type="submit" className="submit-btn" disabled={isLoading}>
                        {isLoading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                <div className="form-links">
                    {/* Botão de Esqueceu a Senha (muda para a etapa 'forgot') */}
                    <p>
                        <a href="#" onClick={(e) => {e.preventDefault(); setCurrentStep('forgot');}}>Esqueceu a Senha?</a>
                    </p>
                    <p>Não tem uma conta? <Link to="/register">Crie uma agora</Link></p>
                    <p><Link to="/policia/login">Acesso Policial</Link></p>
                </div>
            </div>
        </section>
    );
}

export default LoginForm;