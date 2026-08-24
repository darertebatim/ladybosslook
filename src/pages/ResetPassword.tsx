import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';
import riloAppIcon from '@/assets/rilo-app-icon.png';
import { Eye, EyeOff, CheckCircle2, AlertTriangle } from 'lucide-react';

type Status = 'checking' | 'ready' | 'invalid' | 'done';

/**
 * Public password-reset page.
 *
 * Supabase sends the recovery link to this route. Depending on the flow the
 * session arrives either as a `#access_token=...&type=recovery` hash (implicit)
 * or a `?code=...` query param (PKCE). We handle both, then let the user set a
 * new password with `updateUser({ password })`.
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [status, setStatus] = useState<Status>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // A PASSWORD_RECOVERY event can land after our first check — accept it.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'PASSWORD_RECOVERY' || (session && status === 'checking')) {
        setStatus((s) => (s === 'done' ? s : 'ready'));
      }
    });

    const bootstrap = async () => {
      try {
        const url = new URL(window.location.href);
        const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
        const code = url.searchParams.get('code');
        const errorDescription =
          url.searchParams.get('error_description') || hash.get('error_description');

        if (errorDescription) {
          if (!cancelled) setStatus('invalid');
          return;
        }

        // PKCE flow
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (!cancelled) setStatus(error ? 'invalid' : 'ready');
          return;
        }

        // Implicit flow — tokens in the hash
        const accessToken = hash.get('access_token');
        const refreshToken = hash.get('refresh_token');
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!cancelled) setStatus(error ? 'invalid' : 'ready');
          return;
        }

        // Already signed in (e.g. supabase-js consumed the hash before we ran,
        // or the user opened this page from Settings) — allow the change.
        const { data } = await supabase.auth.getSession();
        if (!cancelled) setStatus(data.session ? 'ready' : 'invalid');
      } catch {
        if (!cancelled) setStatus('invalid');
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const problems = useMemo(() => {
    const list: string[] = [];
    if (password.length > 0 && password.length < 8) list.push('At least 8 characters');
    if (confirm.length > 0 && confirm !== password) list.push('Passwords must match');
    return list;
  }, [password, confirm]);

  const canSubmit = password.length >= 8 && password === confirm && !saving;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setStatus('done');
      toast({ title: 'Password updated', description: 'You are signed in.' });
      setTimeout(() => navigate('/app/path', { replace: true }), 1200);
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: "Couldn't update password",
        description: err?.message ?? 'Please request a new reset link.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Reset your password | Rilo"
        description="Choose a new password for your Rilo account."
      />
      <div
        className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-10"
        style={{ background: 'linear-gradient(180deg, #FFF4DC 0%, #FFE0E6 45%, #FBD4E2 100%)' }}
      >
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-[18px] overflow-hidden shadow-[0_16px_40px_-12px_rgba(232,74,111,0.4)]">
              <img src={riloAppIcon} alt="Rilo" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-[26px] leading-[1.15] font-bold tracking-tight text-[#1a1f3d]">
              {status === 'done' ? 'Password updated' : 'Choose a new password'}
            </h1>
          </div>

          {status === 'checking' && (
            <div className="flex justify-center py-8">
              <span className="h-7 w-7 animate-spin rounded-full border-2 border-[#1a1f3d] border-t-transparent" />
            </div>
          )}

          {status === 'invalid' && (
            <div className="rounded-3xl bg-white/80 backdrop-blur-md border border-white/70 p-5 space-y-4 text-center">
              <AlertTriangle className="h-8 w-8 mx-auto text-[#E84A6F]" />
              <p className="text-[15px] font-semibold text-[#1a1f3d]">
                This reset link is invalid or has expired.
              </p>
              <p className="text-[13px] text-[#1a1f3d]/65 leading-relaxed">
                Reset links can only be used once and expire after a while. Request a fresh one and
                open it on the same device.
              </p>
              <Button
                type="button"
                onClick={() => navigate('/auth?mode=login')}
                className="w-full h-12 rounded-full font-semibold bg-[#1a1f3d] active:bg-[#1a1f3d]/90 text-white"
              >
                Request a new link
              </Button>
            </div>
          )}

          {status === 'done' && (
            <div className="rounded-3xl bg-white/80 backdrop-blur-md border border-white/70 p-6 text-center space-y-3">
              <CheckCircle2 className="h-9 w-9 mx-auto text-[#1a9c62]" />
              <p className="text-[15px] font-semibold text-[#1a1f3d]">Taking you to Rilo…</p>
            </div>
          )}

          {status === 'ready' && (
            <form
              onSubmit={handleSubmit}
              className="rounded-3xl bg-white/80 backdrop-blur-md border border-white/70 p-5 space-y-4"
            >
              <div className="space-y-2">
                <Label
                  htmlFor="new-password"
                  className="text-[11px] font-bold uppercase tracking-wider text-[#1a1f3d]/60"
                >
                  New password
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={show ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12 rounded-2xl bg-white border-transparent pr-12 text-[#1a1f3d] placeholder:text-[#1a1f3d]/35"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 flex items-center justify-center rounded-full text-[#1a1f3d]/55 active:bg-[#1a1f3d]/5"
                  >
                    {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirm-password"
                  className="text-[11px] font-bold uppercase tracking-wider text-[#1a1f3d]/60"
                >
                  Repeat password
                </Label>
                <Input
                  id="confirm-password"
                  type={show ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Repeat your new password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="h-12 rounded-2xl bg-white border-transparent text-[#1a1f3d] placeholder:text-[#1a1f3d]/35"
                />
              </div>

              {problems.length > 0 && (
                <ul className="space-y-1">
                  {problems.map((p) => (
                    <li key={p} className="text-[12px] font-semibold text-[#C0264A]">
                      • {p}
                    </li>
                  ))}
                </ul>
              )}

              <Button
                type="submit"
                disabled={!canSubmit}
                className="w-full h-[52px] rounded-full font-semibold text-[16px] bg-[#1a1f3d] active:bg-[#1a1f3d]/90 text-white disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save new password'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
