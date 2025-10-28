// src/pages/BoletimPage.jsx - PÁGINA QUE USA O BoletimForm

import React from 'react';
import { useAuth } from '../context/AuthContext'; // Para pegar user, token, isLoading
import BoletimForm from '../components/BoletimForm.jsx'; // Importa o formulário
import { Navigate } from 'react-router-dom'; // Para redirecionar se não for civil

// import './BoletimPage.css'; // Pode ter estilos específicos da página aqui

const BoletimPage = () => {
    // 1. Pega os dados de autenticação
    const { user, token, isLoading } = useAuth();

    // 2. Mostra loading enquanto o AuthContext carrega
    if (isLoading) {
        return <div className="page-container"><p style={{textAlign: 'center', marginTop: '40px'}}>Carregando...</p></div>;
    }

    // 3. Verifica se o usuário está logado E é do tipo 'civil'
    //    O ProtectedRoute já faz isso, mas é uma dupla checagem segura.
    if (!user || user.type !== 'civil') {
        console.warn("BoletimPage: Acesso negado ou usuário inválido. User:", user);
        // Redireciona para o login civil se o acesso for indevido
        // (Embora ProtectedRoute deva ter pego isso antes)
        return <Navigate to="/login" replace />; 
        // Ou mostre uma mensagem de erro:
        // return <div className="page-container"><p style={{textAlign: 'center', color: 'red'}}>Acesso negado. Faça login como cidadão.</p></div>;
    }

    // 4. Se passou pelas verificações, renderiza o BoletimForm
    //    Passamos 'user' e 'token' como props para o formulário usar.
    return (
        <div className="page-container boletim-page"> {/* Adicione classes se necessário */}
            {/* O formulário agora recebe user e token via props */}
            <BoletimForm user={user} token={token} /> 
        </div>
    );
};

export default BoletimPage;