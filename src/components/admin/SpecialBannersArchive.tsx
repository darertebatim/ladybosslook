import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

interface SpecialBanner {
  name: string;
  component: string;
  location: string;
  description: string;
  conditions: string[];
}

const specialBanners: SpecialBanner[] = [
  {
    name: 'Mood Check-In',
    component: 'MoodCheckInBanner',
    location: 'Home (above My Tasks)',
    description: 'Daily prompt encouraging users to log their mood. Uses a static 3:1 image banner.',
    conditions: [
      'Hidden when Welcome card is active',
      'Auto-dismisses after mood is logged',
      'Dismissible via X button (resets daily)',
      'Tapping navigates to /app/mood',
    ],
  },
  {
    name: 'Ladybosslook Onboarding',
    component: 'OnboardingBanner',
    location: 'Home (above My Tasks)',
    description: 'Guides new users through the onboarding flow. Features the Ladybosslook mascot with a notepad illustration.',
    conditions: [
      'Shown only to users who haven\'t completed onboarding',
      'Hidden when Welcome card is active',
      'Tapping navigates to /app/onboarding',
      'Auto-dismisses after onboarding is completed',
    ],
  },
];

export function SpecialBannersArchive() {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          Special banners have custom logic built into the app (e.g. conditional visibility based on user state). 
          They are listed here for reference and cannot be created through the promo banner system.
        </span>
      </div>

      {specialBanners.map((banner) => (
        <Card key={banner.component}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{banner.name}</CardTitle>
              <Badge variant="secondary" className="font-mono text-xs">{banner.component}</Badge>
            </div>
            <CardDescription>{banner.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <span className="font-medium">Location:</span>{' '}
              <span className="text-muted-foreground">{banner.location}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium">Conditions:</span>
              <ul className="mt-1 list-disc list-inside text-muted-foreground space-y-0.5">
                {banner.conditions.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
