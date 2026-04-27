import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlatformUpdatePanel } from './PlatformUpdatePanel';

type Platform = 'ios' | 'android';

export function UpdateNotificationSender() {
  const [platform, setPlatform] = useState<Platform>('ios');

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-lg border bg-muted/30 p-1">
        <Button
          size="sm"
          variant={platform === 'ios' ? 'default' : 'ghost'}
          onClick={() => setPlatform('ios')}
          className="rounded-md"
        >
          🍎 iOS
        </Button>
        <Button
          size="sm"
          variant={platform === 'android' ? 'default' : 'ghost'}
          onClick={() => setPlatform('android')}
          className="rounded-md"
        >
          🤖 Android
        </Button>
      </div>

      <PlatformUpdatePanel platform={platform} />
    </div>
  );
}
