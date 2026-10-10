import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePrograms } from "@/hooks/usePrograms";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Copy, Link2, MessageSquarePlus, Loader2 } from "lucide-react";

const FORMS = [
  { key: "profileanalyze", label: "Instagram profile analysis", path: "/dashboard/forms/profileanalyze", titleFa: "فرم تحلیل پیج اینستاگرام" },
];

interface Props {
  userId: string;
  onInsert: (body: string, buttons?: MessageButton[]) => void;
}

export function SendLinkCard({ userId, onInsert }: Props) {
  const { programs } = usePrograms();
  const { toast } = useToast();
  const [tab, setTab] = useState<"program" | "form">("program");
  const [programSlug, setProgramSlug] = useState("");
  const [formKey, setFormKey] = useState(FORMS[0].key);
  const [busy, setBusy] = useState<"insert" | "copy" | null>(null);

  const program = programs.find(p => p.slug === programSlug);
  const form = FORMS.find(f => f.key === formKey)!;
  const ready = tab === "form" || !!program;

  const makeLink = async () => {
    const path = tab === "program" ? `/${program!.slug}` : form.path;
    const { data, error } = await supabase.functions.invoke("support-signin-link", { body: { userId, path } });
    if (error || !data?.url) throw new Error(error?.message || data?.error || "Could not create link");
    return data.url as string;
  };

  const run = async (mode: "insert" | "copy") => {
    setBusy(mode);
    try {
      const url = await makeLink();
      if (mode === "copy") {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied", description: "Works for 30 days and signs the student in automatically." });
      } else if (tab === "program") {
        onInsert(
          `برای مشاهده و ثبت‌نام در برنامه «${program!.title}» روی لینک زیر بزنید 👇\n${url}\nبدون نیاز به ورود دوباره، مستقیم وارد حساب خودتان می‌شوید.`,
        );
      } else {
        onInsert(
          `لطفاً ${form.titleFa} را از طریق لینک زیر پر کنید 👇\n${url}\nبدون نیاز به ورود دوباره، مستقیم وارد حساب خودتان می‌شوید.`,
        );
      }
    } catch (e: any) {
      toast({ title: "Couldn't create link", description: e.message, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <Link2 className="h-3.5 w-3.5" /> Send link (auto sign-in)
      </h4>
      <Tabs value={tab} onValueChange={v => setTab(v as any)}>
        <TabsList className="grid grid-cols-2 w-full h-8">
          <TabsTrigger value="program" className="text-xs">Program</TabsTrigger>
          <TabsTrigger value="form" className="text-xs">Form</TabsTrigger>
        </TabsList>
      </Tabs>
      {tab === "program" ? (
        <Select value={programSlug} onValueChange={setProgramSlug}>
          <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Pick a program" /></SelectTrigger>
          <SelectContent>
            {programs.map(p => (
              <SelectItem key={p.slug} value={p.slug} className="text-xs">{p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Select value={formKey} onValueChange={setFormKey}>
          <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            {FORMS.map(f => <SelectItem key={f.key} value={f.key} className="text-xs">{f.label}</SelectItem>)}
          </SelectContent>
        </Select>
      )}
      <div className="grid grid-cols-2 gap-2">
        <Button size="sm" className="h-9 text-xs gap-1.5" disabled={!ready || !!busy} onClick={() => run("insert")}>
          {busy === "insert" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquarePlus className="h-3.5 w-3.5" />}
          Insert into chat
        </Button>
        <Button size="sm" variant="outline" className="h-9 text-xs gap-1.5" disabled={!ready || !!busy} onClick={() => run("copy")}>
          {busy === "copy" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Copy className="h-3.5 w-3.5" />}
          Copy link
        </Button>
      </div>
    </div>
  );
}
