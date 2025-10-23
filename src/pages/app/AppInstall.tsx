import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Check, Smartphone } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';

const AppInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Install App - LadyBoss Academy"
        description="Install the LadyBoss Academy app on your device"
      />
      
      <div className="container max-w-4xl py-12 px-4">
        <div className="text-center mb-8">
          <Smartphone className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-2">Install LadyBoss Academy</h1>
          <p className="text-muted-foreground">
            Get the full app experience on your device
          </p>
        </div>

        {isInstalled ? (
          <Card className="border-green-500/50 bg-green-500/5">
            <CardContent className="pt-6 text-center">
              <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <h2 className="text-xl font-semibold mb-2">App Installed!</h2>
              <p className="text-muted-foreground">
                The LadyBoss Academy app is installed on your device.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {deferredPrompt && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Quick Install</CardTitle>
                  <CardDescription>
                    Click the button below to install the app
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={handleInstallClick} className="w-full" size="lg">
                    <Download className="mr-2 h-5 w-5" />
                    Install App Now
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
                <CardContent className="space-y-3 text-sm">
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>Open this page in <strong>Safari</strong> browser</li>
                    <li>Tap the <strong>Share</strong> button (square with arrow pointing up)</li>
                    <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                    <li>Tap <strong>"Add"</strong> in the top right corner</li>
                    <li>The LadyBoss Academy app icon will appear on your home screen</li>
                  </ol>
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
