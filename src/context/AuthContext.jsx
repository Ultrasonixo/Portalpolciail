// src/context/AuthContext.jsx - VERSÃO ATUALIZADA COM updateUserPermissions

import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); 
    const [token, setToken] = useState(null); 
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
                localStorage.clear(); 
                setToken(null);
                setUser(null);
            }
        }
        setIsLoading(false); 
    }, []);

    // Função Login
    const login = useCallback((userData, userType) => {
        // Pega 'policial' (do login policial) OU 'usuario' (do login civil)
        const { token, policial, usuario } = userData; 
        const userInfo = policial || usuario; // Pega o objeto que existir

        if (!userInfo) {
            console.error("AuthContext: Objeto 'policial' ou 'usuario' não encontrado na resposta de login.");
            localStorage.clear();
            setToken(null);
            setUser(null);
            return;
        }

        const sessionData = {
            ...userInfo, // Espalha os dados (id, nome, permissoes, etc.)
            type: userType, // Adiciona o tipo (civil ou policial)
        };

        if (token) {
             localStorage.setItem('authToken', token);
             setToken(token);
        } else {
             localStorage.removeItem('authToken'); 
             setToken(null);
        }

        localStorage.setItem('user_session', JSON.stringify(sessionData));
        setUser(sessionData); 
    }, []); 

    // Função Logout
    const logout = useCallback(() => {
        localStorage.removeItem('user_session');
        localStorage.removeItem('authToken');
        setUser(null);
        setToken(null); 
        navigate('/'); // Redireciona para a home (ou /login se preferir)
    }, [navigate]);

    // ✅ --- NOVA FUNÇÃO ---
    // Esta função permite que um componente atualize as permissões
    // do usuário logado (ex: o AdminPanel atualizando o próprio user)
    const updateUserPermissions = useCallback((newPermissions) => {
        setUser(currentUser => {
            if (!currentUser) return null; // Não faz nada se não houver usuário

            // 1. Combina as permissões antigas com as novas
            const mergedPermissions = {
                ...currentUser.permissoes,
                ...newPermissions
            };

            // 2. Cria o novo objeto de sessão
            const newSessionData = {
                ...currentUser,
                permissoes: mergedPermissions
            };

            // 3. Atualiza o localStorage para persistir a mudança
            localStorage.setItem('user_session', JSON.stringify(newSessionData));

            // 4. Retorna o novo estado
            return newSessionData;
        });
    }, []); // Sem dependências, é estável

    // O valor compartilhado
    const value = React.useMemo(() => ({
        user,
        token,
        isLoading, 
        login,
        logout,
        updateUserPermissions // ✅ 4. Disponibiliza a nova função
    }), [user, token, isLoading, login, logout, updateUserPermissions]); // Adiciona a nova função

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