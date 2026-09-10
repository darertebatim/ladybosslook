import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import { BrandedSplash } from '@/components/app/BrandedSplash';
import { authUrlFor } from '@/lib/authRedirect';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requiredPage?: string;
}

export function ProtectedRoute({ children, requireAdmin = false, requiredPage }: ProtectedRouteProps) {
  const { user, loading, isAdmin, hasAdminAccess, canAccessAdminPage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Send the visitor back to exactly this page after signing in,
        // instead of dropping them inside the app.
        navigate(
          authUrlFor(`${location.pathname}${location.search}${location.hash}`),
          { replace: true },
        );
      } else if (requireAdmin && !isAdmin) {
        navigate('/');
      } else if (requiredPage && !canAccessAdminPage(requiredPage)) {
        // User doesn't have access to this specific admin page
        navigate('/app/home');
      }
    }
  }, [user, loading, isAdmin, requireAdmin, requiredPage, canAccessAdminPage, navigate, location]);

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