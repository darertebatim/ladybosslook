import { useState, useRef, useEffect } from 'react';
import { X, Send, Trash2, Copy, Check, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { useAIAssistant } from '@/contexts/AIAssistantContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const QUICK_ACTIONS = [
  { label: 'Draft announcement', prompt: 'Help me write an announcement for my community' },
  { label: 'Session reminder', prompt: 'Write a session reminder for tomorrow\'s class' },
  { label: 'Create ritual', prompt: 'Create a morning wellness ritual with 5 actions' },
  { label: 'Push notification', prompt: 'Write a short push notification to engage users' },
];

const TOOL_TO_FORM_TYPE: Record<string, string> = {
  create_broadcast_content: 'broadcast',
  create_feed_post_content: 'feed_post',
  create_push_notification_content: 'push_notification',
  create_routine_plan: 'routine_plan',
  suggest_task_templates: 'task_templates',
};

export function AIAssistantPanel() {
  const { 
    isOpen, 
    setIsOpen, 
    messages, 
    addMessage,
    updateMessage,
    clearMessages, 
    isLoading, 
    setIsLoading,
    currentPage,
    applyToForm,
    hasFormHandler,
  } = useAIAssistant();
  
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSend = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    setInput('');
    addMessage({ role: 'user', content: messageText });
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please log in to use the AI assistant');
        setIsLoading(false);
        return;
      }

      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const response = await fetch(
        `https://mnukhzjcvbwpvktxqlej.supabase.co/functions/v1/admin-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: [...conversationHistory, { role: 'user', content: messageText }],
            currentPage,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          toast.error('Rate limit exceeded. Please wait a moment.');
        } else if (response.status === 402) {
          toast.error('AI credits exhausted. Please add funds.');
        } else {
          toast.error(errorData.error || 'Failed to get AI response');
        }
        setIsLoading(false);
        return;
      }

      // Stream the response
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let assistantContent = '';
      let toolCall: { name: string; data: Record<string, any> } | undefined;
      let toolCallBuffer = '';
      let assistantMessageId: string | null = null;

      const processLine = (line: string) => {
        if (!line.startsWith('data: ')) return;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') return;

        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta;
          
          if (delta?.content) {
            assistantContent += delta.content;
            
            // Create or update the assistant message
            if (!assistantMessageId) {
              assistantMessageId = addMessage({ role: 'assistant', content: assistantContent });
            } else {
              updateMessage(assistantMessageId, { content: assistantContent });
            }
          }
          
          // Handle tool calls
          if (delta?.tool_calls) {
            for (const tc of delta.tool_calls) {
              if (tc.function?.name) {
                toolCallBuffer = '';
                toolCall = { name: tc.function.name, data: {} };
              }
              if (tc.function?.arguments) {
                toolCallBuffer += tc.function.arguments;
              }
            }
          }

          // Check for finish reason
          if (parsed.choices?.[0]?.finish_reason === 'tool_calls' && toolCall && toolCallBuffer) {
            try {
              toolCall.data = JSON.parse(toolCallBuffer);
              // Update the message with the tool call
              if (assistantMessageId) {
                updateMessage(assistantMessageId, { toolCall });
              }
            } catch {
              console.error('Failed to parse tool call arguments');
            }
          }
        } catch {
          // Ignore parse errors for partial chunks
        }
      };

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          processLine(line);
        }
      }

      // Process any remaining buffer
      if (buffer) {
        for (const line of buffer.split('\n')) {
          processLine(line);
        }
      }

      // Final update: ensure tool call is attached if we have one
      if (assistantMessageId && toolCall && toolCallBuffer) {
        try {
          toolCall.data = JSON.parse(toolCallBuffer);
          updateMessage(assistantMessageId, { content: assistantContent, toolCall });
        } catch {
          // Already handled
        }
      }

    } catch (error) {
      console.error('AI Assistant error:', error);
      toast.error('Failed to get AI response');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleApplyToForm = (toolCall: { name: string; data: Record<string, any> }) => {
    const formType = TOOL_TO_FORM_TYPE[toolCall.name];
    if (!formType) {
      toast.error('Unknown form type');
      return;
    }

    if (!hasFormHandler(formType)) {
      toast.error(`No ${formType} form found on this page. Navigate to the correct page first.`);
      return;
    }

    const success = applyToForm(formType, toolCall.data);
    if (success) {
      toast.success('Applied to form!');
    } else {
      toast.error('Failed to apply to form');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-6 bottom-24 w-[420px] max-w-[calc(100vw-3rem)] h-[600px] bg-background border rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-lg">✨</span>
          </div>
          <div>
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Page: {currentPage}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={clearMessages} className="h-8 w-8">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              How can I help you today?
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => handleSend(action.prompt)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <div
                  className={cn(
                    "max-w-[90%] rounded-lg px-3 py-2 overflow-hidden",
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  {message.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none break-words">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm break-words">{message.content}</p>
                  )}

                  {/* Tool call card */}
                  {message.toolCall && (
                    <Card className="mt-3 p-3 bg-background">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground capitalize">
                          {message.toolCall.name.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <pre className="text-xs bg-muted p-2 rounded overflow-x-auto max-h-40 whitespace-pre-wrap break-words">
                        {JSON.stringify(message.toolCall.data, null, 2)}
                      </pre>
                      <div className="flex gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1"
                          onClick={() => handleApplyToForm(message.toolCall!)}
                        >
                          Apply to Form
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopy(JSON.stringify(message.toolCall!.data, null, 2), message.id)}
                        >
                          {copiedId === message.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                    </Card>
                  )}

                  {/* Copy button for assistant messages */}
                  {message.role === 'assistant' && !message.toolCall && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-6 text-xs"
                      onClick={() => handleCopy(message.content, message.id)}
                    >
                      {copiedId === message.id ? (
                        <><Check className="h-3 w-3 mr-1" /> Copied</>
                      ) : (
                        <><Copy className="h-3 w-3 mr-1" /> Copy</>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
