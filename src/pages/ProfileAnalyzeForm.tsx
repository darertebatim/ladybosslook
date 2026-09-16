import { useState } from 'react';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/ui/navigation';
import Footer from '@/components/sections/Footer';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Instagram, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

const formSchema = z.object({
  instagram_url: z
    .string()
    .trim()
    .min(1, 'آدرس پیج اینستاگرام الزامی است')
    .max(200, 'آدرس پیج خیلی طولانی است'),
  business_field: z
    .string()
    .trim()
    .min(1, 'حوزه فعالیت را بنویسید')
    .max(300, 'حوزه فعالیت خیلی طولانی است'),
  business_name: z.string().trim().max(200, 'اسم بیزینس خیلی طولانی است').optional().or(z.literal('')),
  product_service: z
    .string()
    .trim()
    .min(1, 'محصول یا خدمت مورد نظر را بنویسید')
    .max(2000, 'متن خیلی طولانی است'),
  target_audience: z
    .string()
    .trim()
    .min(1, 'مخاطب هدف را بنویسید')
    .max(2000, 'متن خیلی طولانی است'),
  offer_includes: z
    .string()
    .trim()
    .min(1, 'محتوای آفر را بنویسید')
    .max(3000, 'متن خیلی طولانی است'),
  conversion_action: z
    .string()
    .trim()
    .min(1, 'اقدام و محل تبدیل را بنویسید')
    .max(2000, 'متن خیلی طولانی است'),
  question: z.string().trim().max(2000, 'متن خیلی طولانی است').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;
type FieldKey = keyof FormValues;

const EMPTY_FORM: FormValues = {
  instagram_url: '',
  business_field: '',
  business_name: '',
  product_service: '',
  target_audience: '',
  offer_includes: '',
  conversion_action: '',
  question: '',
};

const ProfileAnalyzeForm = () => {
  const { user } = useAuth();
  const [values, setValues] = useState<FormValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const setField = (key: FieldKey, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    const parsed = formSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<FieldKey, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as FieldKey;
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    if (!user) {
      setSubmitError('برای ثبت درخواست باید وارد حساب خود شوید.');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('profile_analysis_requests').insert({
        user_id: user.id,
        instagram_url: parsed.data.instagram_url,
        business_field: parsed.data.business_field,
        business_name: parsed.data.business_name || null,
        product_service: parsed.data.product_service,
        target_audience: parsed.data.target_audience,
        offer_includes: parsed.data.offer_includes,
        conversion_action: parsed.data.conversion_action,
        question: parsed.data.question || null,
      });
      if (error) throw error;
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to submit profile analysis request:', err);
      setSubmitError('ثبت درخواست با خطا مواجه شد. لطفاً دوباره تلاش کنید.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (key: FieldKey) =>
    `bg-white border-border-warm rounded-xl text-right placeholder:text-right placeholder:text-muted-foreground/40 focus-visible:ring-brand/40 ${
      errors[key] ? 'border-destructive' : ''
    }`;

  const renderError = (key: FieldKey) =>
    errors[key] ? (
      <p className="mt-1.5 text-sm text-destructive text-right">{errors[key]}</p>
    ) : null;

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <SEOHead title="درخواست تحلیل پیج اینستاگرام | Rilo" description="فرم درخواست تحلیل پیج اینستاگرام توسط علی لطفی" />
        <Navigation />
        <main
          dir="rtl"
          className="rilo-surface flex-1 flex items-center justify-center px-4 py-16 pt-24"
          style={{ fontFamily: 'var(--font-farsi)' }}
        >
          <div className="w-full max-w-lg bg-card-warm rounded-3xl shadow-card-warm p-8 sm:p-10 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-mint flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-700" />
            </div>
            <h1 className="text-2xl font-bold text-fg-warm">درخواست شما ثبت شد ✅</h1>
            <p className="text-fg-warm-muted leading-relaxed">
              تیم علی لطفی پیج شما را بررسی می‌کند و نتیجه تحلیل به‌همراه نکات اصلاحی در اختیارتان قرار می‌گیرد.
              <br />
              لطفاً تا اعلام نتیجه، پیج را فعال و به‌روز نگه دارید.
            </p>
            <Button
              onClick={() => {
                setValues(EMPTY_FORM);
                setSubmitted(false);
              }}
              variant="outline"
              className="mt-2 rounded-xl border-border-warm"
            >
              ثبت درخواست جدید
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEOHead title="درخواست تحلیل پیج اینستاگرام | Rilo" description="فرم درخواست تحلیل پیج اینستاگرام توسط علی لطفی" />
      <Navigation />
      <main dir="rtl" className="rilo-surface flex-1 px-4 pt-24 pb-10 sm:pt-28 sm:pb-14" style={{ fontFamily: 'var(--font-farsi)' }}>
        <div className="w-full max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-gradient-orange rounded-3xl p-6 sm:p-8 text-white shadow-card-warm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <Instagram className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold">تحلیل پیج اینستاگرام شما</h1>
                <p className="text-sm text-white/90 mt-0.5">توسط علی لطفی — مدرس دوره جذب مشتری</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/95">
              برای اینکه تحلیل دقیق و کاربردی‌ای از پیج اینستاگرامتون بگیرید، لطفاً فرم زیر را با دقت و کامل پر کنید.
              هرچه اطلاعات دقیق‌تری بدهید، تحلیل دقیق‌تری دریافت می‌کنید.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-card-warm rounded-3xl shadow-card-warm p-5 sm:p-8 space-y-7">
            {/* ۱ — Instagram URL */}
            <div>
              <label htmlFor="instagram_url" className="block font-bold text-fg-warm mb-2">
                <span className="text-brand ml-1">۱.</span> آدرس دقیق پیج اینستاگرامتون
              </label>
              <div className="relative" dir="ltr">
                <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                <Input
                  id="instagram_url"
                  dir="ltr"
                  placeholder="instagram.com/alilotfivip"
                  value={values.instagram_url}
                  onChange={(e) => setField('instagram_url', e.target.value)}
                  className={`${inputClass('instagram_url')} pl-9 text-left placeholder:text-left`}
                />
              </div>
              {renderError('instagram_url')}
            </div>

            {/* ۲ — Business field + name */}
            <div>
              <label className="block font-bold text-fg-warm mb-2">
                <span className="text-brand ml-1">۲.</span> حوزه فعالیت و اسم بیزینس
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Input
                    id="business_field"
                    placeholder="حوزه فعالیت (مثلاً آموزش زبان)"
                    value={values.business_field}
                    onChange={(e) => setField('business_field', e.target.value)}
                    className={inputClass('business_field')}
                  />
                  {renderError('business_field')}
                </div>
                <div>
                  <Input
                    id="business_name"
                    placeholder="اسم بیزینس (اختیاری)"
                    value={values.business_name}
                    onChange={(e) => setField('business_name', e.target.value)}
                    className={inputClass('business_name')}
                  />
                </div>
              </div>
            </div>

            {/* ۳ — Product / service */}
            <div>
              <label htmlFor="product_service" className="block font-bold text-fg-warm mb-2">
                <span className="text-brand ml-1">۳.</span> محصول یا خدمتی که برای تبلیغ انتخاب کردید کدام است؟
              </label>
              <Textarea
                id="product_service"
                rows={3}
                placeholder="مثلاً دوره آنلاین فروش، مشاوره حضوری، محصول فیزیکی و…"
                value={values.product_service}
                onChange={(e) => setField('product_service', e.target.value)}
                className={`${inputClass('product_service')} resize-none`}
              />
              {renderError('product_service')}
            </div>

            {/* ۴ — Target audience */}
            <div>
              <label htmlFor="target_audience" className="block font-bold text-fg-warm mb-2">
                <span className="text-brand ml-1">۴.</span> مخاطب هدف شما چه کسانی هستند؟
              </label>
              <Textarea
                id="target_audience"
                rows={3}
                placeholder="سن، شغل، موقعیت، مشکلی که دارند و…"
                value={values.target_audience}
                onChange={(e) => setField('target_audience', e.target.value)}
                className={`${inputClass('target_audience')} resize-none`}
              />
              {renderError('target_audience')}
            </div>

            {/* ۵ — Offer includes */}
            <div>
              <label htmlFor="offer_includes" className="block font-bold text-fg-warm mb-2">
                <span className="text-brand ml-1">۵.</span> آفر شما شامل چه چیزهایی است؟
              </label>
              <Textarea
                id="offer_includes"
                rows={3}
                placeholder="هر چیزی که مشتری در ازای پرداختش دریافت می‌کند را بنویسید…"
                value={values.offer_includes}
                onChange={(e) => setField('offer_includes', e.target.value)}
                className={`${inputClass('offer_includes')} resize-none`}
              />
              {renderError('offer_includes')}
            </div>

            {/* ۶ — Conversion action */}
            <div>
              <label htmlFor="conversion_action" className="block font-bold text-fg-warm mb-2">
                <span className="text-brand ml-1">۶.</span> اقدام (اکشن) چیست و کاربر کجا به مشتری تبدیل می‌شود؟
              </label>
              <Textarea
                id="conversion_action"
                rows={3}
                placeholder="مثلاً دایرکت، لینک بایو، لندینگ‌پیج، تماس و…"
                value={values.conversion_action}
                onChange={(e) => setField('conversion_action', e.target.value)}
                className={`${inputClass('conversion_action')} resize-none`}
              />
              {renderError('conversion_action')}
            </div>

            {/* ۷ — Question (optional) */}
            <div>
              <label htmlFor="question" className="block font-bold text-fg-warm mb-2">
                <span className="text-brand ml-1">۷.</span> سوال یا چالش خاصی دارید که می‌خواهید مستقیماً از ما بپرسید؟{' '}
                <span className="text-fg-warm-muted font-normal text-sm">(اختیاری)</span>
              </label>
              <Textarea
                id="question"
                rows={3}
                placeholder="هر سوال یا چالشی که ذهنتان را درگیر کرده…"
                value={values.question}
                onChange={(e) => setField('question', e.target.value)}
                className={`${inputClass('question')} resize-none`}
              />
              {renderError('question')}
            </div>

            {submitError && (
              <p className="text-sm text-destructive text-right bg-destructive/10 rounded-xl px-4 py-3">
                {submitError}
              </p>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-2xl bg-brand text-white font-bold text-base active:opacity-90 shadow-card-warm"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin ml-2" />
                  در حال ثبت…
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 ml-2" />
                  ثبت درخواست تحلیل
                </>
              )}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfileAnalyzeForm;
