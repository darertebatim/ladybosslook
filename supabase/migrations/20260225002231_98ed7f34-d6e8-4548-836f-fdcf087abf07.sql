-- Align promo banner destination_type constraint with frontend-supported destination types
ALTER TABLE public.promo_banners
DROP CONSTRAINT IF EXISTS promo_banners_destination_type_check;

ALTER TABLE public.promo_banners
ADD CONSTRAINT promo_banners_destination_type_check
CHECK (
  destination_type = ANY (
    ARRAY[
      'routine'::text,
      'playlist'::text,
      'journal'::text,
      'programs'::text,
      'breathe'::text,
      'water'::text,
      'channels'::text,
      'home'::text,
      'inspire'::text,
      'custom_url'::text,
      'tasks'::text,
      'routines_hub'::text,
      'tasks_bank'::text,
      'breathe_exercise'::text,
      'external_url'::text,
      'emotion'::text,
      'period'::text,
      'chat'::text,
      'profile'::text,
      'planner'::text,
      'rate'::text,
      'onboarding'::text,
      'watch'::text,
      'video_playlist'::text
    ]
  )
);