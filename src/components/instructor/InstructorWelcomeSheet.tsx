import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface InstructorData {
  id: string;
  slug: string;
  display_name: string;
  photo_url: string | null;
  bio: string | null;
  default_program_slug: string | null;
  default_routine_ids: string[];
  default_playlist_ids: string[];
  plus_trial_days: number;
}

/**
 * Props for the visual-only welcome sheet content. Used both by the live
 * sheet (driven by the user's referral row) and by the admin App Test
 * preview.
 */
export interface InstructorWelcomePreviewProps {
  displayName: string;
  photoUrl?: string | null;
  bio?: string | null;
  defaultProgramSlug?: string | null;
  defaultRoutineIdsCount?: number;
  defaultPlaylistIdsCount?: number;
  plusTrialDays?: number;
  onDismiss?: () => void;
}

/**
 * Pure presentational component for the welcome sheet body. No data
 * fetching — accepts everything as props for previewability.
 */
export function InstructorWelcomeContent({
  displayName,
  photoUrl,
  bio,
  defaultProgramSlug,
  defaultRoutineIdsCount = 0,
  defaultPlaylistIdsCount = 0,
  plusTrialDays = 0,
  onDismiss,
}: InstructorWelcomePreviewProps) {
  const unlockedCount =
    (defaultProgramSlug ? 1 : 0) + defaultRoutineIdsCount + defaultPlaylistIdsCount;

  return (
    <div className="flex flex-col items-center text-center">
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={displayName}
          className="h-24 w-24 rounded-full object-cover ring-4 ring-primary/20"
        />
      ) : (
        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/20">
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
      )}

      <h2 className="mt-5 text-2xl font-bold text-foreground">
        Welcome from {displayName}!
      </h2>

      {bio && (
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">{bio}</p>
      )}

      <div className="mt-6 w-full rounded-2xl bg-secondary/40 p-5 space-y-3 text-left">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {displayName} picked this for you
        </p>
        {defaultProgramSlug && (
          <div className="flex items-start gap-3">
            <span className="text-xl">🎓</span>
            <div>
              <p className="text-sm font-semibold text-foreground">Program enrolled</p>
              <p className="text-xs text-muted-foreground">
                Your course is unlocked and waiting for you.
              </p>
            </div>
          </div>
        )}
        {defaultRoutineIdsCount > 0 && (
          <div className="flex items-start gap-3">
            <span className="text-xl">📋</span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {defaultRoutineIdsCount} routine{defaultRoutineIdsCount > 1 ? 's' : ''} added
              </p>
              <p className="text-xs text-muted-foreground">
                Hand-picked for your home planner.
              </p>
            </div>
          </div>
        )}
        {defaultPlaylistIdsCount > 0 && (
          <div className="flex items-start gap-3">
            <span className="text-xl">🎧</span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {defaultPlaylistIdsCount} playlist{defaultPlaylistIdsCount > 1 ? 's' : ''} unlocked
              </p>
              <p className="text-xs text-muted-foreground">
                Available now in your audio library.
              </p>
            </div>
          </div>
        )}
        {plusTrialDays > 0 && (
          <div className="flex items-start gap-3">
            <span className="text-xl">✨</span>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {plusTrialDays}-day Simora Plus trial
              </p>
              <p className="text-xs text-muted-foreground">
                Unlock all premium features on us.
              </p>
            </div>
          </div>
        )}
        {unlockedCount === 0 && plusTrialDays === 0 && (
          <p className="text-sm text-muted-foreground">
            You're now part of {displayName}'s community.
          </p>
        )}
      </div>

      <Button
        onClick={onDismiss}
        className="mt-6 w-full h-12 rounded-2xl text-base font-semibold"
      >
        Let's get started
      </Button>
    </div>
  );
}

/**
 * Shown once after signup if the user was referred by an instructor.
 * Reads the user's `instructor_referrals` row and, if `welcome_shown_at`
 * is null, opens with the instructor's photo, name, and a summary of
 * what's been unlocked for them.
 */
export function InstructorWelcomeSheet() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [instructor, setInstructor] = useState<InstructorData | null>(null);
  const [referralId, setReferralId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      try {
        const { data: referral } = await supabase
          .from('instructor_referrals')
          .select('id, welcome_shown_at, instructor_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (cancelled || !referral || referral.welcome_shown_at) return;

        const { data: ins } = await supabase
          .from('instructors')
          .select('id, slug, display_name, photo_url, bio, default_program_slug, default_routine_ids, default_playlist_ids, plus_trial_days')
          .eq('id', referral.instructor_id)
          .maybeSingle();

        if (cancelled || !ins) return;
        const insData = ins as InstructorData;
        setInstructor(insData);
        setReferralId(referral.id);
        setOpen(true);
      } catch (err) {
        console.warn('[InstructorWelcome] load failed:', err);
      }
    };

    // Wait for the onboarding hook to finish creating the referral row.
    const timer = setTimeout(load, 3500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [user]);

  const dismiss = async () => {
    setOpen(false);
    if (referralId) {
      await supabase
        .from('instructor_referrals')
        .update({ welcome_shown_at: new Date().toISOString() })
        .eq('id', referralId);
    }
  };

  if (!instructor) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t-0 px-6 pt-8 pb-10 max-h-[88vh]"
      >
        <InstructorWelcomeContent
          displayName={instructor.display_name}
          photoUrl={instructor.photo_url}
          bio={instructor.bio}
          defaultProgramSlug={instructor.default_program_slug}
          defaultRoutineIdsCount={instructor.default_routine_ids?.length || 0}
          defaultPlaylistIdsCount={instructor.default_playlist_ids?.length || 0}
          plusTrialDays={instructor.plus_trial_days}
          onDismiss={dismiss}
        />
      </SheetContent>
    </Sheet>
  );
}