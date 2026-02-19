import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageCircle, Search } from "lucide-react";
import { useState, useMemo } from "react";

interface Conversation {
  id: string;
  user_id: string;
  status: string;
  unread_count_admin: number;
  last_message_at: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    email: string;
  };
  last_message?: string;
  programs?: string[];
}

interface ChatConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  loading?: boolean;
}

// Friendly labels for program slugs
const PROGRAM_LABELS: Record<string, string> = {
  'simora-plus': 'Simora+',
};

function getProgramLabel(slug: string): string {
  return PROGRAM_LABELS[slug] || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

export function ChatConversationList({ 
  conversations, 
  selectedId, 
  onSelect,
  loading 
}: ChatConversationListProps) {
  const [search, setSearch] = useState("");
  const [selectedProgram, setSelectedProgram] = useState<string>("all");

  // Collect all unique program slugs across conversations
  const allPrograms = useMemo(() => {
    const slugs = new Set<string>();
    conversations.forEach(conv => {
      conv.programs?.forEach(p => slugs.add(p));
    });
    return Array.from(slugs).sort();
  }, [conversations]);

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = !search || 
      conv.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      conv.profiles?.email?.toLowerCase().includes(search.toLowerCase());
    const matchesProgram = selectedProgram === "all" || conv.programs?.includes(selectedProgram);
    return matchesSearch && matchesProgram;
  });

  return (
    <div className="flex flex-col h-full border-r">
      {/* Filters */}
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
        {/* Program tag filters */}
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant={selectedProgram === "all" ? "default" : "outline"}
            className="cursor-pointer text-xs"
            onClick={() => setSelectedProgram("all")}
          >
            All
          </Badge>
          {allPrograms.map(slug => (
            <Badge
              key={slug}
              variant={selectedProgram === slug ? "default" : "outline"}
              className="cursor-pointer text-xs"
              onClick={() => setSelectedProgram(slug)}
            >
              {getProgramLabel(slug)}
            </Badge>
          ))}
        </div>
      </div>

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
                "w-full p-3 text-left border-b hover:bg-muted/50 transition-colors",
                selectedId === conv.id && "bg-muted"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">
                      {conv.profiles?.full_name || 'Unknown User'}
                    </span>
                    {conv.unread_count_admin > 0 && (
                      <Badge variant="default" className="h-5 min-w-5 flex items-center justify-center rounded-full">
                        {conv.unread_count_admin}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {conv.profiles?.email}
                  </p>
                  {conv.last_message && (
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {conv.last_message}
                    </p>
                  )}
                  {/* Program tags */}
                  {conv.programs && conv.programs.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {conv.programs.map(slug => (
                        <Badge key={slug} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {getProgramLabel(slug)}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {format(new Date(conv.last_message_at), 'MMM d, h:mm a')}
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
