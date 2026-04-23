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
  const [unlockedCount, setUnlockedCount] = useState(0);

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
        const count =
          (insData.default_program_slug ? 1 : 0) +
          (insData.default_routine_ids?.length || 0) +
          (insData.default_playlist_ids?.length || 0);
        setUnlockedCount(count);
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
        <div className="flex flex-col items-center text-center">
          {instructor.photo_url ? (
            <img
              src={instructor.photo_url}
              alt={instructor.display_name}
              className="h-24 w-24 rounded-full object-cover ring-4 ring-primary/20"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/20">
              <Sparkles className="h-10 w-10 text-primary" />
            </div>
          )}

          <h2 className="mt-5 text-2xl font-bold text-foreground">
            Welcome from {instructor.display_name}!
          </h2>

          {instructor.bio && (
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              {instructor.bio}
            </p>
          )}

          <div className="mt-6 w-full rounded-2xl bg-secondary/40 p-5 space-y-3 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {instructor.display_name} picked this for you
            </p>
            {instructor.default_program_slug && (
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
            {instructor.default_routine_ids?.length > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-xl">📋</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {instructor.default_routine_ids.length} routine{instructor.default_routine_ids.length > 1 ? 's' : ''} added
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Hand-picked for your home planner.
                  </p>
                </div>
              </div>
            )}
            {instructor.plus_trial_days > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-xl">✨</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {instructor.plus_trial_days}-day Simora Plus trial
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Unlock all premium features on us.
                  </p>
                </div>
              </div>
            )}
            {unlockedCount === 0 && instructor.plus_trial_days === 0 && (
              <p className="text-sm text-muted-foreground">
                You're now part of {instructor.display_name}'s community.
              </p>
            )}
          </div>

          <Button
            onClick={dismiss}
            className="mt-6 w-full h-12 rounded-2xl text-base font-semibold"
          >
            Let's get started
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}