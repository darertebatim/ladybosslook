import { ReactNode } from 'react';
import { BackButton } from '@/components/app/BackButton';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  backTo?: string;
  rightAction?: ReactNode;
  transparent?: boolean;
}

export function AppHeader({ 
  title, 
  subtitle, 
  showBack = false,
  backTo,
  rightAction, 
  transparent = false 
}: AppHeaderProps) {
  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 rounded-b-3xl shadow-sm ${
        transparent 
          ? 'bg-[#F4ECFE]/80 dark:bg-violet-950/80 backdrop-blur-lg' 
          : 'bg-[#F4ECFE] dark:bg-violet-950/90'
      }`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex items-center justify-between pt-3 pb-2 px-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {showBack && (
            <BackButton to={backTo} className="shrink-0" />
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

// Spacer to offset content below fixed header (~48px header + safe area)
export function AppHeaderSpacer() {
  return (
    <div 
      style={{ 
        height: 'calc(48px + env(safe-area-inset-top, 0px))' 
      }} 
    />
  );
}