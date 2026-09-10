import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';

/**
 * Compact sign-in / sign-up block used inline inside checkout (cart page).
 * Framed as "Step 1" so people understand auth is part of buying, not a wall.
 */
export const InlineAuth = ({ ctaLabel = 'Continue to payment' }: { ctaLabel?: string }) => {
  const { signIn, signUp, signInWithGoogle, signInWithApple } = useAuth();
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauth, setOauth] = useState<'google' | 'apple' | null>(null);

  const isLogin = mode === 'login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
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

  const runOauth = async (provider: 'google' | 'apple') => {
    setOauth(provider);
    try {
      const { error } = provider === 'google'
        ? await signInWithGoogle()
        : await signInWithApple();
      if (error) toast.error(error.message || 'Sign-in failed');
    } finally {
      setOauth(null);
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-5 md:p-6 space-y-5">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
            1
          </span>
          <h2 className="font-semibold text-lg">
            {isLogin ? 'Sign in to continue' : 'Create your account'}
          </h2>
        </div>
        <p className="text-sm text-muted-foreground pl-8">
          Your program is delivered inside the Rilo app, so we link the purchase to your account.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 font-medium"
          onClick={() => runOauth('google')}
          disabled={!!oauth || loading}
        >
          {oauth === 'google' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue with Google'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-11 font-medium"
          onClick={() => runOauth('apple')}
          disabled={!!oauth || loading}
        >
          {oauth === 'apple' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue with Apple'}
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wide text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="checkout-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="checkout-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="pl-9 h-11"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="checkout-password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="checkout-password"
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? 'Your password' : 'At least 6 characters'}
              className="pl-9 h-11"
            />
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading || !!oauth}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Please wait...</> : ctaLabel}
        </Button>
      </form>

      <div className="flex flex-col gap-2 text-sm">
        <button
          type="button"
          className="text-primary font-medium underline-offset-4 hover:underline"
          onClick={() => setMode(isLogin ? 'signup' : 'login')}
        >
          {isLogin ? "New here? Create an account" : 'Already have an account? Sign in'}
        </button>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="w-3.5 h-3.5" />
          Your cart is saved. Payment happens on the next step.
        </p>
      </div>
    </div>
  );
};

export default InlineAuth;
