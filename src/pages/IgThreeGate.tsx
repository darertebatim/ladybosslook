import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { z } from "zod";
import { Play } from "lucide-react";
import coverAsset from "@/assets/igthree-thumbnail.jpg.asset.json";
import { supabase } from "@/integrations/supabase/client";
import { trackWebinarLead } from "@/lib/metaCapi";
import { useToast } from "@/hooks/use-toast";

export const IGTHREE_EMAIL_KEY = "igthree_email";
const TITLE = "سه پیشفرض برای جذب مشتری از اینستاگرام در امریکا و کانادا";
const emailSchema = z.string().trim().email().max(255);

export default function IgThreeGate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Returning visitors get a shortcut link below the form instead of an
  // automatic redirect, so the cover page is always reachable.

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
        name: "", email: clean, city: "", phone: "", source: "igthree_video", round_id: null,
      });
      if (dbError) throw dbError;
      trackWebinarLead({ customEvent: "IGThreeLead", contentName: "igthree_video", email: clean });
      try { localStorage.setItem(IGTHREE_EMAIL_KEY, clean); } catch { /* ignore */ }
      navigate("/l/igthree/watch");
    } catch (err) {
      console.error("igthree gate error", err);
      toast({ title: "خطا", description: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.", variant: "destructive" });
      setSubmitting(false);
    }
  }

  return (
    <div className="h-[100svh] overflow-hidden bg-gradient-to-b from-orange-50 via-white to-white">
      <Helmet>
        <title>{TITLE} | Rilo</title>
        <meta name="description" content={`ویدیو آموزشی رایگان: ${TITLE}.`} />
      </Helmet>

      <main
        dir="rtl"
        className="mx-auto flex h-full w-full max-w-md flex-col justify-center gap-4 px-5 py-5 font-farsi"
      >
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-3 py-1 text-[11px] font-bold text-white shadow-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            ویدیو رایگان — تماشای فوری
          </span>
          <h1 className="mt-2.5 text-[21px] font-extrabold leading-8 text-neutral-900">{TITLE}</h1>
          <p className="mt-1 text-xs text-neutral-600">مخصوص بیزینس‌های آمریکا و کانادا — با علی لطفی</p>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.focus()}
          className="relative w-full overflow-hidden rounded-2xl border border-orange-200 bg-black shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
          aria-label="برای تماشا ایمیل خود را وارد کنید"
        >
          <img src={coverAsset.url} alt={TITLE} className="aspect-video max-h-[34svh] w-full object-cover" />
          <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-xl">
            <Play className="h-6 w-6 translate-x-0.5 fill-rose-500 text-rose-500" />
          </span>
        </button>

        <form onSubmit={handleSubmit} className="space-y-2.5">
          <p className="text-center text-sm font-bold text-neutral-900">
            ایمیل خود را وارد کنید تا ویدیو همین الان باز شود
          </p>
          <input
            ref={inputRef}
            type="email"
            inputMode="email"
            autoComplete="email"
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
            {submitting ? "در حال باز کردن..." : "تماشای ویدیو"}
          </button>
          <p className="text-center text-[11px] text-neutral-500">رایگان — ویدیو بلافاصله باز می‌شود</p>
        </form>
      </main>
    </div>
  );
}
