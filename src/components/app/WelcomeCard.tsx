import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import welcomeImage from '@/assets/welcome-simora.png';

interface WelcomeCardProps {
  onAddAction: () => void;
}

export function WelcomeCard({ onAddAction }: WelcomeCardProps) {
  const [dismissed, setDismissed] = useState(false);

  const handleDismiss = () => {
    setDismissed(true);
    // Clear force new user flag when dismissed
    localStorage.removeItem('simora_force_new_user');
  };

  if (dismissed) return null;

  return (
    <Card className="relative overflow-hidden border-0 shadow-lg">
      {/* Background Image */}
      <div className="relative">
        <img 
          src={welcomeImage} 
          alt="Welcome to Simora" 
          className="w-full h-44 object-cover object-top"
        />
        
        {/* Dismiss button */}
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors"
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
      
      {/* Content */}
      <div className="p-4 text-center">
        <p className="text-muted-foreground text-sm mb-4">
          Start with just one small action today.
          <br />
          <span className="text-xs opacity-70">One is enough. ✨</span>
        </p>
        
        <Button 
          onClick={onAddAction}
          className="w-full bg-violet-600 hover:bg-violet-700 text-white font-medium"
          size="lg"
        >
          Pick my first action
        </Button>
      </div>
    </Card>
  );
}
