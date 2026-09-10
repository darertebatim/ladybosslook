import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, X, Link2 } from "lucide-react";
import type { MessageButton } from "./supportData";

interface Props {
  buttons: MessageButton[];
  onChange: (buttons: MessageButton[]) => void;
  max?: number;
  compact?: boolean;
}

export function MessageButtonsEditor({ buttons, onChange, max = 3, compact }: Props) {
  const update = (i: number, patch: Partial<MessageButton>) => {
    onChange(buttons.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  };

  return (
    <div className="space-y-2">
      {buttons.map((b, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={b.label}
            onChange={(e) => update(i, { label: e.target.value })}
            placeholder="Button text"
            className={compact ? "h-8 text-xs" : ""}
          />
          <Input
            value={b.url}
            onChange={(e) => update(i, { url: e.target.value })}
            placeholder="https://… or /app/programs/slug"
            className={compact ? "h-8 text-xs" : ""}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => onChange(buttons.filter((_, idx) => idx !== i))}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {buttons.length < max && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() => onChange([...buttons, { label: "", url: "" }])}
        >
          <Plus className="h-3.5 w-3.5" />
          <Link2 className="h-3.5 w-3.5" />
          Add button
        </Button>
      )}
    </div>
  );
}
