import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { ArrowDown, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/SEOHead";

const schema = z.object({
  email: z.string().trim().email("ایمیل معتبر نیست").max(255),
});

export default function IgAdsGifts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.errors[0]?.message || "ایمیل معتبر نیست");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      // Saves the email with a server timestamp and sends the gift email.
      const { error: fnError } = await supabase.functions.invoke("send-igads-gifts", {
        body: { email: parsed.data.email.toLowerCase() },
      });

      if (fnError) {
        // If saving/sending fails, still let them get the gifts.
        console.warn("igads gifts submission error", fnError);
      }

      navigate("/giftsalilotfivip", { replace: true });
    } catch (err) {
      console.error("gifts submit error", err);
      toast({
        title: "خطا",
        description: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  }

  return (
    <>
      <SEOHead
        title="هدایای ویژه وبینار اینستاگرام ادز | Rilo"
        description="دریافت هدایا و منابع ویژه استاد لطفی پس از وبینار جذب مشتری با اینستاگرام ادز."
        locale="fa_IR"
      />
      <div
        dir="rtl"
        lang="fa"
        className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-amber-50 font-farsi"
      >
        <main className="mx-auto flex w-full max-w-md flex-col items-center px-4 pb-16 pt-10">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-rose-500 to-amber-500 text-4xl text-white shadow-lg">
            <Gift className="h-10 w-10" />
          </div>

          <h1 className="mt-6 text-center text-2xl font-bold leading-tight text-neutral-900">
            🎁 هدایای ویژه وبینار 🎁
          </h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-neutral-600">
            ایمیل خود را وارد کنید تا فوراً به صفحه هدایا منتقل شوید.
          </p>

          <form
            onSubmit={handleSubmit}
            dir="ltr"
            className="mt-8 w-full space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm text-left"
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-neutral-800">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                className="min-h-[48px] w-full rounded-xl border border-neutral-300 bg-white px-4 text-base text-neutral-900 outline-none focus:border-rose-500"
                placeholder="you@example.com"
                dir="ltr"
                autoFocus
              />
              {error && (
                <p className="mt-1 text-xs text-rose-600">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-rose-500 to-amber-500 text-base font-bold text-white shadow-md transition active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? "در حال ورود..." : (
                <>
                  دریافت هدایا
                  <ArrowDown className="h-4 w-4" />
                </>
              )}
            </button>

            <p className="text-center text-[11px] leading-5 text-neutral-500">
              با وارد کردن ایمیل، هدایا برای شما باز می‌شوند.
            </p>
          </form>
        </main>
      </div>
    </>
  );
}
