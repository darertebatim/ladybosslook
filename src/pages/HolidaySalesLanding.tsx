import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import { Calendar, Check, CheckCircle2, ClipboardList, FileText, Gift, ListChecks, Loader2, Lock, Play, Rocket, Target, Video, CalendarDays, TrendingUp, Users, RefreshCw, MessageCircle, Repeat, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrackedIframe } from "@/components/TrackedIframe";
import { supabase, browserTimezone } from "@/integrations/supabase/client";
import { trackInitiateCheckout } from "@/lib/metaPixel";
import coverAsset from "@/assets/year-end-sales-workshop-cover.webp.asset.json";

const PROGRAM_SLUG = "HolidaySalesActionPlanWorkshop";
const WORKSHOP_TITLE = "ورکشاپ پلن فروش آخر سال";
const VSL_ID = "MnaNMy2xQMU";
const fa = (n: number) => n.toLocaleString("fa-IR");

type Session = { date: string; pt: string; et: string };

function useWorkshop() {
  const [info, setInfo] = useState<{ now: number; was: number; title: string }>({ now: 19, was: 40, title: WORKSHOP_TITLE });
  const [sessions, setSessions] = useState<Session[]>([]);
  useEffect(() => {
    supabase.from("program_catalog").select("price_amount, original_price, title").eq("slug", PROGRAM_SLUG).maybeSingle()
      .then(({ data }) => {
        if (data) setInfo({ now: (data.price_amount ?? 1900) / 100, was: (data.original_price ?? 0) / 100, title: data.title || WORKSHOP_TITLE });
      });
    supabase.from("program_rounds").select("first_session_date").eq("program_slug", PROGRAM_SLUG)
      .gt("first_session_date", new Date(Date.now() - 2 * 86400000).toISOString())
      .order("first_session_date", { ascending: true }).limit(1).maybeSingle()
      .then(({ data }) => {
        if (!data?.first_session_date) return;
        const first = new Date(data.first_session_date).getTime();
        const d = new Intl.DateTimeFormat("fa-IR-u-ca-gregory", { timeZone: "America/Los_Angeles", weekday: "long", day: "numeric", month: "long" });
        const t = (tz: string) => new Intl.DateTimeFormat("fa-IR", { timeZone: tz, hour: "numeric", minute: "2-digit" });
        setSessions([0, 1].map((i) => {
          const at = new Date(first + i * 86400000);
          return { date: d.format(at), pt: t("America/Los_Angeles").format(at), et: t("America/New_York").format(at) };
        }));
      });
  }, []);
  return { ...info, sessions };
}

const DAY1 = [
  "یک محصول یا خدمت رو برای تمرکز در این فصل انتخاب می‌کنی.",
  "مشخص می‌کنی پیشنهادت برای چه گروهی از مشتری‌هاست.",
  "پیشنهادت رو می‌سازی؛ مثل پکیج خدمات، خرید هدیه، رزرو زودتر یا یک مزیت ویژه.",
  "دلیل مشخصی برای اقدام مشتری در نظر می‌گیری؛ بر اساس زمان، ظرفیت یا شرایط واقعی پیشنهادت.",
  "مشخص می‌کنی کدوم فرصت‌ها برات مناسب‌ترن: مشتری‌های قبلی، پرس‌وجوکننده‌ها یا مشتری‌های جدید.",
];
const DAY2 = [
  "پیامی که برای مشتری‌های قبلی می‌فرستی تا دوباره سراغت بیان.",
  "برنامه پیگیری کسایی که سؤال پرسیدن اما خرید نکردن.",
  "پست‌ها، استوری‌ها و ایمیل‌هایی که برای معرفی پیشنهادت لازم داری.",
  "جای تبلیغ اینستاگرامی در برنامه‌ات و چیزهایی که قبلش باید آماده باشه.",
  "بررسی مسیر سفارش، رزرو یا تماس تا مشتری بدونه قدم بعدی چیه.",
  "چیدن کارها در یک برنامه هفتگی، متناسب با زمان و ظرفیت خودت.",
];
const OUTPUTS = [
  { icon: Target, title: "پیشنهاد فروش آخر سالت", body: "چی می‌فروشی، به چه کسی و با چه دلیلی برای اقدام." },
  { icon: CalendarDays, title: "برنامه هفتگی کسب‌وکارت", body: "کی به مشتری‌های قبلی پیام بدی، پیگیری کنی، محتوا بذاری و در صورت نیاز تبلیغ کنی." },
  { icon: ListChecks, title: "چک‌لیست آماده‌سازی", body: "پیام‌ها، محتوای معرفی، لینک رزرو یا سفارش و شرایط پیشنهاد." },
  { icon: Repeat, title: "پلن پیش‌فروش ماه‌های بعد", body: "چطور از همین فصل، برای درآمد بعد از سال نو هم رزرو و پیش‌فروش بگیری." },
  { icon: ClipboardList, title: "اولویت‌بندی کارها", body: "اینکه کدوم کارها مهم‌ترن و کدوم‌ها رو می‌تونی کنار بذاری." },
];

const BENEFITS = [
  { icon: TrendingUp, title: "فروش بیشتر در پرخریدترین فصل سال", body: "وقتی مشتری‌ها آماده خرج‌کردن‌ان، پیشنهادت به‌موقع جلوشونه." },
  { icon: CalendarDays, title: "پرشدن ظرفیت‌ها و نوبت‌های خالی", body: "قبل از اینکه مشتری وقتش رو جای دیگه رزرو کنه." },
  { icon: RefreshCw, title: "برگشتن مشتری‌های قبلی", body: "کسایی که مدتیه سراغت نیومدن، با یک دلیل مشخص برمی‌گردن." },
  { icon: MessageCircle, title: "خرید از کسایی که فقط قیمت پرسیدن", body: "با پیگیری به‌موقع، پرس‌وجوها به خرید تبدیل می‌شن." },
  { icon: Users, title: "دیده‌شدن توسط آدم‌های جدید", body: "خیلی‌ها این فصل برای اولین بار با کسب‌وکارت آشنا می‌شن." },
  { icon: CalendarDays, title: "درآمد بعد از سال نو، با پیش‌فروش", body: "با پیش‌فروش یا رزرو خدمات برای ماه‌های بعد، رکود ژانویه رو هم پوشش می‌دی." },
  { icon: Repeat, title: "مشتری‌هایی که بعد از تعطیلات هم می‌مونن", body: "خرید امروز، شروع یک رابطه بلندمدته؛ نه فقط یک فروش." },
];
const LOSSES = [
  "مشتری خریدش رو کرده و بودجه‌اش رو جای دیگه خرج کرده.",
  "وقتش رو با یک کسب‌وکار دیگه رزرو کرده که زودتر پیشنهاد داده.",
  "با عجله تخفیف می‌دی و سودت رو می‌سوزونی، بدون نتیجه‌ای که انتظار داشتی.",
  "نوبت‌ها یا محصولاتی که می‌خواستی بفروشی، خالی و فروش‌نرفته می‌مونن.",
  "فرصت آشناشدن مشتری‌های جدید با کسب‌وکارت، تا سال بعد از دست می‌ره.",
];

function CTA({ onClick, loading, now, was }: { onClick: () => void; loading: boolean; now: number; was: number }) {
  return (
    <Button data-main-cta size="lg" onClick={onClick} disabled={loading}
      className="h-14 w-full rounded-2xl px-3 text-[15px] font-extrabold shadow-ios active:scale-[0.98]">
      {loading ? <Loader2 className="ml-1.5 h-4 w-4 animate-spin" /> : <Rocket className="ml-1.5 h-4 w-4" />}
      {loading ? "در حال انتقال به پرداخت..." : (
        <span className="flex items-center gap-1.5">
          ثبت‌نام در ورکشاپ —
          {was > now && <span className="text-xs font-bold line-through opacity-70">{fa(was)}</span>}
          <span>{fa(now)} دلار</span>
        </span>
      )}
    </Button>
  );
}

function TrustRow() {
  return (
    <div dir="ltr" className="mt-3 flex items-center justify-center gap-2 whitespace-nowrap text-[11px] font-medium text-foreground/75">
      <span className="flex items-center gap-1"><Lock className="h-3 w-3" />Secure payment · <span className="font-bold text-primary">Stripe</span></span>
      <span className="h-3 w-px bg-border" />
      <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Instant access</span>
    </div>
  );
}

export default function HolidaySalesLanding() {
  const { now, was, title, sessions } = useWorkshop();
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const off = was > now ? Math.round((1 - now / was) * 100) : 0;

  useEffect(() => {
    const onScroll = () => {
      const visible = Array.from(document.querySelectorAll("[data-main-cta]")).some((el) => {
        const r = el.getBoundingClientRect();
        return r.top < window.innerHeight && r.bottom > 0;
      });
      setShowSticky(window.scrollY > 600 && !visible);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const checkout = async () => {
    setLoading(true);
    try {
      trackInitiateCheckout({ content_name: PROGRAM_SLUG, value: now, currency: "USD" });
      const { data, error } = await supabase.functions.invoke("create-payment", { body: { program: PROGRAM_SLUG, timezone: browserTimezone } });
      if (error) throw error;
      if (!data?.url) throw new Error("No checkout URL");
      window.location.href = data.url;
    } catch (e) {
      console.error("holidaysales checkout error", e);
      toast.error("خطا در انتقال به پرداخت. لطفاً دوباره تلاش کنید.");
      setLoading(false);
    }
  };

  const PriceBox = (
    <div className="rounded-3xl bg-card p-5 text-center shadow-ios">
      <p className="text-xs font-bold text-primary">ورکشاپ آنلاین زنده · ۲ جلسه ۹۰ دقیقه‌ای</p>
      <div className="mt-2 flex items-center justify-center gap-2">
        {was > now && <span className="text-lg font-bold text-muted-foreground line-through">{fa(was)}$</span>}
        <span className="text-4xl font-black text-foreground">{fa(now)}$</span>
        {off > 0 && <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-black text-primary-foreground">{fa(off)}٪ تخفیف</span>}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[11.5px] font-bold">
        {["۲ جلسه زنده", "فایل برنامه + چک‌لیست", "ضبط جلسات"].map((c) => (
          <span key={c} className="rounded-full bg-secondary px-2.5 py-1 text-foreground">{c}</span>
        ))}
      </div>
      <div className="mt-4"><CTA onClick={checkout} loading={loading} now={now} was={was} /></div>
      <TrustRow />
    </div>
  );

  return (
    <div dir="rtl" className="min-h-screen bg-background font-farsi text-foreground">
      <Helmet>
        <title>{`${title} | از بلک فرایدی تا کریسمس`}</title>
        <meta name="description" content="۲ جلسه آنلاین ۹۰ دقیقه‌ای برای ساختن پیشنهاد فروش، برنامه هفتگی و چک‌لیست اجرایی آخر سال — ویژه کسب‌وکارهای آمریکا و کانادا." />
        <meta property="og:title" content={title} />
        <meta property="og:description" content="از بلک فرایدی تا کریسمس، با برنامه جلو برو." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="bg-primary px-4 py-2.5 text-center text-sm font-bold text-primary-foreground">
        <Gift className="ml-1 inline h-4 w-4" /> فصل فروش آخر سال نزدیکه — برنامه‌ات رو همین هفته آماده کن
      </div>

      <section className="bg-gradient-to-b from-secondary via-background to-background px-4 pb-8 pt-5">
        <div className="mx-auto max-w-md text-center">
          <p className="inline-flex rounded-full bg-card px-3 py-1 text-[12px] font-extrabold text-primary shadow-ios">ورکشاپ ۲ روزه · ویژه آمریکا و کانادا</p>
          <h1 className="mt-3 text-[28px] font-black leading-[1.6]">{title}</h1>
          <p className="mt-1 text-[16px] font-bold text-foreground/80">از بلک فرایدی تا کریسمس، با برنامه جلو برو</p>
          <div className="mt-5 overflow-hidden rounded-3xl bg-foreground shadow-ios">
            <div className="relative aspect-video w-full">
              {playing ? (
                <div className="absolute inset-0 overflow-hidden">
                  {/* Frame mask: oversize the embed so YouTube's top title bar and bottom-corner branding are cropped out */}
                  <TrackedIframe
                    className="absolute left-0 top-[-60px] w-full"
                    style={{ height: "calc(100% + 120px)" }}
                    src={`https://www.youtube-nocookie.com/embed/${VSL_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&fs=1&disablekb=0`}
                    title={title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <button type="button" onClick={() => setPlaying(true)} className="absolute inset-0 h-full w-full" aria-label="پخش ویدیو">
                  <img src={coverAsset.url} alt={title} className="h-full w-full object-cover" />
                  <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary shadow-ios transition active:scale-95">
                    <Play className="h-9 w-9 translate-x-0.5 fill-primary-foreground text-primary-foreground" />
                  </span>
                </button>
              )}
            </div>
          </div>
          <div className="mt-5">{PriceBox}</div>

          {sessions.length > 0 && (
            <div className="mt-5 rounded-3xl bg-card p-4 text-right shadow-ios">
              <p className="flex items-center gap-1.5 font-extrabold"><Calendar className="h-5 w-5 text-primary" /> زمان جلسه‌ها</p>
              {sessions.map((s, i) => (
                <div key={i} className="mt-3 rounded-2xl bg-secondary p-3">
                  <p className="text-sm font-extrabold">جلسه {fa(i + 1)} — {s.date}</p>
                  <p className="mt-1 text-xs font-bold text-foreground/80">{s.pt} به وقت غرب (PT) · {s.et} به وقت شرق (ET)</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="px-4 py-8">
        <div className="mx-auto max-w-md">
          <h2 className="text-center text-[22px] font-extrabold leading-9">چرا فصل آخر سال این‌قدر مهمه؟</h2>
          <div className="mt-4 space-y-4 text-[15px] leading-8">
            <p>از بلک فرایدی تا کریسمس، خیلی از مشتری‌های تو قراره برای خرید هدیه، مهمونی‌ها، سفر و خدمات موردنیازشون پول خرج کنن.</p>
            <p>این فصل فقط فرصت فروش بیشتر نیست؛ فرصتیه که آدم‌های بیشتری کسب‌وکارت رو ببینن و برای اولین بار ازت خرید کنن.</p>
            <p className="rounded-2xl bg-secondary p-4 font-bold">سؤال اینه: وقتی دارن تصمیم می‌گیرن از کجا خرید کنن، کسب‌وکار تو هم جزو انتخاب‌هاشون هست؟</p>
          </div>
        </div>
      </section>

      <section className="px-4 py-6">
        <div className="mx-auto max-w-md">
          <h2 className="mb-5 text-center text-[22px] font-extrabold leading-9">با برنامه، این فصل برای کسب‌وکارت چی می‌سازه؟</h2>
          <div className="space-y-3">
            {BENEFITS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-3 rounded-3xl bg-card p-4 shadow-ios">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-secondary"><Icon className="h-5 w-5 text-primary" /></span>
                <div>
                  <p className="text-sm font-extrabold leading-6">{title}</p>
                  <p className="mt-0.5 text-xs leading-6 text-foreground/80">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-6">
        <div className="mx-auto max-w-md rounded-3xl bg-card p-5 shadow-ios">
          <h2 className="flex items-center gap-2 text-lg font-extrabold leading-8"><AlertTriangle className="h-5 w-5 shrink-0 text-destructive" /> اگه دیر آماده بشی، چی از دست می‌دی؟</h2>
          <p className="mt-2 text-sm leading-7">یهو می‌بینی بلک فرایدی رسیده، با عجله چند تا استوری و ایمیل می‌فرستی… ولی وقتی پیشنهادت رو می‌بینن:</p>
          <ul className="mt-3 space-y-2">
            {LOSSES.map((t) => (
              <li key={t} className="flex gap-2 text-sm leading-7"><X className="mt-1.5 h-4 w-4 shrink-0 text-destructive" />{t}</li>
            ))}
          </ul>
          <p className="mt-4 rounded-2xl bg-secondary p-3 text-sm font-bold leading-7">ممکنه پیشنهادت بد نبوده باشه؛ فقط دیر آماده شده، به آدم‌های کافی نرسیده یا پیگیری نشده.</p>
        </div>
      </section>

      <section className="px-4 py-8">
        <div className="mx-auto max-w-md space-y-4 text-[15px] leading-8">
          <p>آخر سال، هم سرت شلوغه، هم فرصت‌هایی برای فروش وجود داره که نمی‌خوای از دستشون بدی.</p>
          <p>اما بین رسیدگی به مشتری‌ها و کارهای روزمره، ممکنه پیشنهادت دیر آماده بشه، فرصت خبر دادن به مشتری‌های قبلی رو از دست بدی یا ندونی برای جذب مشتری جدید از کجا شروع کنی.</p>
          <p className="rounded-2xl bg-secondary p-4 font-bold">توی این ورکشاپ، برنامه این چند هفته رو برای کسب‌وکار خودت آماده می‌کنی: چی بفروشی، به چه کسانی پیشنهاد بدی، چی آماده کنی و هر هفته چه کارهایی انجام بدی.</p>
        </div>
      </section>

      <section className="px-4 py-6">
        <div className="mx-auto max-w-md space-y-4">
          {[{ n: 1, title: "پیشنهاد فروش و فرصت‌های کسب‌وکارت رو مشخص کن", items: DAY1, out: "پیش‌نویس پیشنهاد آخر سالت، مخاطب اون و زمان ارائه‌اش." },
            { n: 2, title: "پیشنهادت رو به یک برنامه اجرایی تبدیل کن", items: DAY2, out: "برنامه هفتگی از بلک فرایدی تا کریسمس و چک‌لیست آماده‌سازی." }].map((d) => (
            <div key={d.n} className="rounded-3xl bg-card p-5 shadow-ios">
              <span className="rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">روز {fa(d.n)}</span>
              <h3 className="mt-3 text-lg font-extrabold leading-8">{d.title}</h3>
              <ul className="mt-3 space-y-2">
                {d.items.map((t) => (
                  <li key={t} className="flex gap-2 text-sm leading-7"><Check className="mt-1.5 h-4 w-4 shrink-0 text-primary" />{t}</li>
                ))}
              </ul>
              <p className="mt-3 rounded-2xl bg-secondary p-3 text-sm font-bold leading-7">خروجی: {d.out}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 py-8">
        <div className="mx-auto max-w-md">
          <h2 className="mb-5 text-center text-[22px] font-extrabold">با چی از ورکشاپ خارج می‌شی؟</h2>
          <div className="grid grid-cols-2 gap-3">
            {OUTPUTS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-3xl bg-card p-4 shadow-ios">
                <Icon className="h-6 w-6 text-primary" />
                <p className="mt-2 text-sm font-extrabold leading-6">{title}</p>
                <p className="mt-1 text-xs leading-6 text-foreground/80">{body}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 flex gap-2 rounded-2xl bg-secondary p-4 text-sm leading-7">
            <FileText className="mt-1 h-4 w-4 shrink-0 text-primary" />
            فایل برنامه و چک‌لیست رو می‌گیری و در طول دو جلسه برای کسب‌وکار خودت کاملشون می‌کنی. ضبط هر دو جلسه هم در اختیارت قرار می‌گیره.
          </p>
        </div>
      </section>

      <section className="px-4 py-8">
        <div className="mx-auto max-w-md rounded-3xl bg-card p-5 shadow-ios">
          <p className="text-xs font-bold text-primary">مدرس ورکشاپ</p>
          <h2 className="mt-1 text-lg font-extrabold">علی لطفی</h2>
          <p className="mt-2 text-sm leading-7">هم‌بنیان‌گذار آکادمی رایلو؛ در چند سال گذشته در کنار صدها صاحب کسب‌وکار و متخصص در آمریکا و کانادا برای ساخت سیستم بازاریابی و فروش پایدار کار کرده.</p>
        </div>
      </section>

      <section className="px-4 py-8">
        <div className="mx-auto max-w-md rounded-3xl bg-card p-5 shadow-ios">
          <h2 className="text-lg font-extrabold">این ورکشاپ برای توئه اگر…</h2>
          <ul className="mt-3 space-y-2 text-sm leading-7">
            {["در آمریکا یا کانادا کسب‌وکار داری.", "محصول یا خدمت مشخصی برای فروش داری.", "می‌خوای نوبت‌های خالی رو پر کنی، سفارش بیشتری بگیری یا مشتری‌های قبلی رو برگردونی.", "می‌خوای با چند اقدام مشخص و قابل اجرا جلو بری، نه با حدس."].map((t) => (
              <li key={t} className="flex gap-2"><Check className="mt-1.5 h-4 w-4 shrink-0 text-primary" />{t}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-4 pb-28 pt-4">
        <div className="mx-auto max-w-md">
          <p className="mb-4 flex items-center justify-center gap-1.5 text-center font-extrabold"><Video className="h-5 w-5 text-primary" /> برای ساختن برنامه فروش آخر سالت ثبت‌نام کن</p>
          {PriceBox}
        </div>
      </section>

      {showSticky && (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-background/95 p-3 shadow-ios backdrop-blur">
          <div className="mx-auto max-w-md"><CTA onClick={checkout} loading={loading} now={now} was={was} /></div>
        </div>
      )}
    </div>
  );
}
