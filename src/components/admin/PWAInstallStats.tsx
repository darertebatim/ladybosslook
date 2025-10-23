import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Smartphone } from 'lucide-react';
import { format } from 'date-fns';

interface PWAInstall {
  id: string;
  user_id: string;
  created_at: string;
  full_name?: string;
  email?: string;
}

export function PWAInstallStats() {
  const [installs, setInstalls] = useState<PWAInstall[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstalls();
  }, []);

  const fetchInstalls = async () => {
    try {
      const { data: installations, error } = await supabase
        .from('pwa_installations')
        .select('id, user_id, installed_at, platform')
        .order('installed_at', { ascending: false });

      if (error) throw error;

      if (!installations || installations.length === 0) {
        setInstalls([]);
        return;
      }

      // Get profiles for all users
      const userIds = installations.map(i => i.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);

      // Merge installation data with profile data
      const installsWithProfiles = installations.map(install => {
        const profile = profiles?.find(p => p.id === install.user_id);
        return {
          id: install.id,
          user_id: install.user_id,
          created_at: install.installed_at,
          full_name: profile?.full_name,
          email: profile?.email,
        };
      });

      setInstalls(installsWithProfiles);
    } catch (error) {
      console.error('Error fetching PWA installs:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          <CardTitle>PWA Installations</CardTitle>
        </div>
        <CardDescription>
          Users who have installed the Progressive Web App
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : installs.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No PWA installations yet
          </p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {installs.length} Total Installations
              </Badge>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Installed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {installs.map((install) => (
                    <TableRow key={install.id}>
                      <TableCell className="font-medium">
                        {install.full_name || 'Unknown'}
                      </TableCell>
                      <TableCell>{install.email || 'N/A'}</TableCell>
                      <TableCell>
                        {format(new Date(install.created_at), 'MMM d, yyyy HH:mm')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
