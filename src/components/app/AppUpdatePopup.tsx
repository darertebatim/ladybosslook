import { useState, useEffect } from 'react';
import { Download, Sparkles } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

const APP_STORE_URL = 'https://apps.apple.com/app/routine-ladybosslook/id6755076134';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.ladybosslook.academy';
const DISMISSED_KEY = 'app_update_popup_dismissed_id';

interface UpdatePopupConfig {
  id: string;
  title: string;
  description: string;
  buttonText: string;
  active: boolean;
  platform?: 'ios' | 'android'; // required target platform
}

export function AppUpdatePopup() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<UpdatePopupConfig | null>(null);

  useEffect(() => {
    if (!user) return;

    // Only show on native platforms
    if (!Capacitor.isNativePlatform()) return;

    const currentPlatform = Capacitor.getPlatform(); // 'ios' | 'android'

    const checkPopup = async () => {
      const { data } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'app_update_popup')
        .maybeSingle();

      if (!data?.value) return;

      try {
        const parsed: UpdatePopupConfig = JSON.parse(data.value);
        if (!parsed.active) return;

        // Platform gate: only show if popup targets this platform
        if (parsed.platform && parsed.platform !== currentPlatform) return;
        // If no platform is set (legacy), don't show — require explicit platform
        if (!parsed.platform) return;

        // Check if already dismissed this specific popup
        const dismissedId = localStorage.getItem(DISMISSED_KEY);
        if (dismissedId === parsed.id) return;

        setConfig(parsed);
        setOpen(true);
      } catch (e) {
        console.error('Failed to parse update popup config:', e);
      }
    };

    checkPopup();
  }, [user]);

  const handleUpdate = async () => {
    setOpen(false);
    if (config) localStorage.setItem(DISMISSED_KEY, config.id);
    
    const storeUrl = config?.platform === 'android' ? PLAY_STORE_URL : APP_STORE_URL;
    
    try {
      await Browser.open({ url: storeUrl });
    } catch {
      window.open(storeUrl, '_blank');
    }
  };

  const handleDismiss = () => {
    setOpen(false);
    if (config) localStorage.setItem(DISMISSED_KEY, config.id);
  };

  if (!config) return null;

  return (
    <AlertDialog open={open} onOpenChange={handleDismiss}>
      <AlertDialogContent className="max-w-[300px] p-0 rounded-3xl border-0 shadow-2xl overflow-hidden bg-gradient-to-b from-background to-muted/30">
        <AlertDialogHeader className="pt-6 pb-4 px-5">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="rounded-full bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 p-4">
                <Download className="h-7 w-7 text-emerald-600" />
              </div>
              <div className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>
          <AlertDialogTitle className="text-center text-lg font-semibold leading-tight">
            {config.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-sm text-muted-foreground mt-2">
            {config.description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-0 sm:flex-col p-4 pt-2">
          <AlertDialogAction 
            onClick={handleUpdate} 
            className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-base font-medium shadow-md"
          >
            {config.buttonText || 'Update Now'}
          </AlertDialogAction>
          <AlertDialogCancel 
            onClick={handleDismiss} 
            className="w-full h-10 rounded-xl border-0 m-0 mt-2 bg-transparent hover:bg-muted/50 text-sm font-normal text-muted-foreground"
          >
            Maybe later
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
