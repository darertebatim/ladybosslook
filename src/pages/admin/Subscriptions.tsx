import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, Crown, Search } from 'lucide-react';
import { toast } from 'sonner';

// ─── Products Tab ───
function ProductsTab() {
  const queryClient = useQueryClient();
  const [newProduct, setNewProduct] = useState({ name: '', ios_product_id: '', stripe_price_id: '', interval: 'monthly', price_amount: 0, trial_days: 7 });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['subscription-products'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subscription_products').select('*').order('created_at') as any;
      if (error) throw error;
      return data;
    },
  });

  const addProduct = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('subscription_products').insert({
        name: newProduct.name,
        ios_product_id: newProduct.ios_product_id || null,
        stripe_price_id: newProduct.stripe_price_id || null,
        interval: newProduct.interval,
        price_amount: newProduct.price_amount,
        trial_days: newProduct.trial_days,
      } as any) as any;
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription-products'] });
      setNewProduct({ name: '', ios_product_id: '', stripe_price_id: '', interval: 'monthly', price_amount: 0, trial_days: 7 });
      toast.success('Product added');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('subscription_products').update({ is_active } as any).eq('id', id) as any;
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subscription-products'] }),
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-lg">Add Product</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Name (e.g. Premium Monthly)" value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))} />
            <Input placeholder="iOS Product ID" value={newProduct.ios_product_id} onChange={e => setNewProduct(p => ({ ...p, ios_product_id: e.target.value }))} />
            <Input placeholder="Stripe Price ID" value={newProduct.stripe_price_id} onChange={e => setNewProduct(p => ({ ...p, stripe_price_id: e.target.value }))} />
            <select className="border rounded-md px-3 py-2 text-sm" value={newProduct.interval} onChange={e => setNewProduct(p => ({ ...p, interval: e.target.value }))}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <Input type="number" placeholder="Price (cents)" value={newProduct.price_amount} onChange={e => setNewProduct(p => ({ ...p, price_amount: parseInt(e.target.value) || 0 }))} />
            <Input type="number" placeholder="Trial days" value={newProduct.trial_days} onChange={e => setNewProduct(p => ({ ...p, trial_days: parseInt(e.target.value) || 0 }))} />
          </div>
          <Button className="mt-3" onClick={() => addProduct.mutate()} disabled={!newProduct.name}>
            <Plus className="w-4 h-4 mr-1" /> Add Product
          </Button>
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Interval</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Trial</TableHead>
            <TableHead>iOS ID</TableHead>
            <TableHead>Stripe ID</TableHead>
            <TableHead>Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p: any) => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell>{p.interval}</TableCell>
              <TableCell>${(p.price_amount / 100).toFixed(2)}</TableCell>
              <TableCell>{p.trial_days}d</TableCell>
              <TableCell className="text-xs text-muted-foreground">{p.ios_product_id || '—'}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{p.stripe_price_id || '—'}</TableCell>
              <TableCell>
                <Switch checked={p.is_active} onCheckedChange={v => toggleActive.mutate({ id: p.id, is_active: v })} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Access Control Tab ───
function AccessControlTab() {
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
      {/* Tools */}
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

      {/* Playlists */}
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

      {/* Rituals */}
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

      {/* Programs */}
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

// ─── Subscribers Tab ───
function SubscribersTab() {
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

// ─── Main Page ───
export default function Subscriptions() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Crown className="w-6 h-6 text-primary" /> Subscriptions
        </h2>
        <p className="text-muted-foreground">Manage subscription products, access control, and subscribers</p>
      </div>

      <Tabs defaultValue="products">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="access">Access Control</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
        </TabsList>
        <TabsContent value="products"><ProductsTab /></TabsContent>
        <TabsContent value="access"><AccessControlTab /></TabsContent>
        <TabsContent value="subscribers"><SubscribersTab /></TabsContent>
      </Tabs>
    </div>
  );
}
