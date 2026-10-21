// PowerFree (Razie Ladyboss) webinar show-up emails — duplicated from Start Ads; copy to be customized.
// Follow-up happens on WhatsApp, so every email points there instead of in-app support.

export type PowerFreeKind = "confirm" | "reminder" | "morning" | "onehour" | "start" | "after3h" | "after24h";
const PROGRAM_URL = "https://ladybosslook.com/r/powerfree";
const WA_JOIN_TEXT = "سلام راضیه جان، بعد از وبینار قدرت دو زبانه درباره قدم بعدی سوال داشتم:\n";

export const WHATSAPP_NUMBER = "19495723730";
export const waLink = (text: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
const WA_IG_TEXT = "سلام راضیه جان، برای وبینار قدرت دو زبانه ثبت‌نام کردم. اسم و ایمیلم:\n";
const WA_HELP_TEXT = "سلام، برای وبینار قدرت دو زبانه سوال داشتم:\n";

export const POWERFREE_SUBJECTS: Record<PowerFreeKind, string> = {
  confirm: "خانم رئیس، صندلی‌ات در وبینار «قدرت دو زبانه» رزرو شد 🌷",
  reminder: "اون خانم قدرتمند هنوز همون‌جاست… (یادآوری وبینار قدرت دو زبانه)",
  morning: "امروز: وبینار قدرت دو زبانه — ساعت و لینک ورود 🌅",
  onehour: "۱ ساعت تا وبینار قدرت دو زبانه ⏳ (هدیه فقط برای حاضرین)",
  start: "وبینار قدرت دو زبانه شروع شد — همین حالا وارد شو 🚀",
  after3h: "بعد از وبینار: قدم بعدی به سمت قدرت ۱۰ برابری 💫",
  after24h: "خانم رئیس، یک سال دیگه رو منتظر نمون 🤍",
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
      <p style="margin:0 0 8px;font-size:15px;font-weight:bold;">📲 قدم دوم: جزئیاتت رو برای پشتیبانی بفرست</p>
      ${p("اسم و ایمیلت رو در واتساپ برامون بفرست تا حضورت <strong>قطعی</strong> بشه و هر سوالی داشتی مستقیم با ما در ارتباط باشی.")}
      ${btn(waLink(WA_IG_TEXT), "💬 ارسال جزئیات در واتساپ", "#25D366")}
    </div>`;
  const help = `
    <p style="margin:18px 0 0;font-size:13px;color:#6b7280;line-height:1.9;">
      سوالی داشتی یا لینک باز نشد؟ <a href="${waLink(WA_HELP_TEXT)}" style="color:#16a34a;font-weight:bold;">در واتساپ پیام بده 💬</a>
      <br><br><strong>راضیه لیدی‌باس</strong><br><span dir="ltr">Rilo App - Ladybosslook llc</span>
    </p>`;
  const cal = `${p("جلسه رو همین حالا به تقویمت اضافه کن تا یادت نره 👇")}${btn(i.calendarUrl, "📅 افزودن به تقویم", "#111827")}`;
  const noRec = `<div style="border:2px dashed #fda4af;background:#fff1f2;border-radius:14px;padding:12px 16px;margin:18px 0;"><p style="margin:0;font-size:14px;font-weight:bold;color:#be123c;">🔥 وبینار ۹۰ دقیقه‌ای و ${RED("فقط زنده")} است — بازپخش ندارد. 🎁 هدیه (تست قدرت درونی + PDF تحلیل) فقط به حاضرین داده می‌شود.</p></div>`;

  const GIFT = `<div style="background:#fff;border:1px solid #fde68a;border-radius:14px;padding:12px 16px;margin:16px 0;"><p style="margin:0;font-size:14px;line-height:2;">🎁 <strong>هدیه حاضرین:</strong> داخل وبینار یک تست درباره یکی از فاکتورهای قدرت درونیت می‌گیریم و <strong>PDF تست + تحلیلش</strong> رو هدیه می‌گیری.</p></div>`;

  let body = "";
  if (i.kind === "confirm") {
    body = `
      <h1 style="margin:0 0 12px;font-size:21px;line-height:1.6;">تبریک ${name} عزیز 🌷 صندلی‌ات رزرو شد</h1>
      ${p(`جایگاه ${RED("رایگان")} تو در <strong>وبینار ۹۰ دقیقه‌ای «قدرت دو زبانه»</strong> ثبت شد؛ جایی که نقشه راه رسیدن به ${RED("قدرت ۱۰ برابری")} رو بازگو می‌کنم.`)}
      ${p("مهم نیست چند ساله مهاجرت کردی. اگر می‌خوای قدرتت رو هم در زبان خودت و هم در زبان کشوری که بهش اومدی دوباره به دست بیاری، این وبینار برای توئه.")}
      ${p("فقط دو قدم مونده تا حضورت کاملاً قطعی بشه:")}
      <div style="background:#fff;border:1px solid #fde68a;border-radius:14px;padding:12px 16px;margin:16px 0;">
        <p style="margin:0 0 8px;font-size:15px;font-weight:bold;">📅 قدم اول: وبینار رو به تقویم گوشیت اضافه کن</p>
        ${p("یک یادآوری از روز قبل بذار تا حتی ۵ دقیقه‌ش رو هم از دست ندی.")}
        ${btn(i.calendarUrl, "📅 افزودن به تقویم", "#111827")}
      </div>
      ${waBox}
      ${p("اگر هنوز ویدیوی صفحه تشکر رو ندیدی، حتماً ببینش 👇")}
      ${btn(i.thankYouUrl, "🎬 دیدن ویدیوی راضیه", "#111827")}
      ${zoneTable}
      ${GIFT}
      ${noRec}
      ${meet ? p("<strong>🔗 لینک ورود (روز جلسه):</strong>") + meet : ""}
      ${help}`;
  } else if (i.kind === "reminder") {
    body = `
      ${p(`سلام ${name} عزیز 🌷`)}
      ${p("مهاجرت فقط بحث پول نیست. یعنی همه چیز رو پشت سر گذاشتی — اعتبار، شغل، خانواده، دوست‌ها، خاطره‌ها — و فقط با یک چمدون اومدی تا زندگی بهتری بسازی. این یعنی <strong>جرأت خیلی زیاد.</strong>")}
      ${p("اما سال‌های اول مهاجرت خیلی‌ها رو خسته می‌کنه. اتفاق‌هایی که انرژی‌مون رو می‌گیره، اعتماد به نفس‌مون رو کم می‌کنه و توقع‌مون از خودمون رو میاره پایین. تا جایی که یک روز نگاه می‌کنی و می‌پرسی: «اون خانم قدرتمند گذشته کجا رفت؟»")}
      ${p(`${RED("اون خانم هنوز همون‌جاست.")} فقط لازمه یادش بیاد و نقشه راه رسیدن به قدرت ۱۰ برابری رو یاد بگیره. دقیقاً همین کاریه که در وبینار «قدرت دو زبانه» با هم انجام می‌دیم.`)}
      ${p("<strong>دو قدمت رو برداشتی؟</strong>")}
      ${cal}
      ${waBox}
      ${zoneTable}
      ${GIFT}
      ${noRec}
      ${help}`;
  } else if (i.kind === "morning") {
    body = `
      ${p(`سلام ${name} عزیز 🌅`)}
      ${p(`${RED("امروز")} روز وبینار «قدرت دو زبانه» است.`)}
      ${p("بعد از مهاجرت باید چیزهایی رو که در عرض ۲۰ سال در کشور خودمون ساخته بودیم، در چند سال جبران کنیم: ارتباطات، اعتبار، شغل و درآمد، عشق و خانواده، حال خوب. برای همین به سطحی از قدرت نیاز داریم که شاید قبلاً لازمش نداشتیم.")}
      <p style="margin:20px 0 10px;font-size:16px;font-weight:bold;">🚫 ۳ باور اشتباه بعد از مهاجرت:</p>
      ${p("<strong>۱. «فقط کافیه زبان رو یاد بگیرم.»</strong><br>حقیقت: زبان لازمه اما کافی نیست. قدرت یعنی با اعتماد به نفس در هر دو زبان ارتباط بسازی و دیده بشی.")}
      ${p("<strong>۲. «سال‌ها طول می‌کشه تا دوباره به جایگاه قبلی برسم.»</strong><br>حقیقت: با نقشه راه درست، خیلی از خانم‌ها در کمتر از یک سال چند پله رشد کردن.")}
      ${p("<strong>۳. «اون آدم قبلی دیگه برنمی‌گرده.»</strong><br>حقیقت: قدرت درونیت از بین نرفته؛ فقط باید بازسازی بشه.")}
      <div style="background:#ffffff;border:1px solid #fde68a;border-radius:14px;padding:12px 16px;margin:20px 0;">
        <p style="margin:0 0 8px;font-size:15px;font-weight:bold;">📝 قبل از وبینار:</p>
        ${p("یک جمله بنویس: «اگر قدرتم ۱۰ برابر بشه، اولین چیزی که در زندگیم تغییر می‌کنه چیه؟» و با خودت بیارش.")}
      </div>
      ${zoneTable}
      ${meet}
      <p style="margin:16px 0 8px;font-size:15px;font-weight:bold;">📌 چند نکته:</p>
      <ul style="margin:0 0 14px;padding:0 20px 0 0;font-size:15px;line-height:2;">
        <li>وبینار ۹۰ دقیقه است و ${RED("ضبط نمی‌شود")}.</li>
        <li>هر کاری داری کنار بذار و ۵ تا ۱۰ دقیقه زودتر وارد شو.</li>
        <li>دفترچه و یک جای آروم آماده داشته باش؛ قراره تست قدرت درونی هم انجام بدیم.</li>
      </ul>
      ${GIFT}
      ${p("امروز می‌بینمت خانم رئیس 🌷")}
      ${help}`;
  } else if (i.kind === "onehour") {
    body = `
      ${p(`سلام ${name} عزیز ⏳`)}
      ${p(`دقیقاً ${RED("۱ ساعت دیگه")} وبینار «قدرت دو زبانه» شروع میشه.`)}
      ${p("<strong>۱. بازپخش نداره.</strong> فقط زنده است.")}
      ${p("<strong>۲. هدیه فقط برای حاضرین.</strong> تست قدرت درونی و PDF تحلیلش رو فقط کسانی می‌گیرن که داخل وبینار باشن.")}
      ${p("<strong>۳. جدی بگیرش.</strong> همون‌قدر که این وبینار رو جدی بگیری، همون‌قدر می‌تونه شروع مسیر رشدت باشه.")}
      ${zoneTable}
      ${meet}
      ${p("یک چای یا قهوه بریز و دفترچه‌ت رو بردار؛ ۱ ساعت دیگه می‌بینمت!")}
      ${help}`;
  } else if (i.kind === "after3h") {
    body = `
      ${p(`سلام ${name} عزیز 🌷`)}
      ${p("ممنونم که امروز در وبینار «قدرت دو زبانه» بودی. اگر هم نتونستی بیای، این ایمیل برای تو هم هست.")}
      ${p("امروز دیدیم که قدرت بعد از مهاجرت فقط پول درآوردن نیست؛ ساختن ارتباطات سطح بالا، اعتماد به نفس در هر دو زبان، رشد شغلی و کسب‌وکار، رابطه سالم و حال خوبه.")}
      ${p(`اما دونستن نقشه راه کافی نیست. ${RED("قدم برداشتن")} روی اون نقشه‌ست که در کمتر از ۶ ماه تفاوت می‌سازه.`)}
      ${p("اگر آماده‌ای قدم بعدی رو با من برداری، جزئیاتش اینجاست 👇")}
      ${btn(PROGRAM_URL, "💫 دیدن قدم بعدی")}
      ${p("سوالی داری یا نمی‌دونی از کجا شروع کنی؟ مستقیم در واتساپ بپرس 👇")}
      ${btn(waLink(WA_JOIN_TEXT), "💬 سوال در واتساپ", "#25D366")}
      ${help}`;
  } else if (i.kind === "after24h") {
    body = `
      ${p(`سلام ${name} عزیز،`)}
      ${p("یک سوال صادقانه: <strong>اگر همه چیز همین‌طور بمونه، سال بعد این موقع کجای زندگیت هستی؟</strong>")}
      ${p("تو کار بزرگی کردی: همه چیز رو پشت سر گذاشتی تا زندگی بهتری بسازی. حیفه که یک سال دیگه هم با انرژی کم و اعتماد به نفس کم‌رنگ بگذره.")}
      ${p(`خانم‌هایی که با من مسیر رو شروع کردن، در کمتر از یک سال ارتباطات تازه ساختن، ارتقای شغلی گرفتن، مشتری‌های بیشتری پیدا کردن و به آرامش رسیدن. ${RED("تو هم می‌تونی تغییر کنی")} — قولش رو بهت میدم.`)}
      ${btn(PROGRAM_URL, "✨ شروع مسیر قدرت ۱۰ برابری")}
      ${p("اگر مطمئن نیستی این مسیر برای تو هست یا نه، در واتساپ پیام بده تا با هم صحبت کنیم 👇")}
      ${btn(waLink(WA_JOIN_TEXT), "💬 صحبت در واتساپ", "#25D366")}
      ${help}`;
  } else {
    body = `
      <div style="text-align:center;">
        <h1 style="margin:0 0 14px;font-size:22px;line-height:1.6;">${name} عزیز 🌷 وبینار قدرت دو زبانه ${RED("شروع شد")}</h1>
        <p style="margin:0 0 10px;font-size:16px;">همین حالا وارد شو؛ هدیه حاضرین منتظرته 👇</p>
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
