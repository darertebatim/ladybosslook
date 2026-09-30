import { useState, useEffect } from 'react';
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { X, Monitor, Mail, Copy, Check, Loader2, CheckCircle2 } from 'lucide-react';
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
  const [aliasEmails, setAliasEmails] = useState<string[]>([]);

  useEffect(() => {
    if (!open || !user?.id) return;
    supabase
      .from('account_email_aliases')
      .select('email')
      .eq('primary_user_id', user.id)
      .then(({ data }) => setAliasEmails((data || []).map((a: any) => a.email)));
  }, [open, user?.id]);

  const allEmails = Array.from(
    new Set([user?.email, ...aliasEmails].filter(Boolean).map((e) => String(e).toLowerCase())),
  );
  const emailList = (
    <div className="mt-2 flex flex-wrap justify-center gap-1.5">
      {allEmails.map((e) => (
        <span key={e} className="rounded-full bg-card-warm px-2.5 py-1 text-xs text-fg-warm shadow-ios break-all">
          {e}
        </span>
      ))}
    </div>
  );

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
      <SheetContent side="bottom" hideCloseButton className="app-theme rounded-t-3xl border-0 bg-bg-warm px-5 pb-8 pt-5">
        <SheetPrimitive.Close className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/60 text-fg-warm shadow-ios backdrop-blur-sm transition-opacity active:opacity-60">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </SheetPrimitive.Close>
        <SheetHeader className="text-left">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-orange shadow-ios">
            <Monitor className="h-8 w-8 text-white" />
          </div>
          <SheetTitle className="text-center text-xl text-fg-warm">Use Rilo on your computer</SheetTitle>
          <SheetDescription className="text-center text-fg-warm-muted">
            A bigger screen is ideal for watching sessions, downloading worksheets and joining live meetings.
          </SheetDescription>
        </SheetHeader>

        {sent ? (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-mint p-4 text-center shadow-card-warm">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-brand" />
              <p className="font-semibold text-fg-warm">One-time link sent!</p>
              <p className="mt-1 text-sm text-fg-warm-muted">
                Open your inbox on your computer and tap the button in the email.
              </p>
              {emailList}
            </div>
            <Button
              variant="ghost"
              className="w-full h-11 rounded-2xl text-fg-warm"
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
              className="w-full h-auto px-4 py-4 bg-gradient-orange text-white font-semibold shadow-ios rounded-2xl border-0 hover:opacity-95"
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
            {allEmails.length > 0 && (
              <div className="text-center">
                <p className="text-xs text-fg-warm-muted">
                  We'll send it to {allEmails.length > 1 ? 'all your emails' : 'your email'}:
                </p>
                {emailList}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 rounded-2xl bg-card-warm p-4 shadow-card-warm">
          <p className="text-sm text-fg-warm">
            Or go directly to <span className="font-semibold text-brand">ladybosslook.com/app</span> on your computer.
          </p>
          <Button
            variant="outline"
            className="mt-3 w-full h-11 rounded-2xl border-0 bg-white text-fg-warm shadow-ios"
            onClick={copyLink}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2 text-brand" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2 text-brand" /> Copy link
              </>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
