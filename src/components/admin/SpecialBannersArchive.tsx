import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Info } from 'lucide-react';
import moodBannerImg from '@/assets/mood-banner.png';
import onboardingBannerImg from '@/assets/onboarding-banner.png';
import weeklyReviewBannerImg from '@/assets/weekly-review-banner.png';
import selfcareQuizBannerImg from '@/assets/selfcare-quiz-banner.jpg';
import { useSpecialBannerSettings, useToggleSpecialBanner } from '@/hooks/useSpecialBannerSettings';

interface SpecialBanner {
  name: string;
  component: string;
  location: string;
  description: string;
  conditions: string[];
  coverImage?: string;
}

const specialBanners: SpecialBanner[] = [
  {
    name: 'Self-Care Quiz',
    component: 'SelfCareQuizBanner',
    location: 'Home (above Tasks), Home (after Routines), Tools Page (under Tools), Programs Page, Tasks Bank (under Categories)',
    description: 'Promotes the "What\'s Missing?" self-care diagnostic quiz. Uses a static 3:1 image banner. Tapping opens the self-care quiz onboarding flow.',
    coverImage: selfcareQuizBannerImg,
    conditions: [
      'Shown only to users who haven\'t completed the self-care quiz',
      'First special banner new users see (before Promo Banners & Mood Check-In)',
      'Dismissible via X button (stays hidden for session)',
      'Tapping navigates to /app/onboarding/selfcare-quiz',
      'Auto-hides after self-care quiz is completed',
    ],
  },
  {
    name: 'Mood Check-In',
    component: 'MoodCheckInBanner',
    location: 'Home (after Promo & Home banners)',
    description: 'Daily prompt encouraging users to log their mood. Uses a static 3:1 image banner. Tapping opens the mood logging screen.',
    coverImage: moodBannerImg,
    conditions: [
      'Hidden when Promo or Home banners are active',
      'Auto-hides after today\'s mood is logged',
      'Dismissible via X button (resets daily)',
      'Tapping navigates to /app/mood',
    ],
  },
  {
    name: 'Rilo Onboarding',
    component: 'OnboardingBanner',
    location: 'Home (above My Tasks)',
    description: 'Guides new users through the 12-step onboarding flow. Uses a static 3:1 image banner with the Rilo mascot.',
    coverImage: onboardingBannerImg,
    conditions: [
      'Shown only to users who haven\'t completed onboarding',
      'Dismissible via X button (stays hidden for session)',
      'Tapping navigates to /app/onboarding',
      'Auto-hides after onboarding is completed',
    ],
  },
  {
    name: 'Weekly Review',
    component: 'WeeklyReviewBanner',
    location: 'Home (after Mood Check-In banner)',
    description: 'Weekend banner encouraging users to review their week and plan the next one. Uses a 3:1 cover image with mascot, "Plan your next week in 1 min!" text, and a "Let\'s go!" CTA.',
    coverImage: weeklyReviewBannerImg,
    conditions: [
      'Shown only on weekends (Saturday & Sunday)',
      'Appears after Mood Check-In banner is dismissed',
      'Hidden once the weekly review flow is completed for that week',
      'Dismissible via X button (resets each week)',
      'Tapping navigates to /app/onboarding/weekly-review',
    ],
  },
];

export function SpecialBannersArchive() {
  const { data: disabledMap = {} } = useSpecialBannerSettings();
  const toggleMutation = useToggleSpecialBanner();

  const toggleBanner = (banner: SpecialBanner) => {
    const newValue = !disabledMap[banner.component];
    toggleMutation.mutate({ component: banner.component, disabled: newValue });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
        <Info className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          Special banners have custom logic built into the app (e.g. conditional visibility based on user state). 
          Use the toggle to enable or disable each banner across all devices.
        </span>
      </div>

      {specialBanners.map((banner) => (
        <Card key={banner.component} className={disabledMap[banner.component] ? 'opacity-60' : ''}>
          {banner.coverImage && (
            <div className="px-4 pt-4">
              <img
                src={banner.coverImage}
                alt={`${banner.name} banner preview`}
                className="w-full h-auto rounded-lg border"
                style={{ aspectRatio: '3/1', objectFit: 'cover' }}
              />
            </div>
          )}
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{banner.name}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={disabledMap[banner.component] ? 'destructive' : 'secondary'} className="text-xs">
                  {disabledMap[banner.component] ? 'Disabled' : 'Active'}
                </Badge>
                <Switch
                  checked={!disabledMap[banner.component]}
                  onCheckedChange={() => toggleBanner(banner)}
                />
              </div>
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
