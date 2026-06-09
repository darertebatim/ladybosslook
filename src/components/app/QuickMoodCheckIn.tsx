import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { FluentEmoji } from '@/components/ui/FluentEmoji';
import { useCreateMoodLog } from '@/hooks/useMoodLogs';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

// 5-level mood system matching Me+ design
const MOODS = [
  { 
    value: 'great', 
    emoji: '😄', 
    label: 'Great',
    bgColor: 'bg-yellow-200',
  },
  { 
    value: 'good', 
    emoji: '🙂', 
    label: 'Good',
    bgColor: 'bg-green-200',
  },
  { 
    value: 'okay', 
    emoji: '😐', 
    label: 'Okay',
    bgColor: 'bg-blue-200',
  },
  { 
    value: 'not_great', 
    emoji: '😔', 
    label: 'Not Great',
    bgColor: 'bg-purple-200',
  },
  { 
    value: 'bad', 
    emoji: '😢', 
    label: 'Bad',
    bgColor: 'bg-red-200',
  },
];

interface QuickMoodCheckInProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickMoodCheckIn({ open, onOpenChange }: QuickMoodCheckInProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const createMoodLog = useCreateMoodLog();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleMoodSelect = async (moodValue: string) => {
    haptic.selection();
    setIsSubmitting(true);
    
    try {
      // Log mood without creating a journal entry
      const moodLabel = MOODS.find(m => m.value === moodValue)?.label || moodValue;
      await createMoodLog.mutateAsync({
        mood: moodValue,
        content: `Feeling ${moodLabel.toLowerCase()} today.`,
        source: 'quick',
      });
      
      haptic.success();
      toast.success(t('homePlanner.moodLogged'), {
        action: {
          label: t('reflections.freeForm'),
          onClick: () => navigate(`/app/reflections/free-form?mood=${moodValue}`),
        },
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to log mood:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-safe">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-xl font-semibold text-center">
            How are you feeling?
          </DrawerTitle>
        </DrawerHeader>
        
        <div className="px-6 pb-8 pt-4">
          {/* Top row - 3 moods */}
          <div className="flex justify-center gap-4 mb-6">
            {MOODS.slice(0, 3).map((mood) => (
              <button
                key={mood.value}
                onClick={() => handleMoodSelect(mood.value)}
                disabled={isSubmitting}
                className={cn(
                  'flex flex-col items-center gap-2 transition-all',
                  'active:scale-95 disabled:opacity-50'
                )}
              >
                <div className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center',
                  mood.bgColor
                )}>
                  <FluentEmoji emoji={mood.emoji} size={48} />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {mood.label}
                </span>
              </button>
            ))}
          </div>
          
          {/* Bottom row - 2 moods */}
          <div className="flex justify-center gap-4">
            {MOODS.slice(3).map((mood) => (
              <button
                key={mood.value}
                onClick={() => handleMoodSelect(mood.value)}
                disabled={isSubmitting}
                className={cn(
                  'flex flex-col items-center gap-2 transition-all',
                  'active:scale-95 disabled:opacity-50'
                )}
              >
                <div className={cn(
                  'w-20 h-20 rounded-full flex items-center justify-center',
                  mood.bgColor
                )}>
                  <FluentEmoji emoji={mood.emoji} size={48} />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {mood.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
