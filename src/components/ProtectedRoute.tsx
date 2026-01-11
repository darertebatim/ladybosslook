import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { BrandedSplash } from '@/components/app/BrandedSplash';

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
    return <BrandedSplash />;
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