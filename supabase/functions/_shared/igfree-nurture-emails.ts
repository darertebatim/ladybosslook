// IG Free Webinar ("افزایش مشتری ۲۰۲۷") value emails:
// nurture1 = ~1 day after signup, nurture2 = ~1 day before the live session.
import { waLink } from "./startads-emails.ts";

export type IgFreeNurtureKind = "nurture1" | "nurture2";

export const IGFREE_NURTURE_SUBJECTS: Record<IgFreeNurtureKind, string> = {
  nurture1: "چرا ۲۵ هزار ویو اینستاگرام، اجاره و قسط‌های بیزینس رو نمیده؟ 📱 (یک اشتباه پرهزینه)",
  nurture2: "فردا وبینار زنده داریم ⏳ (۳ فکت مهم درباره مارکت آمریکا و کانادا)",
};
const PREVIEWS: Record<IgFreeNurtureKind, string> = {
  nurture1: "یک داستان واقعی از ارواین کالیفرنیا، و لیست بیزینس‌هایی که این متد برای آنها طراحی شده...",
  nurture2: "یک حساب ساده ریاضی که نشان می‌دهد چرا بیشتر بیزینس‌ها سودشان را می‌سوزانند...",
};

export interface IgFreeNurtureInput {
  kind: IgFreeNurtureKind;
  name: string;
  thankYouUrl: string;
  calendarUrl: string;
  /** Session time already formatted in the registrant's own timezone. */
  localTime: string;
}

const esc = (s: string) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>)[c]);
const R = (t: string) => `<strong style="color:#e11d48;">${t}</strong>`;
const p = (t: string) => `<p dir="rtl" style="margin:0 0 12px;font-size:15px;line-height:2;text-align:right;">${t}</p>`;
const h2 = (t: string) => `<h2 dir="rtl" style="margin:22px 0 10px;font-size:17px;line-height:1.7;text-align:right;">${t}</h2>`;
const btn = (href: string, label: string, bg = "#e11d48") =>
  `<p style="text-align:center;margin:18px 0;"><a href="${esc(href)}" style="display:inline-block;background:${bg};color:#fff;text-decoration:none;padding:14px 26px;border-radius:12px;font-size:16px;font-weight:bold;">${label}</a></p>`;
const box = (inner: string, bg = "#fff", border = "#fde68a") =>
  `<div style="background:${bg};border:1px solid ${border};border-radius:14px;padding:14px 16px;margin:16px 0;">${inner}</div>`;
const SIGN = `<p style="margin:22px 0 0;">ارادتمند،<br/><strong>علی لطفی</strong><br/><span style="color:#64748b;font-size:13px;">Rilo App — Ladybosslook LLC</span></p>`;

export function igFreeNurtureWaText(kind: IgFreeNurtureKind): string {
  return kind === "nurture1"
    ? "سلام، در وبینار افزایش مشتری ۲۰۲۷ ثبت‌نام کرده‌ام. این لینک پیج اینستاگرام منه برای بررسی قبل از وبینار:\n"
    : "سلام، فردا در وبینار افزایش مشتری ۲۰۲۷ شرکت می‌کنم. سوالم اینه:\n";
}

function body1(i: IgFreeNurtureInput, name: string): string {
  return [
    p(`سلام ${name} عزیز، 👋`),
    p("می‌خوام ماجرای واقعی یکی از همکارانمون در ارواین کالیفرنیا رو برات تعریف کنم که احتمالاً برای خودت یا خیلی از اطرافیانت ملموسه:"),
    p("چند ماه پیش با یک خانم طراح داخلی و نقاش دکوراتیو صحبت می‌کردم. کیفیت کارش خیره‌کننده بود؛ نمونه‌کارهای لوکس، اخلاق حرفه‌ای، و دقتی که مشتری‌های آمریکایی عاشقش میشن."),
    p("اما روزمره‌ش تبدیل شده بود به یک شغل دوم طاقت‌فرسا: صبح ۲ ساعت دنبال موزیک‌های ترند اینستاگرام می‌گشت، ظهر ساعت‌ها با نرم‌افزارهای ادیت ویدیو می‌جنگید و بعدازظهر استوری‌های متعدد می‌گذاشت. روزی ۳ تا ۴ ساعت فقط صرف «تولید محتوا» می‌شد."),
    p(`یک روز یکی از ویدیوهاش وایرال شد: ${R("۲۵ هزار بازدید و نزدیک به ۱,۲۰۰ لایک!")} همه براش پیام تبریک می‌فرستادن.`),
    p(`اما وقتی ۲ هفته بعد تقویم نوبت‌هاش رو نگاه کرد، حقیقت تلخ مشخص شد: ${R("حتی ۱ مشتری واقعی از اون ۲۵ هزار نفر ثبت سفارش نکرده بود.")}`),
    p("چرا؟ چون بیشتر اون بیننده‌ها یا در شهرهای دیگه و خارج از محدوده سرویس‌دهی بودن، یا همکارانی که فقط مدل کار رو تشویق می‌کردن، یا آدم‌هایی که برای وقت‌گذرانی ویدیو می‌دیدن — نه آدم‌های محلی با نیاز فوری و توان پرداخت دستمزد واقعی."),
    p(`لایک و ویو اجاره و قسط بیزینس رو پاس نمی‌کنه؛ ${R("مشتری واقعی")} پاس می‌کنه.`),
    h2("این وبینار دقیقاً برای چه بیزینس‌هایی طراحی شده؟"),
    box(`
      ${p("💇‍♀️ <strong>خدمات زیبایی و سلامت:</strong> سالن‌دارها، مژه‌کارها، ناخن‌کارها، فیشیال و اسکین‌کر، میکاپ‌آرتیست‌ها و کلینیک‌های زیبایی.")}
      ${p("🏡 <strong>خدمات منزل و ساخت‌وساز:</strong> طراحی و بازسازی داخلی، نقاشی، کابینت، لوله‌کشی، نظافت منازل و دفاتر، هوم‌استیجینگ و املاک.")}
      ${p("⚖️ <strong>متخصصین و مشاوران:</strong> حسابداران (CPA)، مشاوران مالی و مالیاتی، وکلا، مشاوران مهاجرت، روان‌شناسان و کوچ‌ها.")}
      ${p("📸 <strong>مراسم، رویداد و آموزش:</strong> عکاسان و فیلم‌برداران، کیک‌سازها و کترینگ‌ها، ایونت‌پلنرها، مربیان ورزشی و مدرسین.")}
      ${p("🛍️ <strong>محصولات خاص و دست‌ساز:</strong> فروشگاه‌های محلی، طراحان لباس، طلا و جواهرات و تولیدکنندگان محصولات اختصاصی.")}`),
    p(`اگر در یکی از این حوزه‌ها فعالیت می‌کنی، به ۱۰۰ هزار فالوور احتیاج نداری. تو فقط به ${R("۱۰ تا ۲۰ مشتری جدی و وفادار در ماه")} نیاز داری تا به ثبات و استقلال مالی برسی.`),
    p("توی <strong>وبینار افزایش مشتری ۲۰۲۷</strong> جدیدترین و مؤثرترین روش‌هایی رو باز می‌کنیم که در ۳ ماه گذشته بیش از ۲۰۰ کسب‌وکار در آمریکا و کانادا باهاش ظرفیت‌های خالی‌شون رو پر کردن — بدون وابستگی به آژانس و بدون روزی چند ساعت تولید محتوا."),
    box(`<p style="margin:0 0 8px;font-size:15px;font-weight:bold;">🎬 یک کار مهم قبل از وبینار</p>
      ${p("اگر هنوز ویدیوی صفحه تشکر رو کامل ندیدی، حتماً ببینش؛ پیش‌نیاز حضور در وبیناره.")}
      ${btn(i.thankYouUrl, "دیدن ویدیوی پیش‌نیاز", "#111827")}`),
    box(`<p style="margin:0 0 8px;font-size:15px;font-weight:bold;">📲 پیج اینستاگرامت رو قبل از وبینار بفرست</p>
      ${p("اگر می‌خوای پیجت قبل از جلسه بررسی بشه و جات و هدیه حاضرین لایو قطعی بشه، لینک یا آیدی اینستاگرامت رو در واتساپ بفرست.")}
      ${btn(waLink(igFreeNurtureWaText("nurture1")), "💬 ارسال پیج اینستاگرام در واتساپ", "#25D366")}`, "#ecfdf5", "#25D366"),
    SIGN,
  ].join("\n");
}

function body2(i: IgFreeNurtureInput, name: string): string {
  return [
    p(`سلام ${name} عزیز، 👋`),
    p(`فردا ${R(esc(i.localTime))} (به وقت محلی شما) وبینار زنده <strong>«افزایش مشتری ۲۰۲۷»</strong> برگزار میشه.`),
    p("قبل از اینکه فردا وارد کلاس بشیم، می‌خوام ۳ فکت واقعی از بازار بیزینس‌های کوچک در آمریکا و کانادا رو باهات در میون بذارم:"),
    h2("فکت اول: معرفی دوستان (Word of Mouth) سقف درآمدت رو قفل می‌کنه"),
    p(`معرفی دوستان عالیه، اما یک عیب بزرگ داره: ${R("قابل کنترل نیست.")} یک ماه سرت شلوغه و ماه بعد ورودی‌ها قطع میشه. بیشتر بیزینس‌های کوچک نه به خاطر کیفیت کار، بلکه به خاطر همین نوسان دخل‌وخرج تحت فشار قرار می‌گیرن.`),
    h2("فکت دوم: مشتری محلی تو هر روز در اینستاگرامه، ولی دنبال پیج تو نمی‌گرده"),
    p("مشتری‌ای که دنبال فیشیال، نقاشی خانه، حسابدار یا وکیل در منطقه خودشه، منتظر نمی‌مونه تا ریلز تو تصادفی جلوی چشمش بیاد. بیزینس‌های پیشرو پیامی شفاف رو مستقیماً جلوی آدم‌های همون منطقه (شعاع چند مایلی) قرار میدن."),
    h2("فکت سوم: تخفیف دادن، سود تو رو می‌سوزونه"),
    p(`فرض کن برای یک خدمت ۳۰۰ دلاری، ۶۰ دلار تخفیف بدی. اگر حاشیه سودت حدود ۱۲۰ دلار باشه، فقط ۲۰٪ از قیمت رو کم کردی اما ${R("نصف سودت")} رو از دست دادی. راه درست ارزون فروختن نیست؛ جذب پیوسته مشتری‌هاییه که ارزش کار تو رو می‌فهمن.`),
    box(`<p style="margin:0 0 8px;font-size:15px;font-weight:bold;">🧮 یک حساب سرانگشتی</p>
      ${p(`اگر ارزش هر مشتری جدید برای بیزینس تو ۳۰۰ تا ۱,۰۰۰ دلار باشه، فقط ${R("۴ مشتری اضافه در ماه")} یعنی ${R("۱,۲۰۰ تا ۴,۰۰۰ دلار")} درآمد بیشتر در ماه. این تفاوت بین استرس اجاره و قسط، و یک بیزینس پایدار در مهاجرته.`)}`),
    box(`<p style="margin:0 0 8px;font-size:15px;font-weight:bold;">🎯 تمرین ۱ دقیقه‌ای برای امشب</p>
      ${p("«برای اینکه خیالم از همه هزینه‌ها راحت باشه، دقیقاً ماهانه به چند مشتری جدید نیاز دارم؟» این عدد رو فردا با خودت به وبینار بیار.")}`),
    `<div style="border:2px dashed #fda4af;background:#fff1f2;border-radius:14px;padding:12px 16px;margin:18px 0;">
      ${p(`⚠️ <strong>جلسه ضبط نمیشه و بازپخش نداره</strong> — یک کلاس زنده با پرسش‌وپاسخه.`)}
      ${p("🎁 بلیت اصلی ۵۰ دلار بوده، اما صندلی شما رایگان ثبت شده و برای حاضرین لایو هدیه‌های ویژه داریم.")}
    </div>`,
    p("همین الان جلسه رو به تقویمت اضافه کن تا یادت نره 👇"),
    btn(i.calendarUrl, "📅 افزودن به تقویم", "#111827"),
    btn(i.thankYouUrl, "جزئیات و ساعت وبینار"),
    `<p style="margin:16px 0 0;">فردا در وبینار زنده می‌بینمت! 🌷</p>`,
    SIGN,
  ].join("\n");
}

export function buildIgFreeNurtureHtml(i: IgFreeNurtureInput): string {
  const name = esc(i.name || "دوست");
  const inner = i.kind === "nurture1" ? body1(i, name) : body2(i, name);
  return `<!DOCTYPE html>
<html dir="rtl" lang="fa">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body dir="rtl" style="margin:0;padding:0;background:#fff7ed;font-family:Tahoma,Arial,sans-serif;color:#111827;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${PREVIEWS[i.kind]}</div>
<div dir="rtl" style="direction:rtl;text-align:right;max-width:560px;margin:0 auto;padding:24px 20px;">
${inner}
</div>
</body>
</html>`;
}
