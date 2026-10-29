import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import {
  Check, X, Shield, Play, Video, BookOpen, MessageCircle, Calendar, Target,
  PenLine, Megaphone, TrendingUp, Gift, Sparkles, Clock, Users, Award, Loader2,
  BarChart3, Rocket, Wallet, Repeat,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TrackedIframe } from "@/components/TrackedIframe";
import { supabase, browserTimezone } from "@/integrations/supabase/client";
import { trackInitiateCheckout } from "@/lib/metaPixel";

const PROGRAM_SLUG = "casigads";
const VSL_ID = "VwTKgHp8APw";

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

function CTA({ onClick, loading, price, className = "" }: { onClick: () => void; loading: boolean; price: number; className?: string }) {
  return (
    <Button
      size="lg"
      onClick={onClick}
      disabled={loading}
      className={`h-14 w-full rounded-2xl text-base font-extrabold shadow-ios active:scale-[0.98] ${className}`}
    >
      {loading ? <Loader2 className="ml-2 h-5 w-5 animate-spin" /> : <Rocket className="ml-2 h-5 w-5" />}
      {loading ? "در حال انتقال به پرداخت..." : `همین الان ثبت‌نام کن — ${fa(price)} دلار`}
    </Button>
  );
}

function SectionTitle({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto mb-8 max-w-md text-center">
      {eyebrow && <p className="mb-2 text-sm font-bold text-primary">{eyebrow}</p>}
      <h2 className="text-2xl font-extrabold leading-[1.6] text-foreground">{title}</h2>
      {sub && <p className="mt-3 text-base leading-8 text-muted-foreground">{sub}</p>}
    </div>
  );
}

const SITUATIONS = [
  { title: "تبلیغ می‌کنی، ولی سود نمی‌کنی", body: "پول خرج می‌کنی، ولی مشتری و درآمدی که برمی‌گرده کافی نیست." },
  { title: "امتحان کردی و رها کردی", body: "ویو و دایرکت گرفتی، ولی آخرش دیدی به‌صرفه نیست و کنارش گذاشتی." },
  { title: "هنوز شروع نکردی", body: "نمی‌دونی از کجا شروع کنی و نمی‌خوای پولت بی‌نتیجه بسوزه." },
];

const MISTAKES = [
  { icon: BarChart3, title: "ردیابی نتایج", body: "پیتزافروشی که فکر می‌کرد هر مشتری ۱۰ دلار براش گرون تموم میشه و تبلیغ رو خاموش کرد. با محاسبه درست، هزینه جذب هر مشتری به ۴ دلار رسید." },
  { icon: Megaphone, title: "بوست کردن پست", body: "بوست یعنی کنترل نداشتن. نتیجه‌اش لایک و ویوی پرت است. کسایی که مشتری می‌گیرن از Ads Manager استفاده می‌کنن." },
  { icon: Target, title: "مخاطب هدف اشتباه", body: "فقط سن و جنسیت و شهر کافی نیست. Custom Audience و Lookalike کمک می‌کنن تبلیغت مدام به آدم‌های درست‌تر برسه." },
  { icon: Wallet, title: "تنظیمات کمپین", body: "رستورانی که شش ماه روزی ۸۰۰ دلار خرج کرد، در حالی که چندتا از تنظیمات اصلی کمپینش اصلاً مناسب بیزینسش نبود." },
  { icon: PenLine, title: "محتوای تبلیغ", body: "نمونه‌کار، قبل‌وبعد و شوکیس محصول، محتوای جذب مشتری نیست. چیزی که نتیجه می‌سازه، پیام پشت محتواست." },
  { icon: Calendar, title: "نداشتن پلن تبلیغ", body: "هر تبلیغ: یک سفارش، برای یک دسته مشتری، با یک آفر. تبلیغ برای «کل بیزینس» و «کل بازار» شکست می‌خوره." },
];

const WEEKS = [
  { n: 1, icon: Target, title: "پلن تبلیغ", items: ["کدوم محصول یا خدمت رو تبلیغ کنی", "برای کدوم دسته از مشتری‌ها", "با چه آفری که تو رو متمایز کنه"] },
  { n: 2, icon: PenLine, title: "محتوای تبلیغ", items: ["نقشه متقاعدسازی غریبه‌ها برای بیزینس خودت", "نوشتن پیام تبلیغ با فرمول برنده", "ساخت محتوایی که بگن: «همینو می‌خوام، الان»"] },
  { n: 3, icon: Rocket, title: "کمپین تبلیغ", items: ["راه‌اندازی و تنظیمات Ads Manager", "تست با بودجه کم و ردیابی نتیجه", "اصلاح و توسعه کمپین تا نتیجه بگیری"] },
];

const STACK = [
  { icon: Video, title: "۳ جلسه لایو ورکشاپی", body: "هر هفته یک جلسه ۲ ساعته با علی لطفی، همراه با پرسش و پاسخ مستقیم" },
  { icon: Play, title: "۶ ساعت آموزش ضبط‌شده", body: "از همین امروز دسترسی داری؛ Ads Manager، محتوا، پیام‌نویسی و ردیابی" },
  { icon: BookOpen, title: "۶ پلی‌بوک و ورک‌بوک", body: "راهنمای قدم‌به‌قدم به روش آیکیا؛ با صفحه خالی تنها نمی‌مونی" },
  { icon: MessageCircle, title: "۳ هفته پشتیبانی تخصصی در چت", body: "بازخورد روی تمرین‌ها و کمک در ردیابی و اصلاح تبلیغت" },
  { icon: Repeat, title: "ضبط همه جلسات برای همیشه", body: "اگه لایو نبودی یا خواستی مرور کنی، همیشه در دسترسه" },
];

const BONUSES = [
  { title: "پلی‌بوک پروفایل اینستاگرام", body: "پیجت رو طوری آماده کن که هر کسی از تبلیغ اومد، راحت مشتری بشه." },
  { title: "هوش مصنوعی برای صاحبان بیزینس", body: "از AI برای ایده‌پردازی، نوشتن پیام و برنامه‌ریزی محتوا کمک بگیر." },
  { title: "اولویت مصاحبه منتورشیپ بیزینس", body: "برای ورود به برنامه منتورشیپ خصوصی، در اولویت قرار می‌گیری." },
];

const FOR_YOU = [
  "در آمریکا یا کانادا بیزینس داری و محصول یا خدمتت آماده فروشه",
  "پست و ریلز می‌ذاری ولی مشتری کافی نمی‌گیری",
  "قبلاً تبلیغ کردی و نمی‌دونی چرا نتیجه نداد",
  "می‌خوای خودت کنترل جذب مشتری رو دستت بگیری یا کار آژانست رو بفهمی",
];
const NOT_FOR_YOU = [
  "دنبال فالوور، ویو یا اکسپلور هستی، نه مشتری",
  "هنوز محصول یا خدمت مشخصی برای فروش نداری",
  "انتظار معجزه یک‌شبه بدون اجرا و تمرین داری",
];

const BUSINESSES = [
  "سالن زیبایی و کلینیک", "رستوران و کافه", "ساخت‌وساز و بازسازی", "خدمات منزل",
  "املاک و وام", "حسابداری و مالیات", "بیمه و حقوقی", "عکاسی و رویداد",
  "مربیگری و مشاوره", "فروشگاه آنلاین و فیزیکی", "سلامت و تناسب اندام", "آموزش و کلاس",
];

const COMPARE = [
  { label: "آژانس تبلیغاتی", value: "چند ده هزار دلار راه‌اندازی + ماهانه ۱۰,۰۰۰ دلار" },
  { label: "منتورینگ خصوصی علی لطفی", value: "ماهانه بیش از ۵,۰۰۰ دلار" },
  { label: "ورکشاپ‌های مشابه (بدون پشتیبانی)", value: "بیش از ۲,۰۰۰ دلار" },
];

const FAQ = [
  { q: "چه بیزینس‌هایی می‌تونن از این روش مشتری بگیرن؟", a: "تقریباً هر بیزینسی که محصول یا خدمت مشخص و مشتری محلی یا آنلاین در آمریکا و کانادا داره: سالن و کلینیک، رستوران، ساخت‌وساز و خدمات منزل، املاک، حسابداری، بیمه، عکاسی، مربیگری، فروشگاه‌ها و... خیلی‌ها فکر می‌کنن «کار من خاصه»، ولی مشتری‌های تو هم همین الان توی اینستاگرام هستن." },
  { q: "برای تبلیغات چقدر بودجه لازم دارم؟", a: "در فاز یادگیری با عددهای ناچیز (حدود ۵ تا ۱۰ دلار در روز) تست می‌کنیم. وقتی مطمئن شدی بیشتر از هزینه‌ات برمی‌گرده، پله‌پله بودجه رو بالا می‌بری. هزینه تبلیغات جدا از شهریه است." },
  { q: "تا حالا با Ads Manager کار نکردم. می‌تونم؟", a: "بله. لازم نیست کل Ads Manager رو بلد باشی؛ فقط بخشی که به درد بیزینس خودت می‌خوره. حتی در جلسه اول کمک می‌کنیم اولین کمپینت رو بسازی." },
  { q: "دوره به چه زبانیه؟ انگلیسیم قوی نیست.", a: "کل دوره، پلی‌بوک‌ها و پشتیبانی به زبان فارسیه. هر جا اصطلاح انگلیسی در Ads Manager باشه، قدم‌به‌قدم نشونت میدیم کجا رو بزنی." },
  { q: "قبلاً پست بوست کردم یا به آژانس پول دادم و جواب نگرفتم. این چه فرقی داره؟", a: "بوست کنترلی روی مخاطب و تبدیل بهت نمیده. اینجا با چک‌لیست ۶ اشتباه، دقیقاً پیدا می‌کنی کجای کار مشکل داشته و خودت پلن، پیام و کمپین رو می‌سازی." },
  { q: "اگه نتونم سر جلسات لایو باشم چی؟", a: "همه جلسات ضبط میشن و برای همیشه در اپ رایلو در دسترس هستن. آموزش‌های ضبط‌شده هم از روز اول بازه." },
  { q: "هفته‌ای چقدر وقت لازم دارم؟", a: "هر هفته یک جلسه ۲ ساعته، به‌اضافه زمانی که برای اجرای تمرین‌ها روی بیزینس خودت می‌ذاری. هدف اینه که در کمتر از یک ماه سیستم جذب مشتریت راه بیفته." },
  { q: "باید محتوای زیاد یا ریلز روزانه بسازم؟", a: "نه. به‌جای ۳۰ پست و ریلز، یک محتوای مخصوص جذب مشتری می‌سازی که بارها و بارها ازش استفاده می‌کنی." },
  { q: "شما آژانس هستید و تبلیغ منو اجرا می‌کنید؟", a: "نه. آکادمی رایلو سرویس تبلیغاتی نمیده؛ آموزش میده، چون وقتی صاحب بیزینس خودش سوار کار باشه، نتیجه خیلی بهتری می‌گیره. ولی در تمام مسیر پشتیبانی کنارت هست." },
  { q: "بعد از پرداخت چه اتفاقی می‌افته؟", a: "وارد صفحه تأیید پرداخت میشی و راهنمای دسترسی به آموزش‌ها، جلسات لایو، پشتیبانی و هدایا رو همون‌جا می‌بینی." },
  { q: "گارانتی بازگشت وجه چطوریه؟", a: "۳۰ روز فرصت داری. اگه به هر دلیلی این برنامه مناسبت نبود، با یک پیام به پشتیبانی کل مبلغ رو بدون هیچ سؤالی پس می‌گیری." },
];

export default function IgAdsProgramLanding() {
  const price = useProgramPrice();
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const discount = price.was > price.now ? Math.round((1 - price.now / price.was) * 100) : 0;

  useEffect(() => {
    const onScroll = () => setShowSticky(window.scrollY > 700);
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
        <meta name="description" content="در ۳ هفته یاد بگیر با تبلیغات اینستاگرام، برای بیزینست در آمریکا و کانادا مشتری جدید و پایدار جذب کنی. به فارسی، با ۳۰ روز ضمانت بازگشت وجه." />
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
      <section className="bg-gradient-to-b from-secondary via-background to-background px-4 pb-10 pt-10">
        <div className="mx-auto max-w-md text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 text-sm font-bold text-foreground shadow-ios">
            <Award className="h-4 w-4 text-primary" /> آکادمی رایلو · با علی لطفی
          </span>
          <h1 className="mt-5 text-[28px] font-black leading-[1.6] text-foreground">
            نقشه راه جذب <span className="text-primary">مشتری‌های جدید</span> با تبلیغات اینستاگرامی
          </h1>
          <p className="mx-auto mt-4 max-w-md text-base leading-8 text-muted-foreground">
            یک روش مشخص و قابل‌حساب برای پر کردن ظرفیت خالی بیزینست — بدون ریلز روزانه و بدون هزینه‌های سنگین آژانس.
          </p>

          <div className="mt-8 overflow-hidden rounded-3xl bg-foreground shadow-ios">
            <div className="relative aspect-video w-full">
              {playing ? (
                <TrackedIframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube.com/embed/${VSL_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                  title="نقشه راه جذب مشتری با تبلیغات اینستاگرامی"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <button type="button" onClick={() => setPlaying(true)} className="absolute inset-0 h-full w-full" aria-label="پخش ویدیو">
                  <img src={`https://i.ytimg.com/vi/${VSL_ID}/maxresdefault.jpg`} alt="" className="h-full w-full object-cover" />
                  <span className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary shadow-ios transition active:scale-95">
                    <Play className="h-9 w-9 translate-x-0.5 fill-primary-foreground text-primary-foreground" />
                  </span>
                </button>
              )}
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">🔊 صدای ویدیو را روشن کنید — این ویدیو کل نقشه راه را توضیح می‌دهد</p>

          <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm font-bold">
            {[
              [Clock, "۳ هفته"], [Video, "۳ لایو ۲ ساعته"], [BookOpen, "۶ پلی‌بوک"], [MessageCircle, "پشتیبانی چت"],
            ].map(([Icon, t], i) => {
              const I = Icon as typeof Clock;
              return (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-2 shadow-ios">
                  <I className="h-4 w-4 text-primary" /> {t as string}
                </span>
              );
            })}
          </div>

          <div className="mt-8">
            <CTA onClick={checkout} loading={loading} price={price.now} />
            <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <Shield className="h-4 w-4 text-success" /> ۳۰ روز ضمانت بازگشت کامل وجه، بدون هیچ سؤالی
            </p>
          </div>
        </div>
      </section>

      {/* Situations */}
      <section className="px-4 py-10">
        <div className="mx-auto max-w-md">
          <SectionTitle eyebrow="کجای مسیر هستی؟" title="احتمالاً الان توی یکی از این سه وضعیتی" sub="در هر سه حالت مسئله یکیه: بیزینست مشتری جدید لازم داره، ولی هنوز روشی نداری که بشه روش حساب کرد." />
          <div className="grid gap-4">
            {SITUATIONS.map((s, i) => (
              <div key={i} className="rounded-3xl bg-card p-6 shadow-ios">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-lg font-black text-primary">{fa(i + 1)}</span>
                <h3 className="mt-4 text-lg font-extrabold">{s.title}</h3>
                <p className="mt-2 leading-8 text-muted-foreground">{s.body}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-md rounded-2xl bg-secondary p-5 text-center font-bold leading-8 text-foreground">
            و در همین حال، رقیبی که راه جذب مشتری رو بلده، داره به مشتری‌هایی می‌رسه که می‌تونستن مشتری تو باشن.
          </p>
        </div>
      </section>

      {/* 6 mistakes */}
      <section className="bg-muted/50 px-4 py-10">
        <div className="mx-auto max-w-md">
          <SectionTitle eyebrow="چک‌لیست شکست تبلیغات" title="۶ اشتباهی که دلیل ۹۰٪ شکست تبلیغات اینستاگرامی است" sub="با همین چک‌لیست، تبلیغات خودمون و شاگردهامون رو بررسی می‌کنیم." />
          <div className="grid gap-4">
            {MISTAKES.map((m, i) => (
              <div key={i} className="rounded-3xl bg-card p-6 shadow-ios">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10">
                    <m.icon className="h-5 w-5 text-destructive" />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-muted-foreground">اشتباه {fa(i + 1)}</p>
                    <h3 className="text-lg font-extrabold">{m.title}</h3>
                  </div>
                </div>
                <p className="mt-4 leading-8 text-muted-foreground">{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IKEA */}
      <section className="px-4 py-10">
        <div className="mx-auto grid max-w-md gap-6">
          <div>
            <p className="mb-2 text-sm font-bold text-primary">متد آیکیا</p>
            <h2 className="text-2xl font-extrabold leading-[1.6]">لازم نیست دیجیتال مارکتر باشی</h2>
            <p className="mt-4 leading-9 text-muted-foreground">
              وقتی از آیکیا میز می‌خری، لازم نیست نجار باشی؛ کافیه دفترچه راهنما رو دنبال کنی. اینجا هم پلی‌بوک‌ها و چک‌لیست‌ها دقیقاً همین کار رو می‌کنن.
              لازم نیست کل Ads Manager رو بلد باشی — فقط بخشی که به درد بیزینس خودت می‌خوره.
            </p>
          </div>
          <div className="rounded-3xl bg-card p-6 shadow-ios">
            {["مستقیم غریبه‌هایی رو جذب می‌کنی که به کارت نیاز دارن", "بدون نیاز به پست روزانه و جمع کردن فالوور", "یک بار درستش کنی، به‌صورت خودکار برات مشتری میاره"].map((t, i) => (
              <div key={i} className="flex items-start gap-3 py-3">
                <Check className="mt-1 h-5 w-5 shrink-0 text-success" />
                <p className="font-bold leading-8">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="bg-muted/50 px-4 py-10">
        <div className="mx-auto max-w-md">
          <SectionTitle eyebrow="فرمول سه‌مرحله‌ای تبلیغ موفق" title="در ۳ هفته، سیستم جذب مشتری بیزینست رو می‌سازی" sub="هر هفته یک جلسه لایو ۲ ساعته؛ بین جلسه‌ها روی بیزینس خودت اجرا می‌کنی، با پشتیبانی ما." />
          <div className="grid gap-4">
            {WEEKS.map((w) => (
              <div key={w.n} className="rounded-3xl bg-card p-6 shadow-ios">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">هفته {fa(w.n)}</span>
                  <w.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-4 text-xl font-extrabold">{w.title}</h3>
                <ul className="mt-3 space-y-2">
                  {w.items.map((it) => (
                    <li key={it} className="flex items-start gap-2 leading-8 text-muted-foreground">
                      <Check className="mt-1.5 h-4 w-4 shrink-0 text-success" /> {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="px-4 py-10">
        <div className="mx-auto max-w-md">
          <SectionTitle eyebrow="نتیجه این روش" title="ثبات، حق انتخاب، و سقف درآمدی که دست خودته" />
          <div className="grid gap-4">
            {[
              { icon: TrendingUp, t: "ثبات", b: "اگه این هفته از ۱۰۰ نفر، ۱۰ نفر مشتری شدن، هفته بعد هم می‌دونی تقریباً چی در انتظارته." },
              { icon: Target, t: "حق انتخاب", b: "ظرفیتت پره؟ کمش کن. مسافرتی؟ خاموشش کن. برگشتی؟ دوباره روشنش کن." },
              { icon: Rocket, t: "رشد", b: "ظرفیتت دو برابر شد؟ پخش تبلیغ رو بیشتر می‌کنی و ظرفیت جدیدت رو پر می‌کنی." },
            ].map((r) => (
              <div key={r.t} className="rounded-3xl bg-card p-6 text-center shadow-ios">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary"><r.icon className="h-7 w-7 text-primary" /></span>
                <h3 className="mt-4 text-xl font-extrabold">{r.t}</h3>
                <p className="mt-2 leading-8 text-muted-foreground">{r.b}</p>
              </div>
            ))}
          </div>
          <p className="mx-auto mt-8 max-w-md text-center leading-9 text-muted-foreground">
            <strong className="text-foreground">پول تبلیغات هزینه نیست؛ سرمایه در گردشه.</strong> اول دوره می‌ذاری، و تا آخر دوره باید اصل پول و سودش برگرده — وگرنه جایی از فرمول باید اصلاح بشه.
          </p>
        </div>
      </section>

      {/* Testimonials placeholder */}
      <section className="bg-muted/50 px-4 py-10">
        <div className="mx-auto max-w-md">
          <SectionTitle eyebrow="نتایج شاگردها" title="بیش از ۲۰۰ بیزینس در آمریکا و کانادا با این روش کار می‌کنن" />
          <div className="flex aspect-video items-center justify-center rounded-3xl bg-card shadow-ios">
            <div className="text-center text-muted-foreground">
              <Users className="mx-auto h-10 w-10 text-primary" />
              <p className="mt-3 font-bold">ویدیوی رضایت شاگردها به‌زودی</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Ali */}
      <section className="px-4 py-10">
        <div className="mx-auto max-w-md rounded-3xl bg-card p-6 shadow-ios">
          <p className="text-sm font-bold text-primary">مدرس دوره</p>
          <h2 className="mt-2 text-2xl font-extrabold">علی لطفی</h2>
          <p className="mt-1 text-muted-foreground">بنیان‌گذار آکادمی رایلو · کالیفرنیا</p>
          <p className="mt-5 leading-9 text-muted-foreground">
            بیش از ۱۰ سال قبل از مهاجرت بیزینس‌های خودش رو داشت و اینستاگرام هم بلد بود. ولی در آمریکا ۳ سال طول کشید تا به یک سیستم پایدار برای جذب مشتری برسه.
            امروز منتور بیش از ۲۰۰ کارآفرین در آمریکا و کاناداست و همین روش رو قدم‌به‌قدم آموزش میده.
          </p>
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {[["+۱۰", "سال کارآفرینی"], ["+۲۰۰", "بیزینس منتورشده"], ["۳", "سال تجربه در آمریکا تا این متد"]].map(([n, l]) => (
              <div key={l} className="rounded-2xl bg-secondary p-3">
                <p className="text-2xl font-black text-primary">{n}</p>
                <p className="mt-1 text-xs font-bold leading-5">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who for */}
      <section className="bg-muted/50 px-4 py-10">
        <div className="mx-auto max-w-md">
          <SectionTitle title="این برنامه برای کیه؟" />
          <div className="grid gap-4">
            <div className="rounded-3xl bg-card p-6 shadow-ios">
              <h3 className="mb-4 text-lg font-extrabold text-success">✓ مناسب توئه اگه...</h3>
              {FOR_YOU.map((t) => (
                <div key={t} className="flex items-start gap-3 py-2"><Check className="mt-1.5 h-4 w-4 shrink-0 text-success" /><p className="leading-8">{t}</p></div>
              ))}
            </div>
            <div className="rounded-3xl bg-card p-6 shadow-ios">
              <h3 className="mb-4 text-lg font-extrabold text-destructive">✗ مناسب تو نیست اگه...</h3>
              {NOT_FOR_YOU.map((t) => (
                <div key={t} className="flex items-start gap-3 py-2"><X className="mt-1.5 h-4 w-4 shrink-0 text-destructive" /><p className="leading-8">{t}</p></div>
              ))}
            </div>
          </div>
          <div className="mt-8 rounded-3xl bg-card p-6 shadow-ios">
            <h3 className="mb-4 text-center text-lg font-extrabold">بیزینس‌هایی که با این روش مشتری می‌گیرن</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {BUSINESSES.map((b) => (
                <span key={b} className="rounded-full bg-secondary px-4 py-2 text-sm font-bold">{b}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Offer */}
      <section id="offer" className="px-4 py-10">
        <div className="mx-auto max-w-md">
          <SectionTitle eyebrow="هر چیزی که دریافت می‌کنی" title="دوره کامل جذب مشتری با تبلیغات اینستاگرامی" />
          <div className="rounded-3xl bg-card p-6 shadow-ios">
            {STACK.map((s) => (
              <div key={s.title} className="flex items-start gap-4 border-b border-border py-4 last:border-0">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary"><s.icon className="h-5 w-5 text-primary" /></span>
                <div>
                  <h3 className="font-extrabold">{s.title}</h3>
                  <p className="mt-1 leading-7 text-muted-foreground">{s.body}</p>
                </div>
              </div>
            ))}
            <div className="mt-4 rounded-2xl bg-secondary p-5">
              <h3 className="flex items-center gap-2 font-extrabold"><Gift className="h-5 w-5 text-primary" /> هدیه‌های ویژه</h3>
              {BONUSES.map((b) => (
                <div key={b.title} className="mt-3">
                  <p className="font-bold">{b.title}</p>
                  <p className="text-sm leading-7 text-muted-foreground">{b.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-3xl bg-card p-6 shadow-ios">
            <h3 className="mb-3 text-center font-extrabold">در مقایسه با گزینه‌های دیگر</h3>
            {COMPARE.map((c) => (
              <div key={c.label} className="flex flex-col gap-1 border-b border-border py-3 text-sm last:border-0">
                <span className="font-bold">{c.label}</span>
                <span className="text-muted-foreground">{c.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl bg-foreground p-6 text-center text-background shadow-ios">
            <p className="text-sm font-bold opacity-80">شهریه اصلی</p>
            <p className="text-2xl font-bold line-through opacity-60">{fa(price.was)} دلار</p>
            <p className="mt-3 text-sm font-bold">سهم شما امروز</p>
            <p className="text-5xl font-black text-primary">{fa(price.now)}<span className="text-2xl"> دلار</span></p>
            {discount > 0 && <p className="mt-2 inline-block rounded-full bg-primary px-4 py-1 text-sm font-bold text-primary-foreground">{fa(discount)}٪ تخفیف رونمایی</p>}
            <div className="mt-6">
              <CTA onClick={checkout} loading={loading} price={price.now} />
            </div>
            <p className="mt-3 text-xs opacity-70">هزینه اجرای تبلیغات جداست و به بودجه‌ای که خودت انتخاب می‌کنی بستگی داره.</p>
          </div>
        </div>
      </section>

      {/* Guarantee */}
      <section className="px-4 pb-10">
        <div className="mx-auto max-w-md rounded-3xl border-2 border-dashed border-success bg-card p-6 text-center shadow-ios">
          <Shield className="mx-auto h-14 w-14 text-success" />
          <h2 className="mt-4 text-2xl font-extrabold">۳۰ روز ضمانت ۱۰۰٪ بازگشت وجه</h2>
          <p className="mx-auto mt-3 max-w-md leading-9 text-muted-foreground">
            انگار ۳۰ روز پولت پیش ما امانته. ثبت‌نام کن، آموزش‌ها رو ببین و با برنامه آشنا شو. اگه به هر دلیلی مناسبت نبود، کل مبلغ رو بدون هیچ سؤالی پس می‌گیری. همه ریسک با ماست.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/50 px-4 py-10">
        <div className="mx-auto max-w-md">
          <SectionTitle eyebrow="سؤال‌های پرتکرار" title="هنوز سؤالی داری؟" />
          <Accordion type="single" collapsible className="space-y-3">
            {FAQ.map((f, i) => (
              <AccordionItem key={i} value={`f${i}`} className="rounded-2xl border-0 bg-card px-5 shadow-ios">
                <AccordionTrigger className="text-right font-extrabold leading-8 hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="leading-8 text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 pb-32 pt-10 text-center">
        <div className="mx-auto max-w-md">
          <h2 className="text-2xl font-extrabold leading-[1.6]">دو راه داری</h2>
          <p className="mt-4 leading-9 text-muted-foreground">
            می‌تونی خودت با آزمون و خطا راهش رو پیدا کنی — برای من ۳ سال طول کشید.
            یا می‌تونی از روشی استفاده کنی که برای بیش از ۲۰۰ بیزینس جواب داده، با پشتیبانی کنارت، و در کمتر از یک ماه سیستم جذب مشتری خودت رو راه بندازی.
          </p>
          <div className="mt-8">
            <CTA onClick={checkout} loading={loading} price={price.now} />
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
