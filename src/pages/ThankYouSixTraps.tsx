import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { trackCompleteRegistration } from "@/lib/metaPixel";
import {
  buildGoogleCalendarUrl,
  downloadIcs,
  formatLADateTime,
  formatLocalDateTime,
  type WebinarEvent,
} from "@/lib/sixtrapsCalendar";

const PROGRAM_SLUG = "instagram6traps";
const YOUTUBE_ID = "nccqY4M6GZ4";

export default function ThankYouSixTraps() {
  const location = useLocation();
  const [webinar, setWebinar] = useState<{
    title: string;
    startUtc: Date;
    durationMinutes: number;
    meetUrl: string;
    supportUrl: string;
  } | null>(null);

  useEffect(() => {
    if (!location.state?.sixTrapsRegistrationCompleted) return;

    // Dispatch from the confirmed destination so navigation cannot interrupt Meta.
    const timer = window.setTimeout(() => {
      trackCompleteRegistration({
        content_name: "6 Traps Webinar Registration",
        content_category: "webinar",
        status: true,
        value: 0,
        currency: "USD",
      });
      window.history.replaceState({}, document.title, window.location.href);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [location.state]);

  useEffect(() => {
    (async () => {
      const { data: autoRule } = await (supabase as any)
        .from("program_auto_enrollment")
        .select("round_id")
        .eq("program_slug", PROGRAM_SLUG)
        .maybeSingle();
      const roundQuery = (supabase as any)
        .from("program_rounds")
        .select("first_session_date, first_session_duration, google_meet_link, support_link_url");
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
          supportUrl: round.support_link_url || "https://wa.me/16265028538",
        });
      }
    })();
  }, []);

  const event: WebinarEvent | null = useMemo(() => {
    if (!webinar) return null;
    return {
      title: webinar.title,
      description: `لینک ورود:\n${webinar.meetUrl}\n\nپشتیبانی واتس‌اپ:\n${webinar.supportUrl}`,
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
        title="ثبت‌نام شما ثبت شد | وبینار ۶ تله اینستاگرام"
        description="ثبت‌نام شما در وبینار رایگان ۶ تله اینستاگرام با موفقیت ثبت شد."
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
            <p className="mt-2 text-sm font-bold text-violet-700">
              اما هنوز ۲ قدم دیگر مانده !
            </p>
            <p className="mt-2 text-sm leading-6 text-neutral-700">
              همین حالا این ویدیو را ببینید
            </p>
          </div>

          {/* YouTube embed */}
          <div className="mt-6 aspect-video overflow-hidden rounded-2xl shadow-md">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${YOUTUBE_ID}`}
              title="پیام علی لطفی"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Calendar buttons */}
          {event && (
            <section className="mt-6">
              <p className="mb-3 text-center text-sm font-semibold text-neutral-800">
                الآن به تقویم‌تان اضافه کنید تا یادتان نرود:
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
                  onClick={() => downloadIcs(event, "sixtraps.ics")}
                  className="flex min-h-[52px] items-center justify-center rounded-xl border border-neutral-300 bg-white px-3 text-sm font-semibold text-neutral-900 shadow-sm transition active:scale-[0.98]"
                >
                  افزودن به Apple Calendar
                </button>
              </div>
              <p className="mt-4 text-center text-sm font-bold text-rose-600">
                لینک ورود به وبینار در ایمیل شما ارسال شده است
              </p>
            </section>
          )}

          {/* WhatsApp */}
          {webinar && (
            <a
              href={`${webinar.supportUrl}?text=${encodeURIComponent(
                "سلام، در وبینار ۶ تله اینستاگرام ثبت‌نام کرده‌ام. لطفاً جزئیات وبینار را برایم بفرستید.",
              )}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex min-h-[52px] w-full items-center justify-center rounded-xl bg-emerald-500 px-4 text-base font-bold text-white shadow-md transition active:scale-[0.98]"
            >
              ارسال جزئیات به واتس‌اپ من
            </a>
          )}

          {/* Webinar details card */}
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
                <div className="flex flex-wrap items-center gap-2">
                  <span>⏱ مدت: {webinar.durationMinutes} دقیقه</span>
                  <span className="text-neutral-400">|</span>
                  <span>🔴 Live in Google Meet</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-neutral-500">
                لینک ورود در ایمیل شما ارسال شده است.
              </p>
              <p className="mt-1 text-xs text-neutral-500" dir="ltr">
                Sender: <strong>onboarding@resend.dev</strong> (Ali Lotfi - Ladyboss Academy). Please check your spam folder.
              </p>
            </section>
          )}
        </main>
      </div>
    </>
  );
}