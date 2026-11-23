import { TrackedIframe } from "@/components/TrackedIframe";
import { trackCalendarClick } from "@/lib/trackCalendarClick";
import { useEffect, useMemo, useState } from "react";
import { ArrowDown, CalendarPlus, Check, MessageCircle, Play } from "lucide-react";
import { useLocation, useSearchParams } from "react-router-dom";
import { resolveWebinarRound } from "@/lib/webinarRounds";

import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { trackCompleteRegistration } from "@/lib/metaPixel";
import WebinarAddEmailBox from "@/components/WebinarAddEmailBox";
import type { DedicatedWebinar } from "@/lib/dedicatedWebinars";
import { youtubeId } from "@/pages/StartAdsLanding";
import { buildWebinarSupportMessage, buildWebinarThankYouUrl } from "@/lib/webinarSupportMessage";
import {
  buildGoogleCalendarUrl,
  downloadIcs,
  formatLADateTime,
  formatLocalDateTime,
  formatCompactLocalDateTime,
  formatTimeZoneTime,
  COMMON_TIMEZONES,
  type WebinarEvent,
} from "@/lib/sixtrapsCalendar";

const PROGRAM_SLUG = "igadsfree";

function CountdownToWebinar({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculate = () => {
      const diff = +targetDate - +new Date();
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };
    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <section className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 shadow-sm">
      <div className="flex items-center justify-center gap-3" dir="rtl">
        <p className="text-xs font-bold text-emerald-700">تا شروع وبینار</p>
        <div className="inline-flex items-center justify-center gap-1 text-emerald-900" dir="ltr">
          <span className="flex min-w-[40px] flex-col items-center rounded-md bg-white px-1.5 py-0.5 text-sm font-black shadow-sm leading-tight">
            {pad(timeLeft.days)}
            <span className="text-[9px] font-medium text-emerald-600 leading-tight">روز</span>
          </span>
          <span className="text-emerald-400">:</span>
          <span className="flex min-w-[40px] flex-col items-center rounded-md bg-white px-1.5 py-0.5 text-sm font-black shadow-sm leading-tight">
            {pad(timeLeft.hours)}
            <span className="text-[9px] font-medium text-emerald-600 leading-tight">ساعت</span>
          </span>
          <span className="text-emerald-400">:</span>
          <span className="flex min-w-[40px] flex-col items-center rounded-md bg-white px-1.5 py-0.5 text-sm font-black shadow-sm leading-tight">
            {pad(timeLeft.minutes)}
            <span className="text-[9px] font-medium text-emerald-600 leading-tight">دقیقه</span>
          </span>
          <span className="text-emerald-400">:</span>
          <span className="flex min-w-[40px] flex-col items-center rounded-md bg-white px-1.5 py-0.5 text-sm font-black shadow-sm leading-tight">
            {pad(timeLeft.seconds)}
            <span className="text-[9px] font-medium text-emerald-600 leading-tight">ثانیه</span>
          </span>
        </div>
      </div>
    </section>
  );
}

// Thank-you video is a fixed campaign video (pOxk1JnTtxs) shared by
// /l/igadsfree/thankyou and /l/aliagads/thankyou — not round-specific.
export const THANKYOU_VIDEO_ID = "pOxk1JnTtxs";

export default function ThankYouIgAds({ campaign }: { campaign?: DedicatedWebinar } = {}) {
  const slug = campaign?.slug ?? PROGRAM_SLUG;
  const regSourceKey = campaign?.regSource ?? "igads_registration";
  const defaultTitle = campaign?.defaultTitle ?? "وبینار جذب مشتری با اینستاگرام ادز";
  const dc = campaign?.igadsClone ? undefined : campaign;
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const roundParam = searchParams.get("round");

  const stored = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(regSourceKey) || "null") as
        | { email?: string; roundId?: string; name?: string; city?: string }
        | null;
    } catch {
      return null;
    }
  }, []);
  const registeredEmail = ((location.state as any)?.email || searchParams.get("email") || stored?.email) as string | undefined;
  const registeredRoundId = ((location.state as any)?.roundId || stored?.roundId) as string | undefined;
  // Video watch tracking reads "lead_email"; keep it in sync so plays are tied to this registrant.
  useEffect(() => {
    if (registeredEmail && registeredEmail.includes("@")) {
      try { localStorage.setItem("lead_email", registeredEmail.trim().toLowerCase()); } catch { /* ignore */ }
    }
  }, [registeredEmail]);
  const [fallbackDetails, setFallbackDetails] = useState<{ name?: string; city?: string }>({});
  const registeredName = (((location.state as any)?.name || stored?.name || fallbackDetails.name) as string | undefined);
  const registeredCity = (((location.state as any)?.city || stored?.city || fallbackDetails.city) as string | undefined);
  const [videoId, setVideoId] = useState("");
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [webinar, setWebinar] = useState<{
    title: string;
    startUtc: Date;
    durationMinutes: number;
    meetUrl: string;
    supportUrl: string;
    roundId: string;
    roundNumber: number | null;
    roundName: string | null;
  } | null>(null);

  useEffect(() => {
    if (!(location.state as any)?.igAdsRegistrationCompleted) return;

    const timer = window.setTimeout(() => {
      trackCompleteRegistration({
        content_name: campaign?.metaContentName ?? "Instagram Ads Webinar Registration",
        content_category: "webinar",
        status: true,
        value: 0,
        currency: "USD",
      });
      window.history.replaceState({}, document.title, window.location.href);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [location.state]);

  // If name/city weren't carried over (old registration, cleared storage),
  // look them up by email so the support message can still include them.
  useEffect(() => {
    const hasName = (location.state as any)?.name || stored?.name;
    const hasCity = (location.state as any)?.city || stored?.city;
    if (!registeredEmail || (hasName && hasCity)) return;
    supabase.functions
      .invoke("lookup-webinar-registration", {
        body: { email: registeredEmail, source: regSourceKey },
      })
      .then(({ data }) => {
        if (data?.found) setFallbackDetails({ name: data.name, city: data.city });
      })
      .catch((e) => console.error("registration lookup failed", e));
  }, [registeredEmail, location.state, stored]);

  useEffect(() => {
    (async () => {
      const round = await resolveWebinarRound(slug, roundParam || registeredRoundId);
      const { data: prog } = await (supabase as any)
        .from("program_catalog")
        .select("title")
        .eq("slug", slug)
        .maybeSingle();

      // Campaign-level override wins; dedicated campaigns otherwise use the
      // thank-you video set on the round; the IG Ads pages keep their fixed video.
      setVideoId(campaign?.thankYouVideoId ?? (dc ? youtubeId(round?.video_url) ?? "" : THANKYOU_VIDEO_ID));

      if (round?.first_session_date) {
        setWebinar({
          title: prog?.title || defaultTitle,
          startUtc: new Date(round.first_session_date),
          durationMinutes: round.first_session_duration || 120,
          meetUrl: round.google_meet_link || "",
          supportUrl: campaign?.whatsappNumber
            ? `https://wa.me/${campaign.whatsappNumber}`
            : "https://ladybosslook.com/dashboard/chat",
          roundId: round.id,
          roundNumber: round.round_number,
          roundName: round.round_name,
        });
      }
    })();
  }, [roundParam, registeredRoundId]);


  const event: WebinarEvent | null = useMemo(() => {
    if (!webinar) return null;
    return {
      title: webinar.title,
      description: `لینک ورود:\n${webinar.meetUrl}\n\nپشتیبانی:\n${webinar.supportUrl}`,
      startUtc: webinar.startUtc,
      durationMinutes: webinar.durationMinutes,
      location: webinar.meetUrl,
    };
  }, [webinar]);

  const laDate = webinar ? formatLADateTime(webinar.startUtc) : "";
  const localDate = webinar ? formatLocalDateTime(webinar.startUtc) : "";
  const compactLocalDate = webinar ? formatCompactLocalDateTime(webinar.startUtc) : "";
  const supportThankYouUrl = buildWebinarThankYouUrl(
    campaign?.basePath ?? "/l/igadsfree",
    webinar?.roundId || roundParam || registeredRoundId,
    registeredEmail,
  );
  const reserveLiveGifts = campaign?.slug === "igfreewebinar";
  const whatsAppMessage = buildWebinarSupportMessage({
    title: defaultTitle,
    name: registeredName,
    email: registeredEmail,
    roundNumber: webinar?.roundNumber,
    roundName: webinar?.roundName,
    localDateTime: compactLocalDate,
    losAngelesDateTime: laDate,
    meetUrl: webinar?.meetUrl,
    thankYouUrl: supportThankYouUrl,
    reserveLiveGifts,
  });

  return (
    <>
      <SEOHead
        title={campaign ? `ثبت‌نام شما ثبت شد | ${defaultTitle}` : "ثبت‌نام شما ثبت شد | وبینار اینستاگرام ادز"}
        description={campaign ? `ثبت‌نام شما در ${defaultTitle} با موفقیت ثبت شد.` : "ثبت‌نام شما در وبینار رایگان جذب مشتری با اینستاگرام ادز با موفقیت ثبت شد."}
        locale="fa_IR"
      />
      <div
        dir="rtl"
        lang="fa"
        className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-amber-50 font-farsi"
      >
        <main className="mx-auto w-full max-w-md px-4 pb-10 pt-4">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
              <Check className="h-7 w-7" strokeWidth={3} />
            </div>
            <h1 className="text-xl font-bold leading-8 text-neutral-900">
              ایمیل شما ثبت شد
              <span className="mt-1 block text-lg font-black leading-7 text-rose-600">
                اما هنوز ۳ قدم دیگر مانده تا جای شما قطعی بشود
              </span>
            </h1>
            <div className="mt-2 flex justify-center" aria-hidden="true">
              <ArrowDown className="h-7 w-7 animate-bounce text-rose-600" strokeWidth={3} />
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4">
            {videoId && (
              <section className="order-1 rounded-2xl border border-rose-100 bg-white p-3 shadow-sm">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-600 text-lg font-black text-white">
                    ۱
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-rose-600">قدم اول از ۳</p>
                    <h2 className="text-base font-black text-neutral-900">ویدیو را تماشا کنید</h2>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600">
                    <Play className="h-4 w-4 fill-current" />
                  </span>
                </div>

                <div className="relative aspect-video overflow-hidden rounded-xl shadow-md">
                  {videoPlaying ? (
                    <div className="absolute inset-0 overflow-hidden">
                      {/* Frame mask: oversize the embed so YouTube's top title bar and bottom-corner branding are cropped out */}
                      <TrackedIframe
                        className="absolute left-0 top-[-60px] w-full"
                        style={{ height: "calc(100% + 120px)" }}
                        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&fs=1&disablekb=0`}
                        title="پیام علی لطفی"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setVideoPlaying(true)}
                      aria-label="پخش ویدیو"
                      className="group relative block h-full w-full"
                    >
                      <img
                        src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
                        onError={(e) => {
                          const img = e.currentTarget;
                          if (!img.src.includes("hqdefault")) {
                            img.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                          }
                        }}
                        alt="پیام علی لطفی"
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-active:bg-black/30">
                        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 shadow-xl transition group-active:scale-95">
                          <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-rose-600">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </span>
                      </span>
                    </button>
                  )}
                </div>
                <p className="mt-2 text-center text-xs font-bold leading-5 text-neutral-600">
                  {reserveLiveGifts
                    ? "تماشای کامل این ویدیو پیش‌نیاز حضور در وبینار است؛ لطفاً تا آخر ببینید."
                    : "این ویدیو فقط برای ثبت‌نامی‌هاست؛ قبل از وبینار ببینید تا آماده لایو باشید."}
                </p>
              </section>
            )}

            {webinar && (
              <section className={`rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm ${reserveLiveGifts ? "order-2" : "order-3"}`}>
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-lg font-black text-white">
                    {reserveLiveGifts ? "۲" : "۳"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-emerald-600">{reserveLiveGifts ? "قدم دوم از ۳" : "قدم سوم از ۳"}</p>
                    <h2 className="text-base font-black text-neutral-900">
                      {reserveLiveGifts
                        ? "جای خود و هدایای حاضرین را رزرو کنید"
                        : campaign?.whatsappNumber
                          ? "در واتساپ پیام بدهید"
                          : "به پشتیبانی پیام بدهید"}
                    </h2>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <MessageCircle className="h-5 w-5" />
                  </span>
                </div>
                <p className="mb-3 text-center text-xs font-bold leading-5 text-neutral-600">
                  {reserveLiveGifts
                    ? "پیام آماده را در واتساپ بفرستید تا حضور شما تأیید شود و هدایای مخصوص حاضرین لایو برایتان رزرو شود."
                    : "روی دکمه زیر بزنید و پیام آماده را ارسال کنید تا جزئیات وبینار را دریافت کنید."}
                </p>
                {reserveLiveGifts && (
                  <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs font-black leading-5 text-amber-800">
                    🎁 هدایا و سوپرایزهای ویژه فقط برای حاضرین لایو وبینار
                  </div>
                )}
                <a
                  href={
                    campaign?.whatsappNumber
                      ? `https://wa.me/${campaign.whatsappNumber}?text=${encodeURIComponent(whatsAppMessage)}`
                      : `/dashboard/chat?draft=${encodeURIComponent(
                          [
                            campaign ? `سلام، در ${defaultTitle} ثبت‌نام کرده‌ام. لطفاً جزئیات وبینار را برایم بفرستید.` : "سلام، در وبینار اینستاگرام ادز ثبت‌نام کرده‌ام. لطفاً جزئیات وبینار را برایم بفرستید.",
                            registeredName && `نام: ${registeredName}`,
                            registeredCity && `شهر: ${registeredCity}`,
                            registeredEmail && `ایمیل: ${registeredEmail}`,
                          ]
                            .filter(Boolean)
                            .join("\n"),
                        )}`
                  }
                  onClick={() => trackCalendarClick("whatsapp", { email: registeredEmail, roundId: roundParam || registeredRoundId })}
                  target={campaign?.whatsappNumber ? "_blank" : undefined}
                  rel={campaign?.whatsappNumber ? "noreferrer" : undefined}
                  className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-white shadow-md transition active:scale-[0.98]"
                >
                  <MessageCircle className="h-5 w-5" />
                  {reserveLiveGifts
                    ? "رزرو جای من و هدایا در واتساپ"
                    : campaign?.whatsappNumber
                      ? "ارسال پیام در واتساپ"
                      : "ارسال پیام به پشتیبانی"}
                </a>
                {registeredEmail && (
                  <p className="mt-3 rounded-xl bg-neutral-50 px-3 py-2 text-center text-[11px] font-bold leading-5 text-neutral-700">
                    لینک ورود به این ایمیل هم ارسال شد:
                    <br />
                    <span dir="ltr" className="break-all text-neutral-900">{registeredEmail}</span>
                  </p>
                )}
              </section>
            )}

            {event && (
              <section className={`rounded-2xl border border-amber-200 bg-white p-3 shadow-sm ${reserveLiveGifts ? "order-3" : "order-2"}`}>
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-lg font-black text-white">
                    {reserveLiveGifts ? "۳" : "۲"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold text-amber-700">{reserveLiveGifts ? "قدم سوم از ۳" : "قدم دوم از ۳"}</p>
                    <h2 className="text-base font-black text-neutral-900">جلسه را به تقویم اضافه کنید</h2>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700">
                    <CalendarPlus className="h-5 w-5" />
                  </span>
                </div>
                <p className="mb-3 text-center text-xs font-bold leading-5 text-neutral-600">
                  زمان جلسه را ذخیره کنید تا وبینار زنده را از دست ندهید.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={buildGoogleCalendarUrl(event)}
                    onClick={() => trackCalendarClick("google", { email: registeredEmail, roundId: roundParam || registeredRoundId })}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-[48px] items-center justify-center rounded-xl bg-neutral-900 px-2 text-xs font-semibold text-white shadow-sm transition active:scale-[0.98]"
                  >
                    افزودن به Google Calendar
                  </a>
                  <button
                    type="button"
                    onClick={() => { trackCalendarClick("apple", { email: registeredEmail, roundId: roundParam || registeredRoundId }); downloadIcs(event, campaign?.icsName ?? "igads-webinar.ics"); }}
                    className="flex min-h-[48px] items-center justify-center rounded-xl border border-neutral-300 bg-white px-2 text-xs font-semibold text-neutral-900 shadow-sm transition active:scale-[0.98]"
                  >
                    افزودن به Apple Calendar
                  </button>
                </div>
                {compactLocalDate && (
                  <div className="mt-3 flex w-full flex-col items-center justify-center rounded-xl border border-emerald-300 bg-emerald-100 px-3 py-2 text-center">
                    <p className="text-sm font-bold text-emerald-900" dir="ltr">
                      🕒 Your Local time: {compactLocalDate.split("\n")[0]}
                    </p>
                    <p className="text-xs font-semibold text-emerald-800" dir="ltr">
                      {compactLocalDate.split("\n")[1]}
                    </p>
                  </div>
                )}
                <div className="mt-3 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-center">
                  <p className="text-[11px] font-black leading-snug text-amber-800">
                    🔥 این آخرین جلسه رایگان است — بدون ضبط
                  </p>
                </div>
              </section>
            )}
          </div>

          {webinar && (
            <section className="mt-5 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
              <h2 className="text-base font-semibold text-neutral-900">
                جزئیات وبینار
              </h2>
              <div className="mt-1.5 space-y-1.5 text-sm text-neutral-800">
                <div dir="ltr" className="text-left text-xs">📅 {laDate}</div>
                {localDate && (
                  <div dir="ltr" className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-300 bg-emerald-100 px-3 py-1 text-center text-sm font-bold text-emerald-900 whitespace-pre-line">
                    🕒 Your Local time: {localDate}
                  </div>
                )}
                <CountdownToWebinar targetDate={webinar.startUtc} />
                <details dir="ltr" className="rounded-lg bg-neutral-50 px-3 py-1.5 text-left text-xs text-neutral-600">
                  <summary className="cursor-pointer font-semibold text-neutral-500">Other time zones</summary>
                  <ul className="mt-1 space-y-0.5">
                    {COMMON_TIMEZONES.map(({ label, tz }) => (
                      <li key={`${label}-${tz}`} className="flex justify-between gap-4">
                        <span>{label}</span>
                        <span className="font-medium text-neutral-800">
                          {formatTimeZoneTime(webinar.startUtc, tz)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span>⏱ مدت: {webinar.durationMinutes} دقیقه</span>
                  <span className="text-neutral-400">|</span>
                  <span>🔴 Live in Google Meet</span>
                </div>
              </div>
              <p className="mt-2 text-[11px] leading-snug text-neutral-500" dir="ltr">
                Sender: <strong>hi@ladybosslook.com</strong> ({campaign?.senderName ?? "Ali Lotfi - Ladyboss Academy"}). Please check your spam folder.
              </p>
            </section>
          )}

          {registeredEmail && (
            <WebinarAddEmailBox
              originalEmail={registeredEmail}
              source={campaign?.slug === "powerfree" ? "powerfree" : "igads"}
              roundId={registeredRoundId}
            />
          )}
        </main>
      </div>
    </>
  );
}
