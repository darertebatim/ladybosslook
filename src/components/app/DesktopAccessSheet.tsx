import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Monitor, Mail, Copy, Check, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserPreferredLanguage } from '@/hooks/useUserPreferredLanguage';
import { toast } from 'sonner';

const DESKTOP_URL = 'https://ladybosslook.com/app';

interface DesktopAccessSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** In-app path the desktop browser should land on, e.g. /app/myprograms/slug/roundId */
  redirectPath?: string;
  programName?: string;
}

export function DesktopAccessSheet({
  open,
  onOpenChange,
  redirectPath = '/app',
  programName,
}: DesktopAccessSheetProps) {
  const { user } = useAuth();
  const contentLang = useUserPreferredLanguage();
  const lang = contentLang === 'persian' ? 'fa' : 'en';

  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      setSent(false);
      setCopied(false);
    }
  }, [open]);

  const sendLink = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-desktop-login-link', {
        body: { redirectPath, programName, lang },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setSent(true);
    } catch (e: any) {
      console.error('send-desktop-login-link failed:', e);
      toast.error("We couldn't send the link. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(DESKTOP_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy the link');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl border-0 px-5 pb-8 pt-5">
        <SheetHeader className="text-left">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[hsl(var(--tint-peach))]">
            <Monitor className="h-7 w-7 text-brand" />
          </div>
          <SheetTitle className="text-center text-fg-warm">Use Rilo on your computer</SheetTitle>
          <SheetDescription className="text-center">
            A bigger screen is ideal for watching sessions, downloading worksheets and joining live meetings.
          </SheetDescription>
        </SheetHeader>

        {sent ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-[hsl(var(--tint-mint,var(--tint-peach)))] p-4 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-brand" />
              <p className="font-semibold text-fg-warm">One-time link sent!</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Open your inbox on your computer and tap the button in the email.
              </p>
              {user?.email && (
                <p className="mt-2 text-xs text-muted-foreground break-all">{user.email}</p>
              )}
            </div>
            <Button
              variant="ghost"
              className="w-full h-11 rounded-2xl"
              onClick={sendLink}
              disabled={sending}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Resend the link'}
            </Button>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            <Button
              size="lg"
              className="w-full h-auto px-4 py-4 bg-brand text-white shadow-ios rounded-2xl border-0"
              onClick={sendLink}
              disabled={sending}
            >
              {sending ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Mail className="h-5 w-5 mr-2" />
              )}
              Email me a one-time login link
            </Button>
            {user?.email && (
              <p className="text-center text-xs text-muted-foreground break-all">
                We'll send it to {user.email}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 rounded-2xl border border-border-warm bg-card-warm p-4">
          <p className="text-sm text-fg-warm">
            Or go directly to <span className="font-semibold">ladybosslook.com/app</span> on your computer.
          </p>
          <Button
            variant="outline"
            className="mt-3 w-full h-11 rounded-2xl border-0 bg-white text-fg-warm shadow-ios"
            onClick={copyLink}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" /> Copy link
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
