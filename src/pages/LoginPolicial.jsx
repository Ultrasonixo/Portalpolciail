// src/pages/LoginPolicial.jsx (COMPLETO COM RECUPERAÇÃO DE SENHA E "OLHINHO")

import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ReCAPTCHA from "react-google-recaptcha";
import AuthLayout from '../components/auth/AuthLayout.jsx';
// ⚠️ IMPORTANTE: Precisamos do CSS do formulário unificado
import '../components/Form.css'; 
import { toast } from 'react-toastify';

// --- ÍCONES ---
const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
);
const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" x2="22" y1="2" y2="22"></line></svg>
);
const AnimatedCheckmark = () => (
  <svg className="toast-icon-svg checkmark-svg" viewBox="0 0 52 52">
    <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
    <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
  </svg>
);
const AnimatedXMark = () => (
  <svg className="toast-icon-svg xmark-svg" viewBox="0 0 52 52">
    <g transform="translate(26 26)">
        <line className="xmark-line1" x1="-15" y1="-15" x2="15" y2="15" />
        <line className="xmark-line2" x1="-15" y1="15" x2="15" y2="-15" />
    </g>
  </svg>
);


const LoginPolicial = () => {
    // ESTADO CENTRAL PARA CONTROLE DE VISÃO: 'login', 'forgot', 'verify_code', 'reset_password'
    const [currentStep, setCurrentStep] = useState('login');

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // ESTADOS PARA LOGIN
    const [passaporte, setPassaporte] = useState('');
    const [senha, setSenha] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // ESTADOS PARA RECUPERAÇÃO/RESET
    const [email, setEmail] = useState(''); // E-mail para onde enviar o código
    const [code, setCode] = useState('');
    const [novaSenha, setNovaSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [verifiedResetToken, setVerifiedResetToken] = useState(null); // Armazena o JWT da Etapa 2

    const [loading, setLoading] = useState(false);
    const recaptchaRef = useRef(null);

    const RECAPTCHA_V2_SITE_KEY = "6LdTmO8rAAAAACFoivqHCsdgKlOSj3VEXfBOyYRn";
    const from = location.state?.from?.pathname || "/policia/dashboard";

    // --- FUNÇÃO PRINCIPAL DE LOGIN ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const recaptchaToken = recaptchaRef.current.getValue();
        if (!recaptchaToken) {
            toast.warning('Complete a verificação "Não sou um robô".');
            setLoading(false);
            recaptchaRef.current.reset();
            return;
        }

        const toastId = toast.loading("Verificando credenciais...");

        try {
            const response = await fetch('/api/policia/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    passaporte: passaporte, 
                    senha: senha,           
                    recaptchaToken: recaptchaToken
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro na autenticação.');
            }
            if (!data.token || !data.policial) {
                console.error("LoginPolicial: Resposta API inválida!");
                throw new Error('Resposta inválida do servidor.');
            }

            toast.update(toastId, {
                render: "Login bem-sucedido! Redirecionando...",
                type: 'success', isLoading: false, autoClose: 2000,
                icon: <AnimatedCheckmark />
            });

            setTimeout(() => {
                login(data, 'policial');
                navigate(from, { replace: true });
            }, 500);

        } catch (err) {
            console.error("LoginPolicial: Erro login:", err);
            toast.update(toastId, {
                render: `Erro: ${err.message}`,
                type: 'error', isLoading: false, autoClose: 5000,
                icon: <AnimatedXMark />
            });
            localStorage.removeItem('authToken');
            localStorage.removeItem('user_session');
            recaptchaRef.current.reset();
            setLoading(false);
        }
    };
    
    // --- ETAPA 1: SOLICITAR CÓDIGO (FORGOT PASSWORD) ---
    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        if (!email) { // ✅ REQUISITO: Apenas E-mail
            toast.warning('O campo Gmail é obrigatório.'); 
            return; 
        }
        setLoading(true);
        const toastId = toast.loading("Verificando e-mail...");

        try {
            // ⚠️ ROTA POLICIAL
            const response = await fetch('/api/policia/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }), // ✅ Apenas E-mail
            });
            
            const result = await response.json();
            
            if (!response.ok) { // Captura o erro 404 (Gmail não cadastrado)
                 throw new Error(result.message || 'Erro ao processar a solicitação.');
            }
            
            toast.update(toastId, {
                render: result.message || "E-mail enviado! Verifique sua caixa de entrada.",
                type: 'success', isLoading: false, autoClose: 5000, icon: <AnimatedCheckmark />
            });
            
            setCurrentStep('verify_code'); // Muda para a etapa de verificação

        } catch (err) {
            toast.update(toastId, {
                render: `Falha: ${err.message}`, // ✅ Exibe a mensagem de "Gmail não cadastrado"
                type: 'error', isLoading: false, autoClose: 5000, icon: <AnimatedXMark />
            });
        } finally {
            setLoading(false);
        }
    };
    
    // --- ETAPA 2: VERIFICAR O CÓDIGO ---
    const handleVerifyCodeSubmit = async (e) => {
        e.preventDefault();
        if (!email || !code) { // ✅ REQUISITO: Apenas E-mail e Código
            toast.error('E-mail e Código são obrigatórios.'); 
            return; 
        }
        
        setLoading(true);
        const toastId = toast.loading("Verificando código...");

        try {
            // ⚠️ ROTA POLICIAL
            const response = await fetch('/api/policia/verify-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }), // ✅ Apenas E-mail e Código
            });
            
            const result = await response.json();
            if (!response.ok) {
                 throw new Error(result.message || 'Erro ao verificar o código.');
            }
            
            toast.update(toastId, {
                render: result.message || "Código correto! Crie sua nova senha.",
                type: 'success', isLoading: false, autoClose: 3000, icon: <AnimatedCheckmark />
            });
            
            setVerifiedResetToken(result.resetToken); // Salva o JWT seguro
            setCurrentStep('reset_password'); // MUDA PARA A ETAPA DE REDEFINIÇÃO
            setCode('');

        } catch (err) {
            toast.update(toastId, {
                render: `Falha: ${err.message}`,
                type: 'error', isLoading: false, autoClose: 6000, icon: <AnimatedXMark />
            });
        } finally {
            setLoading(false);
        }
    };
    
    // --- ETAPA 3: REDEFINIR A SENHA ---
    const handleResetPasswordSubmit = async (e) => {
        e.preventDefault();
        if (novaSenha !== confirmarSenha) { toast.error('As senhas não coincidem.'); return; }
        if (novaSenha.length < 8) { toast.error('A senha deve ter no mínimo 8 caracteres.'); return; }
        if (!verifiedResetToken) { toast.error('Erro de sessão. Tente solicitar o código novamente.'); return; }
        
        setLoading(true);
        const toastId = toast.loading("Redefinindo senha...");

        try {
            // ⚠️ ROTA POLICIAL
            const response = await fetch('/api/policia/reset-password', {
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
                type: 'success', isLoading: false, autoClose: 3000, icon: <AnimatedCheckmark />
            });
            
            setTimeout(() => { 
                setLoading(false); // ✅ CORRIGIDO: Parar o loading no sucesso
                setCurrentStep('login');
                // Limpa todos os campos
                setPassaporte(''); setEmail(''); setCode(''); setNovaSenha(''); setConfirmarSenha('');
                setVerifiedResetToken(null);
            }, 3500);

        } catch (err) {
            toast.update(toastId, {
                render: `Falha: ${err.message}`,
                type: 'error', isLoading: false, autoClose: 6000, icon: <AnimatedXMark />
            });
            setLoading(false);
        }
    };


    // --- RENDERIZAÇÃO CONDICIONAL ---

    // 1. Visão de Verificação de Código (Etapa 2)
    if (currentStep === 'verify_code') {
        return (
            <AuthLayout
                title="Confirmar Acesso Policial"
                subtitle={`Digite o código enviado para ${email}.`}
            >
                <form onSubmit={handleVerifyCodeSubmit}>
                    {/* ✅ CAMPO PASSAPORTE REMOVIDO DAQUI */}
                    <div className="input-group">
                        <label htmlFor="email">Gmail Cadastrado (Confirmação)</label>
                        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"/>
                    </div>
                    <div className="input-group">
                        <label htmlFor="code">Código de 6 Dígitos</label>
                        <input type="text" id="code" value={code} onChange={(e) => setCode(e.target.value)} required autoComplete="one-time-code" maxLength="6"/>
                    </div>
                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Verificando...' : 'Verificar Código'}
                    </button>
                    <p className="auth-redirect-link" style={{marginTop: '25px'}}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setCurrentStep('login'); }}>&larr; Voltar ao Login</a>
                    </p>
                </form>
            </AuthLayout>
        );
    }
    
    // 2. Visão de Redefinição de Senha (Etapa 3)
    if (currentStep === 'reset_password') {
        return (
             <AuthLayout
                title="Redefinir Senha Policial"
                subtitle="Código verificado! Crie sua nova senha."
            >
                <form onSubmit={handleResetPasswordSubmit}>
                    <div className="input-group">
                        <label htmlFor="novaSenha">Nova Senha (mín. 8 caracteres)</label>
                        <div className="password-wrapper">
                            <input type={showPassword ? 'text' : 'password'} id="novaSenha" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} required autoComplete="new-password"/>
                            <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>
                    <div className="input-group">
                        <label htmlFor="confirmarSenha">Confirmar Nova Senha</label>
                        <div className="password-wrapper">
                            <input type={showPassword ? 'text' : 'password'} id="confirmarSenha" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} required autoComplete="new-password"/>
                            <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Redefinindo...' : 'Confirmar Nova Senha'}
                    </button>
                </form>
            </AuthLayout>
        );
    }
    
    // 3. Visão de Esqueci a Senha (Etapa 1: Pedir o código)
    if (currentStep === 'forgot') {
        return (
            <AuthLayout
                title="Esqueceu a Senha? (Policial)"
                subtitle="Informe seu Gmail de cadastro para receber o código."
            >
                <form onSubmit={handleForgotSubmit}>
                    {/* ✅ CAMPO PASSAPORTE REMOVIDO DAQUI */}
                    <div className="input-group">
                        <label htmlFor="email">Gmail Cadastrado</label>
                        <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"/>
                    </div>
                    <button type="submit" className="auth-button" disabled={loading}>
                        {loading ? 'Enviando...' : 'Solicitar Código'}
                    </button>
                    <p className="auth-redirect-link" style={{marginTop: '25px'}}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setCurrentStep('login'); }}>&larr; Voltar ao Login</a>
                    </p>
                </form>
            </AuthLayout>
        );
    }


    // 4. Visão Padrão: Login
    return (
        <AuthLayout
            title="Acesso Restrito - Portal Policial"
            subtitle="Identifique-se com seu passaporte e senha."
        >
            <form onSubmit={handleSubmit}>
                {/* ✅ Substituído InputField por <div className="input-group"> */}
                <div className="input-group">
                    <label htmlFor="passaporte">Número do Passaporte</label>
                    <input type="text" id="passaporte" value={passaporte} onChange={(e) => setPassaporte(e.target.value)} required autoComplete="username"/>
                </div>
                
                <div className="input-group">
                    <label htmlFor="senha">Senha</label>
                    <div className="password-wrapper">
                        <input 
                            type={showPassword ? 'text' : 'password'} 
                            id="senha" 
                            name="senha" 
                            value={senha} 
                            onChange={(e) => setSenha(e.target.value)} 
                            placeholder="Digite sua senha" 
                            required
                            autoComplete="current-password"
                        />
                        <button type="button" className="password-toggle-btn" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                    </div>
                </div>

                {/* Widget reCAPTCHA v2 */}
                <div className="captcha-group" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', marginTop: '15px' }}>
                     <ReCAPTCHA
                       ref={recaptchaRef}
                       sitekey={RECAPTCHA_V2_SITE_KEY}
                     />
                </div>

                <button type="submit" className="auth-button" disabled={loading}>
                    {loading ? 'Verificando...' : 'Entrar'}
                </button>

                <p className="auth-redirect-link">
                    <a href="#" onClick={(e) => {e.preventDefault(); setCurrentStep('forgot');}}>Esqueceu a Senha?</a>
                </p>
                <p className="auth-redirect-link">
                    Não tem acesso? <Link to="/policia/register">Solicite aqui</Link>
                </p>
                <p className="auth-redirect-link">
                     <Link to="/">Voltar para o Portal Cidadão</Link>
                </p>
            </form>
        </AuthLayout>
    );
};

export default LoginPolicial;
