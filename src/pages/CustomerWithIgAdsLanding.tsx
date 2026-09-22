import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Play, Sparkles } from "lucide-react";
import coverAsset from "@/assets/customerwithigads-cover.png.asset.json";
import WebinarWaitlistBox from "@/components/WebinarWaitlistBox";
import { trackCustomLead, trackLead } from "@/lib/metaPixel";

const YT_ID = "kMcRNW0_44o";

export default function CustomerWithIgAdsLanding() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white">
      <Helmet>
        <title>بهترین روش جذب مشتری از اینستاگرام | Rilo</title>
        <meta
          name="description"
          content="ویدیو آموزشی رایگان: بهترین روش جذب مشتری از اینستاگرام، مخصوص بیزینس‌های آمریکا و کانادا."
        />
      </Helmet>

      <main dir="rtl" className="mx-auto w-full max-w-2xl px-4 pb-16 pt-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-3 py-1 text-[11px] font-bold text-white shadow-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
            ویدیو رایگان — تماشای فوری
          </span>
          <h1 className="mt-3 text-2xl font-extrabold leading-9 text-neutral-900 sm:text-3xl">
            بهترین روش جذب مشتری از اینستاگرام
          </h1>
          <p className="mt-2 text-sm leading-7 text-neutral-600">
            مخصوص بیزینس‌های آمریکا و کانادا — با علی لطفی
          </p>
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl border border-orange-200 bg-black shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
          <div className="relative aspect-video w-full">
            {playing ? (
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube.com/embed/${YT_ID}?autoplay=1&rel=0&modestbranding=1`}
                title="بهترین روش جذب مشتری از اینستاگرام"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <button
                type="button"
                onClick={() => setPlaying(true)}
                className="group absolute inset-0 h-full w-full"
                aria-label="پخش ویدیو"
              >
                <img
                  src={coverAsset.url}
                  alt="بهترین روش جذب مشتری از اینستاگرام"
                  className="h-full w-full object-cover"
                />
                <span className="absolute inset-0 bg-black/10 transition group-active:bg-black/25" />
                <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-xl transition group-active:scale-95">
                  <Play className="h-7 w-7 translate-x-0.5 fill-rose-500 text-rose-500" />
                </span>
              </button>
            )}
          </div>
        </section>

        <p className="mt-3 text-center text-xs leading-6 text-neutral-500">
          ویدیو را تا انتها ببینید — روشی که در ادامه توضیح داده می‌شود، پایه دوره بعدی ماست.
        </p>

        <div className="mt-8 flex items-center gap-3">
          <div className="h-px flex-1 bg-neutral-200" />
          <span className="h-2 w-2 rounded-full bg-rose-400" />
          <div className="h-px flex-1 bg-neutral-200" />
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-orange-300 bg-orange-50/60 p-4 text-center">
          <p className="inline-flex items-center gap-1.5 text-sm font-bold text-orange-800">
            <Sparkles className="h-4 w-4" />
            ظرفیت دوره بعدی محدود است
          </p>
          <p className="mt-1 text-xs leading-6 text-orange-900/80">
            نام و ایمیل خود را ثبت کنید تا قبل از همه، از تاریخ شروع و تخفیف ویژه دوره باخبر شوید.
          </p>
        </div>

        <div onClickCapture={() => { /* noop */ }}>
          <WebinarWaitlistBox
            source="customerwithigads_waitlist"
            title="لیست انتظار دوره بعدی"
            onSuccess={() => {
              trackLead({ content_name: "customerwithigads_waitlist" });
              trackCustomLead("CustomerWithIgAdsLead");
            }}
          />
        </div>
      </main>
    </div>
  );
}
