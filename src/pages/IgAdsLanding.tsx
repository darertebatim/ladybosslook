import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resolveWebinarRound, listActiveWebinarRounds, getWebinarRoundRouting, inferWebinarSideFromTimezone, type WebinarRoundRow } from "@/lib/webinarRounds";

import { z } from "zod";
import { ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";
import { formatLADateTime, formatLocalDateTime } from "@/lib/sixtrapsCalendar";
import { trackWebinarLead } from "@/lib/metaCapi";
import { isIranTimezone, getDeviceTimezone } from "@/lib/regionRestrictions";
import { useWaitlistLeadCampaigns, useSlotChoiceLeadCampaigns } from "@/hooks/useLeadCampaignStatus";
import WebinarWaitlistBox from "@/components/WebinarWaitlistBox";

const ROUND_ASSIGNMENT_STORAGE_KEY = "igadsfree_round_assignment";

const PROGRAM_SLUG = "igadsfree";

const schema = z.object({
  name: z.string().trim().min(2, "نام را کامل وارد کنید").max(100),
  city: z.string().trim().min(2, "شهر را وارد کنید").max(100),
  email: z.string().trim().email("ایمیل معتبر نیست").max(255),
});

const fa = (n: number) => String(n).padStart(2, "0").replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

function WebinarCountdown({ startUtc }: { startUtc: Date }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = startUtc.getTime() - now;
  if (diff <= 0) {
    return (
      <p className="text-xs font-bold text-rose-600">وبینار شروع شده است!</p>
    );
  }

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  const items = [
    { v: days, l: "روز" },
    { v: hours, l: "ساعت" },
    { v: minutes, l: "دقیقه" },
    { v: seconds, l: "ثانیه" },
  ];

  return (
    <div className="mx-auto max-w-xs">
      <div dir="ltr" className="flex items-center justify-center gap-2">
        <ArrowDown className="h-5 w-5 animate-bounce text-rose-500" />
        {items.map((it) => (
          <div
            key={it.l}
            className="min-w-[58px] rounded-2xl bg-white px-2 py-2 shadow-sm ring-1 ring-rose-100"
          >
            <div className="text-xl font-extrabold tabular-nums text-rose-600">{fa(it.v)}</div>
            <div className="text-[10px] font-semibold text-neutral-500">{it.l}</div>
          </div>
        ))}
        <ArrowDown className="h-5 w-5 animate-bounce text-rose-500" />
      </div>
    </div>
  );
}

function laTimeLabel(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

function localTimeLabels(d: Date): { date: string; time: string } {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const city = tz.includes("/") ? tz.split("/").pop()!.replace(/_/g, " ") : tz;
    const zonePrefix: Record<string, string> = {
      "America/Los_Angeles": "Pacific",
      "America/Vancouver": "Pacific",
      "America/New_York": "Eastern",
      "America/Toronto": "Eastern",
      "America/Chicago": "Central",
      "America/Denver": "Mountain",
    };
    const date = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(d);
    const time = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(d);
    const location = [zonePrefix[tz], city].filter(Boolean).join(" / ");
    return { date, time: `${time}${location ? ` (${location} Time)` : ""}` };
  } catch {
    return { date: "", time: "" };
  }
}

/** Small "starts in" countdown shown under each session option. */
function MiniCountdown({ startUtc }: { startUtc: Date }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = startUtc.getTime() - now;
  if (diff <= 0) {
    return <p dir="rtl" className="mt-2 text-[11px] font-bold text-rose-600">این جلسه شروع شده است</p>;
  }

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  const clock = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    .replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);

  return (
    <div dir="ltr" className="mt-2 flex flex-wrap items-center justify-start gap-1 text-left text-[11px] font-bold text-rose-600">
      <span aria-hidden="true">⏳</span>
      <span dir="rtl">تا شروع:</span>
      {days > 0 && <span dir="rtl">{fa(days)} روز و</span>}
      <span dir="ltr" className="tabular-nums">{clock}</span>
    </div>
  );
}

/** English "registration closes in" countdown shown inside the form box. */
function FormCountdown({ startUtc }: { startUtc: Date }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = startUtc.getTime() - now;
  if (diff <= 0) {
    return <span className="font-bold text-rose-600">Registration is closing</span>;
  }

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  const clock = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <span dir="ltr" className="tabular-nums">
      {days > 0 ? `${days}d ` : ""}
      {clock}
    </span>
  );
}

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
  const formRef = useRef<HTMLFormElement | null>(null);
  const [roundId, setRoundId] = useState<string | null>(null);
  const [needsRoundChoice, setNeedsRoundChoice] = useState(false);
  const [roundOptions, setRoundOptions] = useState<WebinarRoundRow[]>([]);
  const [noUpcomingWebinar, setNoUpcomingWebinar] = useState(false);
  const { waitlist } = useWaitlistLeadCampaigns();
  const waitlistMode = waitlist.includes("igads") || noUpcomingWebinar;
  const { slotChoice, isLoading: slotLoading } = useSlotChoiceLeadCampaigns();
  const letUserPick = slotChoice.includes("igads");

  // Recommend the session that fits the visitor's timezone side
  // (East = earlier UTC start, West = later UTC start).
  const recommendedRoundId = useMemo(() => {
    if (roundOptions.length < 2) return null;
    const side = inferWebinarSideFromTimezone(getDeviceTimezone());
    if (!side || side === "europe") return null;
    const sorted = [...roundOptions]
      .filter((r) => r.first_session_date)
      .sort((a, b) => new Date(a.first_session_date!).getTime() - new Date(b.first_session_date!).getTime());
    if (!sorted.length) return null;
    return side === "east" ? sorted[0].id : sorted[sorted.length - 1].id;
  }, [roundOptions]);

  useEffect(() => {
    if (slotLoading) return;
    (async () => {
      // Slot-choice mode: visitors pick their own session (timezone routing stays
      // available, it's just bypassed while this mode is on).
      if (letUserPick && !roundParam) {
        const { data: progA } = await (supabase as any)
          .from("program_catalog")
          .select("title, cover_image_url")
          .eq("slug", PROGRAM_SLUG)
          .maybeSingle();
        if (progA?.title) setProgramTitle(progA.title);
        if (progA?.cover_image_url) setCover(progA.cover_image_url);

        const upcoming = (await listActiveWebinarRounds(PROGRAM_SLUG)).filter(
          (r) => r.first_session_date && new Date(r.first_session_date).getTime() > Date.now(),
        );
        if (upcoming.length) {
          setRoundOptions(upcoming);
          setNeedsRoundChoice(true);
        } else {
          setNoUpcomingWebinar(true);
        }
        return;
      }

      // 1. Pinned ?round= param always wins.
      // 2. Otherwise restore a previously saved assignment — but only if it
      //    still matches the current East/West routing, so admin routing
      //    changes always reach returning visitors.
      let effectiveRoundParam = roundParam;
      if (!effectiveRoundParam) {
        try {
          const saved = localStorage.getItem(ROUND_ASSIGNMENT_STORAGE_KEY);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.roundNumber) {
              const routing = await getWebinarRoundRouting(PROGRAM_SLUG);
              const current = [
                routing?.east_round_number,
                routing?.west_round_number,
                routing?.europe_round_number,
              ].filter((n) => n !== null && n !== undefined);
              if (current.includes(Number(parsed.roundNumber))) {
                effectiveRoundParam = String(parsed.roundNumber);
              } else {
                localStorage.removeItem(ROUND_ASSIGNMENT_STORAGE_KEY);
              }
            }
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

      const isUpcoming =
        !!round?.first_session_date &&
        new Date(round.first_session_date).getTime() > Date.now();

      if (isUpcoming) {
        setWebinar({
          title: prog?.title || programTitle,
          startUtc: new Date(round!.first_session_date!),
          durationMinutes: round!.first_session_duration || 120,
          meetUrl: round!.google_meet_link || "",
        });
      } else {
        // No upcoming session for this visitor — offer the other active rounds,
        // and fall back to the waitlist when nothing is scheduled at all.
        const rounds = (await listActiveWebinarRounds(PROGRAM_SLUG)).filter(
          (r) => r.first_session_date && new Date(r.first_session_date).getTime() > Date.now(),
        ).sort((a, b) => new Date(a.first_session_date!).getTime() - new Date(b.first_session_date!).getTime());
        if (rounds.length && !effectiveRoundParam) {
          setRoundOptions(rounds);
          setNeedsRoundChoice(true);
        } else if (!rounds.length) {
          setNoUpcomingWebinar(true);
        }
      }
    })();
  }, [roundParam, letUserPick, slotLoading]);


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
    // Scroll down to the registration form once it mounts
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
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
          JSON.stringify({
            email: parsed.data.email.toLowerCase(),
            roundId,
            name: parsed.data.name,
            city: parsed.data.city,
          }),
        );
      } catch {}

      navigate(`/l/igadsfree/thankyou${roundId ? `?round=${roundId}` : ""}`, {
        state: {
          igAdsRegistrationCompleted: true,
          email: parsed.data.email.toLowerCase(),
          roundId,
          name: parsed.data.name,
          city: parsed.data.city,
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
            ) : waitlistMode ? null : needsRoundChoice ? (
              <div className="mx-auto rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex justify-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-100 bg-rose-50 px-3 py-1 text-[11px] font-bold text-rose-600">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                    </span>
                    آخرین فرصت ثبت‌نام رایگان
                  </span>
                </div>
                <p className="text-center text-base font-bold text-neutral-900">زمان وبینار را انتخاب کنید</p>
                <div className="mt-3 rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 px-3 py-2.5">
                  <p className="text-center text-xs font-medium leading-6 text-neutral-700">
                    فقط <span className="font-bold text-orange-600">۲ سانس زنده</span> برای این جمعه باقی‌مانده است.
                  </p>
                  <p className="mt-0.5 text-center text-[11px] leading-5 text-neutral-500">
                    {letUserPick
                      ? "لینک همان جلسه بلافاصله برایتان ایمیل می‌شود."
                      : "منطقه زمانی دستگاه شما شناسایی نشد. لطفاً جلسه‌ای که برایتان مناسب‌تر است را انتخاب کنید."}
                  </p>
                </div>
                <div className="mt-4 space-y-3">
                  {roundOptions.map((r, idx) => {
                    const sessionLabel = idx === 0 ? "سانس اول" : "سانس دوم";
                    return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => selectRound(r)}
                      className="w-full rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-right active:bg-neutral-100"
                    >
                      {r.first_session_date && (
                        <div dir="ltr" className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-left">
                          <span className="font-semibold text-neutral-900" dir="rtl">
                            {sessionLabel}
                          </span>
                          <span className="text-sm text-neutral-600">
                            LA: {laTimeLabel(new Date(r.first_session_date))} PT
                          </span>
                        </div>
                      )}
                      {r.first_session_date && (
                        <div dir="ltr" className="mt-3 text-left text-base font-bold leading-6 text-emerald-700">
                          <div className="whitespace-nowrap">🕒 {localTimeLabels(new Date(r.first_session_date)).date}</div>
                          <div>{localTimeLabels(new Date(r.first_session_date)).time}</div>
                        </div>
                      )}
                      {r.first_session_date && (
                        <MiniCountdown startUtc={new Date(r.first_session_date)} />
                      )}
                      {recommendedRoundId === r.id && (
                        <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
                          پیشنهاد ما برای منطقه شما
                        </span>
                      )}
                    </button>
                    );
                  })}
                </div>
              </div>
            ) : laLabel && (
              <div className="mx-auto flex flex-col items-center gap-2">
                <div dir="ltr" className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-sm font-medium text-white">
                  📅 LA time: {laLabel}
                </div>
                {webinar && <WebinarCountdown startUtc={webinar.startUtc} />}
                {localLabel && (
                  <div dir="ltr" className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2.5 text-center text-base font-bold text-white shadow-sm whitespace-pre-line">
                    🕒 Your Local time: {localLabel}
                  </div>
                )}
                {letUserPick && roundOptions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setNeedsRoundChoice(true)}
                    className="text-xs font-semibold text-neutral-600 underline underline-offset-4"
                  >
                    تغییر زمان جلسه
                  </button>
                )}
                <div className="flex flex-col items-center gap-1 pt-1 text-sm font-semibold text-emerald-700">
                  <span>برای دریافت لینک وبینار، فرم زیر را پر کنید</span>
                  <span dir="ltr" className="text-xs font-medium text-emerald-600">Fill out the form below to receive the webinar link</span>
                  <ArrowDown className="h-5 w-5 animate-bounce" />
                </div>
              </div>
            )}
          </section>

          {!blockedRegion && waitlistMode && (
            <WebinarWaitlistBox source="igads_waitlist" />
          )}

          {!blockedRegion && !waitlistMode && !needsRoundChoice && (
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            dir="ltr"
            className="mt-8 space-y-4 scroll-mt-4 rounded-2xl border-2 border-rose-200 bg-white p-5 shadow-sm text-left"
          >
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-[11px] font-bold text-rose-600">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
                </span>
                🔥 Free seats are limited
              </span>
            </div>
            <h2 className="text-center text-lg font-semibold text-neutral-900">
              🎁 Free Registration 🎁
            </h2>
            {webinar && (
              <p className="text-center text-xs font-semibold text-neutral-600">
                ⏳ Registration closes in <FormCountdown startUtc={webinar.startUtc} />
              </p>
            )}

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

            <p className="text-center text-[11px] font-semibold leading-5 text-rose-600">
              🔒 Seats are limited — this is the last free live session. No recording will be shared.
            </p>

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
