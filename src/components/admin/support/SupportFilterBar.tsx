import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel,
  SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { getProgramLabel, parseRoundKey } from "./supportData";

export type SupportStatusFilter = "all" | "open" | "resolved" | "waiting";
export type SupportSort = "recent" | "oldest" | "unread";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  unreadOnly: boolean;
  onUnreadOnly: (v: boolean) => void;
  status: SupportStatusFilter;
  onStatus: (v: SupportStatusFilter) => void;
  sort: SupportSort;
  onSort: (v: SupportSort) => void;
  program: string;
  onProgram: (v: string) => void;
  programCounts: Array<{ slug: string; count: number }>;
  roundCounts: Array<{ key: string; count: number }>;
  total: number;
  unreadTotal: number;
}

export function SupportFilterBar({
  search, onSearch, unreadOnly, onUnreadOnly, status, onStatus,
  sort, onSort, program, onProgram, programCounts, roundCounts, total, unreadTotal,
}: Props) {
  const selectedLabel = program === "all"
    ? `All programs (${total})`
    : program.includes("::")
      ? (() => { const r = parseRoundKey(program); return `${getProgramLabel(r.slug)} · ${r.label}`; })()
      : getProgramLabel(program);
  return (
    <div className="border rounded-lg bg-background p-3 space-y-2 mb-4">
      <div className="flex flex-col md:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search name, email or message…"
            className="pl-9 h-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => onStatus(v as SupportStatusFilter)}>
          <SelectTrigger className="h-9 w-full md:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All conversations</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="waiting">Waiting on us (24h+)</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => onSort(v as SupportSort)}>
          <SelectTrigger className="h-9 w-full md:w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Newest first</SelectItem>
            <SelectItem value="oldest">Oldest first</SelectItem>
            <SelectItem value="unread">Unread first</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        <Badge
          variant={program === "all" ? "default" : "outline"}
          className="cursor-pointer text-xs shrink-0"
          onClick={() => onProgram("all")}
        >
          All ({total})
        </Badge>
        <Badge
          variant={unreadOnly ? "default" : "outline"}
          className={cn(
            "cursor-pointer text-xs shrink-0",
            unreadOnly
              ? "bg-red-500 text-white border-transparent"
              : unreadTotal > 0 && "border-red-500 text-red-600"
          )}
          onClick={() => onUnreadOnly(!unreadOnly)}
        >
          Unread ({unreadTotal})
        </Badge>
        {programCounts.map(({ slug, count }) => (
          <Badge
            key={slug}
            variant={program === slug ? "default" : "outline"}
            className="cursor-pointer text-xs shrink-0"
            onClick={() => onProgram(program === slug ? "all" : slug)}
          >
            {getProgramLabel(slug)} ({count})
          </Badge>
        ))}
      </div>
    </div>
  );
}
