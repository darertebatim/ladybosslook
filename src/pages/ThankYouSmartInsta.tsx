import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/SEOHead";
import { trackCompleteRegistration } from "@/lib/metaPixel";
import workbookAsset from "@/assets/build-trustworthy-instagram-profile-workbook.pdf.asset.json";
import {
  buildGoogleCalendarUrl,
  downloadIcs,
  formatLADateTime,
  formatLocalDateTime,
  type WebinarEvent,
} from "@/lib/sixtrapsCalendar";

const PROGRAM_SLUG = "smartinstagramframework";
const FALLBACK_YOUTUBE_ID = "G_qM6-Y00wE";

function extractYouTubeId(url?: string | null): string {
  if (!url) return FALLBACK_YOUTUBE_ID;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/);
  return m?.[1] || FALLBACK_YOUTUBE_ID;
}

export default function ThankYouSmartInsta() {
  const location = useLocation();
  const [webinar, setWebinar] = useState<{
    title: string;
    startUtc: Date;
    durationMinutes: number;
    meetUrl: string;
    supportUrl: string;
  } | null>(null);
  const [youtubeId, setYoutubeId] = useState<string>(FALLBACK_YOUTUBE_ID);

  useEffect(() => {
    if (!location.state?.smartInstaRegistrationCompleted) return;
    const timer = window.setTimeout(() => {
      trackCompleteRegistration({
        content_name: "Smart Instagram Framework Registration",
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
        .select("title, video_url")
        .eq("slug", PROGRAM_SLUG)
        .maybeSingle();
      setYoutubeId(extractYouTubeId(prog?.video_url));
      if (round?.first_session_date) {
        setWebinar({
          title: prog?.title || "وبینار فریم‌ورک اینستاگرام هوشمند",
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
        title="ثبت‌نام شما ثبت شد | وبینار فریم‌ورک اینستاگرام هوشمند"
        description="ثبت‌نام شما در وبینار رایگان فریم‌ورک اینستاگرام هوشمند با موفقیت ثبت شد."
        locale="fa_IR"
      />
      <div
        dir="rtl"
        lang="fa"
        className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-amber-50 font-farsi"
      >
        <main className="mx-auto w-full max-w-md px-4 pb-16 pt-8">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-2xl text-white shadow-md">
              ✓
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">
              ثبت‌نام شما با موفقیت انجام شد
            </h1>
            <p className="mt-2 text-xs font-semibold text-rose-600">
              این وبینار مخصوص صاحبان کسب‌وکار در آمریکا و کانادا است
            </p>
            <p className="mt-2 text-sm leading-6 text-neutral-700">
              لینک ورود به وبینار و جزئیات کامل به ایمیل شما ارسال شد. تا وبینار،
              این ویدیوی کوتاه از علی لطفی را ببینید.
            </p>
          </div>

          {/* YouTube embed */}
          <div className="mt-6 aspect-video overflow-hidden rounded-2xl shadow-md">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${youtubeId}`}
              title="پیام علی لطفی"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Gift PDF */}
          <section className="mt-6 rounded-2xl border border-violet-200 bg-white p-5 shadow-sm text-center">
            <p className="text-base font-bold text-neutral-900">🎁 هدیه شما</p>
            <p className="mt-1 text-sm leading-6 text-neutral-700">
              ورک‌بوک «پروفایل اینستاگرام قابل اعتماد» را همین حالا دانلود کنید.
            </p>
            <a
              href={workbookAsset.url}
              download="Build_a_Trustworthy_Instagram_Profile_Workbook.pdf"
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-violet-600 to-fuchsia-500 px-4 text-base font-bold text-white shadow-md transition active:scale-[0.98]"
            >
              <Download className="h-5 w-5" />
              دانلود ورک‌بوک هدیه (PDF)
            </a>
          </section>

          {/* Webinar details */}
          {webinar && (
            <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-900">جزئیات وبینار</h2>
              <p className="mt-1 text-sm text-neutral-700">{webinar.title}</p>
              <div className="mt-3 space-y-2 text-sm text-neutral-800">
                <div dir="ltr" className="text-left">📅 {laDate}</div>
                {localDate && (
                  <div dir="ltr" className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-left text-base font-bold text-emerald-900 border border-emerald-300">
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
                Sender: <strong>hi@ladybosslook.com</strong> (Ali Lotfi - Ladyboss Academy). Please check your spam folder.
              </p>
            </section>
          )}

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
                  onClick={() => downloadIcs(event, "smartinstaframework.ics")}
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
        </main>
      </div>
    </>
  );
}
