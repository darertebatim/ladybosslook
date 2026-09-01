import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resolveWebinarRound, listActiveWebinarRounds, type WebinarRoundRow } from "@/lib/webinarRounds";

import { z } from "zod";
import { ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";
import { formatLADateTime, formatLocalDateTime } from "@/lib/sixtrapsCalendar";
import { trackWebinarLead } from "@/lib/metaCapi";
import { isIranTimezone, getDeviceTimezone } from "@/lib/regionRestrictions";

const ROUND_ASSIGNMENT_STORAGE_KEY = "igadsfree_round_assignment";

const PROGRAM_SLUG = "igadsfree";

const schema = z.object({
  name: z.string().trim().min(2, "نام را کامل وارد کنید").max(100),
  city: z.string().trim().min(2, "شهر را وارد کنید").max(100),
  email: z.string().trim().email("ایمیل معتبر نیست").max(255),
});

export default function IgAdsLanding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roundParam = searchParams.get("round");

  const { toast } = useToast();
  const blockedRegion = useMemo(() => isIranTimezone(), []);
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [cover, setCover] = useState<string>("");
  const [programTitle, setProgramTitle] = useState<string>("وبینار جذب مشتری با اینستاگرام ادز");
  const [webinar, setWebinar] = useState<{
    title: string;
    startUtc: Date;
    durationMinutes: number;
    meetUrl: string;
  } | null>(null);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [needsRoundChoice, setNeedsRoundChoice] = useState(false);
  const [roundOptions, setRoundOptions] = useState<WebinarRoundRow[]>([]);

  useEffect(() => {
    (async () => {
      // 1. Pinned ?round= param always wins.
      // 2. Otherwise restore a previously saved assignment.
      let effectiveRoundParam = roundParam;
      if (!effectiveRoundParam) {
        try {
          const saved = localStorage.getItem(ROUND_ASSIGNMENT_STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.roundNumber) effectiveRoundParam = String(parsed.roundNumber);
          }
        } catch {}
      }

      // 3. If still no pinned round, use device timezone to auto-assign.
      const timezone = !effectiveRoundParam ? getDeviceTimezone() : null;
      const round = await resolveWebinarRound(PROGRAM_SLUG, effectiveRoundParam, timezone);

      if (round?.id) {
        setRoundId(round.id);
        setNeedsRoundChoice(false);
      }

      const { data: prog } = await (supabase as any)
        .from("program_catalog")
        .select("title, cover_image_url")
        .eq("slug", PROGRAM_SLUG)
        .maybeSingle();

      if (prog?.title) setProgramTitle(prog.title);
      if (prog?.cover_image_url) setCover(prog.cover_image_url);

      if (round?.first_session_date) {
        setWebinar({
          title: prog?.title || programTitle,
          startUtc: new Date(round.first_session_date),
          durationMinutes: round.first_session_duration || 120,
          meetUrl: round.google_meet_link || "",
        });
      } else if (!effectiveRoundParam && !round) {
        // Unmatched/unknown timezone — let the visitor pick.
        const rounds = await listActiveWebinarRounds(PROGRAM_SLUG);
        if (rounds.length) {
          setRoundOptions(rounds);
          setNeedsRoundChoice(true);
        }
      }
    })();
  }, [roundParam]);


  const laLabel = useMemo(
    () => (webinar ? formatLADateTime(webinar.startUtc) : ""),
    [webinar],
  );
  const localLabel = useMemo(
    () => (webinar ? formatLocalDateTime(webinar.startUtc) : ""),
    [webinar],
  );

  function selectRound(round: WebinarRoundRow) {
    if (!round.id) return;
    if (round.round_number) {
      try {
        localStorage.setItem(
          ROUND_ASSIGNMENT_STORAGE_KEY,
          JSON.stringify({ roundNumber: round.round_number, assignedAt: Date.now() }),
        );
      } catch {}
    }
    setNeedsRoundChoice(false);
    setRoundId(round.id);
    setWebinar({
      title: programTitle,
      startUtc: new Date(round.first_session_date!),
      durationMinutes: round.first_session_duration || 120,
      meetUrl: round.google_meet_link || "",
    });
  }

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
        source: "igads_registration",
        round_id: roundId,
      });
      if (error) throw error;

      trackWebinarLead({
        customEvent: "IGAdsFreeLead",
        contentName: "Instagram Ads Webinar Registration",
        email: parsed.data.email.toLowerCase(),
        name: parsed.data.name,
      });

      supabase.functions
        .invoke("send-sixtraps-confirmation", {
          body: {
            name: parsed.data.name,
            email: parsed.data.email.toLowerCase(),
            programSlug: PROGRAM_SLUG,
            prereqUrl: "https://ladybosslook.com/l/igadsfree/thankyou",
            sources: ["igads_registration", "preigads_interest"],
            ...(roundId ? { roundId } : {}),
          },
        })
        .catch((err) => console.error("confirmation email error", err));

      try {
        localStorage.setItem(
          "igads_registration",
          JSON.stringify({ email: parsed.data.email.toLowerCase(), roundId }),
        );
      } catch {}

      navigate(`/l/igadsfree/thankyou${roundId ? `?round=${roundId}` : ""}`, {
        state: {
          igAdsRegistrationCompleted: true,
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
        title="وبینار رایگان جذب مشتری با اینستاگرام ادز"
        description="در این وبینار رایگان یاد می‌گیرید چطور با تبلیغات اینستاگرام (Instagram Ads) مشتری واقعی جذب کنید."
        locale="fa_IR"
      />
      <div
        dir="rtl"
        lang="fa"
        className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-amber-50 font-farsi"
      >
        <main className="mx-auto w-full max-w-md px-4 pb-16 pt-6">
          {cover && (
            <div className="overflow-hidden rounded-3xl shadow-lg">
              <img
                src={cover}
                alt="وبینار جذب مشتری با اینستاگرام ادز"
                className="h-auto w-full object-cover"
              />
            </div>
          )}

          <section className="mt-6 space-y-3 text-center">
            <h1 className="text-2xl font-bold leading-tight text-neutral-900">
              🎁وبینار رایگان: جذب مشتری
              با اینستاگرام ادز
            </h1>
            <p className="text-xs font-semibold text-rose-600">
              این وبینار مخصوص صاحبان بیزینس در آمریکا و کانادا است
            </p>
            {blockedRegion ? (
              <div className="mx-auto rounded-2xl border border-rose-200 bg-rose-50 p-4">
                <p className="text-sm font-bold leading-7 text-rose-700">
                  متأسفیم، این وبینار برای منطقه شما در دسترس نیست.
                </p>
                <p className="mt-1 text-xs leading-6 text-rose-600">
                  (کلاس زنده ساعت ۳ بامداد به وقت شما برگزار می‌شود)
                </p>
                <p dir="ltr" className="mt-2 text-[11px] leading-5 text-rose-500">
                  We're sorry, this webinar is not available for your region (the live class would be at 3 AM in your area).
                </p>
              </div>
            ) : needsRoundChoice ? (
              <div className="mx-auto rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-bold text-neutral-900">انتخاب زمان وبینار</p>
                <p className="mt-1 text-xs leading-5 text-neutral-600">
                  منطقه زمانی دستگاه شما شناسایی نشد. لطفاً جلسه‌ای که برایتان مناسب‌تر است را انتخاب کنید.
                </p>
                <div className="mt-4 space-y-3">
                  {roundOptions.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => selectRound(r)}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-right active:bg-neutral-100"
                    >
                      <div className="font-semibold text-neutral-900">
                        {r.round_name || `Round ${r.round_number}`}
                      </div>
                      {r.first_session_date && (
                        <div className="mt-1 text-sm text-neutral-600" dir="ltr">
                          {formatLADateTime(new Date(r.first_session_date))}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : laLabel && (
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

          {!blockedRegion && !needsRoundChoice && (
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
              Sender: <strong>hi@ladybosslook.com</strong> (Ali Lotfi - Ladyboss Academy). Please check your spam folder.
            </p>
          </form>
          )}
        </main>
      </div>
    </>
  );
}
