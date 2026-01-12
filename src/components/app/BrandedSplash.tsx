import { cn } from '@/lib/utils';
import appIcon from '@/assets/app-icon.png';

interface BrandedSplashProps {
  className?: string;
}

export function BrandedSplash({ className }: BrandedSplashProps) {
  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10",
      className
    )}>
      {/* Logo */}
      <div className="relative mb-8">
        <img 
          src={appIcon} 
          alt="LadyBoss" 
          className="w-24 h-24 rounded-3xl shadow-xl animate-in fade-in duration-500"
        />
        {/* Subtle glow effect */}
        <div className="absolute inset-0 w-24 h-24 rounded-3xl bg-primary/20 blur-xl -z-10 animate-pulse" />
      </div>
      
      {/* Brand name */}
      <h1 className="text-2xl font-bold text-foreground mb-2 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
        LadyBoss
      </h1>
      <p className="text-sm text-muted-foreground animate-in fade-in duration-700 delay-300">
        Empowering Your Success
      </p>
      
      {/* Loading indicator */}
      <div className="mt-8 flex items-center gap-2 animate-in fade-in duration-700 delay-500">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
