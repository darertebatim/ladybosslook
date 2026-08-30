import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Props {
  originalEmail: string;
  source: "sixtraps" | "smartinsta";
  roundId?: string | null;
}

const emailSchema = z.string().trim().email("ایمیل معتبر نیست").max(255);

const SOURCE_MAP: Record<Props["source"], { registration: string; additional: string; functionName: string }> = {
  sixtraps: {
    registration: "sixtraps_registration",
    additional: "sixtraps_additional_email",
    functionName: "send-sixtraps-confirmation",
  },
  smartinsta: {
    registration: "smartinsta_registration",
    additional: "smartinsta_additional_email",
    functionName: "send-smartinsta-confirmation",
  },
};

export default function WebinarAddEmailBox({ originalEmail, source, roundId }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    const parsed = emailSchema.safeParse(email);
    if (!parsed.success) {
      toast({
        title: "ایمیل معتبر نیست",
        description: "لطفاً یک ایمیل صحیح وارد کنید.",
        variant: "destructive",
      });
      return;
    }

    const newEmail = parsed.data.toLowerCase();
    if (newEmail === originalEmail.toLowerCase()) {
      toast({
        title: "این ایمیل قبلاً ثبت شده",
        description: "ایمیل وارد شده همان ایمیل اولیه است.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const config = SOURCE_MAP[source];

      // Try to attach to the original signup row; otherwise create a standalone additional row.
      const { data: submissions } = await (supabase as any)
        .from("form_submissions")
        .select("id, meta")
        .eq("email", originalEmail.toLowerCase())
        .eq("source", config.registration)
        .order("submitted_at", { ascending: false })
        .limit(1);

      const submission = submissions?.[0];
      if (submission) {
        const additional: string[] = submission.meta?.additional_emails || [];
        if (!additional.includes(newEmail)) {
          additional.push(newEmail);
          await (supabase as any)
            .from("form_submissions")
            .update({ meta: { ...(submission.meta || {}), additional_emails: additional } })
            .eq("id", submission.id);
        }
      }

      // Always record the additional email as its own submission so it shows in admin and gets the round.
      await (supabase as any).from("form_submissions").insert({
        name: "",
        email: newEmail,
        city: "",
        phone: "",
        source: config.additional,
        round_id: roundId || null,
        meta: { original_email: originalEmail.toLowerCase() },
      });

      // Send confirmation email to the new address (fire-and-forget, non-blocking).
      supabase.functions
        .invoke(config.functionName, {
          body: { name: "", email: newEmail },
        })
        .catch((err) => console.error("additional confirmation email error", err));

      toast({
        title: "ایمیل ثبت شد",
        description: "جزئیات وبینار به ایمیل جدید ارسال خواهد شد.",
      });
      setEmail("");
      setExpanded(false);
    } catch (err) {
      console.error("add email error", err);
      toast({
        title: "خطا",
        description: "مشکلی پیش آمد. لطفاً دوباره تلاش کنید.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      {!expanded ? (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full text-center text-sm font-semibold text-amber-800 transition active:opacity-70"
        >
          من ایمیل جزییات را نگرفتم
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-sm font-semibold text-amber-900">ایمیل دیگری وارد کنید:</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            dir="ltr"
            maxLength={255}
            className="min-h-[48px] w-full rounded-xl border border-neutral-300 bg-white px-4 text-base text-neutral-900 outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[48px] w-full rounded-xl bg-amber-500 text-base font-bold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60"
          >
            {submitting ? "در حال ثبت..." : "ثبت و ارسال جزئیات"}
          </button>
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="w-full text-center text-xs text-amber-700 transition active:opacity-70"
          >
            انصراف
          </button>
        </form>
      )}
    </section>
  );
}
