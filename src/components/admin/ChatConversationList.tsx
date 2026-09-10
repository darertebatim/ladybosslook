import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageCircle, Search } from "lucide-react";
import { useState, useMemo } from "react";
import {
  conversationEmail,
  conversationName,
  getProgramLabel,
  type SupportConversation,
} from "./support/supportData";

interface ChatConversationListProps {
  conversations: SupportConversation[];
  selectedId: string | null;
  onSelect: (conversation: SupportConversation) => void;
  loading?: boolean;
  /** Set to false when the page renders its own filter bar above the list. */
  showFilters?: boolean;
}

export function ChatConversationList({
  conversations,
  selectedId,
  onSelect,
  loading,
  showFilters = true,
}: ChatConversationListProps) {
  const [search, setSearch] = useState("");
  const [selectedProgram, setSelectedProgram] = useState<string>("all");
  const [unreadOnly, setUnreadOnly] = useState(false);

  const totalUnread = useMemo(
    () => conversations.filter(c => c.unread_count_admin > 0).length,
    [conversations]
  );

  const allPrograms = useMemo(() => {
    const slugs = new Set<string>();
    conversations.forEach(conv => {
      conv.programs?.forEach(p => slugs.add(p));
    });
    return Array.from(slugs).sort();
  }, [conversations]);

  const filteredConversations = showFilters
    ? conversations.filter(conv => {
        const term = search.toLowerCase();
        const matchesSearch =
          !search ||
          conversationName(conv).toLowerCase().includes(term) ||
          conversationEmail(conv).toLowerCase().includes(term);
        const matchesProgram =
          selectedProgram === "all" || conv.programs?.includes(selectedProgram);
        const matchesUnread = !unreadOnly || conv.unread_count_admin > 0;
        return matchesSearch && matchesProgram && matchesUnread;
      })
    : conversations;

  return (
    <div className="flex flex-col h-full border-r">
      {showFilters && (
        <div className="p-3 border-b space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {allPrograms.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <Badge
                variant={selectedProgram === "all" ? "default" : "outline"}
                className="cursor-pointer text-xs shrink-0"
                onClick={() => setSelectedProgram("all")}
              >
                All ({conversations.length})
              </Badge>
              <Badge
                variant={unreadOnly ? "default" : "outline"}
                className={cn(
                  "cursor-pointer text-xs shrink-0",
                  unreadOnly
                    ? "bg-red-500 text-white border-transparent"
                    : totalUnread > 0 && "border-red-500 text-red-600"
                )}
                onClick={() => setUnreadOnly(v => !v)}
              >
                Unread ({totalUnread})
              </Badge>
              {allPrograms.map(slug => {
                const count = conversations.filter(c => c.programs?.includes(slug)).length;
                return (
                  <Badge
                    key={slug}
                    variant={selectedProgram === slug ? "default" : "outline"}
                    className="cursor-pointer text-xs shrink-0"
                    onClick={() => setSelectedProgram(slug)}
                  >
                    {getProgramLabel(slug)} ({count})
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">Loading...</div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No conversations found</p>
          </div>
        ) : (
          filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={cn(
                "w-full p-3 text-left border-b hover:bg-muted/50 transition-colors relative",
                selectedId === conv.id && "bg-muted",
                conv.unread_count_admin > 0 && "bg-red-500/5"
              )}
            >
              {conv.unread_count_admin > 0 && (
                <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-red-500" />
              )}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "truncate",
                      conv.unread_count_admin > 0 ? "font-semibold" : "font-medium"
                    )}>
                      {conversationName(conv)}
                    </span>
                    {conv.resolved_at && (
                      <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">Resolved</Badge>
                    )}
                    {conv.unread_count_admin > 0 && (
                      <Badge className="h-5 min-w-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white border-transparent">
                        {conv.unread_count_admin}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {conversationEmail(conv)}
                  </p>
                  {conv.last_message && (
                    <p className={cn(
                      "text-sm truncate mt-1",
                      conv.unread_count_admin > 0
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    )}>
                      {conv.last_sender_type === "admin" ? "You: " : ""}{conv.last_message}
                    </p>
                  )}
                  {conv.programs && conv.programs.length > 0 && (
                    <p className="text-[10px] text-muted-foreground truncate mt-1">
                      {conv.programs.map(getProgramLabel).join(' · ')}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {conv.last_message_at
                      ? format(new Date(conv.last_message_at), 'MMM d, h:mm a')
                      : ''}
                  </span>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
