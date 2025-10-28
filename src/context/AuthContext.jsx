// src/context/AuthContext.jsx - VERSÃO FINAL (COM isLoading)

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); // Inicia como null
    const [token, setToken] = useState(null); // Inicia como null
    
    // ✅ 1. O ESTADO DE CARREGAMENTO
    // Começa como 'true' para indicar que estamos verificando o localStorage
    const [isLoading, setIsLoading] = useState(true); 
    
    const navigate = useNavigate();

    // Roda SÓ UMA VEZ quando o app abre
    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user_session');

        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch (e) {
                localStorage.clear(); // Limpa se estiver corrompido
                setToken(null);
                setUser(null);
            }
        } else {
        }
        
        // ✅ 2. AVISA QUE TERMINOU A VERIFICAÇÃO INICIAL
        setIsLoading(false); 
    }, []); // Array vazio [] = roda só no mount

    // Função Login
    // src/context/AuthContext.jsx

const login = useCallback((userData, userType) => {
    // ✅ CORREÇÃO: Pega 'policial' OU 'usuario' da resposta
    const { token, policial, usuario } = userData; 
    const userInfo = policial || usuario; // Pega o objeto que existir

    // Verifica se userInfo foi encontrado
    if (!userInfo) {
        // Você pode querer limpar o localStorage aqui também por segurança
        localStorage.clear();
        setToken(null);
        setUser(null);
        setIsLoading(false); // Garante que parou de carregar
        return; // Interrompe a função
    }

    const sessionData = {
        ...userInfo, // Espalha os dados (id, nome, etc.)
        type: userType, // Adiciona o tipo (civil ou policial)
    };

    // Salva token se existir (para policial)
    if (token) {
         localStorage.setItem('authToken', token);
         setToken(token);
    } else {
         // Limpa token antigo se logando como civil (que não usa token no estado)
         localStorage.removeItem('authToken'); 
         setToken(null);
    }

    localStorage.setItem('user_session', JSON.stringify(sessionData));
    setUser(sessionData); // Salva o objeto 'sessionData' no estado 'user'
    // setIsLoading(false); // Já é feito no useEffect inicial
    }, []); // Removido token e user das dependências, login é estável

    // Função Logout
    const logout = useCallback(() => {
        localStorage.removeItem('user_session');
        localStorage.removeItem('authToken');
        setUser(null);
        setToken(null); 
        navigate('/loginPolicial'); // Ou para onde você quiser redirecionar
    }, [navigate]);

    // O valor compartilhado
    const value = React.useMemo(() => ({
        user,
        token,
        isLoading, // ✅ 3. Fornece o isLoading
        login,
        logout
    }), [user, token, isLoading, login, logout]); // Adiciona isLoading às dependências

    // Renderiza os filhos (o resto do App)
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Hook customizado (inalterado)
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth deve ser usado dentro de um AuthProvider');
    }
    return context;
};