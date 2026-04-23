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

  const perks: { icon: string; label: string }[] = [];
  if (pendingInvite.default_program_slug) {
    perks.push({ icon: '🎓', label: 'Free program enrollment' });
  }
  if (pendingInvite.default_routine_ids?.length > 0) {
    perks.push({
      icon: '📋',
      label: `${pendingInvite.default_routine_ids.length} hand-picked routine${pendingInvite.default_routine_ids.length > 1 ? 's' : ''}`,
    });
  }
  if (pendingInvite.plus_trial_days > 0) {
    perks.push({
      icon: '✨',
      label: `${pendingInvite.plus_trial_days}-day Simora Plus trial`,
    });
  }

  return (
    <Dialog open onOpenChange={(v) => { if (!v && !busy) decline(); }}>
      <DialogContent className="rounded-3xl border-0 p-0 max-w-sm overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 px-6 pt-8 pb-6">
          <div className="flex flex-col items-center text-center">
            {pendingInvite.photo_url ? (
              <img
                src={pendingInvite.photo_url}
                alt={pendingInvite.display_name}
                className="h-20 w-20 rounded-full object-cover ring-4 ring-primary/20"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-primary/20">
                <Sparkles className="h-9 w-9 text-primary" />
              </div>
            )}
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Gift className="h-3.5 w-3.5" />
              You've been invited
            </div>
            <h2 className="mt-3 text-xl font-bold text-foreground">
              {pendingInvite.display_name} is inviting you
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Accept their gifts to unlock the items below.
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-4">
          {perks.length > 0 && (
            <div className="rounded-2xl bg-secondary/40 p-4 space-y-2.5">
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
              onClick={handleAccept}
              disabled={busy}
              className="h-12 rounded-2xl text-base font-semibold"
            >
              {busy ? 'Applying…' : 'Accept gifts'}
            </Button>
            <Button
              onClick={decline}
              disabled={busy}
              variant="ghost"
              className="h-11 rounded-2xl text-sm font-medium text-muted-foreground"
            >
              No thanks
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}