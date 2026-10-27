import { MoodCelebrationSheet } from '@/components/mood/MoodCelebrationSheet';
import { useState } from 'react';

export default function TmpMoodSheetCheck() {
  const [open, setOpen] = useState(true);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <MoodCelebrationSheet
        open={open}
        onOpenChange={setOpen}
        mood="good"
        onDone={() => setOpen(false)}
      />
    </div>
  );
}
