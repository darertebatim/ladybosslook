import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

export function AccessControlManager() {
  const queryClient = useQueryClient();

  const { data: toolConfigs = [] } = useQuery({
    queryKey: ['tool-access-config'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tool_access_config').select('*').order('tool_id') as any;
      if (error) throw error;
      return data;
    },
  });

  const { data: playlists = [] } = useQuery({
    queryKey: ['admin-playlists-sub'],
    queryFn: async () => {
      const { data, error } = await supabase.from('audio_playlists').select('id, name, requires_subscription').order('name') as any;
      if (error) throw error;
      return data;
    },
  });

  const { data: routines = [] } = useQuery({
    queryKey: ['admin-routines-sub'],
    queryFn: async () => {
      const { data, error } = await supabase.from('routines_bank').select('id, title, requires_subscription').order('title') as any;
      if (error) throw error;
      return data;
    },
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['admin-programs-sub'],
    queryFn: async () => {
      const { data, error } = await supabase.from('program_catalog').select('id, title, requires_subscription').order('title') as any;
      if (error) throw error;
      return data;
    },
  });

  const toggleTool = useMutation({
    mutationFn: async ({ id, requires_subscription }: { id: string; requires_subscription: boolean }) => {
      const { error } = await supabase.from('tool_access_config').update({ requires_subscription } as any).eq('id', id) as any;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tool-access-config'] });
      toast.success('Updated');
    },
  });

  const updateFreeLimit = useMutation({
    mutationFn: async ({ id, free_usage_limit }: { id: string; free_usage_limit: number | null }) => {
      const { error } = await supabase.from('tool_access_config').update({ free_usage_limit } as any).eq('id', id) as any;
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tool-access-config'] }),
  });

  const togglePlaylist = useMutation({
    mutationFn: async ({ id, requires_subscription }: { id: string; requires_subscription: boolean }) => {
      const { error } = await supabase.from('audio_playlists').update({ requires_subscription } as any).eq('id', id) as any;
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-playlists-sub'] }),
  });

  const toggleRoutine = useMutation({
    mutationFn: async ({ id, requires_subscription }: { id: string; requires_subscription: boolean }) => {
      const { error } = await supabase.from('routines_bank').update({ requires_subscription } as any).eq('id', id) as any;
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-routines-sub'] }),
  });

  const toggleProgram = useMutation({
    mutationFn: async ({ id, requires_subscription }: { id: string; requires_subscription: boolean }) => {
      const { error } = await supabase.from('program_catalog').update({ requires_subscription } as any).eq('id', id) as any;
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-programs-sub'] }),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2">🛠️ Tools</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Premium</TableHead>
                <TableHead>Free Limit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {toolConfigs.map((t: any) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium capitalize">{t.tool_id}</TableCell>
                  <TableCell>
                    <Switch checked={t.requires_subscription} onCheckedChange={v => toggleTool.mutate({ id: t.id, requires_subscription: v })} />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="w-20"
                      placeholder="∞"
                      value={t.free_usage_limit ?? ''}
                      onChange={e => {
                        const val = e.target.value === '' ? null : parseInt(e.target.value);
                        updateFreeLimit.mutate({ id: t.id, free_usage_limit: val });
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2">🎵 Playlists</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {playlists.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-1">
                <span className="text-sm">{p.name}</span>
                <Switch checked={p.requires_subscription} onCheckedChange={v => togglePlaylist.mutate({ id: p.id, requires_subscription: v })} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2">✨ Rituals</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {routines.map((r: any) => (
              <div key={r.id} className="flex items-center justify-between py-1">
                <span className="text-sm">{r.title}</span>
                <Switch checked={r.requires_subscription} onCheckedChange={v => toggleRoutine.mutate({ id: r.id, requires_subscription: v })} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2">📚 Programs</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {programs.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between py-1">
                <span className="text-sm">{p.title}</span>
                <Switch checked={p.requires_subscription} onCheckedChange={v => toggleProgram.mutate({ id: p.id, requires_subscription: v })} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
