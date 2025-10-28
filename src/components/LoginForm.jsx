import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ReCAPTCHA from "react-google-recaptcha";
import { toast } from 'react-toastify';

// O CSS do formulário é o 'Form.css', que mantém o design atual.
import './Form.css';

// --- ÍCONES ---

// Ícones para o botão de ver a senha (padrão)
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
    const [id_passaporte, setIdPassaporte] = useState('');
    const [senha, setSenha] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const recaptchaRef = useRef(null);

    const RECAPTCHA_V2_SITE_KEY = "6LdTmO8rAAAAACFoivqHCsdgKlOSj3VEXfBOyYRn";
    const from = location.state?.from?.pathname || "/";

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const recaptchaToken = recaptchaRef.current.getValue();
        if (!recaptchaToken) {
            toast.error(
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <XmarkIcon />
                    <span style={{ marginLeft: '10px' }}>Por favor, complete a verificação.</span>
                </div>,
                { icon: false } // Remove o ícone duplicado
            );
            setIsLoading(false);
            return;
        }

        const loginPromise = fetch('http://localhost:3000/api/auth/login', {
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
            success: {
                render() {
                    return (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <CheckmarkIcon />
                            <span style={{ marginLeft: '10px' }}>Login efetuado com sucesso!</span>
                        </div>
                    );
                },
                icon: false, // Remove o ícone duplicado
            },
            error: {
                render({ data }) {
                    return (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                           <XmarkIcon />
                           <span style={{ marginLeft: '10px' }}>{data.message}</span>
                        </div>
                    );
                },
                icon: false, // Remove o ícone duplicado
            }
        }).then((result) => {
            login(result, 'civil');
            navigate(from, { replace: true });
        }).catch(() => {
            recaptchaRef.current.reset();
        }).finally(() => {
            setIsLoading(false);
        });
    };

    return (
        // Layout simples que você já tinha
        <section className="form-section">
            <div className="form-box">
                <img src="/brasao.png" alt="Brasão" className="form-logo" />
                <h2>Acesso Cidadão</h2>
                <p className="form-subtitle">Use seu passaporte e senha para entrar.</p>
                
                <form onSubmit={handleSubmit}>
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
                    <p>Não tem uma conta? <Link to="/register">Crie uma agora</Link></p>
                    <p><Link to="/policia/login">Acesso Policial</Link></p>
                </div>
            </div>
        </section>
    );
}

export default LoginForm;