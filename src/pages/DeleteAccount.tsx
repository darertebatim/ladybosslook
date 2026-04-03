import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, CheckCircle2, Shield } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';

export default function DeleteAccount() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'form' | 'confirm' | 'success' | 'error'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setStep('confirm');
  };

  const handleConfirmDelete = async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      // Sign in to verify credentials
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

      const session = signInData.session;
      if (!session) {
        setErrorMessage('Authentication failed. Please try again.');
        setStep('error');
        setIsLoading(false);
        return;
      }

      // Call delete edge function
      const { data, error } = await supabase.functions.invoke('delete-own-account', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) {
        setErrorMessage('Failed to delete account. Please try again or contact support at support@ladybosslook.com');
        setStep('error');
        setIsLoading(false);
        return;
      }

      // Sign out after deletion
      await supabase.auth.signOut();
      setStep('success');
    } catch (err) {
      setErrorMessage('An unexpected error occurred. Please contact support@ladybosslook.com');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Delete Account | Ladybosslook"
        description="Request deletion of your Ladybosslook account and all associated data."
      />
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <img src="/simora-icon.png" alt="Ladybosslook" className="h-12 w-12 mx-auto mb-3 rounded-xl" />
            <h1 className="text-xl font-bold">Ladybosslook</h1>
          </div>

          {step === 'success' ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                <h2 className="text-xl font-semibold">Account Deleted</h2>
                <p className="text-muted-foreground text-sm">
                  Your account and all associated data have been permanently deleted. 
                  This action cannot be undone.
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
                      <li>Your profile and personal information</li>
                      <li>All journal entries and reflections</li>
                      <li>Progress data and completions</li>
                      <li>Chat messages and community posts</li>
                      <li>All app preferences and settings</li>
                    </ul>
                  </AlertDescription>
                </Alert>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => setStep('form')}
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
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Delete Your Account</CardTitle>
                <CardDescription>
                  Enter your login credentials to verify your identity and permanently delete your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {step === 'error' && errorMessage && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{errorMessage}</AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleSubmit} className="space-y-4">
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
                </form>

                <div className="mt-6 pt-4 border-t">
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Shield className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>
                      Your credentials are used only to verify your identity. 
                      We do not store your password. For questions, contact{' '}
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
