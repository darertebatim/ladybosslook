import { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { AdminNav } from '@/components/admin/AdminNav';
import { SEOHead } from '@/components/SEOHead';
import { useAuth } from '@/hooks/useAuth';
import { AIAssistantProvider } from '@/contexts/AIAssistantContext';
import { AIAssistantButton } from '@/components/admin/AIAssistantButton';
import { AIAssistantPanel } from '@/components/admin/AIAssistantPanel';
import { cn } from '@/lib/utils';

export const AdminLayout = () => {
  const { loading, hasAdminAccess } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
        <AdminNav collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className={cn("p-6 transition-all duration-200", sidebarCollapsed ? "ml-14" : "ml-52")}>
          <Outlet />
        </main>
      </div>
      <AIAssistantButton />
      <AIAssistantPanel />
    </AIAssistantProvider>
  );
};