import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, requiredRole }) {
  const { authState, loading } = useAuth();

  if (loading) return null; // O un spinner, lo que prefieras

  if (!authState.isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === "admin" && !authState.admin) {
    return <Navigate to="/" replace />;
  }

  return children;
}