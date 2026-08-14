import { ExternalLink, Download, Play } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import workbookAsset from "@/assets/build-trustworthy-instagram-profile-workbook.pdf.asset.json";

interface GiftItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  isDownload?: boolean;
  isVideo?: boolean;
}

const GIFTS: GiftItem[] = [
  {
    id: "instagram",
    icon: "📸",
    title: "صفحه اینستاگرام استاد لطفی",
    description: "محتوای روزانه، نکات طلایی و آخرین اخبار کسب‌وکار اینستاگرامی را دنبال کنید.",
    actionLabel: "مشاهده صفحه اینستاگرام",
    href: "https://instagram.com/alilotfivip",
  },
  {
    id: "meta-ads-setup",
    icon: "🎬",
    title: "ستاپ متا ادز بدون نیاز به لپ‌تاپ",
    description: "آموزش گام‌به‌گام راه‌اندازی تبلیغات متا فقط با گوشی موبایل.",
    actionLabel: "تماشای ویدیو",
    href: "https://www.youtube.com/watch?v=NkO8I7PauT0&t=17s",
    isVideo: true,
  },
  {
    id: "ads-library",
    icon: "📘",
    title: "کتابخانه محتوای تبلیغات متا",
    description: "خلاقانه‌ترین تبلیغات رقبا را ببینید و ایده بگیرید.",
    actionLabel: "ورود به کتابخانه",
    href: "https://www.facebook.com/ads/library",
  },
  {
    id: "trust-profile",
    icon: "📄",
    title: "پروفایل اعتمادساز",
    description: "راهنمای عملی برای ساختن بیو و پروفایلی که مخاطب را به خرید متقاعد می‌کند.",
    actionLabel: "دانلود PDF",
    href: workbookAsset.url,
    isDownload: true,
  },
  {
    id: "session-video",
    icon: "▶️",
    title: "ویدیوی جلسه اینستاگرام هوشمند",
    description: "ضبط کامل جلسه وبینار فریم‌ورک اینستاگرام هوشمند را دوباره تماشا کنید.",
    actionLabel: "تماشای جلسه",
    href: "https://drive.google.com/file/d/1_N5loM7C5eu6Db8Un535x_hIUJe6JdWH/view?usp=drive_link",
    isVideo: true,
  },
];

export default function GiftsAliLotfiVip() {
  return (
    <>
      <SEOHead
        title="هدایای استاد لطفی VIP | Rilo"
        description="دسترسی سریع به هدایا و لینک‌های کاربردی استاد لطفی: اینستاگرام، آموزش متا ادز، کتابخانه تبلیغات، پروفایل اعتمادساز و ویدیوی جلسه."
        locale="fa_IR"
      />
      <main
        dir="rtl"
        className="min-h-screen bg-gradient-to-b from-orange-50 to-white font-farsi dark:from-neutral-950 dark:to-neutral-900"
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-orange-600 px-5 pt-12 pb-10 text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/30 blur-2xl" />
            <div className="absolute -bottom-10 left-10 h-32 w-32 rounded-full bg-white/20 blur-xl" />
          </div>
          <div className="relative mx-auto max-w-md text-center">
            <span className="mb-3 inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              🎁 منابع ویژه
            </span>
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
              هدایای استاد لطفی VIP
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-white/90">
              تمام لینک‌ها و منابعی که نیاز داری، در یک صفحه جمع‌آوری شده‌اند.
            </p>
          </div>
        </div>

        {/* Gift cards */}
        <div className="mx-auto max-w-md px-4 py-6">
          <div className="space-y-4">
            {GIFTS.map((gift, index) => (
              <div
                key={gift.id}
                className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm transition-shadow active:scale-[0.99] dark:border-neutral-800 dark:bg-neutral-900"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-2xl dark:bg-orange-900/30">
                    {gift.icon}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base font-bold text-neutral-900 dark:text-white">
                      {gift.title}
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                      {gift.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <Button
                    asChild
                    className="w-full rounded-xl bg-orange-500 text-sm font-semibold text-white hover:bg-orange-600 active:bg-orange-700"
                  >
                    <a
                      href={gift.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={gift.isDownload}
                      className="inline-flex items-center justify-center gap-2"
                    >
                      {gift.isDownload ? (
                        <Download className="h-4 w-4" />
                      ) : gift.isVideo ? (
                        <Play className="h-4 w-4 fill-current" />
                      ) : (
                        <ExternalLink className="h-4 w-4" />
                      )}
                      {gift.actionLabel}
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <p className="mt-8 text-center text-[11px] text-neutral-500 dark:text-neutral-400">
            این صفحه را ذخیره کنید تا هر زمان به لینک‌ها دسترسی داشته باشید.
          </p>
        </div>
      </main>
    </>
  );
}
