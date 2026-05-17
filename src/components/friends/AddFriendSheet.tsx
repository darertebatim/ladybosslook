import { useState } from "react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useSendFriendRequest } from "@/hooks/useFriends";
import { UserPlus } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddFriendSheet({ open, onOpenChange }: Props) {
  const [code, setCode] = useState("");
  const send = useSendFriendRequest();

  const submit = async () => {
    if (!code.trim()) return;
    try {
      await send.mutateAsync(code);
      setCode("");
      onOpenChange(false);
    } catch { /* toast handled */ }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-[28px] border-0 p-0 max-h-[85dvh]"
      >
        <div className="p-6 pt-5">
          <div className="mx-auto w-10 h-1.5 rounded-full bg-black/15 mb-4" />
          <div className="flex items-center gap-2 mb-1">
            <div className="w-9 h-9 grid place-items-center rounded-2xl bg-gradient-to-br from-[hsl(var(--tint-peach))] to-[hsl(var(--tint-lavender))]">
              <UserPlus className="w-4 h-4 text-black" />
            </div>
            <h2 className="text-xl font-bold text-black dark:text-white">Add a friend</h2>
          </div>
          <p className="text-sm text-[hsl(var(--fg-warm-muted))] mb-5">
            Ask for their 8-letter friend code and type it below.
          </p>

          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ABCD2345"
            maxLength={8}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            className="w-full text-center tracking-[0.4em] font-mono text-2xl font-bold py-5 rounded-2xl bg-[hsl(var(--tint-peach))] text-black placeholder:text-black/30 outline-none shadow-ios"
          />

          <button
            onClick={submit}
            disabled={code.trim().length < 4 || send.isPending}
            className="mt-5 w-full min-h-12 py-3.5 rounded-2xl bg-black text-white font-semibold shadow-ios active:scale-[0.98] transition-transform disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none disabled:opacity-100"
          >
            {send.isPending ? "Sending…" : "Send friend request"}
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}