import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle2, Shield, Mail } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import appIcon from '@/assets/app-icon.png';

export default function DeleteAccount() {
  const [step, setStep] = useState<'method' | 'email-form' | 'confirm' | 'success' | 'error'>('method');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [authenticatedVia, setAuthenticatedVia] = useState<'email' | 'google' | 'apple' | null>(null);

  // Check if user is already signed in (e.g. after OAuth redirect)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const provider = session.user.app_metadata?.provider;
        if (provider === 'google' || provider === 'apple') {
          setAuthenticatedVia(provider);
          setStep('confirm');
        }
      }
    };

    // Listen for auth state changes (OAuth redirect)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const provider = session.user.app_metadata?.provider;
        if (provider === 'google' || provider === 'apple') {
          setAuthenticatedVia(provider);
          setStep('confirm');
        }
      }
    });

    checkSession();
    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/delete-account` },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sign in with Google');
      setStep('error');
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: `${window.location.origin}/delete-account` },
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sign in with Apple');
      setStep('error');
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setAuthenticatedVia('email');
    setStep('confirm');
  };

  const handleConfirmDelete = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      let session;

      if (authenticatedVia === 'email') {
        // Sign in with email/password
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          setErrorMessage('Invalid email or password. Please check your credentials and try again.');
          setStep('error');
          setIsLoading(false);
          return;
        }
        session = signInData.session;
      } else {
        // Already signed in via OAuth
        const { data } = await supabase.auth.getSession();
        session = data.session;
      }

      if (!session) {
        setErrorMessage('Authentication failed. Please try again.');
        setStep('error');
        setIsLoading(false);
        return;
      }

      // Call delete edge function
      const { error } = await supabase.functions.invoke('delete-own-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        setErrorMessage('Failed to delete account. Please try again or contact support at support@ladybosslook.com');
        setStep('error');
        setIsLoading(false);
        return;
      }

      await supabase.auth.signOut();
      setStep('success');
    } catch (err) {
      setErrorMessage('An unexpected error occurred. Please contact support@ladybosslook.com');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const deletionItems = [
    'Your profile and personal information',
    'All journal entries and reflections',
    'Progress data and completions',
    'Chat messages and community posts',
    'All app preferences and settings',
  ];

  return (
    <>
      <SEOHead
        title="Delete Account | Rilo"
        description="Request deletion of your Rilo account and all associated data."
      />
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <img src={appIcon} alt="Rilo" className="h-16 w-16 mx-auto mb-3 rounded-2xl shadow-md" />
            <h1 className="text-xl font-bold">Rilo</h1>
            <p className="text-sm text-muted-foreground">Account Management</p>
          </div>

          {step === 'success' ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                <h2 className="text-xl font-semibold">Account Deleted</h2>
                <p className="text-muted-foreground text-sm">
                  Your account and all associated data have been permanently deleted.
                </p>
                <p className="text-muted-foreground text-sm">
                  If you have any questions, contact us at{' '}
                  <a href="mailto:support@ladybosslook.com" className="text-primary underline">
                    support@ladybosslook.com
                  </a>
                </p>
              </CardContent>
            </Card>
          ) : step === 'confirm' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Confirm Deletion
                </CardTitle>
                <CardDescription>
                  This action is permanent and cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Deleting your account will permanently remove:
                    <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                      {deletionItems.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setStep('method');
                      setAuthenticatedVia(null);
                    }}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleConfirmDelete}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete My Account'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : step === 'email-form' ? (
            <Card>
              <CardHeader>
                <CardTitle>Sign in to continue</CardTitle>
                <CardDescription>
                  Enter your email and password to verify your identity.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {errorMessage && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  <Button type="submit" variant="destructive" className="w-full">
                    Continue
                  </Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => { setStep('method'); setErrorMessage(''); }}>
                    ← Back
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            /* method selection or error */
            <Card>
              <CardHeader>
                <CardTitle>Delete Your Account</CardTitle>
                <CardDescription>
                  Sign in to verify your identity before deleting your account and all associated data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {step === 'error' && errorMessage && (
                  <Alert variant="destructive" className="mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}

                {/* Google */}
                <Button
                  variant="outline"
                  className="w-full h-12 text-sm font-medium"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </Button>

                {/* Apple */}
                <Button
                  variant="outline"
                  className="w-full h-12 text-sm font-medium"
                  onClick={handleAppleSignIn}
                  disabled={isLoading}
                >
                  <svg className="h-5 w-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  Continue with Apple
                </Button>

                {/* Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-3 text-xs text-muted-foreground">or</span>
                  </div>
                </div>

                {/* Email */}
                <Button
                  variant="outline"
                  className="w-full h-12 text-sm font-medium"
                  onClick={() => { setStep('email-form'); setErrorMessage(''); }}
                  disabled={isLoading}
                >
                  <Mail className="h-5 w-5 mr-3" />
                  Continue with Email
                </Button>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>
                      Sign in is used only to verify your identity before deletion. 
                      For questions, contact{' '}
                      <a href="mailto:support@ladybosslook.com" className="text-primary underline">
                        support@ladybosslook.com
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
