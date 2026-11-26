import { AcquisitionSections } from "@/components/programs/AcquisitionSections";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import {
  Check, X, Shield, Play, Video, BookOpen, MessageCircle, Calendar, Target,
  PenLine, Megaphone, TrendingUp, Gift, Sparkles, Clock, Users, Loader2,
  BarChart3, Rocket, Wallet, Repeat, ArrowDown, Lock, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TrackedIframe } from "@/components/TrackedIframe";
import { supabase, browserTimezone } from "@/integrations/supabase/client";
import { trackInitiateCheckout } from "@/lib/metaPixel";
import vslCoverLong from "@/assets/igads-vsl-cover.png.asset.json";
import vslCoverShort from "@/assets/igads-vsl11-cover-v2.webp.asset.json";

const PROGRAM_SLUG = "casigads";
/** variant "short" = 11-min VSL page at /l/igadsvsl. Set SHORT_VSL_ID once the video is uploaded. */
const LONG_VSL_ID = "VwTKgHp8APw";
const SHORT_VSL_ID = "THvut8z-cOg";

const fa = (n: number) => n.toLocaleString("fa-IR");

function useProgramPrice() {
  const [price, setPrice] = useState<{ now: number; was: number }>({ now: 197, was: 497 });
  useEffect(() => {
    supabase
      .from("program_catalog")
      .select("price_amount, original_price")
      .eq("slug", PROGRAM_SLUG)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.price_amount) {
          setPrice({ now: data.price_amount / 100, was: data.original_price ? data.original_price / 100 : 497 });
        }
      });
  }, []);
  return price;
}

const CURRENCY_NOTE = "قیمت‌ها به دلار آمریکا (USD) است؛ اگر از کانادا با کارت کانادایی پرداخت کنی، بانکت مبلغ رو به دلار کانادا تبدیل می‌کنه.";

type Session = { date: string; pt: string; et: string };

/** 4 weekly live sessions of the round buyers are auto-enrolled into (fallback: next upcoming round). */
function useNextRoundSchedule() {
  const [sessions, setSessions] = useState<Session[]>([]);
  useEffect(() => {
    (async () => {
      let firstDate: string | null = null;
      const { data: auto } = await supabase
        .from("program_auto_enrollment")
        .select("round_id")
        .eq("program_slug", PROGRAM_SLUG)
        .maybeSingle();
      if (auto?.round_id) {
        const { data: r } = await supabase.from("program_rounds").select("first_session_date").eq("id", auto.round_id).maybeSingle();
        firstDate = r?.first_session_date ?? null;
      }
      if (!firstDate) {
        const { data: r } = await supabase
          .from("program_rounds")
          .select("first_session_date")
          .eq("program_slug", PROGRAM_SLUG)
          .gt("first_session_date", new Date().toISOString())
          .order("first_session_date", { ascending: true })
          .limit(1)
          .maybeSingle();
        firstDate = r?.first_session_date ?? null;
      }
      return firstDate;
    })()
      .then((firstDate) => {
        if (!firstDate) return;
        const first = new Date(firstDate).getTime();
        const d = (tz: string) => new Intl.DateTimeFormat("fa-IR-u-ca-gregory", { timeZone: tz, weekday: "long", day: "numeric", month: "long" });
        const t = (tz: string) => new Intl.DateTimeFormat("fa-IR", { timeZone: tz, hour: "numeric", minute: "2-digit" });
        setSessions([0, 1, 2, 3].map((w) => {
          const at = new Date(first + w * 7 * 86400000);
          return { date: d("America/Los_Angeles").format(at), pt: t("America/Los_Angeles").format(at), et: t("America/New_York").format(at) };
        }));
      });
  }, []);
  return sessions;
}


function CTA({ onClick, loading, price, was, className = "" }: { onClick: () => void; loading: boolean; price: number; was: number; className?: string }) {
  return (
    <Button
      data-main-cta
      size="lg"
      onClick={onClick}
      disabled={loading}
      className={`h-14 w-full rounded-2xl px-3 text-[15px] font-extrabold shadow-ios active:scale-[0.98] ${className}`}
    >
      {loading ? <Loader2 className="ml-1.5 h-4 w-4 animate-spin" /> : <Rocket className="ml-1.5 h-4 w-4" />}
      {loading ? (
        "در حال انتقال به پرداخت..."
      ) : (
        <span className="flex items-center gap-1.5">
          همین الان ثبت‌نام کن —
          {was > price && <span className="text-xs font-bold line-through opacity-70">{fa(was)}</span>}
          <span>{fa(price)} دلار</span>
        </span>
      )}
    </Button>
  );
}

/** Small animated arrow that points at the video; rotation lives on the wrapper so the bounce animation can't override it. */
function HintArrow({ dir, className = "" }: { dir: "down" | "up"; className?: string }) {
  return (
    <span className={`inline-flex shrink-0 ${dir === "up" ? "-rotate-180" : ""} ${className}`}>
      <ArrowDown className="h-4 w-4 animate-bounce text-primary [animation-duration:1.7s]" strokeWidth={2.6} aria-hidden="true" />
    </span>
  );
}

export default function IgAdsProgramLanding({ variant = "long" }: { variant?: "long" | "short" }) {
  const isShort = variant === "short";
  const VSL_ID = isShort ? SHORT_VSL_ID : LONG_VSL_ID;
  const vslCover = isShort ? vslCoverShort : vslCoverLong;
  const price = useProgramPrice();
  const schedule = useNextRoundSchedule();
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const discount = price.was > price.now ? Math.round((1 - price.now / price.was) * 100) : 0;

  useEffect(() => {
    const onScroll = () => {
      const ctaVisible = Array.from(document.querySelectorAll("[data-main-cta]")).some((el) => {
        const r = el.getBoundingClientRect();
        return r.top < window.innerHeight && r.bottom > 0;
      });
      setShowSticky(window.scrollY > 700 && !ctaVisible);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const checkout = async () => {
    setLoading(true);
    try {
      trackInitiateCheckout({ content_name: PROGRAM_SLUG, value: price.now, currency: "USD" });
      const { data, error } = await supabase.functions.invoke("create-payment", {
        body: { program: PROGRAM_SLUG, timezone: browserTimezone },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("No checkout URL");
      window.location.href = data.url;
    } catch (e) {
      console.error("igadsprogram checkout error", e);
      toast.error("خطا در انتقال به پرداخت. لطفاً دوباره تلاش کنید.");
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background font-farsi text-foreground">
      <Helmet>
        <title>دوره جذب مشتری با تبلیغات اینستاگرامی | علی لطفی</title>
        <meta name="description" content="در ۴ هفته یاد بگیر با تبلیغات اینستاگرام، برای بیزینست در آمریکا و کانادا مشتری جدید و پایدار جذب کنی. به فارسی، با ۳۰ روز ضمانت بازگشت وجه." />
        <meta property="og:title" content="دوره جذب مشتری با تبلیغات اینستاگرامی" />
        <meta property="og:description" content="سیستم پایدار جذب مشتری برای بیزینس‌های فارسی‌زبان آمریکا و کانادا — با علی لطفی." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      {/* Top offer bar */}
      <div className="bg-primary px-4 py-2.5 text-center text-sm font-bold text-primary-foreground">
        <Sparkles className="ml-1 inline h-4 w-4" />
        پیشنهاد ویژه رونمایی: {fa(discount)}٪ تخفیف — فقط برای بیزینس‌های فارسی‌زبان آمریکا و کانادا
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-b from-secondary via-background to-background px-4 pb-10 pt-4">
        <div className="mx-auto max-w-md text-center">

          <div className="mt-3 rounded-3xl bg-card p-4 shadow-ios">
          <h1 className="text-[26px] font-black leading-[1.6] text-foreground">
            {isShort ? "سیستم" : "نقشه راه"} جذب <span className="text-primary">مشتری‌های جدید</span> با تبلیغات اینستاگرامی
          </h1>
          <div className="mt-2 flex items-center justify-center gap-2">
            <HintArrow dir="down" />
            <p className={`whitespace-nowrap text-[13px] font-bold leading-6 ${isShort ? "text-primary" : "text-foreground/80"}`}>
              {isShort ? "همین الان ۱۱ دقیقه ببین" : "۵۰ دقیقه آموزش قدم‌به‌قدم جذب مشتری پایدار"}
            </p>
            <HintArrow dir="down" />
          </div>

          <div className="mt-4 overflow-hidden rounded-3xl bg-foreground shadow-ios">
            <div className="relative aspect-video w-full">
              {playing ? (
                <div className="absolute inset-0 overflow-hidden">
                  {/* Frame mask: oversize the embed so YouTube's top title bar and bottom-corner branding are cropped out */}
                  <TrackedIframe
                    className="absolute left-0 top-[-60px] w-full"
                    style={{ height: "calc(100% + 120px)" }}
                    src={`https://www.youtube-nocookie.com/embed/${VSL_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&fs=1&disablekb=0`}
                    title="نقشه راه جذب مشتری با تبلیغات اینستاگرامی"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <button type="button" onClick={() => VSL_ID && setPlaying(true)} className="absolute inset-0 h-full w-full" aria-label="پخش ویدیو">
                  <img src={vslCover.url} alt="نقشه راه جذب مشتری با تبلیغات اینستاگرامی" className="h-full w-full object-cover" />
                  <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary shadow-ios transition active:scale-95">
                    <Play className="h-9 w-9 translate-x-0.5 fill-primary-foreground text-primary-foreground" />
                  </span>
                </button>
              )}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-center gap-2">
            <HintArrow dir="up" className="mt-5 min-[430px]:mt-0" />
            <div className="flex flex-col items-center gap-1 min-[430px]:flex-row min-[430px]:items-center min-[430px]:gap-2">
              <p className="text-xs text-foreground/70">🔊 صدا را روشن کنید</p>
              <p className="inline-flex whitespace-nowrap rounded-full bg-secondary px-3 py-1 text-[12px] font-extrabold text-foreground">بدون ریلز روزانه · بدون هزینه آژانس</p>
            </div>
            <HintArrow dir="up" className="mt-5 min-[430px]:mt-0" />
          </div>
          </div>

          <div className="mt-4 rounded-3xl bg-primary/10 px-4 py-4">
            <p className="text-xs font-bold text-primary">برنامه‌ای که در ویدیو معرفی شد</p>
            <p className="mt-1 text-lg font-black leading-7 text-foreground">دوره ۴ هفته‌ای جدید آکادمی رایلو</p>
            <p className="mt-2 inline-block whitespace-nowrap rounded-full bg-primary px-4 py-1.5 text-[clamp(15px,5vw,24px)] font-black leading-tight text-primary-foreground shadow-ios">جذب مشتری با تبلیغات اینستاگرامی</p>
            <div className="mt-3 flex items-center justify-center gap-0.5 text-[9px] font-bold min-[360px]:text-[10.5px] min-[400px]:text-[12px]">
              {[
                [Clock, "۴ هفته"], [Video, "۴ لایو ۲ ساعته"], [BookOpen, "۶ پلی‌بوک"], [MessageCircle, "پشتیبانی چت"],
              ].map(([Icon, t], i) => {
                const I = Icon as typeof Clock;
                return (
                  <span key={i} className="flex items-center justify-center gap-1 whitespace-nowrap rounded-xl bg-card px-1 py-2 shadow-ios min-[400px]:px-2">
                    <I className="h-3.5 w-3.5 shrink-0 text-primary" /> {t as string}
                  </span>
                );
              })}
            </div>
            <div className="mt-4">
              <CTA onClick={checkout} loading={loading} price={price.now} was={price.was} />
              {isShort ? (
                <div dir="ltr" className="mt-3 flex items-center justify-center gap-2 whitespace-nowrap text-[11px] font-medium text-foreground/75">
                  <span className="flex items-center gap-1"><Lock className="h-3 w-3" />Secure payment · <span className="font-bold text-[#635BFF]">Stripe</span></span>
                  <span className="text-foreground/30">|</span>
                  <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-primary" />Instant access</span>
                </div>
              ) : (
                <p className="mt-2 text-xs leading-6 text-foreground/80">{CURRENCY_NOTE}</p>
              )}
              <span className="mt-2 inline-flex max-w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-success/15 px-3 py-2 text-[11px] font-extrabold text-success min-[360px]:text-[12.5px] min-[400px]:text-sm">
                <Shield className="h-4 w-4 shrink-0" /> ۳۰ روز ضمانت بازگشت کامل وجه، بدون هیچ سؤالی
              </span>
            </div>
          </div>


          {schedule.length > 0 && (
            <div className="mt-6 rounded-3xl bg-card p-4 text-right shadow-ios">
              <p className="flex items-center gap-1.5 text-base font-extrabold text-foreground"><Calendar className="h-5 w-5 text-primary" /> زمان جلسه‌های لایو دوره بعد</p>
              <div className="mt-3 space-y-2">
                {schedule.map((s, i) => (
                  <div key={i} className="rounded-2xl bg-secondary px-3 py-2.5">
                    <p className="text-sm font-extrabold text-foreground">جلسه {fa(i + 1)} — {s.date}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5 text-xs font-bold">
                      <span className="rounded-full bg-card px-2.5 py-1 text-foreground">🇺🇸🇨🇦 غرب: <span className="text-primary">{s.pt}</span></span>
                      <span className="rounded-full bg-card px-2.5 py-1 text-foreground">🇺🇸🇨🇦 شرق: <span className="text-primary">{s.et}</span></span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs leading-6 text-foreground/80">غرب = لس‌آنجلس/ونکوور · شرق = نیویورک/تورنتو. جلسه‌ها آنلاین در گوگل میت برگزار میشن و ضبط هر جلسه روز بعد در اپ در دسترسه.</p>
            </div>
          )}
        </div>
      </section>

      <AcquisitionSections schedule={schedule} offerFooter={(
          <div className="mt-6 rounded-3xl bg-foreground p-6 text-center text-background shadow-ios">
            <p className="text-sm font-bold opacity-80">شهریه اصلی</p>
            <p className="text-2xl font-bold line-through opacity-60">{fa(price.was)} دلار آمریکا</p>
            <p className="mt-3 text-sm font-bold">سهم شما امروز</p>
            <p className="text-5xl font-black text-primary">{fa(price.now)}<span className="text-2xl"> دلار آمریکا</span></p>
            {discount > 0 && <p className="mt-2 inline-block rounded-full bg-primary px-4 py-1 text-sm font-bold text-primary-foreground">{fa(discount)}٪ تخفیف رونمایی</p>}
            <p className="mt-3 text-xs leading-6 opacity-80">{CURRENCY_NOTE}</p>
            <div className="mt-6">
              <CTA onClick={checkout} loading={loading} price={price.now} was={price.was} />
            </div>
            <p className="mt-3 text-xs opacity-70">هزینه اجرای تبلیغات جداست و به بودجه‌ای که خودت انتخاب می‌کنی بستگی داره.</p>
          </div>
      )} />

      {/* Final CTA */}
      <section className="px-4 pb-32 pt-10 text-center">
        <div className="mx-auto max-w-md">
          <h2 className="text-[22px] font-extrabold leading-[1.7]">دو راه داری</h2>
          <p className="mt-3 text-[15px] leading-8 text-muted-foreground">
            می‌تونی خودت با آزمون و خطا راهش رو پیدا کنی — برای من ۳ سال طول کشید.
            یا می‌تونی از روشی استفاده کنی که برای بیش از ۲۰۰ بیزینس جواب داده، با پشتیبانی کنارت، و در کمتر از یک ماه سیستم جذب مشتری خودت رو راه بندازی.
          </p>
          <div className="mt-8">
            <CTA onClick={checkout} loading={loading} price={price.now} was={price.was} />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">۳۰ روز ضمانت بازگشت وجه · پرداخت امن با Stripe</p>
        </div>
      </section>

      {/* Sticky mobile bar */}
      <div className={`fixed inset-x-0 bottom-0 z-50 bg-card/95 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-3 shadow-ios backdrop-blur transition-transform ${showSticky ? "translate-y-0" : "translate-y-full"}`}>
        <div className="flex items-center gap-3">
          <div className="shrink-0 text-center">
            <p className="text-xs text-muted-foreground line-through">{fa(price.was)}$</p>
            <p className="text-xl font-black text-primary">{fa(price.now)}$</p>
          </div>
          <Button onClick={checkout} disabled={loading} className="h-12 flex-1 rounded-2xl text-base font-extrabold active:scale-[0.98]">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "ثبت‌نام در دوره"}
          </Button>
        </div>
      </div>
    </div>
  );
}
