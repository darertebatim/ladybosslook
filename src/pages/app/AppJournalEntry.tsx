import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2, Check, Loader2, Save, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MoodSelector } from '@/components/app/MoodSelector';
import { WritingPrompts } from '@/components/app/WritingPrompts';
import { 
  useJournalEntry, 
  useCreateJournalEntry, 
  useUpdateJournalEntry,
  useDeleteJournalEntry 
} from '@/hooks/useJournal';
import { JournalEntrySkeleton } from '@/components/app/skeletons/JournalSkeleton';
import { SEOHead } from '@/components/SEOHead';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const AppJournalEntry = () => {
  const navigate = useNavigate();
  const { entryId } = useParams();
  const isNew = !entryId;
  
  const { data: existingEntry, isLoading } = useJournalEntry(entryId);
  const createMutation = useCreateJournalEntry();
  const updateMutation = useUpdateJournalEntry();
  const deleteMutation = useDeleteJournalEntry();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<string | null>(null);
  const [sharedWithAdmin, setSharedWithAdmin] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const createdEntryIdRef = useRef<string | null>(null);

  // Load existing entry data
  useEffect(() => {
    if (existingEntry) {
      setTitle(existingEntry.title || '');
      setContent(existingEntry.content || '');
      setMood(existingEntry.mood);
      setSharedWithAdmin(existingEntry.shared_with_admin || false);
    }
  }, [existingEntry]);

  // Auto-save logic with debounce
  const saveEntry = useCallback(async () => {
    if (!content.trim()) return;

    setSaveStatus('saving');
    
    try {
      if (isNew && !createdEntryIdRef.current) {
        // Create new entry
        const result = await createMutation.mutateAsync({
          title: title.trim() || undefined,
          content,
          mood: mood || undefined,
        });
        createdEntryIdRef.current = result.id;
        // Update URL without triggering navigation
        window.history.replaceState(null, '', `/app/journal/${result.id}`);
      } else {
        // Update existing entry
        const id = createdEntryIdRef.current || entryId;
        if (id) {
          await updateMutation.mutateAsync({
            id,
            title: title.trim() || undefined,
            content,
            mood: mood || undefined,
          });
        }
      }
      setSaveStatus('saved');
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Save failed:', error);
      setSaveStatus('idle');
    }
  }, [content, title, mood, isNew, entryId, createMutation, updateMutation]);

  // Debounced auto-save
  const triggerAutoSave = useCallback(() => {
    setHasUnsavedChanges(true);
    setSaveStatus('idle');
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveEntry();
    }, 3000);
  }, [saveEntry]);

  // Handle content changes
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    triggerAutoSave();
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    triggerAutoSave();
  };

  const handleMoodChange = (newMood: string | null) => {
    setMood(newMood);
    triggerAutoSave();
  };

  // Handle share with admin
  const handleShareWithAdmin = async () => {
    const id = createdEntryIdRef.current || entryId;
    if (!id) {
      toast.error('Please save your entry first');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id,
        shared_with_admin: true,
      });
      setSharedWithAdmin(true);
      setShowShareDialog(false);
      toast.success('Entry shared with Razie');
    } catch (error) {
      console.error('Share failed:', error);
      toast.error('Failed to share entry');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    const id = createdEntryIdRef.current || entryId;
    if (id) {
      await deleteMutation.mutateAsync(id);
      navigate('/app/journal');
    }
  };

  // Handle back navigation
  const handleBack = async () => {
    // Save before leaving if there are unsaved changes
    if (hasUnsavedChanges && content.trim()) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      await saveEntry();
    }
    navigate('/app/journal');
  };

  // Handle explicit save
  const handleSave = async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    await saveEntry();
    toast.success('Entry saved!');
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (isLoading && entryId) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate('/app/journal')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold">Loading...</h1>
            </div>
          </div>
        </div>
        <JournalEntrySkeleton />
      </div>
    );
  }

  const canShare = (entryId || createdEntryIdRef.current) && !sharedWithAdmin;

  return (
    <div className="min-h-screen bg-background flex flex-col pb-40">
      <SEOHead 
        title={isNew ? 'New Entry' : 'Edit Entry'} 
        description="Write your journal entry" 
      />
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">
              {isNew ? 'New Entry' : 'Edit Entry'}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            {saveStatus === 'saving' && (
              <span className="flex items-center text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="flex items-center text-sm text-green-600">
                <Check className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4">
        {/* Title */}
        <Input
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="text-lg font-medium"
        />

        {/* Mood selector */}
        <div>
          <p className="text-sm text-muted-foreground mb-3">How are you feeling?</p>
          <MoodSelector value={mood} onChange={handleMoodChange} />
        </div>

        {/* Writing prompts for new entries */}
        {isNew && !content.trim() && (
          <WritingPrompts 
            onSelectPrompt={(prompt) => {
              setContent(prompt + '\n\n');
            }} 
          />
        )}

        {/* Content editor */}
        <div className="flex-1">
          <Textarea
            placeholder="Write your thoughts..."
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            className="min-h-[200px] resize-none text-base leading-relaxed"
          />
        </div>

        {/* Share with Razie button (for saved entries only) */}
        {canShare && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowShareDialog(true)}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share with Razie
          </Button>
        )}

        {/* Already shared indicator */}
        {sharedWithAdmin && (
          <div className="flex items-center justify-center gap-2 py-2 text-sm text-primary">
            <Share2 className="h-4 w-4" />
            Shared with Razie
          </div>
        )}

        {/* Delete button (for existing entries) */}
        {(entryId || createdEntryIdRef.current) && (
          <Button
            variant="ghost"
            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Entry
          </Button>
        )}
      </div>

      {/* Fixed Save Button - always visible above tab bar */}
      <div className="fixed bottom-20 left-0 right-0 p-4 bg-background border-t z-10">
        <Button 
          className="w-full"
          onClick={handleSave}
          disabled={saveStatus === 'saving' || !content.trim()}
        >
          {saveStatus === 'saving' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {saveStatus === 'saving' ? 'Saving...' : 'Save Entry'}
        </Button>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this journal entry? This action cannot be undone.
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

      {/* Share confirmation dialog */}
      <AlertDialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Share with Razie</AlertDialogTitle>
            <AlertDialogDescription>
              This will allow Razie to read this journal entry. She may use it to better understand and support you. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleShareWithAdmin}>
              Share Entry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AppJournalEntry;