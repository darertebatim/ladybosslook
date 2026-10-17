import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

export interface PricePreset {
  id: string;
  label: string;
  price_amount: number; // cents
  stripe_price_id: string;
  /** Sub-link: /<program-slug>/<slug> opens the page with this price reserved. */
  slug?: string;
  /** Show as a selectable tier on the public program page. */
  show_as_tier?: boolean;
  original_price?: number; // cents, crossed out
  badge?: string;
  perks?: string[];
}

export const slugifyTier = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);

export const normalizePresets = (raw: unknown): PricePreset[] =>
  Array.isArray(raw)
    ? raw
        .filter((p: any) => p && typeof p.stripe_price_id === 'string')
        .map((p: any) => ({
          id: String(p.id || crypto.randomUUID()),
          label: String(p.label || ''),
          price_amount: Number(p.price_amount) || 0,
          stripe_price_id: String(p.stripe_price_id),
          slug: p.slug ? slugifyTier(String(p.slug)) : '',
          show_as_tier: !!p.show_as_tier,
          original_price: Number(p.original_price) || 0,
          badge: String(p.badge || ''),
          perks: Array.isArray(p.perks) ? p.perks.map(String).filter(Boolean) : [],
        }))
    : [];

interface Props {
  presets: PricePreset[];
  activePrice: number;
  activePriceId: string;
  programSlug: string;
  onChange: (presets: PricePreset[]) => void;
  onApply: (preset: PricePreset) => void;
}

export const PricePresets = ({ presets, activePrice, activePriceId, programSlug, onChange, onApply }: Props) => {
  const [label, setLabel] = useState('');
  const [price, setPrice] = useState('');
  const [priceId, setPriceId] = useState('');

  const add = () => {
    const cents = Math.round(parseFloat(price || '0') * 100);
    const id = priceId.trim();
    if (!cents || !id.startsWith('price_')) return;
    onChange([...presets, {
      id: crypto.randomUUID(), label: label.trim(), price_amount: cents, stripe_price_id: id,
      slug: slugifyTier(label), show_as_tier: false, original_price: 0, badge: '', perks: [],
    }]);
    setLabel(''); setPrice(''); setPriceId('');
  };

  const update = (id: string, patch: Partial<PricePreset>) =>
    onChange(presets.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const copy = (url: string) => { navigator.clipboard.writeText(url); toast.success('Link copied'); };
  const tierCount = presets.filter((p) => p.show_as_tier).length;

  return (
    <div className="col-span-2 space-y-3 rounded-lg border p-4">
      <div>
        <Label className="text-sm font-semibold">Prices, tiers & sub-links</Label>
        <p className="text-xs text-muted-foreground">
          Each price can have its own sub-link (e.g. /{programSlug || 'program'}/early) that reserves that price.
          Turn on "Show as tier" for 2+ prices to let everyone choose (e.g. Standard vs VIP). Save the program after changes.
        </p>
        {tierCount === 1 && <p className="text-xs text-destructive mt-1">Turn on at least 2 tiers to show the tier picker.</p>}
      </div>

      {presets.map((p) => {
        const active = p.stripe_price_id === activePriceId && p.price_amount === activePrice;
        const subUrl = p.slug && programSlug ? `https://ladybosslook.com/${programSlug}/${p.slug}` : '';
        return (
          <div key={p.id} className="rounded-lg border p-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" size="sm" variant={active ? 'default' : 'outline'} onClick={() => onApply(p)} title="Use as default price">
                {active && <Check className="h-3 w-3" />} Default
              </Button>
              <Input className="h-8 w-36" placeholder="Label" value={p.label} onChange={(e) => update(p.id, { label: e.target.value })} />
              <Input className="h-8 w-24" type="number" placeholder="$" value={p.price_amount / 100}
                onChange={(e) => update(p.id, { price_amount: Math.round(parseFloat(e.target.value || '0') * 100) })} />
              <Input className="h-8 w-24" type="number" placeholder="Was $" value={(p.original_price || 0) / 100 || ''}
                onChange={(e) => update(p.id, { original_price: Math.round(parseFloat(e.target.value || '0') * 100) })} />
              <Input className="h-8 flex-1 min-w-40 font-mono text-xs" placeholder="price_..." value={p.stripe_price_id}
                onChange={(e) => update(p.id, { stripe_price_id: e.target.value.trim() })} />
              <Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label="Delete price"
                onClick={() => onChange(presets.filter((x) => x.id !== p.id))}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">/{programSlug || 'program'}/</span>
              <Input className="h-8 w-32" placeholder="sub-link" value={p.slug || ''}
                onChange={(e) => update(p.id, { slug: slugifyTier(e.target.value) })} />
              {subUrl && (
                <>
                  <Button type="button" size="sm" variant="ghost" onClick={() => copy(subUrl)}><Copy className="h-3 w-3" /> Page link</Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => copy(`${subUrl}?buy=1`)}><Copy className="h-3 w-3" /> Add-to-cart link</Button>
                </>
              )}
              <label className="ml-auto flex items-center gap-2 text-xs">
                <Switch checked={!!p.show_as_tier} onCheckedChange={(v) => update(p.id, { show_as_tier: v })} />
                Show as tier
              </label>
            </div>
            {p.show_as_tier && (
              <div className="grid gap-2 sm:grid-cols-[160px_1fr]">
                <Input className="h-8" placeholder="Badge (e.g. Most popular)" value={p.badge || ''} onChange={(e) => update(p.id, { badge: e.target.value })} />
                <Textarea rows={2} placeholder="Perks, one per line" value={(p.perks || []).join('\n')}
                  onChange={(e) => update(p.id, { perks: e.target.value.split('\n') })} />
              </div>
            )}
          </div>
        );
      })}
      {presets.length > 0 && (
        <p className="text-xs text-muted-foreground font-mono break-all">Default price: {activePriceId || '—'}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px_1.5fr_auto] gap-2">
        <Input placeholder="Label (e.g. VIP)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <Input placeholder="$" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        <Input placeholder="price_..." value={priceId} onChange={(e) => setPriceId(e.target.value)} />
        <Button type="button" variant="secondary" onClick={add} disabled={!price || !priceId.trim().startsWith('price_')}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
    </div>
  );
};
