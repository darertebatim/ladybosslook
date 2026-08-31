import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { trackLead } from "@/lib/metaPixel";
import { SEOHead } from "@/components/SEOHead";
import {
  buildGoogleCalendarUrl,
  downloadIcs,
  formatLADateTime,
  formatLocalDateTime,
  type WebinarEvent,
} from "@/lib/sixtrapsCalendar";

const PROGRAM_SLUG = "igadsfree";

function youtubeId(url: string | null | undefined): string {
  if (!url) return "";
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/);
  return m?.[1] || "";
}

const emailSchema = z.object({
  email: z.string().trim().email("ایمیل معتبر نیست").max(255),
});

export default function PreIgAds() {
  const [videoId, setVideoId] = useState("");
  const [webinar, setWebinar] = useState<{
    title: string;
    startUtc: Date;
    durationMinutes: number;
    meetUrl: string;
    supportUrl: string;
  } | null>(null);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [roundId, setRoundId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: autoRule } = await (supabase as any)
        .from("program_auto_enrollment")
        .select("round_id")
        .eq("program_slug", PROGRAM_SLUG)
        .maybeSingle();

      const roundQuery = (supabase as any)
        .from("program_rounds")
        .select("id, first_session_date, first_session_duration, google_meet_link, support_link_url, video_url");

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

      setVideoId(youtubeId(round?.video_url || prog?.video_url));

      if (round?.first_session_date) {
        setRoundId(round.id ?? autoRule?.round_id ?? null);
        setWebinar({
          title: prog?.title || "وبینار جذب مشتری با اینستاگرام ادز",
          startUtc: new Date(round.first_session_date),
          durationMinutes: round.first_session_duration || 120,
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

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const parsed = emailSchema.safeParse({ email });
    if (!parsed.success) {
      setEmailError(parsed.error.errors[0]?.message || "ایمیل معتبر نیست");
      return;
    }
    setEmailError("");
    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from("form_submissions").insert({
        name: "",
        email: parsed.data.email.toLowerCase(),
        city: "",
        phone: "",
        source: "preigads_interest",
        round_id: roundId,
      });
      if (error) throw error;

      trackLead({
        content_name: "Instagram Ads Pre-Webinar Interest",
        content_category: "webinar",
      });

      supabase.functions
        .invoke("send-sixtraps-confirmation", {
          body: {
            name: "دوست عزیز",
            email: parsed.data.email.toLowerCase(),
            programSlug: PROGRAM_SLUG,
            prereqUrl: "https://ladybosslook.com/l/igadsfree/pre",
            sources: ["igads_registration", "preigads_interest"],
            ...(roundId ? { roundId } : {}),
          },
        })
        .catch((err) => console.error("confirmation email error", err));

      setEmailSubmitted(true);
    } catch (err) {
      console.error("submit error", err);
      setEmailError("مشکلی پیش آمد. لطفاً دوباره تلاش کنید.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <SEOHead
        title="اینستاگرام ادز | وبینار رایگان با علی لطفی"
        description="لینک و جزئیات وبینار رایگان جذب مشتری با اینستاگرام ادز را دریافت کنید."
        locale="fa_IR"
      />
      <div
        dir="rtl"
        lang="fa"
        className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-amber-50 font-farsi"
      >
        <main className="mx-auto w-full max-w-md px-4 pb-16 pt-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold leading-tight text-neutral-900">
              قبل از وبینار، این ویدیوی کوتاه را ببینید
            </h1>
            <p className="mt-2 text-sm leading-6 text-neutral-700">
              علی لطفی در این ویدیو نکته‌هایی می‌گوید که در وبینار رایگان
              <strong> جذب مشتری با اینستاگرام ادز </strong>
              عمیق‌تر بررسی می‌شوند.
            </p>
            <p className="mt-2 text-xs font-semibold text-rose-600">
              این وبینار مخصوص صاحبان کسب‌وکار در آمریکا و کانادا است
            </p>
          </div>

          {videoId && (
            <div className="mt-6 aspect-video overflow-hidden rounded-2xl shadow-md">
              <iframe
                className="h-full w-full"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="پیام علی لطفی"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}

          {webinar && (
            <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-900">
                جزئیات وبینار
              </h2>
              <p className="mt-1 text-sm text-neutral-700">{webinar.title}</p>
              <div className="mt-3 space-y-2 text-sm text-neutral-800">
                <div dir="ltr" className="text-left">📅 LA time: {laDate}</div>
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
            </section>
          )}

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
                  onClick={() => downloadIcs(event, "igads-webinar.ics")}
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

          {webinar && (
            <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              {!emailSubmitted ? (
                <>
                  <h2 className="text-center text-lg font-semibold text-neutral-900">
                    لینک و جزئیات وبینار را بفرستید
                  </h2>
                  <form
                    onSubmit={handleEmailSubmit}
                    dir="ltr"
                    className="mt-4 space-y-3 text-left"
                  >
                    <div>
                      <label className="mb-1 block text-sm font-medium text-neutral-800">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        maxLength={255}
                        className="min-h-[48px] w-full rounded-xl border border-neutral-300 bg-white px-4 text-base text-neutral-900 outline-none focus:border-emerald-500"
                        placeholder="you@example.com"
                        dir="ltr"
                      />
                      {emailError && (
                        <p className="mt-1 text-xs text-rose-600">{emailError}</p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="min-h-[52px] w-full rounded-xl bg-gradient-to-l from-emerald-500 to-teal-500 text-base font-bold text-white shadow-md transition active:scale-[0.98] disabled:opacity-60"
                    >
                      {submitting ? "در حال ارسال..." : "ارسال لینک و جزئیات"}
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-2xl text-white shadow-md">
                    ✓
                  </div>
                  <h2 className="text-lg font-semibold text-neutral-900">
                    ایمیل شما ثبت شد
                  </h2>
                  <p className="mt-1 text-sm text-neutral-700">
                    لینک ورود و جزئیات وبینار به زودی به ایمیلتان ارسال می‌شود.
                  </p>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </>
  );
}
