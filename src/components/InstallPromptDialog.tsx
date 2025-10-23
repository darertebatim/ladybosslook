import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Smartphone, Loader2 } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface InstallPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InstallPromptDialog({ open, onOpenChange }: InstallPromptDialogProps) {
  const { handleCompleteSetup, isInstalled } = usePWAInstall();
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // If app is already installed, close the dialog
    if (isInstalled && open) {
      onOpenChange(false);
    }
  }, [isInstalled, open, onOpenChange]);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem('hideInstallPrompt', 'true');
    }
    onOpenChange(false);
  };

  const handleInstall = async () => {
    setIsLoading(true);
    const result = await handleCompleteSetup();
    setIsLoading(false);
    
    if (result.success) {
      localStorage.setItem('hideInstallPrompt', 'true');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">Get the Full App Experience!</DialogTitle>
          <DialogDescription className="text-center">
            Install LadyBoss Academy on your device for quick access, push notifications, and offline support.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="flex-col gap-4 sm:flex-col">
          <Button 
            onClick={handleInstall} 
            className="w-full"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Setting up...
              </>
            ) : (
              'Install & Enable Notifications'
            )}
          </Button>

          <div className="flex items-center space-x-2 justify-center">
            <Checkbox 
              id="dontShow" 
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
            />
            <Label 
              htmlFor="dontShow" 
              className="text-sm text-muted-foreground cursor-pointer"
            >
              Don't show this again
            </Label>
          </div>

          <Button 
            variant="ghost" 
            onClick={handleClose}
            className="w-full"
          >
            Not now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
