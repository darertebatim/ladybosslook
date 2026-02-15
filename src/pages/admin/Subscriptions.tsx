import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaywallClassic, PaywallGradient, PaywallMinimal, PaywallBold, PaywallComparison, PaywallLimitedOffer, type PaywallProgramData } from '@/components/app/paywalls';
import { Crown, Lock, Unlock, BookOpen, Wind, Droplets, Heart, Brain, Moon, Music, Timer, Sparkles, CalendarPlus } from 'lucide-react';

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
      { icon: CalendarPlus, label: 'Add actions to plan', detail: '"Add to My Rituals" buttons on tools are available to all users', free: true },
    ],
  },
  {
    category: 'Wellness Tools',
    description: 'Tools available to all users',
    items: [
      { icon: BookOpen, label: 'Journal', detail: 'Daily reflections & guided journaling', free: true },
      { icon: Wind, label: 'Breathe', detail: 'Breathing exercises library', free: true },
      { icon: Droplets, label: 'Water', detail: 'Hydration tracker', free: true },
      { icon: Heart, label: 'Emotions', detail: 'Name your feelings — emotion logging', free: true },
      { icon: Timer, label: 'Fasting', detail: 'Intermittent fasting tracker', free: true },
      { icon: Moon, label: 'Meditate', detail: 'Guided meditation sessions', free: true },
      { icon: Music, label: 'Sounds', detail: 'Ambient sounds library', free: true },
    ],
  },
  {
    category: 'Content & Programs',
    description: 'Content access',
    items: [
      { icon: Sparkles, label: 'Rituals Library', detail: 'Browse all ritual templates freely; saving requires simora+', free: true },
      { icon: Brain, label: 'Premium Audio Library', detail: 'All playlists & tracks available', free: true },
      { icon: BookOpen, label: 'Guided Programs', detail: 'Courses & coaching content', free: true },
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
