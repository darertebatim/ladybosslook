import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Check, Smartphone, Bell, Loader2, AlertCircle, Share2, Plus, MoreVertical, Home, Compass } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { SEOHead } from '@/components/SEOHead';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { checkPermissionStatus, requestNotificationPermission, subscribeToPushNotifications } from '@/lib/pushNotifications';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const AppInstall = () => {
  const { user } = useAuth();
  const { deferredPrompt, isInstalled, isIOS, handleCompleteSetup } = usePWAInstall();
  const [isLoading, setIsLoading] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(checkPermissionStatus());
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const isNotificationsEnabled = notificationPermission === 'granted';

  // Show popup when iOS app gets installed and notifications aren't enabled
  useEffect(() => {
    console.log('[AppInstall] Debug:', { isIOS, isInstalled, isNotificationsEnabled, notificationPermission });
    if (isIOS && isInstalled && !isNotificationsEnabled) {
      console.log('[AppInstall] Showing notification popup');
      setShowNotificationPopup(true);
    }
  }, [isIOS, isInstalled, isNotificationsEnabled, notificationPermission]);

  const handleSetup = async () => {
    if (isIOS) {
      toast.error('On iPhone, please use Safari\'s Share menu to install the app first');
      return;
    }
    setIsLoading(true);
    const result = await handleCompleteSetup();
    setIsLoading(false);
    if (result.success) {
      setNotificationPermission(checkPermissionStatus());
    }
  };

  const handleEnableNotifications = async () => {
    if (!user?.id) {
      toast.error('Please log in first');
      return;
    }
    
    setIsLoading(true);
    setShowNotificationPopup(false);
    try {
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);
      
      if (permission === 'denied') {
        toast.error('Notifications were denied. Enable them in your device settings.');
        setIsLoading(false);
        return;
      }

      if (permission === 'granted') {
        const subscribeResult = await subscribeToPushNotifications(user.id);
        if (subscribeResult.success) {
          toast.success('Notifications enabled successfully!');
        } else {
          toast.error('Failed to enable notifications. Please try again.');
        }
      }
    } catch (error) {
      console.error('[Notifications] Error:', error);
      toast.error('Failed to enable notifications');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Install App - LadyBoss Academy"
        description="Install the LadyBoss Academy app on your device"
      />

      <AlertDialog open={showNotificationPopup} onOpenChange={setShowNotificationPopup}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Enable Notifications?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Stay updated with course announcements, new content, and important updates. 
              You can change this anytime in your device settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowNotificationPopup(false)}>
              Maybe Later
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleEnableNotifications} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enabling...
                </>
              ) : (
                <>
                  <Bell className="mr-2 h-4 w-4" />
                  Enable Now
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="container max-w-4xl py-12 px-4">
        <div className="text-center mb-8">
          <Smartphone className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-2">Install LadyBoss Academy</h1>
          <p className="text-muted-foreground">
            Get the full app experience on your device
          </p>
        </div>

        {isInstalled && isNotificationsEnabled ? (
          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="flex justify-center gap-4">
                <div className="flex flex-col items-center">
                  <Check className="h-12 w-12 mb-2 text-green-500" />
                  <span className="text-sm text-muted-foreground">App Installed</span>
                </div>
                <div className="flex flex-col items-center">
                  <Check className="h-12 w-12 mb-2 text-green-500" />
                  <span className="text-sm text-muted-foreground">Notifications On</span>
                </div>
              </div>
              <h2 className="text-xl font-semibold">All Set!</h2>
              <p className="text-muted-foreground">
                You're ready to use LadyBoss Academy with full features.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {isIOS && !isInstalled && (
              <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <AlertDescription className="ml-2">
                  <strong>iPhone/iPad users:</strong> Please follow the manual installation steps below. 
                  iOS requires installation through Safari's Share menu.
                </AlertDescription>
              </Alert>
            )}

            {isInstalled && !isNotificationsEnabled && isIOS && (
              <Card className="mb-6 border-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Enable Notifications
                  </CardTitle>
                  <CardDescription>
                    Stay updated with course announcements and updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={handleEnableNotifications} 
                    className="w-full" 
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Enabling...
                      </>
                    ) : (
                      <>
                        <Bell className="mr-2 h-5 w-5" />
                        Enable Push Notifications
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {!isIOS && (
              <Card className="mb-6 border-primary/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    One-Click Setup
                  </CardTitle>
                  <CardDescription>
                    Install the app and enable notifications in one step
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {isInstalled ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      <span>{isInstalled ? 'App Installed' : 'Install App'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {isNotificationsEnabled ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Bell className="h-4 w-4" />
                      )}
                      <span>{isNotificationsEnabled ? 'Notifications On' : 'Enable Notifications'}</span>
                    </div>
                  </div>
                  <Button 
                    onClick={handleSetup} 
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
                      <>
                        <Download className="mr-2 h-5 w-5" />
                        Complete Setup Now
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      1
                    </span>
                    iOS (iPhone/iPad)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Compass className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p><strong>Step 1:</strong> Open this page in <strong>Safari</strong> browser</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Share2 className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p><strong>Step 2:</strong> Tap the <strong>Share</strong> button (square with arrow pointing up)</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Plus className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p><strong>Step 3:</strong> Scroll down and tap <strong>"Add to Home Screen"</strong></p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p><strong>Step 4:</strong> Tap <strong>"Add"</strong> in the top right corner</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                        <Home className="h-4 w-4 text-green-500" />
                      </div>
                      <div className="flex-1">
                        <p><strong>Done!</strong> The LadyBoss Academy app icon will appear on your home screen</p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground mt-4">
                    <strong>Note:</strong> iOS 16.4 or later is required for push notifications.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                      2
                    </span>
                    Android
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>Open this page in <strong>Chrome</strong> browser</li>
                    <li>Tap the <strong>three dots menu</strong> in the top right</li>
                    <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></li>
                    <li>Tap <strong>"Install"</strong> in the popup</li>
                    <li>The app will be added to your home screen and app drawer</li>
                  </ol>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Why Install?</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span><strong>Quick Access:</strong> Launch directly from your home screen</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span><strong>Push Notifications:</strong> Get instant updates on announcements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span><strong>Offline Access:</strong> View courses even without internet</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                      <span><strong>Full Screen:</strong> App-like experience without browser UI</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AppInstall;
