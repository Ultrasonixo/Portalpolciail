// src/components/ProtectedRoute.jsx - Exemplo com requiredPermission
import React, { useEffect } from 'react';
import { Navigate, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// Aceita requiredType E requiredPermission
function ProtectedRoute({ children, requiredType, requiredPermission }) {
    const { user, token, isLoading } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    // Define URLs de redirecionamento
    const loginRedirect = requiredType === 'policial' ? '/policia/login' : '/login';
    const permissionDeniedRedirect = '/'; // Para onde redirecionar se não tiver permissão

    useEffect(() => {
        if (!isLoading) {
            // 1. Não logado ou sem token
            if (!user || !token) {
                navigate(loginRedirect, { state: { from: location }, replace: true });
            }
            // 2. Logado, mas com tipo errado (se requiredType foi passado)
            else if (requiredType && user.type !== requiredType) {
                navigate(permissionDeniedRedirect, { replace: true });
            }
            // 3. Logado, com tipo correto (ou sem tipo exigido), MAS SEM PERMISSÃO (se requiredPermission foi passado)
            else if (requiredPermission && !user.permissoes?.[requiredPermission]) {
                console.warn(`[ProtectedRoute] Permissão '${requiredPermission}' negada para ${user.nome_completo}. Redirecionando...`);
                navigate(permissionDeniedRedirect, { replace: true }); // Redireciona para home ou página de erro
            }
            // 4. Acesso permitido
            else {
                 // OK
            }
        }
    }, [isLoading, user, token, requiredType, requiredPermission, location, navigate, loginRedirect, permissionDeniedRedirect]);

    // Renderização
    if (isLoading) {
        return <div>Verificando sessão...</div>;
    }

    // Se não está carregando E a condição de acesso falha (tipo OU permissão)
    if (!isLoading && (
        !user || !token ||
        (requiredType && user.type !== requiredType) ||
        (requiredPermission && !user.permissoes?.[requiredPermission])
    )) {
        return null; // Espera o useEffect redirecionar
    }

    // Permite renderização
    return children ? children : <Outlet />;
}

export default ProtectedRoute;