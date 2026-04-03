import { useState, useRef, useEffect, useCallback } from 'react';
import { useAICoachStream } from '@/hooks/useAICoachStream';
import { supabase } from '@/integrations/supabase/client';
import { AICoachHeader, type CoachMode } from '@/components/app/ai/AICoachHeader';
import { AICoachEmptyState } from '@/components/app/ai/AICoachEmptyState';
import { AICoachMessageBubble } from '@/components/app/ai/AICoachMessageBubble';
import { AICoachTypingIndicator } from '@/components/app/ai/AICoachTypingIndicator';
import { AICoachInput } from '@/components/app/ai/AICoachInput';
import { AICoachDivider } from '@/components/app/ai/AICoachDivider';
import { Button } from '@/components/ui/button';

export default function AppAICoach() {
  const { messages, isLoading, sendMessage, clearMessages, stopGeneration, loadHistory, followUps, insertDivider, executeProposal } = useAICoachStream();
  const [mode, setMode] = useState<CoachMode>('coach');
  const [userName, setUserName] = useState<string>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
      if (data?.full_name) setUserName(data.full_name.split(' ')[0]);
    })();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleModeSwitch = useCallback((newMode: CoachMode) => {
    if (newMode === mode) return;
    insertDivider(newMode);
    setMode(newMode);
  }, [mode, insertDivider]);

  const handleSend = useCallback((text: string, imageBase64?: string) => {
    if (!text.trim() && !imageBase64) return;
    sendMessage(text, mode, imageBase64);
  }, [sendMessage, mode]);

  const showTyping = isLoading && messages[messages.length - 1]?.role !== 'assistant';

  // Check if we should show inline empty state (after a divider with no messages following it)
  const lastMsg = messages[messages.length - 1];
  const showInlineEmptyState = messages.length > 0 && lastMsg?.role === 'divider';

  return (
    <div className="flex flex-col h-[100dvh] bg-muted/30">
      <AICoachHeader mode={mode} setMode={handleModeSwitch} onClear={clearMessages} />

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <AICoachEmptyState mode={mode} userName={userName} onSend={handleSend} />
        ) : (
          <>
            {messages.map(message => (
              message.role === 'divider' ? (
                <AICoachDivider key={message.id} mode={message.mode || mode} />
              ) : (
                <AICoachMessageBubble key={message.id} message={message} onExecuteProposal={executeProposal} />
              )
            ))}

            {showInlineEmptyState && !isLoading && (
              <AICoachEmptyState mode={mode} userName={userName} onSend={handleSend} inline />
            )}

            {showTyping && <AICoachTypingIndicator mode={mode} />}

            {!isLoading && followUps.length > 0 && messages.length > 0 && !showInlineEmptyState && (
              <div className="flex flex-wrap gap-1.5 pt-1 animate-fade-in">
                {followUps.map((chip, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    className="text-xs rounded-full h-7 bg-card/80 backdrop-blur-sm border-border/50"
                    onClick={() => handleSend(chip)}
                  >
                    {chip}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <AICoachInput mode={mode} isLoading={isLoading} onSend={handleSend} onStop={stopGeneration} />
    </div>
  );
}
