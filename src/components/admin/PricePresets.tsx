import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Check } from 'lucide-react';

export interface PricePreset {
  id: string;
  label: string;
  price_amount: number; // cents
  stripe_price_id: string;
}

export const normalizePresets = (raw: unknown): PricePreset[] =>
  Array.isArray(raw)
    ? raw
        .filter((p: any) => p && typeof p.stripe_price_id === 'string')
        .map((p: any) => ({
          id: String(p.id || crypto.randomUUID()),
          label: String(p.label || ''),
          price_amount: Number(p.price_amount) || 0,
          stripe_price_id: String(p.stripe_price_id),
        }))
    : [];

interface Props {
  presets: PricePreset[];
  activePrice: number;
  activePriceId: string;
  onChange: (presets: PricePreset[]) => void;
  onApply: (preset: PricePreset) => void;
}

export const PricePresets = ({ presets, activePrice, activePriceId, onChange, onApply }: Props) => {
  const [label, setLabel] = useState('');
  const [price, setPrice] = useState('');
  const [priceId, setPriceId] = useState('');

  const add = () => {
    const cents = Math.round(parseFloat(price || '0') * 100);
    const id = priceId.trim();
    if (!cents || !id.startsWith('price_')) return;
    onChange([...presets, { id: crypto.randomUUID(), label: label.trim(), price_amount: cents, stripe_price_id: id }]);
    setLabel(''); setPrice(''); setPriceId('');
  };

  return (
    <div className="col-span-2 space-y-3 rounded-lg border p-4">
      <div>
        <Label className="text-sm font-semibold">Saved price presets</Label>
        <p className="text-xs text-muted-foreground">Tap a preset to set Sale Price and Stripe Price ID together. Then save the program.</p>
      </div>

      {presets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {presets.map((p) => {
            const active = p.stripe_price_id === activePriceId && p.price_amount === activePrice;
            return (
              <div key={p.id} className="flex items-center gap-1">
                <Button type="button" size="sm" variant={active ? 'default' : 'outline'} onClick={() => onApply(p)}>
                  {active && <Check className="h-3 w-3" />}
                  ${(p.price_amount / 100).toFixed(0)}{p.label ? ` · ${p.label}` : ''}
                </Button>
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8" aria-label="Delete preset"
                  onClick={() => onChange(presets.filter((x) => x.id !== p.id))}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
      {presets.length > 0 && (
        <p className="text-xs text-muted-foreground font-mono break-all">
          Active: {activePriceId || '—'}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px_1.5fr_auto] gap-2">
        <Input placeholder="Label (e.g. Webinar)" value={label} onChange={(e) => setLabel(e.target.value)} />
        <Input placeholder="$" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        <Input placeholder="price_..." value={priceId} onChange={(e) => setPriceId(e.target.value)} />
        <Button type="button" variant="secondary" onClick={add} disabled={!price || !priceId.trim().startsWith('price_')}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
    </div>
  );
};
