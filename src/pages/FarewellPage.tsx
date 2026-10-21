import { TrackedIframe } from "@/components/TrackedIframe";
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Play } from "lucide-react";
import coverAsset from "@/assets/farewell-thumbnail.jpg.asset.json";

const VIDEO_ID = "gJHhymtbJ-Q";
const TITLE = "بدرقه";
const SUBTITLE = "پایان دوره جذب مشتری";

/**
 * Simple video page at /l/farewell — no email capture, no waitlist,
 * no campaign tracking. Just the cover, a play button, and the video.
 */
export default function FarewellPage() {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white">
      <Helmet>
        <title>{`${TITLE} — ${SUBTITLE} | Rilo`}</title>
        <meta name="description" content={`${TITLE}: ${SUBTITLE}.`} />
      </Helmet>

      <main
        dir="rtl"
        className="mx-auto flex w-full max-w-2xl flex-col px-4 pb-16 pt-10 font-farsi"
      >
        <div className="text-center">
          <h1 className="text-3xl font-extrabold leading-10 text-neutral-900 sm:text-4xl">
            {TITLE}
          </h1>
          <p className="mt-2 text-sm leading-7 text-neutral-600">{SUBTITLE}</p>
        </div>

        <section className="mt-6 overflow-hidden rounded-2xl border border-orange-200 bg-black shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
          <div className="relative aspect-video w-full">
            {playing ? (
              <TrackedIframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                title={`${TITLE} — ${SUBTITLE}`}
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
                  alt={`${TITLE} — ${SUBTITLE}`}
                  className="h-full w-full object-cover"
                />
                <span className="absolute inset-0 bg-black/10 transition group-active:bg-black/25" />
                <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 shadow-ios-raised transition group-active:scale-95">
                  <Play className="h-7 w-7 translate-x-0.5 fill-rose-500 text-rose-500" />
                </span>
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
