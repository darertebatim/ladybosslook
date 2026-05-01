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
import { ArrowLeft, Mail, Users } from 'lucide-react';
import appIcon from '@/assets/app-icon.png';
import cheerfulBird from '@/assets/onboarding/cheerful-bird.png';
import { useKeyboard } from '@/hooks/useKeyboard';
import { Capacitor } from '@capacitor/core';
import { Analytics } from '@/lib/firebaseAnalytics';


export default function Auth() {
  const initialSearchParams = new URLSearchParams(window.location.search);
  // Default to SIGN UP. Apple/Google buttons handle both flows automatically;
  // existing users tap "Already have an account? Log in here" to switch.
  const [isLogin, setIsLogin] = useState(initialSearchParams.get('mode') === 'login');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
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

  // Read redirect param from URL (e.g. /auth?redirect=/cart)
  const searchParams = new URLSearchParams(window.location.search);
  const redirectPath = searchParams.get('redirect') || '/app/home';
  const hasCustomRedirect = searchParams.has('redirect');

  // Redirect if already authenticated, or to onboarding if not seen yet
  useEffect(() => {
    if (user) {
      const hasSeenWhatIsRilo = localStorage.getItem('simora_onboarding_completed_what-is-rilo') === 'true';
      // First sign-in/up: show "What is Rilo?" teach onboarding once
      if (!hasSeenWhatIsRilo && !hasCustomRedirect) {
        navigate('/app/onboarding/what-is-rilo', { replace: true });
      } else {
        navigate(redirectPath);
      }
    } else if (!authLoading) {
      // First-time users should see onboarding before auth
      const hasSeenOnboarding = localStorage.getItem('simora_onboarding_completed_pre-auth-welcome') === 'true';
      const skipOnboarding = searchParams.get('skip_onboarding') === 'true';
      if (!hasSeenOnboarding && !hasCustomRedirect && !skipOnboarding) {
        navigate('/app/onboarding/pre-auth-welcome', { replace: true });
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
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: 'https://ladybosslook.com/auth',
        });

        if (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message,
          });
        } else {
          toast({
            title: "Check your email",
            description: "We've sent you a password reset link.",
          });
          setIsForgotPassword(false);
          setShowEmailForm(false);
        }
      } else {
        if (!isLogin) Analytics.signupStarted('email');
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
            title: "Check your email",
            description: "We've sent you a confirmation link.",
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
      <div className="h-[100dvh] flex flex-col bg-background overflow-hidden relative">
        {/* HERO — full-bleed cheerful bird mascot with warm glow */}
        {!showEmailForm && (
          <div className="relative flex-shrink-0 h-[52vh] min-h-[360px] max-h-[520px] overflow-hidden">
            <img
              src={cheerfulBird}
              alt="Rilo mascot welcoming you"
              className="absolute inset-0 w-full h-full object-cover"
              loading="eager"
              decoding="async"
            />
            {/* Soft warm overlay so text stays readable + blends into white card */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background pointer-events-none" />

            {/* Floating social-proof chip riding the seam between hero and card */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-20">
              <div className="flex items-center gap-2 rounded-full bg-background/85 backdrop-blur-xl px-4 py-2 shadow-ios border border-white/40 whitespace-nowrap">
                <div className="flex -space-x-1.5">
                  <span className="h-5 w-5 rounded-full bg-primary border-2 border-background" />
                  <span className="h-5 w-5 rounded-full bg-amber-400 border-2 border-background" />
                  <span className="h-5 w-5 rounded-full bg-orange-300 border-2 border-background" />
                </div>
                <Users className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-foreground">
                  Joined by 3,000+ users
                </span>
              </div>
            </div>
          </div>
        )}
        {showEmailForm && (
          <div className="flex-shrink-0 pt-10 pb-4 px-6 flex justify-center">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-ios">
              <img src={appIcon} alt="Rilo" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        {/* Main Content Card */}
        <div className={`flex-1 bg-background px-6 py-8 overflow-y-auto ${!showEmailForm ? '-mt-8 rounded-t-[2.5rem] relative z-10' : ''}`}>
          <div className="max-w-md mx-auto space-y-6">
            {/* Back button - inside card for better reach */}
            {showEmailForm && (
              <div className="-mt-2 -ml-2 mb-2">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleBack}
                  className="rounded-full h-12 w-12 p-0"
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>
              </div>
            )}
            
            {/* Title */}
            <div className="text-center space-y-2">
              {!showEmailForm && !isForgotPassword && (
                <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-primary">
                  Your FREE Self-Care App
                </p>
              )}
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {isForgotPassword
                  ? 'Reset Password'
                  : showEmailForm
                    ? (isLogin ? 'Sign in with Email' : 'Sign up with Email')
                    : (isLogin ? 'Welcome back' : 'Welcome to Rilo')}
              </h1>
              <p className="text-muted-foreground text-sm max-w-[28ch] mx-auto leading-relaxed">
                {isForgotPassword
                  ? 'Enter your email to receive a password reset link'
                  : showEmailForm
                    ? (isLogin ? 'Enter your credentials to continue' : 'Create your account to get started')
                    : (isLogin ? 'Ready to pick up where you left off?' : 'Your day, back in your hands.')}
              </p>
            </div>

            {/* Show either social buttons or email form */}
            {!showEmailForm ? (
              /* Social Login Buttons */
              <div className="space-y-3">
                {/* Google Button */}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-14 font-medium text-base rounded-full border-2"
                  onClick={handleGoogleSignIn}
                  disabled={oauthLoading !== null || loading}
                >
                  {oauthLoading === 'google' ? (
                    <span className="flex items-center gap-3">
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
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

                {/* Apple Button */}
                <Button
                  type="button"
                  className="w-full h-14 font-medium text-base rounded-full bg-black hover:bg-black/90 text-white"
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

                {/* Email Button */}
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full h-14 font-medium text-base rounded-full text-white"
                  onClick={() => setShowEmailForm(true)}
                  disabled={oauthLoading !== null || loading}
                >
                  <span className="flex items-center gap-3">
                    <Mail className="h-5 w-5" />
                    Continue with Email
                  </span>
                </Button>
              </div>
            ) : (
              /* Email Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
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
                    className="h-12 rounded-xl"
                  />
                </div>
                {!isForgotPassword && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
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
                      className="h-12 rounded-xl"
                    />
                  </div>
                )}
                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-full font-medium text-base" 
                  disabled={loading || oauthLoading !== null}
                >
                  {loading ? 'Loading...' : (isForgotPassword ? 'Send Reset Link' : (isLogin ? 'Sign In' : 'Sign Up'))}
                </Button>

                {/* Forgot password link */}
                {!isForgotPassword && isLogin && (
                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-sm text-muted-foreground"
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
                      onClick={() => setIsForgotPassword(false)}
                      className="text-sm"
                    >
                      Back to sign in
                    </Button>
                  </div>
                )}
              </form>
            )}

            {/* Toggle Login/Signup — only on the social-buttons screen.
                Apple/Google work identically for both flows; this just changes
                what "Continue with Email" opens to. */}
            {!showEmailForm && !isForgotPassword && (
              <div className="text-center pt-2">
                <p className="text-foreground text-sm font-semibold">
                  {isLogin ? "New to Rilo? " : "Already have an account? "}
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-primary font-bold p-0 h-auto underline underline-offset-4"
                  >
                    {isLogin ? 'Create one' : 'Log in here'}
                  </Button>
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
