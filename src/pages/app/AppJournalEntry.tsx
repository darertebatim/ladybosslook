import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Loader2, Trash2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useJournalEntry, useCreateJournalEntry, useUpdateJournalEntry, useDeleteJournalEntry } from '@/hooks/useJournal';
import { MoodSelector } from '@/components/app/MoodSelector';
import { JournalPromptMarquee } from '@/components/app/JournalPromptMarquee';

import { JournalEntrySkeleton } from '@/components/app/skeletons/JournalSkeleton';
import { BackButton } from '@/components/app/BackButton';
import { SEOHead } from '@/components/SEOHead';
import { toast } from 'sonner';
import { useShareContent } from '@/hooks/useShareContent';
import { useBilingualText } from '@/components/ui/BilingualText';
import { cn } from '@/lib/utils';
import { useRoutinePlayerContext } from '@/components/app/RoutinePlayerProvider';
import { useAutoCompleteProTask } from '@/hooks/useAutoCompleteProTask';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const AppJournalEntry = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { entryId } = useParams<{ entryId: string }>();
  const isNewEntry = !entryId || entryId === 'new';

  let routinePlayer: { isActive: boolean; isMinimized: boolean; maximize: () => void } | null = null;
  try { routinePlayer = useRoutinePlayerContext(); } catch { /* not available */ }
  const hasActivePlayer = routinePlayer?.isActive && routinePlayer?.isMinimized;
  const { autoCompleteJournal } = useAutoCompleteProTask();
  
  // Get mood from URL params for new entries (e.g., /app/journal/new?mood=great)
  const urlParams = new URLSearchParams(window.location.search);
  const initialMood = urlParams.get('mood');

  // Get prefill title from navigation state (journal prompt chips)
  const prefillTitle = (location.state as any)?.prefillTitle || '';
  
  const [title, setTitle] = useState(prefillTitle);
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<string | null>(initialMood);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [entryIdState, setEntryIdState] = useState<string | null>(isNewEntry ? null : entryId || null);
  
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { data: existingEntry, isLoading } = useJournalEntry(isNewEntry ? undefined : entryId);
  const createMutation = useCreateJournalEntry();
  const updateMutation = useUpdateJournalEntry();
  const deleteMutation = useDeleteJournalEntry();
  
  // Detect Persian text for proper font and direction
  const { className: contentBilingualClassName, direction: contentDirection } = useBilingualText(content);
  const { className: titleBilingualClassName, direction: titleDirection } = useBilingualText(title);

  const { handleShare } = useShareContent({
    title: 'Journal Entry',
    text: `📝 I just journaled on Routine Ladyboss — try it! 💫`,
    source: 'journal_entry',
  });

  // Load existing entry data
  useEffect(() => {
    if (existingEntry) {
      setTitle(existingEntry.title || '');
      setContent(existingEntry.content);
      setMood(existingEntry.mood);
      setEntryIdState(existingEntry.id);
    }
  }, [existingEntry]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  const saveEntry = useCallback(async () => {
    if (!content.trim()) return;
    
    setSaveStatus('saving');
    
    try {
      if (entryIdState) {
        await updateMutation.mutateAsync({
          id: entryIdState,
          title: title.trim() || null,
          content: content.trim(),
          mood,
        });
      } else {
        const newEntry = await createMutation.mutateAsync({
          title: title.trim() || null,
          content: content.trim(),
          mood,
        });
        setEntryIdState(newEntry.id);
        // Update URL without navigation
        window.history.replaceState(null, '', `/app/journal/${newEntry.id}`);
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('idle');
    }
  }, [content, title, mood, entryIdState, createMutation, updateMutation]);

  // Pre-navigation cleanup (doesn't navigate - BackButton handles that)
  const handleBackCleanup = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    if (content.trim() && saveStatus !== 'saved') {
      saveEntry(); // Fire and forget - mutation completes in background
    }
  }, [content, saveStatus, saveEntry]);

  const triggerAutoSave = useCallback(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    autoSaveTimeoutRef.current = setTimeout(() => {
      saveEntry();
    }, 3000);
  }, [saveEntry]);

  const handleContentChange = (value: string) => {
    setContent(value);
    triggerAutoSave();
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    triggerAutoSave();
  };

  const handleMoodChange = (newMood: string | null) => {
    setMood(newMood);
    triggerAutoSave();
  };



  const handleDone = async () => {
    // Cancel any pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Save immediately if there's content
    if (content.trim()) {
      await saveEntry();
      toast.success('Entry saved');
    }
    
    // If routine player is active, ensure task_completions is written before maximizing
    if (hasActivePlayer) {
      await autoCompleteJournal();
      navigate('/app/home');
      routinePlayer!.maximize();
      return;
    }
    
    // If opened from mood check-in or a tool flow, go home instead of journal list
    if (initialMood) {
      navigate('/app/home');
      return;
    }

    // Otherwise navigate back to journal list
    navigate('/app/journal');
  };

  const handleDelete = async () => {
    if (!entryIdState) {
      navigate('/app/journal');
      return;
    }
    
    try {
      await deleteMutation.mutateAsync(entryIdState);
      navigate('/app/journal');
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Show skeleton for existing entries while loading
  if (!isNewEntry && isLoading) {
    return (
      <div 
        className="flex flex-col bg-background"
        style={{ height: '100dvh' }}
      >
        <header 
          className="shrink-0 bg-background/95 backdrop-blur border-b"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        >
          <div className="flex items-center gap-3 px-4 pt-3 pb-2">
            <BackButton to="/app/journal" />
            <h1 className="text-lg font-medium">Journal Entry</h1>
          </div>
        </header>
        <div className="flex-1 p-4">
          <JournalEntrySkeleton />
        </div>
      </div>
    );
  }

  const canDelete = entryIdState;

  return (
    <div 
      className="flex flex-col bg-background"
      style={{ height: '100dvh' }}
    >
      <SEOHead title={title || 'New Entry'} description="Write your journal entry" />
      
      {/* Header */}
      <header 
        className="shrink-0 bg-background/95 backdrop-blur border-b z-10"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <BackButton to="/app/journal" onClick={handleBackCleanup} />
            <h1 className="text-lg font-medium">
              {isNewEntry ? 'New Entry' : 'Edit Entry'}
            </h1>
          </div>
          
          {/* Done button + share + save status */}
          <div className="flex items-center gap-2">
            {saveStatus === 'saving' && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            <button
              onClick={handleShare}
              className="h-9 w-9 flex items-center justify-center rounded-full active:scale-95 transition-transform"
              aria-label="Share"
            >
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </button>
            <Button 
              size="sm"
              onClick={handleDone}
              disabled={!content.trim() || saveStatus === 'saving'}
            >
              Done
            </Button>
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="p-4 space-y-4">
          {/* Mood Selector - Compact */}
          <div className="py-1">
            <MoodSelector value={mood} onChange={handleMoodChange} />
          </div>

          {/* Title Input */}
          <Input
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className={cn(
              "text-lg font-medium border-0 px-0 focus-visible:ring-0 placeholder:text-muted-foreground/50",
              titleBilingualClassName
            )}
            dir={titleDirection}
          />

          {/* Prompt Starters - shown for new entries with no content */}
          {isNewEntry && !title.trim() && !content.trim() && (
            <JournalPromptMarquee onSelect={(prompt) => {
              setTitle(prompt);
              triggerAutoSave();
            }} />
          )}

          {/* Content Textarea */}
          <Textarea
            ref={textareaRef}
            placeholder="Start writing your thoughts..."
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className={cn(
              "min-h-[200px] resize-none border-0 px-0 focus-visible:ring-0 text-base leading-relaxed placeholder:text-muted-foreground/50",
              contentBilingualClassName
            )}
            dir={contentDirection}
            style={{ overflow: 'hidden' }}
          />
        </div>
      </div>

      {/* Bottom Toolbar */}
      <div 
        className="shrink-0 border-t bg-background"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            {canDelete && (
              <Button 
                variant="ghost" 
                size="sm"
                className="text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Your journal entry will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AppJournalEntry;
