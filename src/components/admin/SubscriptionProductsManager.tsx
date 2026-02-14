import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export function SubscriptionProductsManager() {
  const queryClient = useQueryClient();
  const [newProduct, setNewProduct] = useState({ name: '', ios_product_id: '', stripe_price_id: '', interval: 'monthly', price_amount: 0, trial_days: 7 });

  const { data: products = [] } = useQuery({
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
        <CardHeader><CardTitle className="text-lg">Add Subscription Product</CardTitle></CardHeader>
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
