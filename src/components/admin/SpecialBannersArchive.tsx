import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Info } from 'lucide-react';
import onboardingBannerImg from '@/assets/onboarding-banner.png';
import weeklyReviewBannerImg from '@/assets/weekly-review-banner.png';
import tourBannerImg from '@/assets/tour-banner.png';
import { useSpecialBannerSettings, useToggleSpecialBanner } from '@/hooks/useSpecialBannerSettings';
import { MoodCheckInBanner } from '@/components/mood/MoodCheckInBanner';
import { SelfCareQuizBanner } from '@/components/app/SelfCareQuizBanner';

import type { ReactNode } from 'react';

interface SpecialBanner {
  name: string;
  component: string;
  location: string;
  description: string;
  conditions: string[];
  coverImage?: string;
  // Optional live React preview (used when the banner is built as a custom box)
  preview?: ReactNode;
}

const specialBanners: SpecialBanner[] = [
  {
    name: 'Self-Care Quiz',
    component: 'SelfCareQuizBanner',
    location: 'Home (above Tasks), Tools Page (under Tools), Programs Page, Tasks Bank (under Categories)',
    description: 'Promotes the "What\'s Missing?" self-care diagnostic quiz. Box banner with orange→amber gradient, sparkle icon, and "AI Powered Analyze" sub-pill. Tapping opens the self-care quiz onboarding flow.',
    preview: <SelfCareQuizBanner />,
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
    description: 'Daily prompt encouraging users to log their mood. Box banner with sunrise gradient. Shows 5 inline mood chips (Great / Good / Okay / Meh / Bad) — tapping one logs the mood directly and opens the celebration sheet with 4 follow-up cards (Journal, Breathe, Reflect, Talk).',
    preview: <MoodCheckInBanner />,
    conditions: [
      'Hidden when Promo or Home banners are active',
      'Auto-hides after today\'s mood is logged',
      'Dismissible via X button (resets daily)',
      'Tapping a mood chip logs it inline + opens celebration sheet',
    ],
  },
  {
    name: 'Welcome Tour ("What is Rilo?")',
    component: 'WhatIsRiloTour',
    location: 'Auto-launches once after sign-up, before the planner is shown',
    description: '12-step "What is Rilo?" teach + setup flow that introduces the planner, routine builder, task details, tools hub, and asks for the first round of routine picks. No tap required — runs automatically the first time a new user lands in /app.',
    coverImage: tourBannerImg,
    conditions: [
      'Shown only to users who haven\'t completed the what-is-rilo flow',
      'Auto-redirects from /auth → /app/onboarding/what-is-rilo on first sign-in',
      'Marks simora_onboarding_completed_what-is-rilo on finish',
      'Cannot be dismissed mid-flow (designed as required onboarding)',
      'Toggle off here to skip it for all new users',
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
          {banner.preview ? (
            <div className="px-4 pt-4">
              <div
                className="rounded-lg border bg-[#F8F4ED] p-3 pointer-events-none select-none"
                aria-hidden="true"
              >
                {banner.preview}
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground italic">
                Live preview — interactions are disabled in this archive view.
              </p>
            </div>
          ) : banner.coverImage ? (
            <div className="px-4 pt-4">
              <img
                src={banner.coverImage}
                alt={`${banner.name} banner preview`}
                className="w-full h-auto rounded-lg border"
                style={{ aspectRatio: '3/1', objectFit: 'cover' }}
              />
            </div>
          ) : null}
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
