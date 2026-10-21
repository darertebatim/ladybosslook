// PowerFree (Razie Ladyboss) webinar show-up emails — duplicated from Start Ads; copy to be customized.
// Follow-up happens on WhatsApp, so every email points there instead of in-app support.

export type PowerFreeKind = "confirm" | "reminder" | "morning" | "onehour" | "start" | "after3h" | "after24h";
const PROGRAM_URL = "https://ladybosslook.com/r/powerfree";
const WA_JOIN_TEXT = "سلام راضیه جان، در مورد ادامه دوره ۳ هفته‌ای جذب مشتری سوال داشتم:\n";

export const WHATSAPP_NUMBER = "16265028538";
export const waLink = (text: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
const WA_IG_TEXT = "سلام راضیه جان، این پیج اینستاگرام من برای جلسه اوله:\n";
const WA_HELP_TEXT = "سلام، برای وبینار قدرت دو زبانه سوال داشتم:\n";

export const POWERFREE_SUBJECTS: Record<PowerFreeKind, string> = {
  confirm: "تایید ثبت‌نام: وبینار «قدرت دو زبانه» (رایگان) 🌷",
  reminder: "یادآوری وبینار قدرت دو زبانه + ویدیوی پیش‌نیاز 🎬",
  morning: "امروز: وبینار قدرت دو زبانه (ساعت و لینک ورود) 🌅",
  onehour: "۱ ساعت تا شروع وبینار قدرت دو زبانه ⏳",
  start: "وبینار قدرت دو زبانه در حال شروع است — همین حالا وارد شوید 🚀",
  after3h: "بعد از جلسه اول: قدم بعدی برای جذب مشتری قبل از بازار آخر سال 🚀",
  after24h: "سوال صادقانه: مشتری بعدی‌ات از کجا میاد؟ 🤔",
};

const esc = (s: string) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as Record<string, string>)[c]);

const CITY_ZONES = [
  { label: "Los Angeles / Vancouver", tz: "America/Los_Angeles" },
  { label: "Chicago / Texas", tz: "America/Chicago" },
  { label: "New York / Toronto", tz: "America/New_York" },
];

function fmtZone(d: Date, tz: string) {
  return new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(d);
}

const RED = (t: string) => `<strong style="color:#e11d48;">${t}</strong>`;
const p = (t: string) => `<p dir="rtl" style="margin:0 0 12px;font-size:15px;line-height:2;text-align:right;">${t}</p>`;
const btn = (href: string, label: string, bg = "#e11d48") =>
  `<p style="text-align:center;margin:18px 0;"><a href="${esc(href)}" style="display:inline-block;background:${bg};color:#fff;text-decoration:none;padding:14px 26px;border-radius:12px;font-size:16px;font-weight:bold;">${label}</a></p>`;

export interface PowerFreeEmailInput {
  kind: PowerFreeKind;
  name: string;
  sessionStart: Date;
  meetUrl: string;
  thankYouUrl: string;
  calendarUrl: string;
}

export function buildPowerFreeHtml(i: PowerFreeEmailInput): string {
  const name = esc(i.name || "دوست عزیز");
  const zoneTable = `
    <div style="background:#fff;border:1px solid #fde68a;border-radius:14px;padding:12px;margin:18px 0;">
      <p style="margin:0 0 8px;font-size:14px;font-weight:bold;">⏰ ساعت جلسه در شهر شما</p>
      <table style="width:100%;border-collapse:collapse;">${CITY_ZONES.map((z) => `
        <tr><td style="padding:6px 10px;font-size:13px;border-bottom:1px solid #fde68a;">${z.label}</td>
        <td dir="ltr" style="padding:6px 10px;font-size:13px;border-bottom:1px solid #fde68a;"><strong>${fmtZone(i.sessionStart, z.tz)}</strong></td></tr>`).join("")}
      </table>
    </div>`;
  const meet = i.meetUrl
    ? `${btn(i.meetUrl, "ورود به جلسه اول")}<p style="text-align:center;margin:0 0 8px;font-size:13px;"><a dir="ltr" href="${esc(i.meetUrl)}" style="color:#e11d48;word-break:break-all;">${esc(i.meetUrl)}</a></p>`
    : "";
  const waBox = `
    <div style="background:#ecfdf5;border:2px solid #25D366;border-radius:14px;padding:14px 16px;margin:18px 0;">
      <p style="margin:0 0 8px;font-size:15px;font-weight:bold;">📲 پیج اینستاگرامت رو در واتساپ برام بفرست</p>
      ${p("توی جلسه پیج‌های واقعی رو بررسی می‌کنیم. اگر می‌خوای پیج تو هم قبل از جلسه دیده بشه، <strong>لینک یا آیدی اینستاگرامت</strong> رو در واتساپ بفرست.")}
      ${btn(waLink(WA_IG_TEXT), "💬 ارسال پیج اینستاگرام در واتساپ", "#25D366")}
    </div>`;
  const help = `
    <p style="margin:18px 0 0;font-size:13px;color:#6b7280;line-height:1.9;">
      سوالی داشتی یا لینک باز نشد؟ <a href="${waLink(WA_HELP_TEXT)}" style="color:#16a34a;font-weight:bold;">در واتساپ پیام بده 💬</a>
      <br><br><strong>راضیه لیدی‌باس</strong><br><span dir="ltr">Rilo App - Ladybosslook llc</span>
    </p>`;
  const cal = `${p("جلسه رو همین حالا به تقویمت اضافه کن تا یادت نره 👇")}${btn(i.calendarUrl, "📅 افزودن به تقویم", "#111827")}`;
  const noRec = `<div style="border:2px dashed #fda4af;background:#fff1f2;border-radius:14px;padding:12px 16px;margin:18px 0;"><p style="margin:0;font-size:14px;font-weight:bold;color:#be123c;">🔥 جلسه ضبط نمی‌شود و فقط ${RED("۵۰ جایگاه رایگان")} داریم.</p></div>`;

  let body = "";
  if (i.kind === "confirm") {
    body = `
      <h1 style="margin:0 0 12px;font-size:21px;line-height:1.6;">سلام ${name} عزیز 👋 جایگاهت رزرو شد 🌷</h1>
      ${p(`جایگاه ${RED("رایگان")} تو در <strong>جلسه اول برنامه ۳ هفته‌ای جذب مشتری و قدرت دو زبانه</strong> ثبت شد.`)}
      ${p("دو قدم کوچیک مونده تا جلسه:")}
      <div style="background:#fff;border:1px solid #fde68a;border-radius:14px;padding:12px 16px;margin:16px 0;">
        <p style="margin:0 0 8px;font-size:15px;font-weight:bold;">🎬 قدم اول: ویدیوی پیش‌نیاز رو ببین</p>
        ${p("توی این ویدیوی کوتاه می‌گم شنبه دقیقاً چی کار می‌کنیم، تا با یک سوال مشخص درباره بیزینس خودت وارد جلسه بشی.")}
        ${btn(i.thankYouUrl, "دیدن ویدیوی پیش‌نیاز", "#111827")}
      </div>
      ${waBox}
      ${zoneTable}
      ${cal}
      ${noRec}
      ${meet ? p("<strong>🔗 لینک ورود (روز جلسه):</strong>") + meet : ""}
      ${help}`;
  } else if (i.kind === "reminder") {
    body = `
      ${p(`سلام ${name} عزیز 🌷`)}
      ${p("<strong>دکمهٔ «Boost Post» سریع‌ترین راه سوزاندن بودجهٔ تبلیغاته.</strong> اینستاگرام اون رو جلوی چشمت گذاشته چون ساده‌ست، نه چون برای بیزینس تو مشتری میاره. نتیجه؟ لایک و بازدید از آدم‌هایی که هیچ‌وقت مشتری تو نمیشن.")}
      ${p(`حالا یک حساب ساده: اگر هر مشتری جدید برای بیزینس تو چند صد دلار ارزش داره، فقط ${RED("چند مشتری محلی بیشتر در ماه")} می‌تونه تفاوت بزرگی در درآمدت بسازه. سوال اینه که اون مشتری‌ها رو چطور پیدا کنیم — نه با شانس، با یک سیستم. جلسه اول، پایهٔ همین سیستمه.`)}
      ${p("دو نکته کوتاه برای جلسه اول:")}
      ${p(`<strong>۱. ویدیوی پیش‌نیاز رو دیدی؟</strong><br>توی این ویدیو گفتم چطور شنبه بدون اتلاف وقت مستقیم میریم سر کار اصلی. ${RED("قبل از جلسه")} ببینش.`)}
      ${btn(i.thankYouUrl, "🎬 دیدن ویدیوی پیش‌نیاز", "#111827")}
      ${p("<strong>۲. پیج اینستاگرامت رو هنوز نفرستادی؟</strong>")}
      ${waBox}
      ${zoneTable}
      ${cal}
      ${noRec}
      ${help}`;
  } else if (i.kind === "morning") {
    body = `
      ${p(`سلام ${name} عزیز 🌅`)}
      ${p(`${RED("امروز")} وبینار «قدرت دو زبانه» برگزار میشه.`)}
      ${p("بازار آخر سال در آمریکا و کانادا نزدیکه 🛍️ و امروز قراره پایه سیستم جذب مشتری‌ت رو قبل از شلوغی بازار بچینیم: اینکه با کدوم پیشنهاد شروع کنی و چه پیامی باعث میشه مشتری محلی به‌جای اسکرول کردن، بهت پیام بده.")}
      ${p("اگر از بیشتر صاحبان بیزینس بپرسی: «هفتهٔ بعد دقیقاً چند مشتری جدید داری؟»، صادقانه میگن: «بستگی داره کی معرفی کنه یا کی تصادفی پیدامون کنه.»")}
      ${p(`اما تکیه کردن فقط به دهان‌به‌دهان، بیزینس ساختن نیست؛ ${RED("شانس‌آزماییه.")}`)}
      <p style="margin:20px 0 10px;font-size:16px;font-weight:bold;">🚫 ۳ دروغ بزرگی که درباره اینستاگرام به ما گفتن:</p>
      ${p("<strong>۱. «باید هر روز پست و ریلز بذاری تا دیده بشی!»</strong><br>حقیقت: تو صاحب بیزینسی، نه اینفلوئنسر تمام‌وقت.")}
      ${p("<strong>۲. «اول باید چند هزار فالوور داشته باشی تا بتونی بفروشی!»</strong><br>حقیقت: فالووری که در شهر تو زندگی نمی‌کنه، از تو خرید نمی‌کنه. چیزی که لازم داری مشتری محلیه، نه عدد فالوور.")}
      ${p("<strong>۳. «تبلیغات متا خیلی گرونه و فقط به درد برندهای بزرگ می‌خوره!»</strong><br>حقیقت: اگر بدون پایهٔ درست شروع کنی، بله، بودجه‌ت می‌سوزه. برای همین جلسه اول روی پایه کار می‌کنیم.")}
      <div style="background:#ffffff;border:1px solid #fde68a;border-radius:14px;padding:12px 16px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:15px;font-weight:bold;">🔍 یک تمرین ۲ دقیقه‌ای قبل از جلسه:</p>
        ${p("اینستاگرام بیزینست رو باز کن و به این ۳ عدد نگاه کن:")}
        <ul style="margin:0 0 10px;padding:0 20px 0 0;font-size:15px;line-height:2;">
          <li>چند درصد مخاطب آخرین پستت از شهر خودت بوده؟</li>
          <li>در ۳۰ روز گذشته، چند نفر مستقیماً از اینستاگرام باهات تماس گرفتن یا وقت رزرو کردن؟</li>
          <li>جذب هر مشتری جدید تا الان برات چقدر تموم شده؟</li>
        </ul>
        ${p("این ۳ عدد رو یادداشت کن و با خودت به جلسه بیار.")}
      </div>
      ${zoneTable}
      ${meet}
      <p style="margin:16px 0 8px;font-size:15px;font-weight:bold;">📌 چند نکته:</p>
      <ul style="margin:0 0 14px;padding:0 20px 0 0;font-size:15px;line-height:2;">
        <li>جلسه ${RED("ضبط نمی‌شود")}؛ فقط همین یک بار زنده است.</li>
        <li>۵ تا ۱۰ دقیقه زودتر وارد شو تا ظرفیت پر نشه.</li>
        <li>دفترچه و یک سوال مشخص درباره بیزینس خودت آماده داشته باش.</li>
      </ul>
      ${p("هنوز پیجت رو نفرستادی؟ تا قبل از جلسه وقت داری 👇")}
      ${btn(waLink(WA_IG_TEXT), "💬 ارسال پیج در واتساپ", "#25D366")}
      ${p("امروز می‌بینمت 🌷")}
      ${help}`;
  } else if (i.kind === "onehour") {
    body = `
      ${p(`سلام ${name} عزیز ⏳`)}
      ${p(`دقیقاً ${RED("۱ ساعت دیگه")} وبینار «قدرت دو زبانه» شروع میشه.`)}
      ${p("<strong>۱. بازپخش نداره.</strong> جلسه کاملاً زنده است و ضبط نمی‌شه.")}
      ${p("<strong>۲. زودتر بیا.</strong> ۵ دقیقه زودتر روی لینک بزن؛ ظرفیت اتاق محدوده.")}
      ${p("<strong>۳. با سوالت بیا.</strong> یک سوال مشخص درباره جذب مشتری برای بیزینس خودت یادداشت کن.")}
      ${zoneTable}
      ${meet}
      ${p("یه چای یا قهوه بریز و دفترچه‌ت رو بردار؛ ۱ ساعت دیگه می‌بینمت!")}
      ${help}`;
  } else if (i.kind === "after3h") {
    body = `
      ${p(`سلام ${name} عزیز 🌷`)}
      ${p("ممنونم که امروز در جلسه اول بودی. اگر هم نتونستی بیای، این ایمیل برای تو هم هست.")}
      ${p("جلسه اول پایه بود: اینکه با کدوم پیشنهاد شروع کنی و چه پیامی مشتری محلی رو به‌جای اسکرول کردن، به پیام دادن می‌رسونه.")}
      ${p(`اما پایه به‌تنهایی مشتری نمیاره. ${RED("بازار آخر سال")} در آمریکا و کانادا نزدیکه و سیستم جذب مشتری باید ${RED("قبل از شلوغی بازار")} ستاپ بشه، نه وسطش.`)}
      ${p("برای همین ادامهٔ دوره ۳ هفته‌ای جذب مشتری رو ساختیم: قدم‌به‌قدم، کنار هم، تا سیستم تبلیغات بیزینست واقعاً راه بیفته. این آخرین سری امساله.")}
      ${btn(PROGRAM_URL, "🚀 دیدن جزئیات و ثبت‌نام در دوره ۳ هفته‌ای")}
      ${p("سوالی داری یا نمی‌دونی این دوره برای بیزینس تو مناسبه یا نه؟ مستقیم در واتساپ بپرس، خودم جواب میدم 👇")}
      ${btn(waLink(WA_JOIN_TEXT), "💬 سوال در واتساپ", "#25D366")}
      ${help}`;
  } else if (i.kind === "after24h") {
    body = `
      ${p(`سلام ${name} عزیز،`)}
      ${p("یک سوال صادقانه: <strong>هفتهٔ بعد، مشتری جدیدت دقیقاً از کجا میاد؟</strong>")}
      ${p(`اگر جوابت «بستگی داره کی معرفی کنه» هست، تنها نیستی. اما تکیه به شانس، اونم ${RED("درست قبل از بازار آخر سال")}، ریسک بزرگیه.`)}
      ${p("حالا همون حساب ساده: اگر هر مشتری جدید برات چند صد دلار ارزش داره، فقط چند مشتری بیشتر در ماه، هزینهٔ دوره رو برمی‌گردونه و بعدش همه‌ش سود سیستمیه که خودت ساختی.")}
      ${p("دوره ۳ هفته‌ای جذب مشتری دقیقاً برای ساختن همین سیستمه، و این آخرین سری قبل از شلوغی بازاره.")}
      ${btn(PROGRAM_URL, "⏳ ثبت‌نام در دوره ۳ هفته‌ای")}
      ${p("اگر مطمئن نیستی، پیجت رو در واتساپ بفرست تا بگم این دوره به درد بیزینست می‌خوره یا نه 👇")}
      ${btn(waLink(WA_IG_TEXT), "💬 ارسال پیج در واتساپ", "#25D366")}
      ${help}`;
  } else {
    body = `
      <div style="text-align:center;">
        <h1 style="margin:0 0 14px;font-size:22px;line-height:1.6;">سلام ${name} عزیز 🌷 جلسه اول ${RED("شروع شد")}</h1>
        <p style="margin:0 0 10px;font-size:16px;">همین حالا وارد شو 👇</p>
        ${meet}
      </div>
      ${help}`;
  }

  return `<!doctype html><html dir="rtl" lang="fa"><body dir="rtl" style="direction:rtl;text-align:right;margin:0;padding:0;background:#fff7ed;font-family:Tahoma,Arial,sans-serif;color:#111827;">
    <div dir="rtl" style="direction:rtl;text-align:right;max-width:560px;margin:0 auto;padding:24px 20px;">${body}</div></body></html>`;
}

export function powerFreeThankYouUrl(roundNumber: number | string | null, email: string): string {
  return `https://ladybosslook.com/r/powerfree/thankyou?round=${encodeURIComponent(String(roundNumber ?? ""))}&email=${encodeURIComponent(email)}`;
}
