import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Loader2, Trash2, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useJournalEntry, useCreateJournalEntry, useUpdateJournalEntry, useDeleteJournalEntry } from '@/hooks/useJournal';
import { MoodSelector } from '@/components/app/MoodSelector';
import { WritingPrompts } from '@/components/app/WritingPrompts';
import { JournalEntrySkeleton } from '@/components/app/skeletons/JournalSkeleton';
import { SEOHead } from '@/components/SEOHead';
import { toast } from 'sonner';
import { useBilingualText } from '@/components/ui/BilingualText';
import { cn } from '@/lib/utils';
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
  const { entryId } = useParams<{ entryId: string }>();
  const isNewEntry = !entryId;
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [entryIdState, setEntryIdState] = useState<string | null>(entryId || null);
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);
  
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const { data: existingEntry, isLoading } = useJournalEntry(entryId);
  const createMutation = useCreateJournalEntry();
  const updateMutation = useUpdateJournalEntry();
  const deleteMutation = useDeleteJournalEntry();
  
  // Detect Persian text for proper font and direction
  const { className: contentBilingualClassName, direction: contentDirection } = useBilingualText(content);
  const { className: titleBilingualClassName, direction: titleDirection } = useBilingualText(title);

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

  const handlePromptSelect = (prompt: string) => {
    setContent(prompt + '\n\n');
    textareaRef.current?.focus();
  };

  const handleBack = async () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    if (content.trim() && saveStatus !== 'saved') {
      await saveEntry();
    }
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

  const handleShare = async () => {
    if (!entryIdState) return;
    
    try {
      await updateMutation.mutateAsync({
        id: entryIdState,
        shared_with_admin: true,
      });
      toast.success('Journal entry shared with Razie');
      setShowShareDialog(false);
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
            <Button variant="ghost" size="icon" onClick={() => navigate('/app/journal')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-medium">Journal Entry</h1>
          </div>
        </header>
        <div className="flex-1 p-4">
          <JournalEntrySkeleton />
        </div>
      </div>
    );
  }

  const showWritingPrompts = isNewEntry && !content.trim() && !isTextareaFocused;
  const canShare = entryIdState && !existingEntry?.shared_with_admin && content.trim();
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
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-medium">
              {isNewEntry ? 'New Entry' : 'Edit Entry'}
            </h1>
          </div>
          
          {/* Save Status Indicator */}
          <div className="flex items-center gap-2">
            {saveStatus === 'saving' && (
              <div className="flex items-center gap-1 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
            {saveStatus === 'saved' && (
              <div className="flex items-center gap-1 text-green-600 text-sm">
                <Check className="h-4 w-4" />
                <span>Saved</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="p-4 space-y-4">
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

          {/* Mood Selector - Compact */}
          <div className="py-2">
            <MoodSelector value={mood} onChange={handleMoodChange} />
          </div>

          {/* Writing Prompts - Only for new empty entries */}
          {showWritingPrompts && (
            <div className="py-2">
              <WritingPrompts onSelectPrompt={handlePromptSelect} />
            </div>
          )}

          {/* Content Textarea */}
          <Textarea
            ref={textareaRef}
            placeholder="Start writing your thoughts..."
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onFocus={() => setIsTextareaFocused(true)}
            onBlur={() => setIsTextareaFocused(false)}
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
                className="text-destructive hover:text-destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {canShare && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowShareDialog(true)}
              >
                <Share2 className="h-4 w-4 mr-1" />
                Share with Razie
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
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Share Confirmation Dialog */}
      <AlertDialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Share with Razie?</AlertDialogTitle>
            <AlertDialogDescription>
              This will share your journal entry with Razie for personal feedback and support. 
              Your entry will remain private otherwise.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleShare}>
              Share Entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AppJournalEntry;
