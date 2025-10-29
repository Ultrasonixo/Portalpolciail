// src/components/ProtectedRoute.jsx - Corrigido

import React, { useEffect } from 'react';
import { Navigate, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { toast } from 'react-toastify'; // Importado para mensagens de erro

// Aceita requiredType E requiredPermission
function ProtectedRoute({ children, requiredType, requiredPermission }) {
    const { user, token, isLoading } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // 💥 [CORREÇÃO APLICADA] Define URLs de redirecionamento
    // Se a rota exige 'policial' OU exige qualquer permissão (que só policial tem),
    // o redirecionamento deve ser para o login policial.
    const requiresPoliceLogin = requiredType === 'policial' || requiredPermission;
    
    const loginRedirect = requiresPoliceLogin ? '/policia/login' : '/login';
    const permissionDeniedRedirect = '/'; // Para onde redirecionar se não tiver permissão

    useEffect(() => {
        if (!isLoading) {
            // 1. Não logado ou sem token
            if (!user || !token) {
                navigate(loginRedirect, { state: { from: location }, replace: true });
                return;
            }
            
            // 2. Logado, mas com tipo errado (Ex: Civil tentando Staff/RH)
            if (user && user.type === 'civil' && requiresPoliceLogin) {
                 toast.error("Acesso negado. Utilize o Login Policial para esta área.");
                 // Desloga o civil antes de redirecionar para o login policial
                 // (Assumindo que useAuth tem logout, mas sem o código, vamos focar no redirect)
                 // Se o logout não estiver disponível, o redirecionamento já é suficiente.
                 navigate(loginRedirect, { replace: true });
                 return;
            }
            
            // 3. Logado, com tipo correto (ou sem tipo exigido), MAS SEM PERMISSÃO (se requiredPermission foi passado)
            if (requiredPermission && !user.permissoes?.[requiredPermission]) {
                 // Verifica se o usuário tem a permissão master (is_staff, is_rh) se a permissão específica não for encontrada.
                 // A lógica do back-end já injeta is_rh/is_staff/is_dev.
                 const hasGlobalPermission = user.permissoes?.is_staff || user.permissoes?.is_rh || user.permissoes?.is_dev;
                 
                 if (!hasGlobalPermission) {
                     console.warn(`[ProtectedRoute] Permissão '${requiredPermission}' negada para ${user.nome_completo}. Redirecionando...`);
                     navigate(permissionDeniedRedirect, { replace: true }); // Redireciona para home ou página de erro
                     return;
                 }
            }
        }
    }, [isLoading, user, token, requiredType, requiredPermission, location, navigate, loginRedirect, permissionDeniedRedirect, requiresPoliceLogin]);

    // Renderização
    if (isLoading) {
        return <div>Verificando sessão...</div>;
    }

    // Se a verificação falhou (a negação deve ser tratada no useEffect)
    // Se o user existe E ele não tem a permissão global E não tem a permissão requerida, bloqueia.
    const accessBlockedByRender = (requiredPermission && !user?.permissoes?.[requiredPermission] && !user?.permissoes?.is_staff);

    if (!user || accessBlockedByRender) {
        return null; // Espera o useEffect redirecionar
    }

    // Permite renderização
    return children ? children : <Outlet />;
}

export default ProtectedRoute;