import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';
import { BrandedSplash } from '@/components/app/BrandedSplash';
import { getDisplayBuildInfo } from '@/lib/buildInfo';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const { signIn, signUp, signInWithGoogle, signInWithApple, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/app/home');
    }
  }, [user, navigate]);

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
        }
      } else {
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
          toast({
            title: "Check your email",
            description: "We've sent you a confirmation link.",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setOauthLoading('google');
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          variant: "destructive",
          title: "Google Sign-In Error",
          description: error.message,
        });
      }
    } finally {
      setOauthLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    setOauthLoading('apple');
    try {
      const { error } = await signInWithApple();
      if (error) {
        toast({
          variant: "destructive",
          title: "Apple Sign-In Error",
          description: error.message,
        });
      }
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <>
      <SEOHead />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            {isForgotPassword ? 'Reset Password' : (isLogin ? 'Welcome back' : 'Create account')}
          </CardTitle>
          <CardDescription className="text-center">
            {isForgotPassword 
              ? 'Enter your email to receive a password reset link'
              : (isLogin 
                ? 'Enter your credentials to access your account'
                : 'Enter your information to create an account')
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* OAuth Buttons - only show when not in forgot password mode */}
          {!isForgotPassword && (
            <>
              <div className="grid gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 font-medium"
                  onClick={handleAppleSignIn}
                  disabled={oauthLoading !== null || loading}
                >
                  {oauthLoading === 'apple' ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Connecting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      Continue with Apple
                    </span>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12 font-medium"
                  onClick={handleGoogleSignIn}
                  disabled={oauthLoading !== null || loading}
                >
                  {oauthLoading === 'google' ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Connecting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
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
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    or continue with email
                  </span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
                  required
                />
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || oauthLoading !== null}
            >
              {loading ? 'Loading...' : (isForgotPassword ? 'Send Reset Link' : (isLogin ? 'Sign In' : 'Sign Up'))}
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            {!isForgotPassword && isLogin && (
              <Button
                type="button"
                variant="link"
                onClick={() => setIsForgotPassword(true)}
                className="text-sm"
              >
                Forgot password?
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsForgotPassword(false);
                setIsLogin(!isLogin);
              }}
              className="text-sm block w-full"
            >
              {isForgotPassword 
                ? "Back to sign in"
                : (isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in")
              }
            </Button>
          </div>
          
          {/* Build ID - helps diagnose which code version is running */}
          <div className="mt-4 text-center">
            <p className="text-[10px] text-muted-foreground/50 font-mono">
              {getDisplayBuildInfo()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}