import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { z } from "zod";
import { Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { trackWebinarLead } from "@/lib/metaCapi";
import { getDeviceTimezone } from "@/lib/regionRestrictions";
import { formatLocalDateTime } from "@/lib/sixtrapsCalendar";

export const STARTADS_SLUG = "startads";
export const STARTADS_SOURCE = "startads_registration";

const schema = z.object({
  name: z.string().trim().min(2, "نام را کامل وارد کنید").max(100),
  email: z.string().trim().email("ایمیل معتبر نیست").max(255),
});

export function youtubeId(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export interface StartAdsRound {
  id: string;
  round_number: number | null;
  first_session_date: string | null;
  first_session_duration: number | null;
  google_meet_link: string | null;
  video_url: string | null;
}

export async function loadStartAds() {
  const [{ data: prog }, { data: rounds }] = await Promise.all([
    (supabase as any).from("program_catalog").select("title, video_url, cover_image_url").eq("slug", STARTADS_SLUG).maybeSingle(),
    (supabase as any)
      .from("program_rounds")
      .select("id, round_number, first_session_date, first_session_duration, google_meet_link, video_url")
      .eq("program_slug", STARTADS_SLUG)
      .eq("status", "active")
      .order("first_session_date", { ascending: true }),
  ]);
  const upcoming = ((rounds || []) as StartAdsRound[]).find(
    (r) => r.first_session_date && new Date(r.first_session_date).getTime() > Date.now(),
  );
  return { prog, round: upcoming || null };
}

export default function StartAdsLanding() {
  const navigate = useNavigate();
  const [prog, setProg] = useState<any>(null);
  const [round, setRound] = useState<StartAdsRound | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadStartAds().then(({ prog, round }) => {
      setProg(prog);
      setRound(round);
      setLoaded(true);
    });
  }, []);

  const vid = youtubeId(prog?.video_url);
  const title = prog?.title || "شروع تبلیغات اینستاگرامی";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const parsed = schema.safeParse({ name, email });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.errors.forEach((er) => er.path[0] && (errs[String(er.path[0])] = er.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    const em = parsed.data.email.toLowerCase();
    try {
      const { error } = await (supabase as any).from("form_submissions").insert({
        name: parsed.data.name,
        email: em,
        phone: "",
        city: "",
        source: round ? STARTADS_SOURCE : "startads_waitlist",
        round_id: round?.id ?? null,
        timezone: getDeviceTimezone(),
      });
      if (error) throw error;
      trackWebinarLead({ customEvent: "StartAdsLead", contentName: "StartAds Session 1 Registration", email: em, name: parsed.data.name });
      if (round) {
        supabase.functions
          .invoke("send-sixtraps-confirmation", {
            body: {
              name: parsed.data.name,
              email: em,
              programSlug: STARTADS_SLUG,
              prereqUrl: `https://ladybosslook.com/l/startads/thankyou?round=${round.round_number}&email=${encodeURIComponent(em)}`,
              sources: [STARTADS_SOURCE],
              roundId: round.id,
            },
          })
          .catch((err) => console.error("confirmation email error", err));
      }
      try {
        localStorage.setItem(STARTADS_SOURCE, JSON.stringify({ email: em, name: parsed.data.name, roundId: round?.id }));
      } catch {}
      navigate(`/l/startads/thankyou${round ? `?round=${round.round_number}` : "?waitlist=1"}`);
    } catch (err) {
      console.error(err);
      setErrors({ email: "ثبت‌نام انجام نشد، دوباره تلاش کنید" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white">
      <Helmet>
        <title>{title} — جلسه اول رایگان | Rilo</title>
        <meta name="description" content="جلسه اول دوره ۳ هفته‌ای جذب مشتری با اینستاگرام ادز — رایگان فقط برای ۵۰ نفر." />
      </Helmet>
      <main dir="rtl" className="mx-auto w-full max-w-xl px-4 pb-6 pt-4 font-farsi">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-3 py-1 text-[11px] font-bold text-white shadow-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            پیشنهاد یک‌باره — فقط ۵۰ نفر
          </span>
          <h1 className="mt-2 text-xl font-extrabold leading-snug text-neutral-900">
            {'«'}{title}{'»\n — رایگان برای شما'}
          </h1>
          <p className="mt-1 text-sm font-bold text-rose-600">▶ ویدیو را ببینید و جایگاه رایگان خود را رزرو کنید</p>
        </div>

        {vid && (
          <div className="mt-3 overflow-hidden rounded-2xl bg-black shadow-ios">
            <div className="relative aspect-video">
              {playing ? (
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube.com/embed/${vid}?autoplay=1&rel=0`}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title={title}
                />
              ) : (
                <button onClick={() => setPlaying(true)} className="absolute inset-0 h-full w-full" aria-label="پخش ویدیو">
                  <img src={`https://i.ytimg.com/vi/${vid}/hqdefault.jpg`} alt="" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-ios">
                    <Play className="h-6 w-6 fill-rose-500 text-rose-500" />
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {loaded && round?.first_session_date && (
          <div className="mt-3 rounded-2xl border border-orange-200 bg-orange-50 px-3 py-2 text-center">
            <p className="text-[11px] font-bold text-rose-600">زمان جلسه اول (به وقت شما) · آنلاین در گوگل میت · {round.first_session_duration || 90} دقیقه</p>
            <p dir="ltr" className="mt-0.5 whitespace-pre-line text-sm font-extrabold leading-5 text-neutral-900">
              {formatLocalDateTime(new Date(round.first_session_date))}
            </p>
          </div>
        )}

        <form onSubmit={submit} className="mt-3 space-y-2 rounded-2xl border border-neutral-200 bg-white p-3 shadow-ios">
          <p className="text-center text-sm font-extrabold text-neutral-900">
            {loaded && !round ? "ثبت‌نام بسته شد — در لیست انتظار جلسه بعد باشید" : "رزرو ۱ جایگاه از ۵۰ جایگاه رایگان"}
          </p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            dir="ltr"
            className="h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm"
          />
          {errors.name && <p className="text-xs text-rose-600">{errors.name}</p>}
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            dir="ltr"
            className="h-11 w-full rounded-xl border border-neutral-200 px-4 text-sm"
          />
          {errors.email && <p className="text-xs text-rose-600">{errors.email}</p>}
          <button
            type="submit"
            disabled={submitting || !loaded}
            className="h-11 w-full rounded-xl bg-rose-500 text-sm font-extrabold text-white active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? "در حال ثبت..." : loaded && !round ? "عضویت در لیست انتظار" : "رزرو جایگاه رایگان من"}
          </button>
          <p className="text-center text-[11px] text-neutral-500">ظرفیت محدود · بدون ضبط · </p>
        </form>
      </main>
    </div>
  );
}
