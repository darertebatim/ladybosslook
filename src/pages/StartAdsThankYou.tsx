import { STARTADS_WEBINAR, type DedicatedWebinar } from "@/lib/dedicatedWebinars";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { CheckCircle2 } from "lucide-react";
import ThankYouIgAds from "@/pages/ThankYouIgAds";

export default function StartAdsThankYou({ campaign = STARTADS_WEBINAR }: { campaign?: DedicatedWebinar }) {
  const [params] = useSearchParams();

  if (params.get("waitlist") !== "1") {
    return <ThankYouIgAds campaign={campaign} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white">
      <Helmet>
        <title>ثبت‌نام شما انجام شد | Rilo</title>
      </Helmet>
      <main dir="rtl" className="mx-auto w-full max-w-xl px-4 pb-16 pt-8 font-farsi">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </span>
          <h1 className="mt-3 text-2xl font-extrabold text-neutral-900">در لیست انتظار هستید 🌷</h1>
          <p className="mt-4 text-sm leading-7 text-neutral-700">
            به محض باز شدن جلسه بعدی، از طریق ایمیل به شما خبر می‌دهیم.
          </p>
        </div>
      </main>
    </div>
  );
}
