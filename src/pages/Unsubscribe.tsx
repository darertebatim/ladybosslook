import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/email-unsubscribe`;

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const email = (params.get("e") || "").trim().toLowerCase();
  const token = (params.get("t") || "").trim();
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${FN_URL}?e=${encodeURIComponent(email)}&t=${encodeURIComponent(token)}&format=json`,
        );
        const json = await res.json().catch(() => null);
        if (!cancelled) setState(json?.ok ? "ok" : "error");
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [email, token]);

  return (
    <>
      <SEOHead
        title="Unsubscribe | Rilo"
        description="Manage your email preferences for Rilo App (Ladybosslook LLC.)."
      />
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          {state === "loading" && (
            <>
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-neutral-400" />
              <h1 className="mt-4 text-lg font-semibold text-neutral-900">
                Updating your preferences…
              </h1>
            </>
          )}

          {state === "ok" && (
            <>
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
              <h1 className="mt-4 text-xl font-bold text-neutral-900">You're unsubscribed</h1>
              <p className="mt-2 text-sm leading-7 text-neutral-600">
                <strong className="break-all">{email}</strong> will no longer receive marketing
                emails from us.
              </p>
            </>
          )}

          {state === "error" && (
            <>
              <XCircle className="mx-auto h-12 w-12 text-neutral-400" />
              <h1 className="mt-4 text-xl font-bold text-neutral-900">This link isn't valid</h1>
              <p className="mt-2 text-sm leading-7 text-neutral-600">
                Please use the unsubscribe link from a recent email, or contact us and we'll remove
                you right away.
              </p>
            </>
          )}

          <a
            href="https://ladybosslook.com"
            className="mt-6 inline-block text-sm font-medium text-[#EA5B2B]"
          >
            ladybosslook.com
          </a>
        </div>
      </div>
    </>
  );
}
