import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CalendarPlus, CalendarDays, Video, CheckCircle2 } from "lucide-react";
import { loadStartAds, youtubeId, type StartAdsRound } from "@/pages/StartAdsLanding";
import { formatLocalDateTime, downloadIcs } from "@/lib/sixtrapsCalendar";
import { trackCalendarClick } from "@/lib/trackCalendarClick";

function gcalUrl(title: string, r: StartAdsRound) {
  const start = new Date(r.first_session_date!);
  const end = new Date(start.getTime() + (r.first_session_duration || 90) * 60000);
  const f = (d: Date) => d.toISOString().replace(/[-:]|\.\d{3}/g, "");
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${f(start)}/${f(end)}`,
    details: `لینک ورود: ${r.google_meet_link || ""}`,
    location: r.google_meet_link || "",
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

export default function StartAdsThankYou() {
  const [params] = useSearchParams();
  const waitlist = params.get("waitlist") === "1";
  const email = params.get("email");
  const [data, setData] = useState<{ prog: any; round: StartAdsRound | null } | null>(null);

  useEffect(() => {
    loadStartAds().then(setData);
  }, []);

  const round = data?.round;
  const title = data?.prog?.title || "شروع تبلیغات اینستاگرامی";
  const vid = youtubeId(round?.video_url);

  const addToApple = () => {
    if (!round?.first_session_date) return;
    trackCalendarClick("apple", { email, roundId: round.id, page: "/l/startads/thankyou" });
    downloadIcs(
      {
        title,
        description: `لینک ورود: ${round.google_meet_link || ""}`,
        startUtc: new Date(round.first_session_date),
        durationMinutes: round.first_session_duration || 90,
        location: round.google_meet_link || "",
      },
      "startads.ics",
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white">
      <Helmet>
        <title>ثبت‌نام شما انجام شد | Rilo</title>
      </Helmet>
      <main dir="rtl" className="mx-auto w-full max-w-xl px-4 pb-16 pt-8 font-farsi">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </span>
          <h1 className="mt-3 text-2xl font-extrabold text-neutral-900">
            {waitlist ? "در لیست انتظار هستید 🌷" : "جایگاه شما رزرو شد 🌷"}
          </h1>
          {!waitlist && (
            <p className="mt-1 text-sm text-neutral-600">دو قدم تا جلسه اول — هر دو را همین حالا انجام دهید</p>
          )}
        </div>

        {!waitlist && round?.first_session_date && (
          <>
            {vid && (
              <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-3 shadow-ios">
                <p className="mb-2 flex items-center justify-center gap-1.5 text-center text-sm font-extrabold text-neutral-900">
                  <Video className="h-4 w-4 text-rose-500" />
                  قدم اول: قبل از جلسه این ویدیو را ببینید
                </p>
                <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
                  <iframe
                    className="absolute inset-0 h-full w-full"
                    src={`https://www.youtube.com/embed/${vid}?rel=0`}
                    allow="encrypted-media"
                    allowFullScreen
                    title="ویدیو پیش‌نیاز"
                  />
                </div>
              </div>
            )}

            <div className="mt-4 rounded-2xl border border-neutral-200 bg-white p-4 text-center shadow-ios">
              <p className="flex items-center justify-center gap-1.5 text-sm font-extrabold text-neutral-900">
                <CalendarDays className="h-4 w-4 text-rose-500" />
                قدم دوم: جلسه را به تقویم خود اضافه کنید
              </p>
              <p className="mt-2 text-xs font-bold text-rose-600">جلسه اول «{title}» · {round.first_session_duration || 90} دقیقه · آنلاین</p>
              <p dir="ltr" className="mt-1 whitespace-pre-line text-sm font-extrabold leading-6 text-neutral-900">
                {formatLocalDateTime(new Date(round.first_session_date))}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <a
                  href={gcalUrl(title, round)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => trackCalendarClick("google", { email, roundId: round.id, page: "/l/startads/thankyou" })}
                  className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-rose-500 text-[13px] font-extrabold text-white active:scale-[0.98]"
                >
                  <CalendarPlus className="h-4 w-4" />
                  تقویم گوگل
                </a>
                <button
                  type="button"
                  onClick={addToApple}
                  className="flex h-12 items-center justify-center gap-1.5 rounded-xl bg-neutral-900 text-[13px] font-extrabold text-white active:scale-[0.98]"
                >
                  <CalendarPlus className="h-4 w-4" />
                  تقویم اپل
                </button>
              </div>
              {round.google_meet_link && (
                <a
                  href={round.google_meet_link}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 flex h-12 items-center justify-center rounded-xl bg-neutral-100 text-sm font-bold text-neutral-900 active:scale-[0.98]"
                >
                  لینک ورود به جلسه (گوگل میت)
                </a>
              )}
            </div>
          </>
        )}
        {waitlist && (
          <p className="mt-4 text-center text-sm leading-7 text-neutral-700">
            به محض باز شدن جلسه بعدی، از طریق ایمیل به شما خبر می‌دهیم.
          </p>
        )}
      </main>
    </div>
  );
}
