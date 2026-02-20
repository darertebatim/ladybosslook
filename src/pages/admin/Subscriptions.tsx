import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { PaywallClassic, PaywallGradient, PaywallMinimal, PaywallBold, PaywallComparison, PaywallLimitedOffer, PaywallVIP, type PaywallProgramData } from '@/components/app/paywalls';
import { Crown, Lock, Unlock, BookOpen, Wind, Droplets, Heart, Brain, Moon, Music, Timer, Sparkles, CalendarPlus, Check, Smartphone } from 'lucide-react';
import { useDefaultPaywall, useSetDefaultPaywall, PaywallVariantId } from '@/hooks/useDefaultPaywall';
import { toast } from 'sonner';

const PAYWALL_VARIANTS = [
  { id: 'classic', label: 'Classic', component: PaywallClassic },
  { id: 'gradient', label: 'Gradient', component: PaywallGradient },
  { id: 'minimal', label: 'Minimal', component: PaywallMinimal },
  { id: 'bold', label: 'Bold (Dark)', component: PaywallBold },
  { id: 'comparison', label: 'Comparison', component: PaywallComparison },
  { id: 'limited-offer', label: 'Limited Offer (50% OFF)', component: PaywallLimitedOffer },
  { id: 'vip', label: 'simora+ Plus', component: PaywallVIP },
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

/** Reusable iPhone 6.5" frame shell */
function IPhoneFrame({ children, width = 300, onClose }: { children: React.ReactNode; width?: number; onClose?: () => void }) {
  const height = Math.round(width * (896 / 414));
  const borderRadius = Math.round(width * 0.106);
  const padding = Math.round(width * 0.019);
  const dynamicIslandW = Math.round(width * 0.217);
  const dynamicIslandH = Math.round(width * 0.068);
  const dynamicIslandTop = Math.round(width * 0.029);
  const screenRadius = Math.round(borderRadius - padding - 2);
  const paddingTop = Math.round(dynamicIslandH + dynamicIslandTop + 8);

  return (
    <div style={{
      width, height, flexShrink: 0,
      borderRadius,
      background: '#1a1a1a',
      boxShadow: '0 0 0 1px #2a2a2a, 0 30px 80px rgba(0,0,0,0.5)',
      padding,
      position: 'relative',
    }}>
      {/* Dynamic Island */}
      <div style={{
        position: 'absolute', top: dynamicIslandTop, left: '50%', transform: 'translateX(-50%)',
        width: dynamicIslandW, height: dynamicIslandH,
        background: '#1a1a1a', borderRadius: dynamicIslandH, zIndex: 20,
      }} />
      {/* Close button on frame */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: dynamicIslandTop, right: 14, zIndex: 30,
            color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 18, lineHeight: 1,
          }}
        >
          ✕
        </button>
      )}
      {/* Screen */}
      <div style={{
        width: '100%', height: '100%',
        borderRadius: screenRadius,
        overflow: 'hidden',
        background: '#fff',
      }}>
        <div style={{ height: '100%', overflowY: 'auto', overflowX: 'hidden', paddingTop }}>
          {children}
        </div>
      </div>
      {/* Home indicator */}
      <div style={{
        position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
        width: Math.round(width * 0.24), height: 4,
        background: 'rgba(255,255,255,0.25)', borderRadius: 4, zIndex: 20,
      }} />
    </div>
  );
}

export default function Subscriptions() {
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [mobilePreview, setMobilePreview] = useState<string | null>(null);
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

  const mobileVariant = PAYWALL_VARIANTS.find(v => v.id === mobilePreview);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Subscriptions & Paywalls</h2>
        <p className="text-muted-foreground">simora+ plan features and paywall previews</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {PAYWALL_VARIANTS.map(({ id, label, component: Component }) => {
                const isDefault = id === defaultVariant;
                return (
                  <div key={id} className="space-y-3">
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
                    <div className="flex justify-center">
                      <IPhoneFrame width={240}>
                        <Component program={programData} preview />
                      </IPhoneFrame>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Mobile Preview Dialog — full-size iPhone 6.5" */}
      {programData && mobileVariant && (
        <Dialog open={!!mobilePreview} onOpenChange={(o) => !o && setMobilePreview(null)}>
          <DialogContent
            className="p-0 bg-transparent border-0 shadow-none [&>button]:hidden"
            style={{ width: 'fit-content', maxWidth: 'none' }}
          >
            <VisuallyHidden><DialogTitle>Mobile Paywall Preview</DialogTitle></VisuallyHidden>
            <IPhoneFrame width={390} onClose={() => setMobilePreview(null)}>
              <mobileVariant.component
                program={programData}
                preview
                onClose={() => setMobilePreview(null)}
              />
            </IPhoneFrame>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
