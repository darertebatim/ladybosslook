import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useLocation, useSearchParams } from "react-router-dom";
import { resolveWebinarRound } from "@/lib/webinarRounds";

import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { trackCompleteRegistration } from "@/lib/metaPixel";
import WebinarAddEmailBox from "@/components/WebinarAddEmailBox";
import {
  buildGoogleCalendarUrl,
  downloadIcs,
  formatLADateTime,
  formatLocalDateTime,
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
    <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
      <p className="text-center text-sm font-bold text-emerald-700">
        تا شروع وبینار
      </p>
      <div className="mt-2 inline-flex w-full items-center justify-center gap-1 text-emerald-900" dir="ltr">
        <span className="flex min-w-[52px] flex-col items-center rounded-lg bg-white px-2 py-1 text-base font-black shadow-sm">
          {pad(timeLeft.days)}
          <span className="text-[10px] font-medium text-emerald-600">روز</span>
        </span>
        <span className="text-emerald-400">:</span>
        <span className="flex min-w-[52px] flex-col items-center rounded-lg bg-white px-2 py-1 text-base font-black shadow-sm">
          {pad(timeLeft.hours)}
          <span className="text-[10px] font-medium text-emerald-600">ساعت</span>
        </span>
        <span className="text-emerald-400">:</span>
        <span className="flex min-w-[52px] flex-col items-center rounded-lg bg-white px-2 py-1 text-base font-black shadow-sm">
          {pad(timeLeft.minutes)}
          <span className="text-[10px] font-medium text-emerald-600">دقیقه</span>
        </span>
        <span className="text-emerald-400">:</span>
        <span className="flex min-w-[52px] flex-col items-center rounded-lg bg-white px-2 py-1 text-base font-black shadow-sm">
          {pad(timeLeft.seconds)}
          <span className="text-[10px] font-medium text-emerald-600">ثانیه</span>
        </span>
      </div>
    </section>
  );
}

function youtubeId(url: string | null | undefined): string {
  if (!url) return "";
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/);
  return m?.[1] || "";
}

export default function ThankYouIgAds() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const roundParam = searchParams.get("round");

  const stored = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("igads_registration") || "null") as
        | { email?: string; roundId?: string; name?: string; city?: string }
        | null;
    } catch {
      return null;
    }
  }, []);
  const registeredEmail = ((location.state as any)?.email || stored?.email) as string | undefined;
  const registeredRoundId = ((location.state as any)?.roundId || stored?.roundId) as string | undefined;
  const [fallbackDetails, setFallbackDetails] = useState<{ name?: string; city?: string }>({});
  const registeredName = (((location.state as any)?.name || stored?.name || fallbackDetails.name) as string | undefined);
  const registeredCity = (((location.state as any)?.city || stored?.city || fallbackDetails.city) as string | undefined);
  const [videoId, setVideoId] = useState("");
  const [webinar, setWebinar] = useState<{
    title: string;
    startUtc: Date;
    durationMinutes: number;
    meetUrl: string;
    supportUrl: string;
  } | null>(null);

  useEffect(() => {
    if (!(location.state as any)?.igAdsRegistrationCompleted) return;

    const timer = window.setTimeout(() => {
      trackCompleteRegistration({
        content_name: "Instagram Ads Webinar Registration",
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
        body: { email: registeredEmail, source: "igads_registration" },
      })
      .then(({ data }) => {
        if (data?.found) setFallbackDetails({ name: data.name, city: data.city });
      })
      .catch((e) => console.error("registration lookup failed", e));
  }, [registeredEmail, location.state, stored]);

  useEffect(() => {
    (async () => {
      const round = await resolveWebinarRound(PROGRAM_SLUG, roundParam || registeredRoundId);
      const { data: prog } = await (supabase as any)
        .from("program_catalog")
        .select("title, video_url")
        .eq("slug", PROGRAM_SLUG)
        .maybeSingle();

      setVideoId(youtubeId(round?.video_url || prog?.video_url));

      if (round?.first_session_date) {
        setWebinar({
          title: prog?.title || "وبینار جذب مشتری با اینستاگرام ادز",
          startUtc: new Date(round.first_session_date),
          durationMinutes: round.first_session_duration || 120,
          meetUrl: round.google_meet_link || "",
          supportUrl: round.support_link_url || "/dashboard/chat",
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

  return (
    <>
      <SEOHead
        title="ثبت‌نام شما ثبت شد | وبینار اینستاگرام ادز"
        description="ثبت‌نام شما در وبینار رایگان جذب مشتری با اینستاگرام ادز با موفقیت ثبت شد."
        locale="fa_IR"
      />
      <div
        dir="rtl"
        lang="fa"
        className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-amber-50 font-farsi"
      >
        <main className="mx-auto w-full max-w-md px-4 pb-16 pt-8">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-2xl text-white shadow-md">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">
              ثبت‌نام شما با موفقیت انجام شد
            </h1>
            <p className="mt-2 text-xl font-black text-rose-600">
              اما هنوز ۲ قدم دیگر مانده !
            </p>
            <p className="mt-1 text-xl font-black text-rose-600">
              همین حالا این ویدیو را ببینید
            </p>
          </div>

          <div className="mt-4 flex justify-center gap-2 text-emerald-600">
            <ArrowDown className="h-6 w-6 animate-bounce" />
            <ArrowDown className="h-6 w-6 animate-bounce" style={{ animationDelay: "100ms" }} />
            <ArrowDown className="h-6 w-6 animate-bounce" style={{ animationDelay: "200ms" }} />
            <ArrowDown className="h-6 w-6 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>

          {videoId && (
            <div className="mt-2 aspect-video overflow-hidden rounded-2xl shadow-md">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="پیام علی لطفی"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          <div className="mt-2 flex justify-center gap-2 text-emerald-600">
            <ArrowUp className="h-6 w-6 animate-bounce" />
            <ArrowUp className="h-6 w-6 animate-bounce" style={{ animationDelay: "100ms" }} />
            <ArrowUp className="h-6 w-6 animate-bounce" style={{ animationDelay: "200ms" }} />
            <ArrowUp className="h-6 w-6 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>

          {event && (
            <section className="mt-6">
              <p className="mb-3 text-center text-lg font-black text-rose-600">
                قدم اول
              </p>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={buildGoogleCalendarUrl(event)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-[52px] items-center justify-center rounded-xl bg-neutral-900 px-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98]"
                >
                  افزودن به Google Calendar
                </a>
                <button
                  type="button"
                  onClick={() => downloadIcs(event, "igads-webinar.ics")}
                  className="flex min-h-[52px] items-center justify-center rounded-xl border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-900 shadow-sm transition active:scale-[0.98]"
                >
                  افزودن به Apple Calendar
                </button>
              </div>
            </section>
          )}

          {webinar && (
            <>
              <p className="mt-6 text-center text-lg font-black text-rose-600">
                قدم دوم
              </p>
              <a
                href={`/dashboard/chat?draft=${encodeURIComponent(
                  [
                    "سلام، در وبینار اینستاگرام ادز ثبت‌نام کرده‌ام. لطفاً جزئیات وبینار را برایم بفرستید.",
                    registeredName && `نام: ${registeredName}`,
                    registeredCity && `شهر: ${registeredCity}`,
                    registeredEmail && `ایمیل: ${registeredEmail}`,
                  ]
                    .filter(Boolean)
                    .join("\n"),
                )}`}
                className="mt-2 flex min-h-[52px] w-full items-center justify-center rounded-xl bg-emerald-500 px-4 text-base font-bold text-white shadow-md transition active:scale-[0.98]"
              >
                ارسال جزئیات به پشتیبانی
              </a>
              <p className="mt-3 text-center text-sm font-bold text-rose-600">
                لینک ورود به وبینار به این ایمیل ارسال شده است:
              </p>
              {registeredEmail && (
                <p className="mt-1 text-center text-sm font-bold text-neutral-900" dir="ltr">
                  {registeredEmail}
                </p>
              )}
            </>
          )}

          {webinar && (
            <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-900">
                جزئیات وبینار
              </h2>
              <p className="mt-1 text-sm text-neutral-700">{webinar.title}</p>
              <div className="mt-3 space-y-2 text-sm text-neutral-800">
                <div dir="ltr" className="text-left">📅 {laDate}</div>
                {localDate && (
                  <div dir="ltr" className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-center text-base font-bold text-emerald-900 border border-emerald-300 whitespace-pre-line">
                    🕒 Your Local time: {localDate}
                  </div>
                )}
                <CountdownToWebinar targetDate={webinar.startUtc} />
                <div dir="ltr" className="mt-1 rounded-xl bg-neutral-50 px-3 py-2 text-left text-xs text-neutral-600">
                  <p className="mb-1 font-semibold text-neutral-500">Other time zones:</p>
                  <ul className="space-y-0.5">
                    {COMMON_TIMEZONES.map(({ label, tz }) => (
                      <li key={`${label}-${tz}`} className="flex justify-between gap-4">
                        <span>{label}</span>
                        <span className="font-medium text-neutral-800">
                          {formatTimeZoneTime(webinar.startUtc, tz)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span>⏱ مدت: {webinar.durationMinutes} دقیقه</span>
                  <span className="text-neutral-400">|</span>
                  <span>🔴 Live in Google Meet</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-neutral-500">
                لینک ورود به ایمیل شما ارسال شده است:
                {registeredEmail && (
                  <span className="mr-1 font-semibold text-neutral-800" dir="ltr">{registeredEmail}</span>
                )}
              </p>
              <p className="mt-1 text-xs text-neutral-500" dir="ltr">
                Sender: <strong>hi@ladybosslook.com</strong> (Ali Lotfi - Ladyboss Academy). Please check your spam folder.
              </p>
            </section>
          )}

          {registeredEmail && (
            <WebinarAddEmailBox
              originalEmail={registeredEmail}
              source="igads"
              roundId={registeredRoundId}
            />
          )}
        </main>
      </div>
    </>
  );
}
