import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import CampeonatosPage from './pages/CampeonatosPage';
import ScoutPage from './pages/ScoutPage';
import PlayoffsPage from './pages/PlayoffsPage';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' },
            success: { iconTheme: { primary: '#3b82f6', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/campeonatos" element={<CampeonatosPage />} />
            <Route path="/scout" element={<ScoutPage />} />
            <Route path="/playoffs" element={<PlayoffsPage />} />
            <Route path="/mata-mata" element={<Navigate to="/playoffs" replace />} />
          </Route>
          <Route element={<ProtectedRoute requiredPerfil="administrador" />}>
            <Route path="/usuarios" element={<UserManagementPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
