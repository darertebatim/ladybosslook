import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaywallClassic, PaywallGradient, PaywallMinimal, PaywallBold, PaywallComparison, type PaywallProgramData } from '@/components/app/paywalls';

const PAYWALL_VARIANTS = [
  { id: 'classic', label: 'Classic', component: PaywallClassic },
  { id: 'gradient', label: 'Gradient', component: PaywallGradient },
  { id: 'minimal', label: 'Minimal', component: PaywallMinimal },
  { id: 'bold', label: 'Bold (Dark)', component: PaywallBold },
  { id: 'comparison', label: 'Comparison', component: PaywallComparison },
] as const;

export default function Subscriptions() {
  const [selectedProgram, setSelectedProgram] = useState<string>('');

  const { data: programs = [] } = useQuery({
    queryKey: ['admin-subscription-programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_catalog')
        .select('*')
        .eq('is_active', true) as any;
      if (error) throw error;
      return (data || []).filter((p: any) => p.ios_product_id);
    },
  });

  // Auto-select first program
  const activeProgram = programs.find((p: any) => p.slug === selectedProgram) || programs[0];

  const programData: PaywallProgramData | null = activeProgram ? {
    title: activeProgram.title,
    cover_image_url: activeProgram.cover_image_url,
    price_amount: activeProgram.price_amount,
    annual_price_amount: activeProgram.annual_price_amount,
    ios_product_id: activeProgram.ios_product_id,
    annual_ios_product_id: activeProgram.annual_ios_product_id,
    features: Array.isArray(activeProgram.features) ? activeProgram.features : [],
    trial_days: activeProgram.trial_days,
  } : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Subscriptions & Paywalls</h2>
          <p className="text-muted-foreground">Preview how paywalls appear for subscription programs</p>
        </div>
        {programs.length > 1 && (
          <Select value={activeProgram?.slug || ''} onValueChange={setSelectedProgram}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select program" />
            </SelectTrigger>
            <SelectContent>
              {programs.map((p: any) => (
                <SelectItem key={p.slug} value={p.slug}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {!programData ? (
        <p className="text-muted-foreground">No subscription programs with iOS product IDs found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {PAYWALL_VARIANTS.map(({ id, label, component: Component }) => (
            <div key={id} className="space-y-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{label}</h3>
              <div className="border rounded-2xl overflow-hidden bg-background shadow-sm" style={{ height: 620 }}>
                <div className="h-full overflow-y-auto">
                  <Component program={programData} preview />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
