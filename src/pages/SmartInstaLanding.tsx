import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";
import { formatLADateTime, formatLocalDateTime } from "@/lib/sixtrapsCalendar";
import { trackLead } from "@/lib/metaPixel";

const PROGRAM_SLUG = "smartinstagramframework";

const schema = z.object({
  email: z.string().trim().email("ایمیل معتبر نیست").max(255),
});

export default function SmartInstaLanding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [webinar, setWebinar] = useState<{
    title: string;
    startUtc: Date;
    durationMinutes: number;
    meetUrl: string;
    coverUrl: string;
  } | null>(null);
  const [roundId, setRoundId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: autoRule } = await (supabase as any)
        .from("program_auto_enrollment")
        .select("round_id")
        .eq("program_slug", PROGRAM_SLUG)
        .maybeSingle();

      const effectiveRoundId = autoRule?.round_id || null;
      setRoundId(effectiveRoundId);

      const roundQuery = (supabase as any)
        .from("program_rounds")
        .select("id, first_session_date, first_session_duration, google_meet_link");

      const { data: round } = effectiveRoundId
        ? await roundQuery.eq("id", effectiveRoundId).maybeSingle()
        : await roundQuery
            .eq("program_slug", PROGRAM_SLUG)
            .eq("status", "active")
            .order("first_session_date", { ascending: true })
            .limit(1)
            .maybeSingle();

      const { data: prog } = await (supabase as any)
        .from("program_catalog")
        .select("title, cover_image_url")
        .eq("slug", PROGRAM_SLUG)
        .maybeSingle();

      if (round?.first_session_date) {
        setWebinar({
          title: prog?.title || "وبینار فریم‌ورک اینستاگرام هوشمند",
          startUtc: new Date(round.first_session_date),
          durationMinutes: round.first_session_duration || 90,
          meetUrl: round.google_meet_link || "",
          coverUrl: prog?.cover_image_url || "",
        });
        if (!effectiveRoundId && round.id) setRoundId(round.id);
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
    const parsed = schema.safeParse({ email });
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
        name: "",
        email: parsed.data.email.toLowerCase(),
        city: "",
        phone: "",
        source: "smartinsta_registration",
      });
      if (error) throw error;

      trackLead({
        content_name: "Smart Instagram Framework Registration",
        content_category: "webinar",
      });

      supabase.functions
        .invoke("send-smartinsta-confirmation", {
          body: {
            name: "",
            email: parsed.data.email.toLowerCase(),
          },
        })
        .catch((err) => console.error("confirmation email error", err));

      navigate("/thankyousmartinstaframework", {
        state: {
          smartInstaRegistrationCompleted: true,
          email: parsed.data.email.toLowerCase(),
          roundId,
        },
      });
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
        title="فریم‌ورک اینستاگرام هوشمند | وبینار رایگان"
        description="در این وبینار رایگان، فریم‌ورک اینستاگرام هوشمند را یاد بگیرید و از اینستاگرام برای کسب‌وکارتان فروش بسازید."
        locale="fa_IR"
      />
      <div
        dir="rtl"
        lang="fa"
        className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-amber-50 font-farsi"
      >
        <main className="mx-auto w-full max-w-md px-4 pb-16 pt-6">
          {webinar?.coverUrl && (
            <div className="overflow-hidden rounded-3xl shadow-lg">
              <img
                src={webinar.coverUrl}
                alt="وبینار فریم‌ورک اینستاگرام هوشمند"
                className="h-auto w-full object-cover"
              />
            </div>
          )}

          <section className="mt-6 space-y-3 text-center">
            <h1 className="text-2xl font-bold leading-tight text-neutral-900">
              وبینار رایگان: فریم‌ورک اینستاگرام هوشمند
            </h1>
            <p className="text-xs font-semibold text-rose-600">
              این وبینار مخصوص صاحبان کسب‌وکار در آمریکا و کانادا است
            </p>
            <p className="text-sm leading-6 text-neutral-700">
              هدیه به حاضرین وبینار ۶ تله
            </p>
            {laLabel && (
              <div className="mx-auto flex flex-col items-center gap-2">
                <div dir="ltr" className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
                  📅 LA time: {laLabel}
                </div>
                {localLabel && (
                  <div dir="ltr" className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2.5 text-center text-base font-bold text-white shadow-sm whitespace-pre-line">
                    🕒 Your Local time: {localLabel}
                  </div>
                )}
                <div className="flex flex-col items-center gap-1 pt-1 text-sm font-semibold text-emerald-700">
                  <span>برای دریافت لینک وبینار، فرم زیر را پر کنید</span>
                  <span dir="ltr" className="text-xs font-medium text-emerald-600">Fill out the form below to receive the webinar link</span>
                  <ArrowDown className="h-5 w-5 animate-bounce" />
                </div>
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

            <div className="flex items-center gap-3">
              <label className="shrink-0 text-sm font-medium text-neutral-800">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                className="min-h-[48px] w-full rounded-xl border border-neutral-300 bg-white px-4 text-base text-neutral-900 outline-none focus:border-violet-500"
                placeholder="you@example.com"
                dir="ltr"
              />
            </div>
            {errors.email && <p className="-mt-2 text-xs text-rose-600">{errors.email}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="min-h-[52px] w-full rounded-xl bg-gradient-to-l from-violet-600 to-fuchsia-500 text-base font-bold text-white shadow-md transition active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? "Registering..." : "Register Free"}
            </button>

            <p className="text-center text-[11px] leading-5 text-neutral-500">
              By registering, the webinar link and reminders will be sent to your email.
            </p>
            <p className="text-center text-[11px] leading-5 text-neutral-500" dir="ltr">
              Sender: <strong>hi@ladybosslook.com</strong> (Ali Lotfi - Ladyboss Academy). Please check your spam folder.
            </p>
          </form>
        </main>
      </div>
    </>
  );
}
