import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  requiredPerfil?: 'administrador' | 'comissao_tecnica';
}

export default function ProtectedRoute({ requiredPerfil }: Props) {
  const { token, usuario } = useAuth();

  if (!token || !usuario) {
    return <Navigate to="/login" replace />;
  }

  if (requiredPerfil === 'administrador' && usuario.perfil !== 'administrador') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
