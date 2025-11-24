import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  logSecurityEvent: (action: string, details?: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkUserRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      setIsAdmin(data?.role === 'admin');
    } catch {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer role checking to avoid blocking
          setTimeout(() => {
            checkUserRole(session.user.id);
          }, 0);
        } else {
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          checkUserRole(session.user.id);
        }, 0);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    // Use the production URL for email redirects
    const redirectUrl = 'https://ladybosslook.com/app/home';
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    
    // Check if user already exists (Supabase returns success but with identities array populated)
    if (!error && data.user && data.user.identities && data.user.identities.length === 0) {
      return { error: { message: 'This email is already registered. Please sign in instead.' } as any };
    }
    
    return { error };
  };

  const signOut = async () => {
    try {
      // Clear local state immediately
      setUser(null);
      setSession(null);
      setIsAdmin(false);
      
      // Then perform the sign out
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
      }
      
      return { error };
    } catch (error: any) {
      console.error('Sign out exception:', error);
      return { error };
    }
  };

  const logSecurityEvent = async (action: string, details?: any): Promise<void> => {
    try {
      // Only log if we have a user context or for authentication events
      if (user || ['sign_in_attempt', 'sign_up_attempt', 'sign_in_failed', 'sign_up_failed'].includes(action)) {
        await supabase.rpc('log_security_event', {
          p_action: action,
          p_details: details ? JSON.stringify(details) : null,
          p_user_id: user?.id || null
        });
      }
    } catch (error) {
      // Silently fail to avoid breaking the main flow
      console.warn('Failed to log security event:', error);
    }
  };

  const value = {
    user,
    session,
    loading,
    isAdmin,
      signIn,
      signUp,
      signOut,
      logSecurityEvent,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};