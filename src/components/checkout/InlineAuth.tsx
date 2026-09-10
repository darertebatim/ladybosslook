import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Mail } from 'lucide-react';

/**
 * Inline sign-in / sign-up block used inside checkout (cart page).
 * Mirrors the full Auth page styling so it feels like one continuous flow.
 */
export const InlineAuth = ({ ctaLabel = 'Continue to payment' }: { ctaLabel?: string }) => {
  const { signIn, signUp, signInWithGoogle, signInWithApple } = useAuth();
  const [isLogin, setIsLogin] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    if (!isLogin && password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (!isLogin && password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const { error } = isLogin
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);
      if (error) {
        toast.error(error.message || 'Could not sign you in');
      }
      // On success the cart page re-renders with the checkout button.
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setOauthLoading('google');
    try {
      const { error } = await signInWithGoogle();
      if (error) toast.error(error.message || 'Sign-in failed');
    } finally {
      setOauthLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    setOauthLoading('apple');
    try {
      const { error } = await signInWithApple();
      if (error) toast.error(error.message || 'Sign-in failed');
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <div
      className="rounded-3xl overflow-hidden p-5 md:p-6"
      style={{
        background: 'linear-gradient(180deg, #FFF4DC 0%, #FFE0E6 45%, #FBD4E2 100%)',
      }}
    >
      <div className="max-w-md mx-auto space-y-5">
        {!showEmailForm ? (
          <div className="space-y-3">
            <p className="text-center text-[14px] text-[#1a1f3d]/65 leading-relaxed">
              Your program is delivered inside the Rilo app, so we link the purchase to your account.
            </p>

            {/* Apple */}
            <Button
              type="button"
              className="w-full h-14 font-semibold text-[16px] rounded-full bg-[#1a1f3d] active:bg-[#1a1f3d]/90 text-white shadow-[0_12px_30px_-12px_rgba(26,31,61,0.6)]"
              onClick={handleAppleSignIn}
              disabled={oauthLoading !== null || loading}
            >
              {oauthLoading === 'apple' ? (
                <span className="flex items-center gap-3">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Continue with Apple
                </span>
              )}
            </Button>

            {/* Google */}
            <Button
              type="button"
              className="w-full h-14 font-semibold text-[16px] rounded-full bg-white active:bg-white/85 text-[#1a1f3d] shadow-[0_12px_30px_-14px_rgba(26,31,61,0.35)]"
              onClick={handleGoogleSignIn}
              disabled={oauthLoading !== null || loading}
            >
              {oauthLoading === 'google' ? (
                <span className="flex items-center gap-3">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#1a1f3d] border-t-transparent" />
                  Connecting...
                </span>
              ) : (
                <span className="flex items-center gap-3">
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </span>
              )}
            </Button>

            {/* Email */}
            <Button
              type="button"
              className="w-full h-14 font-semibold text-[16px] rounded-full bg-white/55 active:bg-white/40 text-[#1a1f3d] backdrop-blur-md border border-white/60"
              onClick={() => setShowEmailForm(true)}
              disabled={oauthLoading !== null || loading}
            >
              <span className="flex items-center gap-3">
                <Mail className="h-5 w-5" />
                Continue with email
              </span>
            </Button>

            <p className="text-center text-[#1a1f3d] text-sm font-semibold">
              {isLogin ? 'New to Rilo? ' : 'Already have an account? '}
              <button
                type="button"
                onClick={() => setIsLogin((v) => !v)}
                className="text-[#B8590E] font-bold underline underline-offset-4"
              >
                {isLogin ? 'Create one' : 'Log in here'}
              </button>
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 bg-white/80 backdrop-blur-xl rounded-3xl p-5 shadow-[0_24px_70px_-20px_rgba(26,31,61,0.25)] border border-white/70"
          >
            <div className="text-center space-y-1">
              <h3 className="text-[22px] leading-[1.15] font-bold tracking-tight text-[#1a1f3d]">
                {isLogin ? 'Sign in with email' : 'Create your account'}
              </h3>
              <p className="text-[14px] text-[#1a1f3d]/65">
                {isLogin ? 'Enter your credentials to continue.' : 'Enter your details to continue.'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkout-email" className="text-[11px] font-bold uppercase tracking-wider text-[#1a1f3d]/60">Email</Label>
              <Input
                id="checkout-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="h-12 rounded-2xl bg-white border-transparent text-[#1a1f3d] placeholder:text-[#1a1f3d]/35"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkout-password" className="text-[11px] font-bold uppercase tracking-wider text-[#1a1f3d]/60">Password</Label>
              <Input
                id="checkout-password"
                type="password"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="h-12 rounded-2xl bg-white border-transparent text-[#1a1f3d] placeholder:text-[#1a1f3d]/35"
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="checkout-confirm" className="text-[11px] font-bold uppercase tracking-wider text-[#1a1f3d]/60">Repeat password</Label>
                <Input
                  id="checkout-confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="h-12 rounded-2xl bg-white border-transparent text-[#1a1f3d] placeholder:text-[#1a1f3d]/35"
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-[52px] rounded-full font-semibold text-[16px] bg-[#1a1f3d] active:bg-[#1a1f3d]/90 text-white shadow-[0_12px_30px_-12px_rgba(26,31,61,0.6)]"
              disabled={loading || oauthLoading !== null}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Please wait...
                </span>
              ) : (
                ctaLabel
              )}
            </Button>

            <div className="text-center space-y-2">
              {!isLogin && (
                <p className="text-[#1a1f3d] text-sm font-semibold">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setIsLogin(true)}
                    className="text-[#B8590E] font-bold underline underline-offset-4"
                  >
                    Log in here
                  </button>
                </p>
              )}
              <button
                type="button"
                onClick={() => setShowEmailForm(false)}
                className="block mx-auto text-sm text-[#1a1f3d] font-medium underline-offset-4 hover:underline"
              >
                Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default InlineAuth;
