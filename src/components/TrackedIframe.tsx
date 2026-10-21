import { useRef, type IframeHTMLAttributes } from "react";
import { useVideoWatchTracking, withYouTubeApi } from "@/lib/videoTracking";

/** Drop-in <iframe> that records YouTube watch time. */
export function TrackedIframe({ src = "", title, ...rest }: IframeHTMLAttributes<HTMLIFrameElement>) {
  const ref = useRef<HTMLIFrameElement>(null);
  const tracked = withYouTubeApi(src);
  useVideoWatchTracking(ref, { url: src, title: title ?? undefined });
  return <iframe ref={ref} src={tracked} title={title} {...rest} />;
}

/** Drop-in <video> that records watch time. */
export function TrackedVideo({ src = "", title, ...rest }: React.VideoHTMLAttributes<HTMLVideoElement> & { title?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useVideoWatchTracking(ref, { url: src, title });
  return <video ref={ref} src={src} {...rest} />;
}

export default TrackedIframe;
