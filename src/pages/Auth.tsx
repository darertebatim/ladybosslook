import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { BrandedSplash } from '@/components/app/BrandedSplash';
import { getDisplayBuildInfo } from '@/lib/buildInfo';
import { ArrowLeft, Mail } from 'lucide-react';
import riloAppIcon from '@/assets/rilo-app-icon.png';
import { useKeyboard } from '@/hooks/useKeyboard';
import { Capacitor } from '@capacitor/core';
import { Analytics } from '@/lib/firebaseAnalytics';
import { getPasswordResetRedirectUrl } from '@/lib/authRedirect';


export default function Auth() {
  const initialSearchParams = new URLSearchParams(window.location.search);
  // Default to SIGN UP. Apple/Google buttons handle both flows automatically;
  // existing users tap "Already have an account? Log in here" to switch.
  const [isLogin, setIsLogin] = useState(initialSearchParams.get('mode') === 'login');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [resetSentTo, setResetSentTo] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const { signIn, signUp, signInWithGoogle, signInWithApple, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isKeyboardOpen } = useKeyboard();
  
  // Ref to track focused input for iOS keyboard scroll fix
  const focusedInputRef = useRef<HTMLInputElement | null>(null);
  const prevKeyboardOpen = useRef(false);
  
  // iOS keyboard scroll fix: multi-pass scroll when keyboard opens
  useEffect(() => {
    if (isKeyboardOpen && !prevKeyboardOpen.current && focusedInputRef.current) {
      const el = focusedInputRef.current;
      const scroll = () => el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(scroll, 60);
      setTimeout(scroll, 300);
      setTimeout(scroll, 500);
    }
    prevKeyboardOpen.current = isKeyboardOpen;
  }, [isKeyboardOpen]);

  // Resend cooldown countdown for the password-reset email
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((n) => n - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // Read redirect param from URL (e.g. /auth?redirect=/cart)
  const searchParams = new URLSearchParams(window.location.search);
  const redirectPath = searchParams.get('redirect') || '/app/path';
  const hasCustomRedirect = searchParams.has('redirect');

  // Redirect if already authenticated, or to onboarding if not seen yet
  useEffect(() => {
    if (user) {
      const hasSeenDoors = localStorage.getItem('simora_onboarding_completed_rilo-doors') === 'true';
      // First sign-in/up: show "Rilo Doors" onboarding once
      if (!hasSeenDoors && !hasCustomRedirect) {
        navigate('/app/onboarding/rilo-doors', { replace: true });
      } else {
        navigate(redirectPath);
      }
    }
  }, [user, authLoading, navigate, redirectPath, hasCustomRedirect]);

  // Show branded splash while checking auth state (prevents flash of login form)
  if (authLoading) {
    return <BrandedSplash />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: getPasswordResetRedirectUrl(),
        });

        if (error && (error as any).status === 429) {
          toast({
            variant: "destructive",
            title: "Too many requests",
            description: "Please wait a few minutes before asking for another reset email.",
          });
        } else {
          // Neutral response either way — never reveal whether an account exists.
          setResetSentTo(email.trim());
          setResendIn(60);
          toast({
            title: "Check your email",
            description: `If an account exists for ${email.trim()}, we've sent a reset link.`,
          });
        }
      } else {
        if (!isLogin) Analytics.signupStarted('email');
        if (!isLogin && password !== confirmPassword) {
          toast({
            variant: "destructive",
            title: "Passwords don't match",
            description: "Please make sure both passwords are the same.",
          });
          setLoading(false);
          return;
        }
        if (!isLogin && password.length < 6) {
          toast({
            variant: "destructive",
            title: "Password too short",
            description: "Use at least 6 characters.",
          });
          setLoading(false);
          return;
        }
        const { error } = isLogin 
          ? await signIn(email, password)
          : await signUp(email, password);

        if (error) {
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: error.message,
          });
        } else if (!isLogin) {
          Analytics.signupCompleted('email');
          toast({
            title: "Welcome to Rilo!",
            description: "Your account is ready.",
          });
        } else {
          Analytics.loginCompleted('email');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setOauthLoading('google');
    if (!isLogin) Analytics.signupStarted('google');
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          variant: "destructive",
          title: "Google Sign-In Error",
          description: error.message,
        });
      } else {
        if (isLogin) Analytics.loginCompleted('google');
        else Analytics.signupCompleted('google');
      }
    } finally {
      setOauthLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    setOauthLoading('apple');
    if (!isLogin) Analytics.signupStarted('apple');
    try {
      const { error } = await signInWithApple();
      if (error) {
        toast({
          variant: "destructive",
          title: "Apple Sign-In Error",
          description: error.message,
        });
      } else {
        if (isLogin) Analytics.loginCompleted('apple');
        else Analytics.signupCompleted('apple');
      }
    } finally {
      setOauthLoading(null);
    }
  };

  const handleBack = () => {
    if (showEmailForm) {
      setShowEmailForm(false);
      setIsForgotPassword(false);
    }
  };

  return (
    <>
      <SEOHead />
      <div
        className="h-[100dvh] flex flex-col overflow-hidden relative"
        style={{
          background:
            'linear-gradient(180deg, #FFF4DC 0%, #FFE0E6 45%, #FBD4E2 100%)',
        }}
      >
        {/* Ambient glow blobs — same palette as "What is Rilo" planner screen */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute -top-32 left-1/2 -translate-x-1/2 w-[480px] h-[480px] rounded-full blur-3xl opacity-60"
            style={{ background: 'radial-gradient(circle, #FFD36E 0%, transparent 70%)' }}
          />
          <div
            className="absolute top-1/3 -right-24 w-[280px] h-[280px] rounded-full blur-3xl opacity-50"
            style={{ background: 'radial-gradient(circle, #F8B4C6 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-16 -left-20 w-[340px] h-[340px] rounded-full blur-3xl opacity-50"
            style={{ background: 'radial-gradient(circle, #E84A6F 0%, transparent 70%)' }}
          />
          {/* Sparkles scattered like the teach screens */}
          {Array.from({ length: 12 }).map((_, i) => {
            const left = (i * 37) % 100;
            const top = (i * 53) % 100;
            return (
              <span
                key={i}
                className="absolute text-[10px] opacity-50"
                style={{ left: `${left}%`, top: `${top}%`, color: '#A0123F' }}
              >
                ✨
              </span>
            );
          })}
        </div>

        {/* Multilingual welcome train pinned to the top as the page header */}
        {!showEmailForm && (
          <div
            className="absolute top-0 left-0 right-0 z-20 pt-[calc(env(safe-area-inset-top)+10px)] pb-2"
          >
            <WelcomeTrain />
          </div>
        )}

        {/* Vertically-centered stack: hero + main content sit in the middle of the screen */}
        <div className="flex-1 px-6 py-6 overflow-y-auto relative z-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-7">
            {/* Hero brand block — big welcome headline + icon + tagline row */}
            {!showEmailForm && (
              <div className="flex flex-col items-center text-center">
                <h1 className="text-[40px] leading-[1.05] font-bold tracking-tight text-[#1a1f3d]">
                  {isLogin ? 'Welcome back!' : 'Welcome to Rilo!'}
                </h1>
                <div className="mt-5 flex items-center gap-4">
                  <div className="w-[88px] h-[88px] rounded-[22px] overflow-hidden shadow-[0_20px_50px_-10px_rgba(232,74,111,0.45)] shrink-0">
                    <img
                      src={riloAppIcon}
                      alt="Rilo"
                      className="w-full h-full object-cover select-none"
                      draggable={false}
                    />
                  </div>
                  <p className="text-left text-[17px] leading-[1.25] font-semibold text-[#1a1f3d]">
                    Your <span className="text-[#F08A3E] font-bold">FREE</span>
                    <br />
                    Self Care Tracker
                    <br />
                    and Routine Planner
                  </p>
                </div>
              </div>
            )}
            {showEmailForm && (
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-[18px] overflow-hidden shadow-[0_16px_40px_-12px_rgba(232,74,111,0.4)]">
                  <img src={riloAppIcon} alt="Rilo" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            {/* Back button - inside card for better reach */}
            {showEmailForm && (
              <div className="-mt-2 -ml-2 mb-2">
                <Button
                  type="button"
                  onClick={handleBack}
                  className="rounded-full h-11 w-11 p-0 bg-white/80 active:bg-white text-[#1a1f3d] shadow-[0_8px_20px_-10px_rgba(26,31,61,0.4)] border border-white/70"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>
            )}
            
            {/* Title — bold dark navy like the teach screens */}
            <div className="text-center space-y-2">
              {(showEmailForm || isForgotPassword) && (
                <h1 className="text-[26px] leading-[1.15] font-bold tracking-tight text-[#1a1f3d]">
                  {isForgotPassword
                    ? 'Reset your password'
                    : (isLogin ? 'Sign in with email' : 'Create your account')}
                </h1>
              )}
              {!showEmailForm && !isForgotPassword && (
                <p className="text-[15px] font-semibold text-[#1a1f3d]">
                  {"\n"}
                </p>
              )}
              {(showEmailForm || isForgotPassword) && (
                <p className="text-[14px] text-[#1a1f3d]/65 max-w-[30ch] mx-auto leading-relaxed">
                  {isForgotPassword
                    ? 'Enter your email to receive a password reset link.'
                    : (isLogin ? 'Enter your credentials to continue.' : '')}
                </p>
              )}
            </div>

            {/* Show either social buttons or email form */}
            {!showEmailForm ? (
              /* Social Login Buttons — Tiimo-style stacked pills */
              <div className="space-y-3">
                {/* Apple first — primary on iOS */}
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

                {/* Email Button — softer tertiary */}
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
              </div>
            ) : (
              /* Email Form — frosted card like the teach planner card */
              <form
                onSubmit={handleSubmit}
                className="space-y-4 bg-white/80 backdrop-blur-xl rounded-3xl p-5 shadow-[0_24px_70px_-20px_rgba(26,31,61,0.25)] border border-white/70"
              >
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-wider text-[#1a1f3d]/60">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={(e) => {
                      if (Capacitor.isNativePlatform()) {
                        focusedInputRef.current = e.target;
                      }
                    }}
                    required
                    className="h-12 rounded-2xl bg-white border-transparent text-[#1a1f3d] placeholder:text-[#1a1f3d]/35"
                  />
                </div>
                {!isForgotPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-[11px] font-bold uppercase tracking-wider text-[#1a1f3d]/60">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={(e) => {
                        if (Capacitor.isNativePlatform()) {
                          focusedInputRef.current = e.target;
                        }
                      }}
                      required
                      className="h-12 rounded-2xl bg-white border-transparent text-[#1a1f3d] placeholder:text-[#1a1f3d]/35"
                    />
                  </div>
                )}
                {!isForgotPassword && !isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-[11px] font-bold uppercase tracking-wider text-[#1a1f3d]/60">Repeat password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onFocus={(e) => {
                        if (Capacitor.isNativePlatform()) {
                          focusedInputRef.current = e.target;
                        }
                      }}
                      required
                      className="h-12 rounded-2xl bg-white border-transparent text-[#1a1f3d] placeholder:text-[#1a1f3d]/35"
                    />
                  </div>
                )}
                <Button 
                  type="submit" 
                  className="w-full h-[52px] rounded-full font-semibold text-[16px] bg-[#1a1f3d] active:bg-[#1a1f3d]/90 text-white shadow-[0_12px_30px_-12px_rgba(26,31,61,0.6)]"
                  disabled={loading || oauthLoading !== null || (isForgotPassword && resendIn > 0)}
                >
                  {loading
                    ? 'Loading...'
                    : isForgotPassword
                      ? (resendIn > 0 ? `Resend in ${resendIn}s` : (resetSentTo ? 'Resend reset link' : 'Send reset link'))
                      : (isLogin ? 'Sign in' : 'Create account')}
                </Button>

                {/* Confirmation + troubleshooting for the reset email */}
                {isForgotPassword && resetSentTo && (
                  <div className="rounded-2xl bg-white/70 border border-white/70 p-4 space-y-2">
                    <p className="text-[13px] font-semibold text-[#1a1f3d]">
                      If an account exists for {resetSentTo}, a reset link is on its way.
                    </p>
                    <p className="text-[12px] text-[#1a1f3d]/65 leading-relaxed">
                      Check your spam folder. The link works once and expires — open it on this
                      device, then choose a new password.
                    </p>
                  </div>
                )}

                {/* Social-account hint */}
                {isForgotPassword && (
                  <p className="text-[12px] text-[#1a1f3d]/65 text-center leading-relaxed">
                    Signed up with Apple or Google? You don't have a password — go back and use
                    "Continue with Apple" or "Continue with Google" instead.
                  </p>
                )}

                {/* Forgot password link */}
                {!isForgotPassword && isLogin && (
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-sm text-[#1a1f3d]/60"
                    >
                      Forgot password?
                    </Button>
                  </div>
                )}

                {/* Back to sign in from forgot password */}
                {isForgotPassword && (
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setResetSentTo(null);
                      }}
                      className="text-sm text-[#1a1f3d]"
                    >
                      Back to sign in
                    </Button>
                  </div>
                )}

              </form>
            )}

            {/* Switch to login from email signup */}
            {showEmailForm && !isForgotPassword && !isLogin && (
              <div className="text-center pt-1">
                <p className="text-[#1a1f3d] text-sm font-semibold">
                  Already have an account?{' '}
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setIsLogin(true)}
                    className="text-[#B8590E] font-bold p-0 h-auto underline underline-offset-4"
                  >
                    Log in here
                  </Button>
                </p>
              </div>
            )}

            {/* Toggle Login/Signup — only on the social-buttons screen.
                Apple/Google work identically for both flows; this just changes
                what "Continue with Email" opens to. */}
            {!showEmailForm && !isForgotPassword && (
              <div className="text-center pt-2">
                <p className="text-[#1a1f3d] text-sm font-semibold">
                  {isLogin ? "New to Rilo? " : "Already have an account? "}
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-[#B8590E] font-bold p-0 h-auto underline underline-offset-4"
                  >
                    {isLogin ? 'Create one' : 'Log in here'}
                  </Button>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom social-proof layer — quiet, static, in its own layer so the
            centered auth stack above is untouched. Hidden when the email form
            is open or the keyboard is up. */}
        {!showEmailForm && !isForgotPassword && !isKeyboardOpen && (
          <div
            className="pointer-events-none absolute left-0 right-0 z-10 px-6 flex flex-col items-center gap-2.5"
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 18px)' }}
          >
            {/* Social-proof pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-white/70 shadow-[0_8px_24px_-12px_rgba(26,31,61,0.25)]">
              <span className="text-[13px]">⭐</span>
              <span className="text-[12px] font-bold text-[#1a1f3d]">
                10,000+ women building their routine
              </span>
            </div>

          </div>
        )}


      </div>
    </>
  );
}

/* Horizontal "train" of welcomes from around the world.
   Each carriage is a soft frosted pill with a flag + the word in its
   own script. Persian / Arabic use the Vazirmatn font (font-farsi). */
// Farsi appears between every other language so Persian users always
// catch their welcome no matter when they look at the screen.
const FARSI = { flag: '🇮🇷', word: 'خوش آمدید', farsi: true };
const WELCOMES: { flag: string; word: string; farsi?: boolean }[] = [
  { flag: '🇺🇸', word: 'Welcome' },
  FARSI,
  { flag: '🇹🇷', word: 'Hoş geldin' },
  FARSI,
  { flag: '🇪🇸', word: 'Bienvenida' },
  FARSI,
];

function WelcomeTrain() {
  // Duplicate the list so the loop is seamless (translateX 0 → -50%)
  const carriages = [...WELCOMES, ...WELCOMES];
  return (
    <div className="overflow-hidden mask-fade-x">
      <div className="flex w-max items-center gap-2.5 animate-marquee-slow whitespace-nowrap py-1">
        {carriages.map((w, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/55 backdrop-blur-md border border-white/60 shadow-[0_4px_14px_-6px_rgba(26,31,61,0.18)] shrink-0"
          >
            <span className="text-[13px] leading-none">{w.flag}</span>
            <span
              dir={w.farsi ? 'rtl' : 'ltr'}
              className={[
                'text-[12px] font-semibold text-[#1a1f3d] leading-none',
                w.farsi ? 'font-farsi text-[13px]' : '',
              ].join(' ')}
            >
              {w.word}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
