import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { PaywallClassic, PaywallGradient, PaywallMinimal, PaywallBold, PaywallComparison, PaywallLimitedOffer, type PaywallProgramData } from '@/components/app/paywalls';
import { Crown, Lock, Unlock, BookOpen, Wind, Droplets, Heart, Brain, Moon, Music, Timer, Sparkles, CalendarPlus, Check, Smartphone, RefreshCw } from 'lucide-react';
import { useDefaultPaywall, useSetDefaultPaywall, PaywallVariantId } from '@/hooks/useDefaultPaywall';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ActionLimitSheet, resetActionLimitSoftSeen } from '@/components/app/ActionLimitSheet';

const PAYWALL_VARIANTS = [
  { id: 'classic', label: 'Classic', component: PaywallClassic },
  { id: 'gradient', label: 'Gradient', component: PaywallGradient },
  { id: 'minimal', label: 'Minimal', component: PaywallMinimal },
  { id: 'bold', label: 'Bold (Dark)', component: PaywallBold },
  { id: 'comparison', label: 'Comparison', component: PaywallComparison },
  { id: 'limited-offer', label: 'Limited Offer (50% OFF)', component: PaywallLimitedOffer },
] as const;

const PLUS_FEATURES = [
  {
    category: 'Gating Logic',
    description: 'How simora+ restricts free users',
    items: [
      { icon: Unlock, label: 'Browse all rituals', detail: 'Free users can view and explore all ritual templates', free: true },
      { icon: Lock, label: 'Save rituals to planner', detail: 'Paywall opens when free user taps "Save" in Edit Ritual sheet', free: false },
      { icon: CalendarPlus, label: 'Max 6 actions per day', detail: 'Free users limited to 6 actions per day; simora+ unlocks unlimited', free: false },
    ],
  },
  {
    category: 'Wellness Tools',
    description: 'Free vs simora+ tool access',
    items: [
      { icon: BookOpen, label: 'Journal', detail: 'Daily reflections & guided journaling', free: true },
      { icon: Wind, label: 'Breathe (basic)', detail: 'Basic breathing exercises available to all', free: true },
      { icon: Wind, label: 'Breathe (premium)', detail: 'Premium breathing exercises require simora+', free: false },
      { icon: Droplets, label: 'Water', detail: 'Hydration tracker', free: true },
      { icon: Heart, label: 'Emotions', detail: 'Emotion logging requires simora+', free: false },
      { icon: Timer, label: 'Fasting', detail: 'Intermittent fasting tracker requires simora+', free: false },
      { icon: Moon, label: 'Meditate', detail: 'Guided meditation sessions', free: true },
      { icon: Music, label: 'Soundscapes', detail: 'Ambient sounds require simora+', free: false },
    ],
  },
  {
    category: 'Content & Programs',
    description: 'Content access',
    items: [
      { icon: Sparkles, label: 'Rituals Library', detail: 'Browse freely; saving to planner requires simora+', free: true },
      { icon: Brain, label: 'Gated Playlists', detail: 'Playlists marked as gated require simora+', free: false },
      { icon: BookOpen, label: 'Guided Programs', detail: 'Courses & coaching content available to all', free: true },
    ],
  },
];

function PlanFeaturesTab() {
  return (
    <div className="space-y-8">
      <div className="rounded-xl border bg-primary/5 p-4 flex items-start gap-3">
        <Crown className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-foreground">simora+ Subscription Gate</p>
          <p className="text-sm text-muted-foreground mt-1">
            All content and tools are <strong>free</strong> to use. The paywall only triggers when users attempt to <strong>save a ritual</strong> to their planner.
          </p>
        </div>
      </div>

      {PLUS_FEATURES.map((section) => (
        <div key={section.category} className="space-y-3">
          <div>
            <h3 className="text-lg font-semibold">{section.category}</h3>
            <p className="text-sm text-muted-foreground">{section.description}</p>
          </div>
          <div className="space-y-2">
            {section.items.map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl border p-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${item.free ? 'bg-muted' : 'bg-primary/10'}`}>
                  <item.icon className={`h-4 w-4 ${item.free ? 'text-muted-foreground' : 'text-primary'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${item.free ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'}`}>
                  {item.free ? 'Free' : 'simora+'}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Subscriptions() {
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [mobilePreview, setMobilePreview] = useState<string | null>(null);
  const [showActionLimitTest, setShowActionLimitTest] = useState(false);
  const { variant: defaultVariant } = useDefaultPaywall();
  const setDefaultPaywall = useSetDefaultPaywall();

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

  const activeProgram = programs.find((p: any) => p.slug === selectedProgram) || programs[0];

  const programData: PaywallProgramData | null = activeProgram ? {
    title: activeProgram.title,
    cover_image_url: activeProgram.cover_image_url,
    price_amount: activeProgram.price_amount,
    annual_price_amount: activeProgram.annual_price_amount,
    original_price: activeProgram.original_price,
    ios_product_id: activeProgram.ios_product_id,
    annual_ios_product_id: activeProgram.annual_ios_product_id,
    features: Array.isArray(activeProgram.features) ? activeProgram.features : [],
    trial_days: activeProgram.trial_days,
  } : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">Subscriptions & Paywalls</h2>
          <p className="text-muted-foreground">simora+ plan features and paywall previews</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              resetActionLimitSoftSeen();
              toast.success('Action limit soft gate reset — will show again next time');
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Reset soft gate
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowActionLimitTest(true)}
          >
            Preview action limit gate
          </Button>
        </div>
      </div>

      <Tabs defaultValue="plan" className="space-y-6">
        <TabsList>
          <TabsTrigger value="plan">Plan Features</TabsTrigger>
          <TabsTrigger value="paywalls">Paywalls</TabsTrigger>
        </TabsList>

        <TabsContent value="plan">
          <PlanFeaturesTab />
        </TabsContent>

        <TabsContent value="paywalls">
          {programs.length > 1 && (
            <div className="flex justify-end mb-4">
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
            </div>
          )}

          {!programData ? (
            <p className="text-muted-foreground">No subscription programs with iOS product IDs found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {PAYWALL_VARIANTS.map(({ id, label, component: Component }) => {
                const isDefault = id === defaultVariant;
                return (
                  <div key={id} className="space-y-2">
                    <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{label}</h3>
                      {isDefault && (
                        <Badge variant="default" className="text-[10px]">
                          <Check className="h-3 w-3 mr-1" /> Default
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="text-muted-foreground hover:text-foreground p-1"
                        onClick={() => setMobilePreview(id)}
                        title="Mobile preview"
                      >
                        <Smartphone className="h-4 w-4" />
                      </button>
                      {!isDefault && (
                        <button
                          className="text-xs text-primary hover:underline"
                          onClick={() => {
                            setDefaultPaywall.mutate(id as PaywallVariantId, {
                              onSuccess: () => toast.success(`"${label}" set as default paywall`),
                            });
                          }}
                        >
                          Set as default
                        </button>
                      )}
                    </div>
                    </div>
                    <div className="border rounded-2xl overflow-hidden bg-background shadow-sm" style={{ height: 620 }}>
                      <div className="h-full overflow-y-auto">
                        <Component program={programData} preview />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Mobile Preview Dialog */}
      {programData && (
        <Dialog open={!!mobilePreview} onOpenChange={(o) => !o && setMobilePreview(null)}>
          <DialogContent className="max-w-[375px] h-[700px] p-0 rounded-[2.5rem] overflow-hidden border-[8px] border-foreground/80 [&>button]:hidden">
            <VisuallyHidden><DialogTitle>Mobile Paywall Preview</DialogTitle></VisuallyHidden>
            <div className="h-full overflow-y-auto bg-background">
              {(() => {
                const found = PAYWALL_VARIANTS.find(v => v.id === mobilePreview);
                if (!found) return null;
                const Comp = found.component;
                return <Comp program={programData} preview onClose={() => setMobilePreview(null)} />;
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Action Limit Soft Gate Preview */}
      <ActionLimitSheet
        open={showActionLimitTest}
        onOpenChange={setShowActionLimitTest}
        onTakeChallenge={() => {
          setShowActionLimitTest(false);
          toast.info('Would show paywall here');
        }}
      />
    </div>
  );
}
