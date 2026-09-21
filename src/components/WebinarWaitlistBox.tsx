import { useState } from "react";
import { z } from "zod";
import { BellRing, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  /** form_submissions.source used for waitlist rows, e.g. "igads_waitlist" */
  source: string;
  /** Farsi title shown above the form */
  title?: string;
}

const schema = z.object({
  name: z.string().trim().min(2, "نام را کامل وارد کنید").max(100),
  email: z.string().trim().email("ایمیل معتبر نیست").max(255),
});

export default function WebinarWaitlistBox({ source, title }: Props) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const parsed = schema.safeParse({ name, email });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.errors.forEach((er) => {
        if (er.path[0]) errs[String(er.path[0])] = er.message;
      });
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const { error } = await (supabase as any).from("form_submissions").insert({
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        city: "",
        phone: "",
        source,
        round_id: null,
      });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      console.error("waitlist submit error", err);
      toast({
        title: "خطا",
        description: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <section className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
          <Check className="h-6 w-6" />
        </div>
        <p className="mt-3 text-base font-bold text-emerald-800">ثبت شد ✅</p>
        <p className="mt-1 text-sm leading-6 text-emerald-700">
          به محض اعلام تاریخ جلسه بعدی، لینک ثبت‌نام را برای شما ایمیل می‌کنیم.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <BellRing className="h-6 w-6" />
        </div>
        <h2 className="mt-3 text-lg font-bold text-neutral-900">
          {title || "در حال حاضر جلسه‌ زنده‌ای برگزار نمی‌شود"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-neutral-600">
          ایمیل خود را وارد کنید تا به لیست انتظار اضافه شوید؛ اولین نفری باشید که از تاریخ
          وبینار بعدی باخبر می‌شود.
        </p>
      </div>

      <form onSubmit={handleSubmit} dir="ltr" className="mt-5 space-y-4 text-left">
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-800">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            placeholder="e.g. Sara Ahmadi"
            dir="ltr"
            className="min-h-[48px] w-full rounded-xl border border-neutral-300 bg-white px-4 text-base text-neutral-900 outline-none focus:border-rose-500"
          />
          {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-800">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={255}
            placeholder="you@example.com"
            dir="ltr"
            className="min-h-[48px] w-full rounded-xl border border-neutral-300 bg-white px-4 text-base text-neutral-900 outline-none focus:border-rose-500"
          />
          {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="min-h-[52px] w-full rounded-xl bg-gradient-to-l from-rose-500 to-amber-500 text-base font-bold text-white shadow-md transition active:scale-[0.98] disabled:opacity-60"
        >
          {submitting ? "در حال ثبت..." : "مرا در لیست انتظار قرار بده"}
        </button>
      </form>
    </section>
  );
}
