import type { ReactNode } from "react";
import { Check, X, Shield, Play, Video, BookOpen, MessageCircle, Calendar, Target,
  PenLine, Megaphone, TrendingUp, Gift, Clock, Users, BarChart3, Rocket, Wallet, Repeat } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
const fa = (n: number) => n.toLocaleString("fa-IR");
export type AcquisitionSession = { date: string; pt: string; et: string };
function SectionTitle({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto mb-6 max-w-md text-center">
      {eyebrow && <p className="mb-2 text-sm font-bold text-primary">{eyebrow}</p>}
      <h2 className="text-[22px] font-extrabold leading-[1.7] text-foreground">{title}</h2>
      {sub && <p className="mt-2 text-[15px] leading-7 text-muted-foreground">{sub}</p>}
    </div>
  );
}

const SITUATIONS = [
  { title: "تبلیغ می‌کنی، ولی سود نمی‌کنی", body: "پول خرج می‌کنی، ولی مشتری و درآمدی که برمی‌گرده کافی نیست." },
  { title: "امتحان کردی و رها کردی", body: "ویو و دایرکت گرفتی، ولی آخرش دیدی به‌صرفه نیست و کنارش گذاشتی." },
  { title: "هنوز شروع نکردی", body: "نمی‌دونی از کجا شروع کنی و نمی‌خوای پولت بی‌نتیجه بسوزه." },
];

const MISTAKES = [
  { icon: BarChart3, title: "ردیابی نتایج", body: "پیتزافروشی که فکر می‌کرد هر مشتری ۱۰ دلار براش گرون تموم میشه و تبلیغ رو خاموش کرد. وقتی خرید تکراری و ارزش هر مشتری رو حساب کرد و تبلیغش رو بهتر کرد، هزینه جذب هر مشتری به ۴ دلار رسید." },
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
  { n: 4, icon: TrendingUp, title: "پلی‌بوک پروفایل اینستاگرام", items: ["تبدیل پروفایل اینستاگرام به دارایی جذب مشتری بیزینست", "چیدمان بایو، هایلایت‌ها و پست‌های پین‌شده برای معرفی روشن پیشنهادت", "ساخت مسیر اعتماد و اقدام؛ از بازدید پروفایل تا دایرکت و خرید"] },
];

const STACK = [
  { icon: Video, title: "۴ جلسه لایو ورکشاپی", body: "هر هفته یک جلسه ۲ ساعته با علی لطفی، همراه با پرسش و پاسخ مستقیم" },
  { icon: Play, title: "۶ ساعت آموزش ضبط‌شده", body: "از همین امروز دسترسی داری؛ Ads Manager، محتوا، پیام‌نویسی و ردیابی" },
  { icon: BookOpen, title: "۶ پلی‌بوک و ورک‌بوک", body: "راهنمای قدم‌به‌قدم به روش آیکیا؛ با صفحه خالی تنها نمی‌مونی" },
  { icon: MessageCircle, title: "۴ هفته پشتیبانی تخصصی در چت", body: "بازخورد روی تمرین‌ها و کمک در ردیابی و اصلاح تبلیغت" },
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
  { q: "هفته‌ای چقدر وقت لازم دارم؟", a: "هر هفته یک جلسه ۲ ساعته، به‌اضافه زمانی که برای اجرای تمرین‌ها روی بیزینس خودت می‌ذاری. هدف اینه که در ۴ هفته سیستم جذب مشتریت راه بیفته." },
  { q: "باید محتوای زیاد یا ریلز روزانه بسازم؟", a: "نه. به‌جای ۳۰ پست و ریلز، یک محتوای مخصوص جذب مشتری می‌سازی که بارها و بارها ازش استفاده می‌کنی." },
  { q: "شما آژانس هستید و تبلیغ منو اجرا می‌کنید؟", a: "نه. آکادمی رایلو سرویس تبلیغاتی نمیده؛ آموزش میده، چون وقتی صاحب بیزینس خودش سوار کار باشه، نتیجه خیلی بهتری می‌گیره. ولی در تمام مسیر پشتیبانی کنارت هست." },
  { q: "بعد از پرداخت چه اتفاقی می‌افته؟", a: "وارد صفحه تأیید پرداخت میشی و راهنمای دسترسی به آموزش‌ها، جلسات لایو، پشتیبانی و هدایا رو همون‌جا می‌بینی." },
  { q: "گارانتی بازگشت وجه چطوریه؟", a: "۳۰ روز فرصت داری. اگه به هر دلیلی این برنامه مناسبت نبود، با یک پیام به پشتیبانی کل مبلغ رو بدون هیچ سؤالی پس می‌گیری." },
];

export function AcquisitionSections({ schedule = [], offerFooter }: { schedule?: AcquisitionSession[]; offerFooter?: ReactNode }) {
  return <div dir="rtl" className="font-farsi text-foreground">
      {/* Situations */}
      <section className="px-4 py-8">
        <div className="mx-auto max-w-md">
          <SectionTitle eyebrow="کجای مسیر هستی؟" title="احتمالاً الان توی یکی از این سه وضعیتی" sub="در هر سه حالت مسئله یکیه: بیزینست مشتری جدید لازم داره، ولی هنوز روشی نداری که بشه روش حساب کرد." />
          <div className="space-y-3">
            {SITUATIONS.map((s, i) => (
              <div key={i} className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-ios">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary font-black text-primary">{fa(i + 1)}</span>
                <div>
                  <h3 className="font-extrabold leading-7">{s.title}</h3>
                  <p className="mt-0.5 text-sm leading-7 text-muted-foreground">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-2xl bg-secondary p-4 text-center text-[15px] font-bold leading-8 text-foreground">
            و در همین حال، رقیبی که راه جذب مشتری رو بلده، داره به مشتری‌هایی می‌رسه که می‌تونستن مشتری تو باشن.
          </p>
        </div>
      </section>

      {/* Curriculum (what you'll build) — placed before the mistakes so the program is tangible early */}
      <section className="bg-muted/50 px-4 py-8">
        <div className="mx-auto max-w-md">
          <SectionTitle eyebrow="دوره ۴ هفته‌ای جذب مشتری با تبلیغات اینستاگرامی" title="در ۴ هفته، سیستم جذب مشتری بیزینست رو می‌سازی" sub="هر هفته یک جلسه لایو ۲ ساعته؛ بین جلسه‌ها روی بیزینس خودت اجرا می‌کنی، با پشتیبانی ما." />
          <div className="space-y-3">
            {WEEKS.map((w, i) => (
              <div key={w.n} className="rounded-2xl bg-card p-4 shadow-ios">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">هفته {fa(w.n)}</span>
                  <w.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-3 text-lg font-extrabold">{w.title}</h3>
                {schedule[i] && (
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-primary"><Calendar className="h-3.5 w-3.5" /> لایو: {schedule[i].date}</p>
                )}
                <ul className="mt-3 space-y-2">
                  {w.items.map((it) => (
                    <li key={it} className="flex items-start gap-2 text-sm leading-7 text-muted-foreground">
                      <Check className="mt-1.5 h-4 w-4 shrink-0 text-success" /> {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-3xl bg-card p-5 shadow-ios">
            <h3 className="mb-2 font-extrabold">کمکی که در این ۴ هفته می‌گیری</h3>
            {STACK.map((s) => (
              <div key={s.title} className="flex items-start gap-3 py-2">
                <s.icon className="mt-1 h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm font-bold leading-7">{s.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 mistakes */}
      <section className="px-4 py-8">
        <div className="mx-auto max-w-md">
          <SectionTitle eyebrow="چک‌لیست شکست تبلیغات" title="۶ اشتباهی که دلیل ۹۰٪ شکست تبلیغات اینستاگرامی است" sub="همون اشتباه‌هایی که توی ویدیو گفتیم — در دوره، کمپین خودت رو با این چک‌لیست بررسی می‌کنیم." />
          <div className="space-y-2">
            {MISTAKES.map((m, i) => (
              <div key={i} className="rounded-2xl bg-card p-3.5 shadow-ios">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
                    <m.icon className="h-4 w-4 text-destructive" />
                  </span>
                  <h3 className="font-extrabold">{fa(i + 1)}. {m.title}</h3>
                </div>
                <p className="mt-2 text-sm leading-7 text-muted-foreground">{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IKEA */}
      <section className="bg-muted/50 px-4 py-8">
        <div className="mx-auto grid max-w-md gap-6">
          <div>
            <p className="mb-2 text-sm font-bold text-primary">متد آیکیا</p>
            <h2 className="text-[22px] font-extrabold leading-[1.7]">لازم نیست دیجیتال مارکتر باشی</h2>
            <p className="mt-3 text-[15px] leading-8 text-muted-foreground">
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

      {/* Results */}
      <section className="px-4 py-8">
        <div className="mx-auto max-w-md">
          <SectionTitle eyebrow="نتیجه این روش" title="ثبات، حق انتخاب، و سقف درآمدی که دست خودته" />
          <div className="space-y-3">
            {[
              { icon: TrendingUp, t: "ثبات", b: "اگه این هفته از ۱۰۰ نفر، ۱۰ نفر مشتری شدن، هفته بعد هم می‌دونی تقریباً چی در انتظارته." },
              { icon: Target, t: "حق انتخاب", b: "ظرفیتت پره؟ کمش کن. مسافرتی؟ خاموشش کن. برگشتی؟ دوباره روشنش کن." },
              { icon: Rocket, t: "رشد", b: "ظرفیتت دو برابر شد؟ پخش تبلیغ رو بیشتر می‌کنی و ظرفیت جدیدت رو پر می‌کنی." },
            ].map((r) => (
              <div key={r.t} className="flex items-start gap-3 rounded-2xl bg-card p-4 shadow-ios">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-secondary"><r.icon className="h-5 w-5 text-primary" /></span>
                <div>
                  <h3 className="font-extrabold">{r.t}</h3>
                  <p className="mt-0.5 text-sm leading-7 text-muted-foreground">{r.b}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-5 rounded-2xl bg-secondary p-4 text-center text-[15px] leading-8 text-muted-foreground">
            <strong className="text-foreground">پول تبلیغات هزینه نیست؛ سرمایه در گردشه.</strong> اول دوره می‌ذاری، و تا آخر دوره باید اصل پول و سودش برگرده — وگرنه جایی از فرمول باید اصلاح بشه.
          </p>
        </div>
      </section>

      {/* Testimonials placeholder */}
      <section className="bg-muted/50 px-4 py-8">
        <div className="mx-auto max-w-md">
          <SectionTitle eyebrow="نتایج شاگردها" title="بیش از ۲۰۰ بیزینس در آمریکا و کانادا با این روش کار می‌کنن" />
          <div className="flex h-36 items-center justify-center rounded-2xl bg-card shadow-ios">
            <div className="text-center text-muted-foreground">
              <Users className="mx-auto h-10 w-10 text-primary" />
              <p className="mt-3 font-bold">ویدیوی رضایت شاگردها به‌زودی</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Ali */}
      <section className="px-4 py-8">
        <div className="mx-auto max-w-md rounded-3xl bg-card p-6 shadow-ios">
          <p className="text-sm font-bold text-primary">مدرس دوره</p>
          <h2 className="mt-2 text-2xl font-extrabold">علی لطفی</h2>
          <p className="mt-1 text-muted-foreground">بنیان‌گذار آکادمی رایلو · کالیفرنیا</p>
          <p className="mt-4 text-[15px] leading-8 text-muted-foreground">
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
      <section className="bg-muted/50 px-4 py-8">
        <div className="mx-auto max-w-md">
          <SectionTitle title="این برنامه برای کیه؟" />
          <div className="space-y-3">
            <div className="rounded-2xl bg-card p-5 shadow-ios">
              <h3 className="mb-3 text-lg font-extrabold text-success">✓ مناسب توئه اگه...</h3>
              {FOR_YOU.map((t) => (
                <div key={t} className="flex items-start gap-3 py-2"><Check className="mt-1.5 h-4 w-4 shrink-0 text-success" /><p className="text-[15px] leading-7">{t}</p></div>
              ))}
            </div>
            <div className="rounded-2xl bg-card p-5 shadow-ios">
              <h3 className="mb-3 text-lg font-extrabold text-destructive">✗ مناسب تو نیست اگه...</h3>
              {NOT_FOR_YOU.map((t) => (
                <div key={t} className="flex items-start gap-3 py-2"><X className="mt-1.5 h-4 w-4 shrink-0 text-destructive" /><p className="text-[15px] leading-7">{t}</p></div>
              ))}
            </div>
          </div>
          <div className="mt-3 rounded-2xl bg-card p-5 shadow-ios">
            <h3 className="mb-3 text-center text-lg font-extrabold">بیزینس‌هایی که با این روش مشتری می‌گیرن</h3>
            <div className="flex flex-wrap justify-center gap-2">
              {BUSINESSES.map((b) => (
                <span key={b} className="rounded-full bg-secondary px-3 py-1.5 text-[13px] font-bold">{b}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Offer */}
      <section id="offer" className="px-4 py-8">
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

          {offerFooter}

        </div>
      </section>

      {/* Guarantee */}
      <section className="px-4 pb-10">
        <div className="mx-auto max-w-md rounded-3xl border-2 border-dashed border-success bg-card p-6 text-center shadow-ios">
          <Shield className="mx-auto h-14 w-14 text-success" />
          <h2 className="mt-3 text-xl font-extrabold">۳۰ روز ضمانت ۱۰۰٪ بازگشت وجه</h2>
          <p className="mt-3 text-[15px] leading-8 text-muted-foreground">
            انگار ۳۰ روز پولت پیش ما امانته. ثبت‌نام کن، آموزش‌ها رو ببین و با برنامه آشنا شو. اگه به هر دلیلی مناسبت نبود، کل مبلغ رو بدون هیچ سؤالی پس می‌گیری. همه ریسک با ماست.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/50 px-4 py-8">
        <div className="mx-auto max-w-md">
          <SectionTitle eyebrow="سؤال‌های پرتکرار" title="هنوز سؤالی داری؟" />
          <Accordion type="single" collapsible className="space-y-3">
            {FAQ.map((f, i) => (
              <AccordionItem key={i} value={`f${i}`} className="rounded-2xl border-0 bg-card px-5 shadow-ios">
                <AccordionTrigger className="text-right font-extrabold leading-8 active:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="leading-8 text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

  </div>;
}
