import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PaywallSheet, PAYWALL_VARIANTS, type PaywallVariant, type PaywallProgram } from '@/components/app/PaywallSheet';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Sparkles } from 'lucide-react';

const VARIANT_LABELS: Record<PaywallVariant, string> = {
  classic: '✨ Classic',
  gradient: '🌈 Gradient',
  minimal: '◻️ Minimal',
  bold: '💪 Bold',
  image: '🖼️ Image',
};

const VARIANT_DESCRIPTIONS: Record<PaywallVariant, string> = {
  classic: 'Clean icon header with checklist features. Great default.',
  gradient: 'Eye-catching gradient hero banner with feature pills.',
  minimal: 'Typography-focused, outline CTA. Elegant feel.',
  bold: 'Large icon, 2-column features grid, oversized CTA.',
  image: 'Uses program cover image as hero. Visual-first.',
};

export default function Subscriptions() {
  const [previewVariant, setPreviewVariant] = useState<PaywallVariant | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<string>('');

  const { data: programs = [] } = useQuery({
    queryKey: ['admin-paywall-programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_catalog')
        .select('slug, title, ios_product_id, annual_ios_product_id, price_amount, annual_price_amount, subscription_interval, trial_days, features, cover_image_url')
        .eq('is_active', true)
        .not('ios_product_id', 'is', null)
        .order('title');
      if (error) throw error;
      return (data || []) as (PaywallProgram & { slug: string })[];
    },
  });

  const activeProgram = programs.find(p => p.slug === selectedProgram) || programs[0];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Subscriptions & Paywalls</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Preview and choose paywall designs for your subscription programs.
        </p>
      </div>

      {/* Program selector */}
      {programs.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Preview with:</span>
          <Select value={selectedProgram || programs[0]?.slug} onValueChange={setSelectedProgram}>
            <SelectTrigger className="w-60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {programs.map(p => (
                <SelectItem key={p.slug} value={p.slug}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Gallery grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {PAYWALL_VARIANTS.map((variant) => (
          <Card
            key={variant}
            className="group overflow-hidden hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary/30"
            onClick={() => setPreviewVariant(variant)}
          >
            <CardContent className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-base">{VARIANT_LABELS[variant]}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {VARIANT_DESCRIPTIONS[variant]}
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {variant}
                </Badge>
              </div>

              {/* Mini preview mockup */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-2.5 min-h-[140px]">
                {variant === 'classic' && (
                  <>
                    <div className="mx-auto w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-primary" />
                    </div>
                    <div className="h-2 bg-muted rounded w-24 mx-auto" />
                    <div className="space-y-1.5">
                      <div className="h-1.5 bg-muted rounded w-full" />
                      <div className="h-1.5 bg-muted rounded w-4/5" />
                      <div className="h-1.5 bg-muted rounded w-3/4" />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="h-8 rounded-md border border-primary bg-primary/5" />
                      <div className="h-8 rounded-md border border-border" />
                    </div>
                    <div className="h-7 rounded-md bg-primary" />
                  </>
                )}
                {variant === 'gradient' && (
                  <>
                    <div className="rounded-lg bg-gradient-to-br from-primary to-accent h-14 flex items-center justify-center">
                      <div className="h-2 bg-primary-foreground/50 rounded w-16" />
                    </div>
                    <div className="space-y-1">
                      <div className="h-5 bg-muted rounded-md" />
                      <div className="h-5 bg-muted rounded-md" />
                    </div>
                    <div className="h-7 rounded-md bg-gradient-to-r from-primary to-accent" />
                  </>
                )}
                {variant === 'minimal' && (
                  <>
                    <div className="h-2.5 bg-muted rounded w-28 mx-auto" />
                    <div className="h-1.5 bg-muted rounded w-20 mx-auto" />
                    <div className="border rounded-lg p-2 space-y-1">
                      <div className="h-1.5 bg-muted rounded w-full" />
                      <div className="h-1.5 bg-muted rounded w-4/5" />
                    </div>
                    <div className="flex justify-center gap-3">
                      <div className="w-12 h-8 rounded border-2 border-primary bg-primary/5" />
                      <div className="w-12 h-8 rounded border border-border" />
                    </div>
                    <div className="h-7 rounded-md border-2 border-primary" />
                  </>
                )}
                {variant === 'bold' && (
                  <>
                    <div className="mx-auto w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <div className="w-4 h-4 rounded bg-primary-foreground/60" />
                    </div>
                    <div className="h-2.5 bg-muted rounded w-20 mx-auto" />
                    <div className="grid grid-cols-2 gap-1">
                      <div className="h-6 bg-muted rounded-md" />
                      <div className="h-6 bg-muted rounded-md" />
                    </div>
                    <div className="h-8 rounded-xl bg-primary" />
                  </>
                )}
                {variant === 'image' && (
                  <>
                    <div className="rounded-lg bg-gradient-to-t from-muted to-muted/30 h-16 flex items-end p-2">
                      <div className="h-2 bg-foreground/30 rounded w-20" />
                    </div>
                    <div className="space-y-1">
                      <div className="h-1.5 bg-muted rounded w-full" />
                      <div className="h-1.5 bg-muted rounded w-3/4" />
                    </div>
                    <div className="h-7 rounded-md bg-primary" />
                  </>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live preview sheet */}
      {previewVariant && activeProgram && (
        <PaywallSheet
          open={!!previewVariant}
          onOpenChange={(open) => !open && setPreviewVariant(null)}
          program={activeProgram}
          variant={previewVariant}
        />
      )}
    </div>
  );
}
