import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { z } from "zod";
import { ArrowDown, CheckCircle2, Clock, MailX, ShieldCheck, Users } from "lucide-react";
import coverAsset from "@/assets/igadsin_cover.png.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { trackWebinarLead } from "@/lib/metaCapi";
import { useToast } from "@/hooks/use-toast";

export const IGADSIN_EMAIL_KEY = "igadsin_email";
const TITLE = "نقشه راه جذب مشتری با تبلیغ اینستاگرامی";
const emailSchema = z.string().trim().email().max(255);

const LEARN = [
  "۶ اشتباهی که باعث می‌شود تبلیغات اینستاگرام شکست بخورد",
  "فرمول ۳ مرحله‌ای جذب مشتری از تبلیغات",
  "اینکه برای بیزینس تو کدام روش و کدام کمپین نتیجه می‌دهد",
  "چطور ظرفیت‌های خالی بیزینست را با مشتری اینستاگرامی پر کنی",
];

const FOR_YOU = [
  "در آمریکا یا کانادا بیزینس داری و می‌خواهی مشتری جدید اضافه کنی",
  "قبلاً تبلیغ کردی و پولت بی‌نتیجه سوخت",
  "می‌خواهی خودت این کار را بلد باشی، نه اینکه به دیگران بسپاری",
];

export default function IgAdsInGate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function focusForm() {
    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    inputRef.current?.focus();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      setError("ایمیل معتبر نیست");
      inputRef.current?.focus();
      return;
    }
    setError("");
    setSubmitting(true);
    const clean = parsed.data.toLowerCase();
    try {
      const { error: dbError } = await (supabase as any).from("form_submissions").insert({
        name: "", email: clean, city: "", phone: "", source: "igadsin_signup", round_id: null,
      });
      if (dbError) throw dbError;
      // Meta Pixel: standard Lead + custom IGAdsInLead (browser + server, deduplicated)
      trackWebinarLead({ customEvent: "IGAdsInLead", contentName: "igadsin_signup", email: clean });
      try { localStorage.setItem(IGADSIN_EMAIL_KEY, clean); } catch { /* ignore */ }
      navigate("/l/igadsprogram");
    } catch (err) {
      console.error("igadsin gate error", err);
      toast({ title: "خطا", description: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.", variant: "destructive" });
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[100svh] bg-gradient-to-b from-orange-50 via-white to-white">
      <Helmet>
        <title>{TITLE} | Rilo</title>
        <meta name="description" content="آموزش رایگان ۵۰ دقیقه‌ای جذب مشتری با تبلیغات اینستاگرام برای بیزینس‌های آمریکا و کانادا — با علی لطفی." />
      </Helmet>

      <main dir="rtl" className="mx-auto flex w-full max-w-md flex-col gap-3.5 px-5 py-4 font-farsi">
        {/* The cover already carries the title, so it stays only for screen readers and search */}
        <h1 className="sr-only">{TITLE}</h1>

        <button
          type="button"
          onClick={focusForm}
          className="relative w-full overflow-hidden rounded-2xl bg-black shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
          aria-label="برای تماشا ایمیل خود را وارد کنید"
        >
          <img src={coverAsset.url} alt={TITLE} className="aspect-video w-full object-cover" />
        </button>

        <p className="flex items-center justify-center gap-1.5 text-center text-xs font-bold text-neutral-600">
          <Users className="h-3.5 w-3.5 text-rose-500" />
          با علی لطفی · بیش از ۲۰۰ بیزینس منتورشده
        </p>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <p className="text-center text-sm font-bold text-neutral-900">
            ایمیل خود را وارد کنید تا آموزش همین الان باز شود
          </p>
          <div className="flex justify-center" aria-hidden="true">
            <ArrowDown className="h-7 w-7 animate-bounce text-rose-500" />
          </div>
          <input
            ref={inputRef}
            type="email"
            inputMode="email"
            enterKeyHint="go"
            autoComplete="email"
            aria-label="ایمیل"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            dir="ltr"
            maxLength={255}
            className="min-h-[52px] w-full rounded-xl border border-neutral-300 bg-white px-4 text-base text-neutral-900 outline-none focus:border-rose-500"
          />
          {error && <p className="text-center text-xs text-rose-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[52px] w-full rounded-xl bg-gradient-to-l from-rose-500 to-amber-500 text-base font-bold text-white shadow-md transition active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? "در حال باز کردن..." : "آموزش رو همین الان ببین"}
          </button>
          <div className="flex items-center justify-center gap-3 text-[11px] text-neutral-600">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> ۵۰ دقیقه</span>
            <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> کاملاً رایگان</span>
            <span className="flex items-center gap-1"><MailX className="h-3.5 w-3.5" /> بدون اسپم</span>
          </div>
        </form>

        <section className="rounded-2xl bg-white p-4 shadow-ios">
          <h2 className="mb-3 text-base font-extrabold text-neutral-900">در این آموزش یاد می‌گیری:</h2>
          <ul className="space-y-2.5">
            {LEARN.map((t) => (
              <li key={t} className="flex gap-2 text-sm leading-6 text-neutral-800">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" />
                {t}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-ios">
          <h2 className="mb-3 text-base font-extrabold text-neutral-900">این آموزش برای توست اگر:</h2>
          <ul className="space-y-2.5">
            {FOR_YOU.map((t) => (
              <li key={t} className="flex gap-2 text-sm leading-6 text-neutral-800">
                <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                {t}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl bg-neutral-900 p-4 text-white">
          <div className="mb-2 flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-400" />
            <h2 className="text-base font-extrabold">علی لطفی، مربی بیزینس شما</h2>
          </div>
          <p className="text-sm leading-7 text-white">
            ده سال سابقه کارآفرینی، و فقط در ۳ ماه گذشته بیش از ۲۰۰ بیزینس در ورکشاپ‌های ما شرکت کرده‌اند.
          </p>
        </section>

        <button
          type="button"
          onClick={focusForm}
          className="mb-6 min-h-[52px] w-full rounded-xl bg-gradient-to-l from-rose-500 to-amber-500 text-base font-bold text-white shadow-md active:scale-[0.98]"
        >
          همین الان آموزش رایگان را ببین
        </button>
      </main>
    </div>
  );
}
