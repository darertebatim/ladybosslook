import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";
import heroAsset from "@/assets/sixtraps-hero.png.asset.json";
import { formatLADateTime, formatLocalDateTime } from "@/lib/sixtrapsCalendar";

const PROGRAM_SLUG = "instagram6traps";

const schema = z.object({
  name: z.string().trim().min(2, "نام را کامل وارد کنید").max(100),
  city: z.string().trim().min(2, "شهر را وارد کنید").max(100),
  email: z.string().trim().email("ایمیل معتبر نیست").max(255),
});

export default function SixTrapsLanding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [webinar, setWebinar] = useState<{
    title: string;
    startUtc: Date;
    durationMinutes: number;
    meetUrl: string;
  } | null>(null);

  useEffect(() => {
    (async () => {
      // Prefer the round configured for auto-enrollment; fall back to earliest active round
      const { data: autoRule } = await (supabase as any)
        .from("program_auto_enrollment")
        .select("round_id")
        .eq("program_slug", PROGRAM_SLUG)
        .maybeSingle();

      const roundQuery = (supabase as any)
        .from("program_rounds")
        .select("first_session_date, first_session_duration, google_meet_link");

      const { data: round } = autoRule?.round_id
        ? await roundQuery.eq("id", autoRule.round_id).maybeSingle()
        : await roundQuery
            .eq("program_slug", PROGRAM_SLUG)
            .eq("status", "active")
            .order("first_session_date", { ascending: true })
            .limit(1)
            .maybeSingle();
      const { data: prog } = await (supabase as any)
        .from("program_catalog")
        .select("title")
        .eq("slug", PROGRAM_SLUG)
        .maybeSingle();
      if (round?.first_session_date) {
        setWebinar({
          title: prog?.title || "وبینار ۶ تله اینستاگرام",
          startUtc: new Date(round.first_session_date),
          durationMinutes: round.first_session_duration || 90,
          meetUrl: round.google_meet_link || "",
        });
      }
    })();
  }, []);

  const laLabel = useMemo(
    () => (webinar ? formatLADateTime(webinar.startUtc) : ""),
    [webinar],
  );
  const localLabel = useMemo(
    () => (webinar ? formatLocalDateTime(webinar.startUtc) : ""),
    [webinar],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const parsed = schema.safeParse({ name, city, email });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.errors.forEach((er) => {
        if (er.path[0]) errs[String(er.path[0])] = er.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from("form_submissions").insert({
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        city: parsed.data.city,
        phone: "",
        source: "sixtraps_registration",
      });
      if (error) throw error;

      // Fire-and-log confirmation email (non-blocking failure)
      supabase.functions
        .invoke("send-sixtraps-confirmation", {
          body: {
            name: parsed.data.name,
            email: parsed.data.email.toLowerCase(),
          },
        })
        .catch((err) => console.error("confirmation email error", err));

      navigate("/thankyousixtraps");
    } catch (err) {
      console.error("submit error", err);
      toast({
        title: "خطا",
        description: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SEOHead
        title="۶ تله اینستاگرام | وبینار رایگان با رازی لیدی‌باس"
        description="در این وبینار رایگان یاد می‌گیرید چطور از ۶ اشتباه بزرگ اینستاگرام دوری کنید و کسب‌وکارتان را رشد دهید."
        locale="fa_IR"
      />
      <div
        dir="rtl"
        lang="fa"
        className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-amber-50 font-farsi"
      >
        <main className="mx-auto w-full max-w-md px-4 pb-16 pt-6">
          <div className="overflow-hidden rounded-3xl shadow-lg">
            <img
              src={heroAsset.url}
              alt="۶ تله اینستاگرام"
              className="h-auto w-full object-cover"
            />
          </div>

          <section className="mt-6 space-y-3 text-center">
            <h1 className="text-2xl font-bold leading-tight text-neutral-900">
              وبینار رایگان: ۶ تله بزرگ اینستاگرام
            </h1>
            <p className="text-xs font-semibold text-rose-600">
              این وبینار مخصوص صاحبان کسب‌وکار در آمریکا و کانادا است
            </p>
            <p className="text-sm leading-6 text-neutral-700">
              اگر کسب‌وکار داری و از اینستاگرام نتیجه دلخواه نمی‌گیری، این وبینار
              برای توست. علی لطفی ۶ اشتباهی که مانع رشد فروش می‌شود را
              مرحله‌به‌مرحله بررسی می‌کند.
            </p>
            {laLabel && (
              <div className="mx-auto flex flex-col items-center gap-2">
                <div dir="ltr" className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
                  📅 {laLabel}
                </div>
                {localLabel && (
                  <div dir="ltr" className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-base font-bold text-neutral-900">
                    🕒 Your time: {localLabel}
                  </div>
                )}
              </div>
            )}
          </section>

          <form
            onSubmit={handleSubmit}
            dir="ltr"
            className="mt-8 space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm text-left"
          >
            <h2 className="text-center text-lg font-semibold text-neutral-900">
              Free Registration
            </h2>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-800">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                className="min-h-[48px] w-full rounded-xl border border-neutral-300 bg-white px-4 text-base text-neutral-900 outline-none focus:border-rose-500"
                placeholder="e.g. Sara Ahmadi"
                dir="ltr"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-rose-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-800">
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                maxLength={100}
                className="min-h-[48px] w-full rounded-xl border border-neutral-300 bg-white px-4 text-base text-neutral-900 outline-none focus:border-rose-500"
                placeholder="e.g. Los Angeles"
                dir="ltr"
              />
              {errors.city && (
                <p className="mt-1 text-xs text-rose-600">{errors.city}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-800">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                className="min-h-[48px] w-full rounded-xl border border-neutral-300 bg-white px-4 text-base text-neutral-900 outline-none focus:border-rose-500"
                placeholder="you@example.com"
                dir="ltr"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-rose-600">{errors.email}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="min-h-[52px] w-full rounded-xl bg-gradient-to-l from-rose-500 to-amber-500 text-base font-bold text-white shadow-md transition active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? "Registering..." : "Register Free"}
            </button>

            <p className="text-center text-[11px] leading-5 text-neutral-500">
              By registering, the webinar link and reminders will be sent to your email.
            </p>
            <p className="text-center text-[11px] leading-5 text-neutral-500" dir="ltr">
              Sender: <strong>onboarding@resend.dev</strong> (Ali Lotfi - Ladyboss Academy). Please check your spam folder.
            </p>
          </form>
        </main>
      </div>
    </>
  );
}