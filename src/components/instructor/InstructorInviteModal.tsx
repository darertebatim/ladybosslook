import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useInstructorOnboarding } from '@/hooks/useInstructorOnboarding';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { haptic } from '@/lib/haptics';

/**
 * Props for the visual-only invite content. Used both by the live modal
 * (driven by useInstructorOnboarding) and by the admin App Test preview.
 */
export interface InstructorInvitePreviewProps {
  displayName: string;
  photoUrl?: string | null;
  defaultProgramSlug?: string | null;
  defaultRoutineIdsCount?: number;
  defaultPlaylistIdsCount?: number;
  defaultChannelIdsCount?: number;
  plusTrialDays?: number;
  packageName?: string | null;
  packageDescription?: string | null;
  packageCoverUrl?: string | null;
  busy?: boolean;
  onAccept?: () => void;
  onDecline?: () => void;
}

/**
 * Pure presentational component for the instructor invite modal body.
 * No data fetching — accepts everything as props for previewability.
 */
export function InstructorInviteContent({
  displayName,
  photoUrl,
  defaultProgramSlug,
  defaultRoutineIdsCount = 0,
  defaultPlaylistIdsCount = 0,
  defaultChannelIdsCount = 0,
  plusTrialDays = 0,
  packageName,
  packageDescription,
  packageCoverUrl,
  busy = false,
  onAccept,
  onDecline,
}: InstructorInvitePreviewProps) {
  const perks: { icon: string; label: string }[] = [];
  if (defaultProgramSlug) {
    perks.push({ icon: '🎓', label: 'Free program enrollment' });
  }
  if (defaultRoutineIdsCount > 0) {
    perks.push({
      icon: '📋',
      label: `${defaultRoutineIdsCount} hand-picked routine${defaultRoutineIdsCount > 1 ? 's' : ''}`,
    });
  }
  if (defaultPlaylistIdsCount > 0) {
    perks.push({
      icon: '🎧',
      label: `${defaultPlaylistIdsCount} unlocked playlist${defaultPlaylistIdsCount > 1 ? 's' : ''}`,
    });
  }
  if (defaultChannelIdsCount > 0) {
    perks.push({
      icon: '💬',
      label: `Joined ${defaultChannelIdsCount} community channel${defaultChannelIdsCount > 1 ? 's' : ''}`,
    });
  }
  if (plusTrialDays > 0) {
    perks.push({
      icon: '✨',
      label: `${plusTrialDays}-day Rilo Plus trial`,
    });
  }

  return (
    <>
      <div className="bg-gradient-to-br from-primary/20 via-secondary/15 to-accent/30 px-6 pt-8 pb-6">
        <div className="flex flex-col items-center text-center">
          {packageCoverUrl ? (
            <img
              src={packageCoverUrl}
              alt={packageName || displayName}
              className="h-24 w-24 rounded-2xl object-cover ring-4 ring-primary/40 shadow-lg shadow-primary/20"
            />
          ) : photoUrl ? (
            <img
              src={photoUrl}
              alt={displayName}
              className="h-20 w-20 rounded-full object-cover ring-4 ring-primary/40 shadow-lg shadow-primary/20"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center ring-4 ring-primary/30 shadow-lg shadow-primary/20">
              <Sparkles className="h-9 w-9 text-primary-foreground" />
            </div>
          )}
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-sm">
            <Gift className="h-3.5 w-3.5" />
            You've been invited
          </div>
          <h2 className="mt-3 text-xl font-bold text-foreground">
            {packageName ? packageName : `${displayName} is inviting you`}
          </h2>
          <p className="mt-1.5 text-sm text-foreground/70">
            {packageName
              ? `From ${displayName}`
              : 'Accept their gifts to unlock the items below.'}
          </p>
          {packageDescription && (
            <p className="mt-2 text-sm text-foreground/80 max-w-xs">
              {packageDescription}
            </p>
          )}
        </div>
      </div>

      <div className="px-6 pb-6 pt-4 space-y-4 bg-gradient-to-b from-accent/20 to-background">
        {perks.length > 0 && (
          <div className="rounded-2xl bg-gradient-to-br from-accent/40 to-secondary/30 p-4 space-y-2.5 border border-primary/10">
            {perks.map((p) => (
              <div key={p.label} className="flex items-center gap-3">
                <span className="text-xl">{p.icon}</span>
                <p className="text-sm font-medium text-foreground">{p.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button
            onClick={onAccept}
            disabled={busy}
            className="h-12 rounded-2xl text-base font-semibold bg-gradient-to-r from-primary to-primary-light hover:from-primary-dark hover:to-primary text-primary-foreground shadow-md shadow-primary/30"
          >
            {busy ? 'Applying…' : 'Accept gifts'}
          </Button>
          <Button
            onClick={onDecline}
            disabled={busy}
            variant="ghost"
            className="h-11 rounded-2xl text-sm font-medium text-foreground/60 hover:text-primary hover:bg-accent/30"
          >
            No thanks
          </Button>
        </div>
      </div>
    </>
  );
}

/**
 * Confirmation modal shown when a logged-in user lands on the app via an
 * instructor's OneLink (e.g. ?instructor=sarah).
 *
 * Flow:
 *   useInstructorOnboarding detects pending invite → exposes `pendingInvite`
 *   → modal opens → user accepts → setup is applied → welcome sheet fires next.
 */
export function InstructorInviteModal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { pendingInvite, accept, decline } = useInstructorOnboarding(user?.id);
  const [busy, setBusy] = useState(false);

  if (!pendingInvite) return null;

  const handleAccept = async () => {
    if (busy) return;
    setBusy(true);
    haptic.light();
    const result = await accept();
    setBusy(false);
    if (result?.ok) {
      haptic.success();
      toast.success(`Welcome from ${pendingInvite.display_name}! 🎉`);
      // Refresh subscription/enrollment caches so unlocked content appears.
      queryClient.invalidateQueries({ queryKey: ['user-subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['user-enrollment-slugs'] });
    } else {
      toast.error('Could not apply invite. Please try again.');
    }
  };

  return (
    <Dialog open onOpenChange={(v) => { if (!v && !busy) decline(); }}>
      <DialogContent className="rounded-3xl border-0 p-0 max-w-sm overflow-hidden">
        <InstructorInviteContent
          displayName={pendingInvite.display_name}
          photoUrl={pendingInvite.photo_url}
          defaultProgramSlug={pendingInvite.default_program_slug}
          defaultRoutineIdsCount={pendingInvite.default_routine_ids?.length || 0}
          defaultPlaylistIdsCount={pendingInvite.default_playlist_ids?.length || 0}
          defaultChannelIdsCount={pendingInvite.default_channel_ids?.length || 0}
          plusTrialDays={pendingInvite.plus_trial_days}
          packageName={pendingInvite.package?.name ?? null}
          packageDescription={pendingInvite.package?.description ?? null}
          packageCoverUrl={pendingInvite.package?.cover_image_url ?? null}
          busy={busy}
          onAccept={handleAccept}
          onDecline={decline}
        />
      </DialogContent>
    </Dialog>
  );
}