import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Trash2, Mic, MicOff, Square, Sparkles, BookOpen, CalendarCheck, Heart } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAICoachStream, type CoachMessage, type ActionResult } from '@/hooks/useAICoachStream';
import { cn } from '@/lib/utils';

type CoachMode = 'coach' | 'assistant' | 'companion';

const MODES: { id: CoachMode; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'coach', label: 'Coach', icon: <BookOpen className="h-3.5 w-3.5" />, description: 'Routines & habits' },
  { id: 'assistant', label: 'Assistant', icon: <CalendarCheck className="h-3.5 w-3.5" />, description: 'Plan & organize' },
  { id: 'companion', label: 'Companion', icon: <Heart className="h-3.5 w-3.5" />, description: 'Emotional support' },
];

const QUICK_CHIPS: Record<CoachMode, { label: string; prompt: string }[]> = {
  coach: [
    { label: '✨ Suggest a routine', prompt: 'Suggest a routine that would be good for me based on my goals.' },
    { label: '🔄 Review my habits', prompt: 'How are my current routines going? What should I improve?' },
    { label: '🌅 Build a morning routine', prompt: 'Help me build a solid morning routine.' },
    { label: '📈 What\'s working?', prompt: 'Based on my activity, what habits are sticking and what needs work?' },
  ],
  assistant: [
    { label: '📋 Plan my day', prompt: 'Help me plan my day — what should I focus on?' },
    { label: '🎯 Add a task', prompt: 'Help me add a wellness task to my planner for today.' },
    { label: '⏰ Time-block my day', prompt: 'Create a time-blocked schedule for today based on my tasks.' },
    { label: '✅ What\'s left today?', prompt: 'What do I still need to do today? Help me prioritize.' },
  ],
  companion: [
    { label: '💭 How am I doing?', prompt: 'How am I doing based on my recent mood and activity?' },
    { label: '😮‍💨 I\'m stressed', prompt: 'I\'m feeling stressed right now. Can you help me reset?' },
    { label: '📝 Journal prompt', prompt: 'Give me a thoughtful journaling prompt for today.' },
    { label: '🫁 Need to breathe', prompt: 'I need a calming breathing exercise right now.' },
  ],
};

export default function AppAICoach() {
  const navigate = useNavigate();
  const { messages, isLoading, sendMessage, clearMessages, stopGeneration, loadHistory } = useAICoachStream();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<CoachMode>('coach');
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback((text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput('');
    sendMessage(msg, mode);
  }, [input, sendMessage, mode]);

  const toggleVoice = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) setInput(prev => prev + transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  const currentChips = QUICK_CHIPS[mode];

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <div className="border-b bg-card safe-area-top">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold truncate">Ladybosslook AI</h1>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={clearMessages} title="Clear history">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-1 px-4 pb-3">
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all",
                mode === m.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 pb-8">
            <div className="text-center space-y-2">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">
                {mode === 'coach' && 'Ready to build better habits? 💪'}
                {mode === 'assistant' && 'Let\'s get organized! 📋'}
                {mode === 'companion' && 'I\'m here for you 💙'}
              </h2>
              <p className="text-sm text-muted-foreground max-w-xs">
                {MODES.find(m => m.id === mode)?.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {currentChips.map(chip => (
                <Button
                  key={chip.label}
                  variant="outline"
                  size="sm"
                  className="text-xs rounded-full"
                  onClick={() => handleSend(chip.prompt)}
                >
                  {chip.label}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map(message => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}

        {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t bg-card safe-area-bottom">
        {isLoading && (
          <div className="flex justify-center mb-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={stopGeneration}>
              <Square className="h-3 w-3 mr-1" /> Stop
            </Button>
          </div>
        )}
        <form
          onSubmit={e => { e.preventDefault(); handleSend(); }}
          className="flex gap-2 items-end"
        >
          <Button
            type="button"
            variant={isListening ? "default" : "ghost"}
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={toggleVoice}
          >
            {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
          </Button>
          <Input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Message your coach..."
            disabled={isLoading}
            className="flex-1 rounded-full"
          />
          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-full"
            disabled={isLoading || !input.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: CoachMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted rounded-tl-sm"
        )}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none break-words [&>p]:mb-1 [&>p:last-child]:mb-0">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {message.actionResults && message.actionResults.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {message.actionResults.map((result, idx) => (
              <ActionResultCard key={idx} result={result} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionResultCard({ result }: { result: ActionResult }) {
  return (
    <Card className={cn(
      "p-2.5 text-xs",
      result.success
        ? "bg-accent/50 border-accent"
        : "bg-destructive/10 border-destructive/30"
    )}>
      <div className="flex items-center gap-1.5">
        <span>{result.success ? '✅' : '❌'}</span>
        <span className="font-medium">{result.message || result.error}</span>
      </div>
      {result.created && (
        <p className="text-muted-foreground mt-1 ml-5">
          {result.created.emoji || '✨'} {result.created.title || result.created.name || result.created.emotion}
        </p>
      )}
    </Card>
  );
}
