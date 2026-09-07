import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Usuario } from '../types';

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  clubeAtivo: string | null;
  setClubeAtivo: (clube: string | null) => void;
  login: (token: string, usuario: Usuario) => void;
  logout: () => void;
  isAdmin: boolean;
  roleLabel: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('access_token')
  );
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const stored = localStorage.getItem('usuario');
    return stored ? JSON.parse(stored) : null;
  });

  const [clubeSimulado, setClubeSimulado] = useState<string | null>(
    () => localStorage.getItem('clube_simulado')
  );

  const login = useCallback((newToken: string, newUsuario: Usuario) => {
    localStorage.setItem('access_token', newToken);
    localStorage.setItem('usuario', JSON.stringify(newUsuario));
    setToken(newToken);
    setUsuario(newUsuario);
    if (newUsuario.clube) {
      setClubeSimulado(null);
      localStorage.removeItem('clube_simulado');
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('clube_simulado');
    setToken(null);
    setUsuario(null);
    setClubeSimulado(null);
  }, []);

  const setClubeAtivo = useCallback((clube: string | null) => {
    if (clube) {
      localStorage.setItem('clube_simulado', clube);
      setClubeSimulado(clube);
    } else {
      localStorage.removeItem('clube_simulado');
      setClubeSimulado(null);
    }
  }, []);

  // Clube efetivo: se for admin e estiver simulando, usa o simulado.
  // Caso contrário, usa o clube vinculado ao usuário.
  const isAdmin = usuario?.perfil === 'administrador';
  const clubeAtivo = isAdmin ? (clubeSimulado || usuario?.clube || null) : (usuario?.clube || null);

  const getRoleLabel = (perfil?: string) => {
    if (perfil === 'administrador') {
      return 'Administrador';
    }
    return 'Comissão Técnica';
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        clubeAtivo,
        setClubeAtivo,
        login,
        logout,
        isAdmin,
        roleLabel: getRoleLabel(usuario?.perfil),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
