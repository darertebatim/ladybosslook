import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { X, Copy, RefreshCw, UserPlus, Heart, Sparkles, Music, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const HIDE_EMPTY_KEY = "hub.hideEmptyStars";

export function getHideEmptyStars(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(HIDE_EMPTY_KEY) === "1";
}

type NotifKey =
  | "friend_requests"
  | "friend_accepted"
  | "moments_received"
  | "playlist_gifts";

const NOTIF_ROWS: Array<{
  key: NotifKey;
  label: string;
  desc: string;
  Icon: typeof UserPlus;
}> = [
  { key: "friend_requests", label: "Friend requests", desc: "When someone wants to add you", Icon: UserPlus },
  { key: "friend_accepted", label: "Friend accepted", desc: "When someone accepts your request", Icon: Heart },
  { key: "moments_received", label: "Moments received", desc: "When a friend inspires you", Icon: Sparkles },
  { key: "playlist_gifts", label: "Playlist gifts", desc: "When a friend gifts you a playlist", Icon: Music },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string | null;
  hideEmptyStars: boolean;
  onHideEmptyStarsChange: (v: boolean) => void;
}

export function HubSettingsSheet({
  open,
  onOpenChange,
  code,
  hideEmptyStars,
  onHideEmptyStarsChange,
}: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [regenerating, setRegenerating] = useState(false);

  const { data: prefs } = useQuery({
    queryKey: ["notification-preferences", user?.id],
    enabled: !!user?.id && open,
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("user_notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      return data as Record<string, any> | null;
    },
  });

  const toggleNotif = useMutation({
    mutationFn: async ({ key, value }: { key: NotifKey; value: boolean }) => {
      if (!user?.id) throw new Error("No user");
      if (!prefs) {
        const { error } = await supabase
          .from("user_notification_preferences")
          .insert({ user_id: user.id, [key]: value } as any);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("user_notification_preferences")
          .update({ [key]: value } as any)
          .eq("user_id", user.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notification-preferences", user?.id] });
    },
    onError: () => toast.error("Couldn't save"),
  });

  const getNotif = (k: NotifKey): boolean => {
    if (prefs && k in prefs) return Boolean(prefs[k]);
    return true;
  };

  const copyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Code copied");
    } catch {
      toast.error("Couldn't copy");
    }
  };

  const regenerate = async () => {
    if (regenerating) return;
    const ok = typeof window !== "undefined"
      ? window.confirm("Generate a new code? Your old code will stop working.")
      : true;
    if (!ok) return;
    setRegenerating(true);
    try {
      const { data, error } = await supabase.rpc("regenerate_my_friend_code" as any);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["my-friend-code", user?.id] });
      toast.success(`New code: ${data}`);
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't regenerate");
    } finally {
      setRegenerating(false);
    }
  };

  const handleHideEmpty = (v: boolean) => {
    onHideEmptyStarsChange(v);
    try { window.localStorage.setItem(HIDE_EMPTY_KEY, v ? "1" : "0"); } catch {}
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-[28px] border-0 p-0 max-h-[92dvh] [&>button]:hidden"
        style={{ background: "linear-gradient(180deg, #1F1140 0%, #2A1655 100%)" }}
      >
        <div className="text-white flex flex-col max-h-[92dvh]">
          {/* Header */}
          <div className="p-5 pt-4 pb-3 shrink-0">
            <div className="mx-auto w-10 h-1.5 rounded-full bg-white/25 mb-4" />
            <div className="flex items-center justify-between">
              <button
                onClick={() => onOpenChange(false)}
                className="w-9 h-9 grid place-items-center rounded-full bg-white/10 active:scale-90"
                aria-label="Close"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              <h2 className="text-[17px] font-bold">Hub settings</h2>
              <div className="w-9" />
            </div>
          </div>

          {/* Body */}
          <div
            className="px-5 pb-8 overflow-y-auto"
            style={{ paddingBottom: "max(env(safe-area-inset-bottom), 32px)" }}
          >
            {/* Notifications */}
            <SectionLabel>Notifications</SectionLabel>
            <div className="rounded-2xl bg-white/[0.06] divide-y divide-white/10 overflow-hidden">
              {NOTIF_ROWS.map(({ key, label, desc, Icon }) => (
                <div key={key} className="flex items-center gap-3 px-4 py-3.5">
                  <div
                    className="w-9 h-9 rounded-full grid place-items-center shrink-0"
                    style={{ background: "linear-gradient(135deg, #FFB088 0%, #EB5E33 100%)" }}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-semibold text-white">{label}</div>
                    <div className="text-[11px] text-white/55 mt-0.5">{desc}</div>
                  </div>
                  <Switch
                    checked={getNotif(key)}
                    onCheckedChange={(v) => toggleNotif.mutate({ key, value: v })}
                    disabled={toggleNotif.isPending}
                  />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-white/45 mt-2 px-1">
              You'll still see these in your bell. Toggle off to silence push.
            </p>

            {/* Friend code */}
            <SectionLabel className="mt-6">My friend code</SectionLabel>
            <div className="rounded-2xl bg-white/[0.06] overflow-hidden">
              <button
                onClick={copyCode}
                disabled={!code}
                className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-white/[0.04] disabled:opacity-60"
              >
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-[11px] uppercase tracking-wider text-white/55 font-bold">Your code</div>
                  <div className="font-mono tracking-[0.25em] text-[16px] font-bold text-white mt-1">
                    {code ?? "————"}
                  </div>
                </div>
                <Copy className="w-4 h-4 text-white/70 shrink-0" />
              </button>
              <div className="h-px bg-white/10" />
              <button
                onClick={regenerate}
                disabled={regenerating}
                className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-white/[0.04] disabled:opacity-60"
              >
                <RefreshCw className={`w-4 h-4 text-white/70 ${regenerating ? "animate-spin" : ""}`} />
                <div className="flex-1 text-left">
                  <div className="text-[14px] font-semibold text-white">Generate new code</div>
                  <div className="text-[11px] text-white/55 mt-0.5">Old code stops working</div>
                </div>
              </button>
            </div>

            {/* Sky */}
            <SectionLabel className="mt-6">Sky</SectionLabel>
            <div className="rounded-2xl bg-white/[0.06] overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3.5">
                <div className="w-9 h-9 rounded-full grid place-items-center bg-white/10 shrink-0">
                  <EyeOff className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-white">Hide empty stars</div>
                  <div className="text-[11px] text-white/55 mt-0.5">Only show friends you've added</div>
                </div>
                <Switch checked={hideEmptyStars} onCheckedChange={handleHideEmpty} />
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function SectionLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`text-[11px] font-bold uppercase tracking-wider text-white/55 mb-2 px-1 ${className}`}>
      {children}
    </div>
  );
}