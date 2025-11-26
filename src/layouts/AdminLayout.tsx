import { Outlet } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { SEOHead } from '@/components/SEOHead';

export const AdminLayout = () => {
  return (
    <>
      <SEOHead />
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-background">
          <AdminSidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-14 border-b flex items-center px-4 bg-background sticky top-0 z-10">
              <SidebarTrigger className="mr-4" />
              <h1 className="text-xl font-semibold">Admin Panel</h1>
            </header>
            <main className="flex-1 p-6">
              <Outlet />
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
};
