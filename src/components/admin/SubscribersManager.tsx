import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

export function SubscribersManager() {
  const [search, setSearch] = useState('');

  const { data: subscribers = [], isLoading } = useQuery({
    queryKey: ['admin-subscribers'],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_subscriptions').select('*').order('created_at', { ascending: false }) as any;
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['admin-subscriber-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('id, email, full_name') as any;
      if (error) throw error;
      return data;
    },
  });

  const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

  const filtered = subscribers.filter((s: any) => {
    if (!search) return true;
    const profile = profileMap.get(s.user_id) as any;
    const searchLower = search.toLowerCase();
    return profile?.email?.toLowerCase().includes(searchLower) ||
           profile?.full_name?.toLowerCase().includes(searchLower) ||
           s.status?.includes(searchLower);
  });

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'trial': return 'secondary';
      case 'cancelled': return 'outline';
      case 'expired': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by email or name..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((s: any) => {
            const profile = profileMap.get(s.user_id) as any;
            return (
              <TableRow key={s.id}>
                <TableCell>
                  <div>
                    <div className="font-medium text-sm">{profile?.full_name || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">{profile?.email}</div>
                  </div>
                </TableCell>
                <TableCell><Badge variant={statusColor(s.status) as any}>{s.status}</Badge></TableCell>
                <TableCell className="capitalize">{s.platform}</TableCell>
                <TableCell className="text-sm">{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : '—'}</TableCell>
                <TableCell className="text-sm">{new Date(s.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            );
          })}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                {isLoading ? 'Loading...' : 'No subscribers yet'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
