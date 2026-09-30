import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Mail, ShieldCheck, Sparkles, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = 'email' | 'code' | 'done';

const ERRORS: Record<string, { en: string; fa: string }> = {
  same_email: {
    en: 'This is already your account email.',
    fa: 'این همان ایمیل حساب شماست.',
  },
  already_linked: {
    en: 'This email is already linked to your account.',
    fa: 'این ایمیل قبلاً به حساب شما وصل شده است.',
  },
  claimed_by_other: {
    en: 'This email belongs to another account. Please contact support.',
    fa: 'این ایمیل به حساب دیگری وصل است. لطفاً با پشتیبانی تماس بگیرید.',
  },
  invalid_email: { en: 'Please enter a valid email.', fa: 'ایمیل معتبر وارد کنید.' },
  wrong_code: { en: 'That code is not correct.', fa: 'کد وارد شده درست نیست.' },
  code_expired: { en: 'The code expired. Send a new one.', fa: 'کد منقضی شده. کد جدید بگیرید.' },
  no_pending_code: { en: 'Send a code first.', fa: 'ابتدا کد را دریافت کنید.' },
  too_many_attempts: { en: 'Too many tries. Send a new code.', fa: 'تلاش زیاد. کد جدید بگیرید.' },
  could_not_send: { en: 'We could not send the email.', fa: 'ارسال ایمیل ممکن نشد.' },
};

export const LinkPaymentEmailSheet = ({ open, onOpenChange }: Props) => {
  const { i18n } = useTranslation();
  const isFa = i18n.language === 'fa';
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ orders: number; courses: number } | null>(null);

  const reset = () => {
    setStep('email');
    setEmail('');
    setCode('');
    setResult(null);
  };

  const showError = (key?: string) => {
    const entry = key ? ERRORS[key] : undefined;
    toast({
      variant: 'destructive',
      title: entry ? (isFa ? entry.fa : entry.en) : isFa ? 'مشکلی پیش آمد' : 'Something went wrong',
    });
  };

  const call = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke('user-link-email', {
      body: { ...body, lang: isFa ? 'fa' : 'en' },
    });
    if (error) {
      let key: string | undefined;
      try {
        const text = await (error as any).context?.text?.();
        if (text) key = JSON.parse(text)?.error;
      } catch { /* ignore */ }
      throw { key };
    }
    return data as any;
  };

  const sendCode = async () => {
    setLoading(true);
    try {
      await call({ action: 'send-code', email: email.trim().toLowerCase() });
      setStep('code');
      toast({ title: isFa ? 'کد فرستاده شد 📩' : 'Code sent 📩' });
    } catch (e: any) {
      showError(e?.key);
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setLoading(true);
    try {
      const data = await call({
        action: 'verify-and-merge',
        email: email.trim().toLowerCase(),
        code: code.trim(),
      });
      setResult({ orders: data?.mergedOrders ?? 0, courses: data?.mergedEnrollments ?? 0 });
      setStep('done');
      queryClient.invalidateQueries();
    } catch (e: any) {
      showError(e?.key);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setTimeout(reset, 250);
      }}
    >
      <SheetContent
        side="bottom"
        className="app-theme bg-bg-warm border-0 rounded-t-3xl px-5 pb-8 pt-6 max-h-[90vh] overflow-y-auto"
      >
        <div dir={isFa ? 'rtl' : 'ltr'} className="space-y-5">
          {step !== 'done' && (
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-14 w-14 rounded-full bg-gradient-orange flex items-center justify-center shadow-ios">
                <Mail className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[hsl(var(--fg-warm))]">
                  {isFa ? 'اتصال ایمیل خرید' : 'Link your purchase email'}
                </h2>
                <p className="text-sm text-[hsl(var(--fg-warm-muted))] mt-1 leading-relaxed">
                  {step === 'email'
                    ? isFa
                      ? 'ایمیلی که موقع پرداخت استفاده کردید را وارد کنید تا دوره‌هایتان به همین حساب اضافه شود.'
                      : 'Enter the email you used at checkout and we will add those courses to this account.'
                    : isFa
                      ? `کد ۶ رقمی را به ${email} فرستادیم.`
                      : `We sent a 6-digit code to ${email}.`}
                </p>
              </div>
            </div>
          )}

          {step === 'email' && (
            <div className="space-y-4">
              <Input
                type="email"
                inputMode="email"
                autoCapitalize="none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isFa ? 'ایمیل خرید' : 'Purchase email'}
                className="h-12 rounded-2xl bg-card-warm border-0 shadow-card-warm text-base"
                dir="ltr"
              />
              <Button
                onClick={sendCode}
                disabled={loading || !email.includes('@')}
                className="w-full h-12 rounded-2xl bg-gradient-orange text-white font-semibold shadow-ios border-0"
              >
                {loading
                  ? isFa ? 'در حال ارسال…' : 'Sending…'
                  : isFa ? 'ارسال کد تایید' : 'Send verification code'}
              </Button>
              <div className="flex items-start gap-2 p-3 rounded-2xl bg-card-warm">
                <ShieldCheck className="h-4 w-4 text-[hsl(var(--brand-primary))] mt-0.5 shrink-0" />
                <p className="text-xs text-[hsl(var(--fg-warm-muted))] leading-relaxed">
                  {isFa
                    ? 'برای امنیت، فقط ایمیلی که به آن دسترسی دارید قابل اتصال است.'
                    : 'For security, you can only link an inbox you can open.'}
                </p>
              </div>
            </div>
          )}

          {step === 'code' && (
            <div className="space-y-4">
              <Input
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="------"
                dir="ltr"
                className="h-14 rounded-2xl bg-card-warm border-0 shadow-card-warm text-center text-2xl font-bold tracking-[0.5em]"
              />
              <Button
                onClick={verify}
                disabled={loading || code.length !== 6}
                className="w-full h-12 rounded-2xl bg-gradient-orange text-white font-semibold shadow-ios border-0"
              >
                {loading
                  ? isFa ? 'در حال بررسی…' : 'Checking…'
                  : isFa ? 'تایید و اتصال' : 'Verify & link'}
              </Button>
              <button
                onClick={() => setStep('email')}
                className="flex items-center justify-center gap-1.5 w-full text-sm text-[hsl(var(--fg-warm-muted))] py-2"
              >
                <ArrowLeft className="h-4 w-4" />
                {isFa ? 'تغییر ایمیل' : 'Change email'}
              </button>
            </div>
          )}

          {step === 'done' && (
            <div className="flex flex-col items-center text-center gap-4 py-2">
              <div className="h-16 w-16 rounded-full bg-mint flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-[hsl(var(--brand-primary))]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[hsl(var(--fg-warm))]">
                  {isFa ? 'ایمیل وصل شد 🎉' : 'Email linked 🎉'}
                </h2>
                <p className="text-sm text-[hsl(var(--fg-warm-muted))] mt-1.5 leading-relaxed">
                  {result && (result.courses > 0 || result.orders > 0)
                    ? isFa
                      ? `${result.courses} دوره و ${result.orders} خرید به حساب شما اضافه شد.`
                      : `${result.courses} course(s) and ${result.orders} purchase(s) added to your account.`
                    : isFa
                      ? 'خریدی با این ایمیل پیدا نشد، اما از این به بعد خریدهای این ایمیل به همین حساب می‌آید.'
                      : 'No purchases found yet, but future purchases with this email will land here.'}
                </p>
              </div>
              <Button
                onClick={() => onOpenChange(false)}
                className="w-full h-12 rounded-2xl bg-gradient-orange text-white font-semibold shadow-ios border-0"
              >
                {isFa ? 'باشه' : 'Done'}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
