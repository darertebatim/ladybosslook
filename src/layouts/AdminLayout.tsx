import { Outlet, Navigate } from 'react-router-dom';
import { AdminNav } from '@/components/admin/AdminNav';
import { SEOHead } from '@/components/SEOHead';
import { useAuth } from '@/hooks/useAuth';
import { AIAssistantProvider } from '@/contexts/AIAssistantContext';
import { AIAssistantButton } from '@/components/admin/AIAssistantButton';
import { AIAssistantPanel } from '@/components/admin/AIAssistantPanel';

export const AdminLayout = () => {
  const { loading, hasAdminAccess } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!hasAdminAccess) {
    return <Navigate to="/app/home" replace />;
  }

  return (
    <AIAssistantProvider>
      <SEOHead />
      <div className="min-h-screen bg-background">
        <AdminNav />
        <main className="container mx-auto p-6">
          <Outlet />
        </main>
      </div>
      <AIAssistantButton />
      <AIAssistantPanel />
    </AIAssistantProvider>
  );
};