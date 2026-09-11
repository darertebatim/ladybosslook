import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ChatConversationList } from "@/components/admin/ChatConversationList";
import { ChatPanel } from "@/components/admin/ChatPanel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Monitor, Smartphone, ArrowLeft } from "lucide-react";
import {
  SupportFilterBar,
  type SupportSort,
  type SupportStatusFilter,
} from "@/components/admin/support/SupportFilterBar";
import { NewMessageDialog } from "@/components/admin/support/NewMessageDialog";
import {
  conversationEmail,
  conversationMatchesProgram,
  conversationName,
  fetchSupportConversations,
  type SupportConversation,
} from "@/components/admin/support/supportData";

const DAY = 24 * 60 * 60 * 1000;

export default function Support() {
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<SupportConversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMode, setMobileMode] = useState(false);
  const [inboxType, setInboxType] = useState<'support' | 'coach'>('support');
  const [searchParams, setSearchParams] = useSearchParams();
  const targetUserId = searchParams.get('userId');

  // Filters
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [status, setStatus] = useState<SupportStatusFilter>("all");
  const [sort, setSort] = useState<SupportSort>("recent");
  const [program, setProgram] = useState("all");

  const fetchConversations = useCallback(async () => {
    try {
      const rows = await fetchSupportConversations(inboxType);
      setConversations(rows);
      setSelectedConversation(prev => {
        if (!prev) return null;
        return rows.find(c => c.id === prev.id) || prev;
      });
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [inboxType]);

  useEffect(() => {
    setSelectedConversation(null);
    setLoading(true);
    fetchConversations();

    const channel = supabase
      .channel(`admin-conversations-${inboxType}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_conversations' }, () => {
        fetchConversations();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [inboxType, fetchConversations]);

  // Auto-select conversation when ?userId= is provided
  useEffect(() => {
    if (!targetUserId || loading) return;
    (async () => {
      const conv = conversations.find(c => c.user_id === targetUserId);
      if (!conv) {
        const { data: convData } = await supabase
          .from('chat_conversations')
          .select('inbox_type')
          .eq('user_id', targetUserId)
          .order('last_message_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (convData && convData.inbox_type !== inboxType) {
          setInboxType(convData.inbox_type as 'support' | 'coach');
        }
        return;
      }
      handleSelectConversation(conv);
      searchParams.delete('userId');
      setSearchParams(searchParams, { replace: true });
    })();
  }, [targetUserId, conversations, loading, inboxType]);

  const programCounts = useMemo(() => {
    const map = new Map<string, number>();
    conversations.forEach(c => c.programs?.forEach(p => map.set(p, (map.get(p) || 0) + 1)));
    return Array.from(map.entries())
      .map(([slug, count]) => ({ slug, count }))
      .sort((a, b) => b.count - a.count);
  }, [conversations]);

  const roundCounts = useMemo(() => {
    const map = new Map<string, number>();
    conversations.forEach(c => c.rounds?.forEach(r => map.set(r, (map.get(r) || 0) + 1)));
    return Array.from(map.entries())
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [conversations]);

  const unreadTotal = useMemo(
    () => conversations.filter(c => c.unread_count_admin > 0).length,
    [conversations]
  );

  const visibleConversations = useMemo(() => {
    const term = search.trim().toLowerCase();
    const now = Date.now();
    let list = conversations.filter(c => {
      const matchesSearch =
        !term ||
        conversationName(c).toLowerCase().includes(term) ||
        conversationEmail(c).toLowerCase().includes(term) ||
        (c.last_message || "").toLowerCase().includes(term);
      const matchesProgram = conversationMatchesProgram(c, program);
      const matchesUnread = !unreadOnly || c.unread_count_admin > 0;
      const waiting =
        c.last_sender_type === 'user' &&
        c.last_message_at &&
        now - new Date(c.last_message_at).getTime() > DAY;
      const matchesStatus =
        status === "all" ||
        (status === "resolved" && !!c.resolved_at) ||
        (status === "open" && !c.resolved_at) ||
        (status === "waiting" && !c.resolved_at && waiting);
      return matchesSearch && matchesProgram && matchesUnread && matchesStatus;
    });

    list = [...list].sort((a, b) => {
      if (sort === "unread") {
        if ((b.unread_count_admin || 0) !== (a.unread_count_admin || 0)) {
          return (b.unread_count_admin || 0) - (a.unread_count_admin || 0);
        }
      }
      const ta = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
      const tb = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
      return sort === "oldest" ? ta - tb : tb - ta;
    });

    return list;
  }, [conversations, search, program, unreadOnly, status, sort]);

  const handleSelectConversation = (conv: SupportConversation) => {
    setSelectedConversation(conv);
    if (conv.unread_count_admin > 0) {
      setConversations(prev => prev.map(c =>
        c.id === conv.id ? { ...c, unread_count_admin: 0 } : c
      ));
    }
  };

  const handleBackToList = () => setSelectedConversation(null);

  const filterBar = (
    <SupportFilterBar
      search={search}
      onSearch={setSearch}
      unreadOnly={unreadOnly}
      onUnreadOnly={setUnreadOnly}
      status={status}
      onStatus={setStatus}
      sort={sort}
      onSort={setSort}
      program={program}
      onProgram={setProgram}
      programCounts={programCounts}
      roundCounts={roundCounts}
      total={conversations.length}
      unreadTotal={unreadTotal}
    />
  );

  // Mobile mode layout
  if (mobileMode) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {selectedConversation && (
              <Button variant="ghost" size="icon" onClick={handleBackToList}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-bold">
                {selectedConversation ? conversationName(selectedConversation) : 'Support Chat'}
              </h1>
              <p className="text-muted-foreground">
                {selectedConversation
                  ? conversationEmail(selectedConversation)
                  : 'Manage customer support conversations'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!selectedConversation && (
              <>
                <NewMessageDialog inboxType={inboxType} onSent={fetchConversations} />
                <Tabs value={inboxType} onValueChange={(v) => setInboxType(v as 'support' | 'coach')}>
                  <TabsList>
                    <TabsTrigger value="support">Support</TabsTrigger>
                    <TabsTrigger value="coach">Coach</TabsTrigger>
                  </TabsList>
                </Tabs>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => setMobileMode(false)} className="gap-2">
              <Monitor className="h-4 w-4" />
              Desktop
            </Button>
          </div>
        </div>

        {!selectedConversation && filterBar}

        <div className="flex-1 border rounded-lg overflow-hidden bg-background">
          {selectedConversation ? (
            <ChatPanel conversation={selectedConversation} onStatusChange={fetchConversations} />
          ) : (
            <ChatConversationList
              conversations={visibleConversations}
              selectedId={null}
              onSelect={handleSelectConversation}
              loading={loading}
              showFilters={false}
            />
          )}
        </div>
      </div>
    );
  }

  // Desktop mode layout
  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Support Chat</h1>
          <p className="text-muted-foreground">Manage customer support conversations</p>
        </div>
        <div className="flex items-center gap-2">
          <NewMessageDialog inboxType={inboxType} onSent={fetchConversations} />
          <Tabs value={inboxType} onValueChange={(v) => setInboxType(v as 'support' | 'coach')}>
            <TabsList>
              <TabsTrigger value="support">Support</TabsTrigger>
              <TabsTrigger value="coach">Coach</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={() => setMobileMode(true)} className="gap-2">
            <Smartphone className="h-4 w-4" />
            Mobile Mode
          </Button>
        </div>
      </div>

      {filterBar}

      <div className="flex flex-1 min-h-0 border rounded-lg overflow-hidden bg-background">
        <div className="w-80 shrink-0">
          <ChatConversationList
            conversations={visibleConversations}
            selectedId={selectedConversation?.id || null}
            onSelect={handleSelectConversation}
            loading={loading}
            showFilters={false}
          />
        </div>
        <div className="flex-1 min-w-0">
          <ChatPanel conversation={selectedConversation} onStatusChange={fetchConversations} />
        </div>
      </div>
    </div>
  );
}
