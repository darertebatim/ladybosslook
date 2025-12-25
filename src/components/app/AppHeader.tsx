import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightAction?: ReactNode;
  transparent?: boolean;
}

export function AppHeader({ 
  title, 
  subtitle, 
  showBack = false, 
  rightAction, 
  transparent = false 
}: AppHeaderProps) {
  const navigate = useNavigate();

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 ${
        transparent 
          ? 'bg-background/80 backdrop-blur-lg' 
          : 'bg-background border-b border-border'
      }`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {showBack && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="font-semibold text-lg truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {rightAction && (
          <div className="shrink-0 ml-2">
            {rightAction}
          </div>
        )}
      </div>
    </header>
  );
}

// Spacer to offset content below fixed header (56px header + safe area)
export function AppHeaderSpacer() {
  return (
    <div 
      style={{ 
        height: 'calc(56px + env(safe-area-inset-top, 0px))' 
      }} 
    />
  );
}