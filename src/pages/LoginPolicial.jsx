// src/pages/LoginPolicial.jsx (COMPLETO COM NOTIFICAÇÕES CSS ANIMADAS)

import React, { useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ReCAPTCHA from "react-google-recaptcha";
import AuthLayout from '../components/auth/AuthLayout.jsx';
import InputField from '../components/auth/InputField.jsx';

// 1. IMPORTE toast E ÍCONES ANIMADOS (CSS)
import { toast } from 'react-toastify';

// Defina os componentes SVG aqui ou importe-os
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
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [formData, setFormData] = useState({ passaporte: '', senha: '' });
    // REMOVIDO: const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const recaptchaRef = useRef(null);

    // SUA CHAVE RECAPTCHA V2
    const RECAPTCHA_V2_SITE_KEY = "6LdTmO8rAAAAACFoivqHCsdgKlOSj3VEXfBOyYRn";

    const from = location.state?.from?.pathname || "/policia/dashboard";

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        // setError(''); // Removido
        setLoading(true);

        // Verifica reCAPTCHA
        const recaptchaToken = recaptchaRef.current.getValue();
        if (!recaptchaToken) {
            // USA toast.warning
            toast.warning('Complete a verificação "Não sou um robô".');
            setLoading(false);
            recaptchaRef.current.reset(); // Reseta para tentar de novo
            return;
        }

        // Inicia toast de loading (opcional, mas bom para feedback)
        const toastId = toast.loading("Verificando credenciais...");

        try {
            const response = await fetch('api/policia/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    recaptchaToken: recaptchaToken
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Lança erro para ser pego pelo catch
                throw new Error(data.message || 'Erro na autenticação.');
            }
            if (!data.token || !data.policial) {
                console.error("LoginPolicial: Resposta API inválida!");
                throw new Error('Resposta inválida do servidor.');
            }

            // Atualiza toast para sucesso ANTES de navegar
            toast.update(toastId, {
                render: "Login bem-sucedido! Redirecionando...",
                type: 'success',
                isLoading: false,
                autoClose: 2000, // Tempo curto antes do redirect
                icon: <AnimatedCheckmark />
            });

            // Atraso mínimo para o usuário ver o toast de sucesso (opcional)
            setTimeout(() => {
                login(data, 'policial'); // Chama login do context
                navigate(from, { replace: true }); // Navega
            }, 500); // 0.5 segundos de delay

        } catch (err) {
            console.error("LoginPolicial: Erro login:", err);

            // Atualiza toast para erro
            toast.update(toastId, {
                render: `Erro: ${err.message}`,
                type: 'error',
                isLoading: false,
                autoClose: 5000, // Mais tempo para ler o erro
                icon: <AnimatedXMark />
            });

            // setError(err.message); // Removido
            localStorage.removeItem('authToken');
            localStorage.removeItem('user_session');
            recaptchaRef.current.reset(); // Resetar reCAPTCHA no erro
            setLoading(false); // Para o botão em caso de erro

        }
        // finally não é mais necessário aqui, pois setLoading(false) está no erro
        // e o sucesso tem um setTimeout
    };

    return (
        <AuthLayout
            title="Acesso Restrito - Portal Policial"
            subtitle="Identifique-se com seu passaporte e senha."
        >
            <form onSubmit={handleSubmit}>
                <InputField
                    label="Número do Passaporte" type="text" name="passaporte"
                    value={formData.passaporte} onChange={handleChange}
                    placeholder="Digite seu passaporte" required
                />
                <InputField
                    label="Senha" type="password" name="senha"
                    value={formData.senha} onChange={handleChange}
                    placeholder="Digite sua senha" required
                />

                {/* Widget reCAPTCHA v2 */}
                <div className="captcha-group" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px', marginTop: '15px' }}>
                     <ReCAPTCHA
                       ref={recaptchaRef}
                       sitekey={RECAPTCHA_V2_SITE_KEY}
                     />
                </div>

                {/* REMOVIDO: {error && <p className="error-message">{error}</p>} */}

                <button type="submit" className="auth-button" disabled={loading}>
                    {loading ? 'Verificando...' : 'Entrar'}
                </button>

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