import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useCreateTaskFromTemplate, TaskTemplate } from '@/hooks/useTaskPlanner';
import { toast } from 'sonner';
import { Calendar, Sparkles, Plus, Loader2 } from 'lucide-react';

interface AddTaskSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: TaskTemplate | null;
}

export function AddTaskSheet({ open, onOpenChange, template }: AddTaskSheetProps) {
  const { user } = useAuth();
  const [choice, setChoice] = useState<'planner' | 'routine'>('planner');
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const createFromTemplate = useCreateTaskFromTemplate();

  // Fetch user's routines from routines_bank
  const { data: routines = [] } = useQuery({
    queryKey: ['routines-bank-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routines_bank')
        .select('id, title, emoji')
        .eq('is_active', true)
        .order('title');
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const handleAdd = async () => {
    if (!template) return;
    setIsAdding(true);

    try {
      if (choice === 'planner') {
        // Add directly to today's planner
        await createFromTemplate.mutateAsync({
          template,
          date: new Date(),
        });
        toast.success('Task added to today! ✨');
      } else if (choice === 'routine' && selectedRoutineId) {
        // Add task to selected routine
        // Get next task order
        const { data: existingTasks } = await supabase
          .from('routines_bank_tasks')
          .select('task_order')
          .eq('routine_id', selectedRoutineId)
          .order('task_order', { ascending: false })
          .limit(1);
        
        const nextOrder = (existingTasks?.[0]?.task_order || 0) + 1;

        const { error } = await supabase
          .from('routines_bank_tasks')
          .insert({
            routine_id: selectedRoutineId,
            title: template.title,
            emoji: template.emoji,
            color: template.color,
            duration_minutes: template.duration_minutes || 1,
            task_order: nextOrder,
            bank_task_id: template.id,
            is_active: true,
          });

        if (error) throw error;

        const routineName = routines.find(r => r.id === selectedRoutineId)?.title || 'routine';
        toast.success(`Added to "${routineName}"! ✨`);
      }
      
      onOpenChange(false);
      setChoice('planner');
      setSelectedRoutineId('');
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    } finally {
      setIsAdding(false);
    }
  };

  if (!template) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[60vh] rounded-t-3xl pb-safe">
        <SheetHeader className="pb-4">
          <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-2" />
          <SheetTitle className="flex items-center gap-2 justify-center">
            <span className="text-2xl">{template.emoji}</span>
            <span>Add "{template.title}"</span>
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 px-2">
          <RadioGroup value={choice} onValueChange={(v) => setChoice(v as 'planner' | 'routine')}>
            <div className="flex items-center space-x-3 p-4 rounded-xl bg-muted/50 border border-border/50">
              <RadioGroupItem value="planner" id="planner" />
              <Label htmlFor="planner" className="flex-1 flex items-center gap-3 cursor-pointer">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Add to Today's Planner</p>
                  <p className="text-sm text-muted-foreground">Add as a one-time task for today</p>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-4 rounded-xl bg-muted/50 border border-border/50">
              <RadioGroupItem value="routine" id="routine" />
              <Label htmlFor="routine" className="flex-1 flex items-center gap-3 cursor-pointer">
                <Sparkles className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Add to a Routine</p>
                  <p className="text-sm text-muted-foreground">Include in a repeating routine</p>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {choice === 'routine' && (
            <div className="space-y-2">
              <Label>Select Routine</Label>
              <Select value={selectedRoutineId} onValueChange={setSelectedRoutineId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a routine..." />
                </SelectTrigger>
                <SelectContent>
                  {routines.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No routines yet. Create one first!
                    </div>
                  ) : (
                    routines.map((routine) => (
                      <SelectItem key={routine.id} value={routine.id}>
                        <span className="flex items-center gap-2">
                          <span>{routine.emoji || '✨'}</span>
                          <span>{routine.title}</span>
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-3 pt-2 pb-4">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-12 rounded-full"
              disabled={isAdding || (choice === 'routine' && !selectedRoutineId)}
              onClick={handleAdd}
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
