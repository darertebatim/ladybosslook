import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Video, FileText, ExternalLink, Star } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

const openUrl = async (url: string) => {
  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({ url });
    } else {
      window.open(url, '_blank');
    }
  } catch {
    window.open(url, '_blank');
  }
};

interface FeedActionButtonProps {
  actionType: 'none' | 'play_audio' | 'join_session' | 'view_materials' | 'external_link' | 'rate_app';
  actionData: Record<string, any>;
}

export function FeedActionButton({ actionType, actionData }: FeedActionButtonProps) {
  const navigate = useNavigate();

  if (actionType === 'none') return null;

  const handleClick = () => {
    switch (actionType) {
      case 'play_audio':
        if (actionData.audioId) {
          navigate(`/app/player/${actionData.audioId}`);
        } else if (actionData.playlistId) {
          navigate(`/app/playlist/${actionData.playlistId}`);
        }
        break;
      case 'join_session':
        if (actionData.meetingUrl) {
          openUrl(actionData.meetingUrl);
        }
        break;
      case 'view_materials':
        if (actionData.courseSlug) {
          navigate(`/app/programs/${actionData.courseSlug}`);
        } else if (actionData.url) {
          openUrl(actionData.url);
        }
        break;
      case 'external_link':
        if (actionData.url) {
          openUrl(actionData.url);
        }
        break;
      case 'rate_app':
        navigate('/app/rate');
        break;
    }
  };

  const getButtonContent = () => {
    const label = actionData.label;

    switch (actionType) {
      case 'play_audio':
        return (
          <>
            <Play className="h-4 w-4 mr-2" />
            {label || 'Listen Now'}
          </>
        );
      case 'join_session':
        return (
          <>
            <Video className="h-4 w-4 mr-2" />
            {label || 'Join Session'}
          </>
        );
      case 'view_materials':
        return (
          <>
            <FileText className="h-4 w-4 mr-2" />
            {label || 'View Materials'}
          </>
        );
      case 'external_link':
        return (
          <>
            <ExternalLink className="h-4 w-4 mr-2" />
            {label || 'Learn More'}
          </>
        );
      case 'rate_app':
        return (
          <>
            <Star className="h-4 w-4 mr-2" />
            {label || 'Rate the App ⭐'}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Button onClick={handleClick} className="w-full sm:w-auto">
      {getButtonContent()}
    </Button>
  );
}

