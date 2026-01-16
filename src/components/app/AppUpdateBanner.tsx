import { Download, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppUpdateChecker } from '@/hooks/useAppUpdateChecker';
import { Browser } from '@capacitor/browser';

export function AppUpdateBanner() {
  const { updateAvailable, latestVersion, storeUrl, dismiss } = useAppUpdateChecker();

  if (!updateAvailable) {
    return null;
  }

  const handleUpdate = async () => {
    try {
      await Browser.open({ url: storeUrl });
    } catch (error) {
      console.error('[AppUpdateBanner] Error opening App Store:', error);
      window.open(storeUrl, '_blank');
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl border-2 border-primary bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 p-4">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
      
      <div className="relative flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground">
            Update Available! 🎉
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            Version {latestVersion} is now available with new features and improvements.
          </p>
          
          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleUpdate}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Update Now
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={dismiss}
              className="text-muted-foreground"
            >
              Later
            </Button>
          </div>
        </div>
        
        {/* Dismiss button */}
        <Button
          size="icon"
          variant="ghost"
          onClick={dismiss}
          className="flex-shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
