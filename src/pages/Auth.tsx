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

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/app/home');
    }
  }, [user, navigate]);

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
        <CardContent>
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
              disabled={loading}
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
        </CardContent>
      </Card>
    </div>
    </>
  );
}