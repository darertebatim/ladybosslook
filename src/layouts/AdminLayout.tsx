import { Outlet } from 'react-router-dom';
import { AdminNav } from '@/components/admin/AdminNav';
import { SEOHead } from '@/components/SEOHead';

export const AdminLayout = () => {
  return (
    <>
      <SEOHead />
      <div className="min-h-screen bg-background">
        <AdminNav />
        <main className="container mx-auto p-6">
          <Outlet />
        </main>
      </div>
    </>
  );
};
