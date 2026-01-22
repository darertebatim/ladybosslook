import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface JournalReminderSettingsProps {
  className?: string;
}

// The journal Pro Routine ID - contains the "Daily Reflection & Gratitude" pro task
const JOURNAL_ROUTINE_ID = '51be0466-99fb-4357-b48d-b584376046c5';

export const JournalReminderSettings = ({ className }: JournalReminderSettingsProps) => {
  const navigate = useNavigate();

  const handleAddToRoutine = () => {
    navigate(`/app/routines/${JOURNAL_ROUTINE_ID}`);
  };

  return (
    <div className={className}>
      <Button
        variant="outline"
        size="sm"
        onClick={handleAddToRoutine}
        className="w-full gap-2"
      >
        <Sparkles className="h-4 w-4" />
        Add Journaling to My Routine
      </Button>
    </div>
  );
};
