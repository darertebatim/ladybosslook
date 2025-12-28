import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requiredPage?: string;
}

export function ProtectedRoute({ children, requireAdmin = false, requiredPage }: ProtectedRouteProps) {
  const { user, loading, isAdmin, hasAdminAccess, canAccessAdminPage } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (requireAdmin && !isAdmin) {
        navigate('/');
      } else if (requiredPage && !canAccessAdminPage(requiredPage)) {
        // User doesn't have access to this specific admin page
        navigate('/app/home');
      }
    }
  }, [user, loading, isAdmin, requireAdmin, requiredPage, canAccessAdminPage, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireAdmin && !isAdmin) {
    return null;
  }

  if (requiredPage && !canAccessAdminPage(requiredPage)) {
    return null;
  }

  return <>{children}</>;
}