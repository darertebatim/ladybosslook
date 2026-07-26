import { Button } from "@/components/ui/button";
import { MessageCircle, Mail } from "lucide-react";
import elcPoster from "@/assets/elc-poster.jpg.asset.json";

const ElcLanding = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4" dir="rtl" style={{ fontFamily: "'Vazirmatn', sans-serif" }}>
      <div className="max-w-lg w-full space-y-6">
        {/* Poster */}
        <img
          src={elcPoster.url}
          alt="چالش ۱۰ شب - زن قوی - Empowered Ladyboss"
          className="w-full rounded-lg shadow-lg"
        />

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            چالش جدید زن قوی
          </h1>
          <p className="text-lg text-amber-500 font-semibold">
            ده شب با راضیه لیدی‌باس
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <p className="text-base text-blue-800 font-medium whitespace-pre-line">
              👇 عزیزان خارج از ایران (ساکنین امریکا، کانادا،
              &nbsp;🇺🇸 🇨🇦 اروپا و ...) وارد لینک پایین شوید 👇
            </p>
          </div>

          <a
            href="https://ladybosslook.com/elc"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full"
          >
            <Button
              size="lg"
              className="w-full text-lg py-6 bg-blue-600 hover:bg-blue-700 text-white"
            >
              🇺🇸 ورود از امریکا،  کانادا و ... (خارج ایران)
            </Button>
          </a>

          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-base text-green-800 font-medium whitespace-pre-line">
              👇 از داخل ایران (شهرهای تهران، تبریز، بندرعباسو ...) وارد لینک پایین شوید 👇
            </p>
          </div>

          <a
            href="https://ladybossnew.com/5chiran"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full"
          >
            <Button
              size="lg"
              className="w-full text-xl py-8 bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg"
            >
              🇮🇷 ورود از داخل ایران (به وقت تهران)
            </Button>
          </a>
        </div>

        {/* Telegram Support */}
        <div className="text-center pt-4 space-y-2">
          <a
            href="https://t.me/lbpool_admin"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <MessageCircle className="h-4 w-4" />
            ادمین پشتیبان در تلگرام: @lbpool_admin
          </a>
          <div>
            <a
              href="mailto:support@ladybosslook.com"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <Mail className="h-4 w-4" />
              ایمیل پشتیبان: support@ladybosslook.com
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElcLanding;
