import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Video, FileText, ExternalLink, Star } from 'lucide-react';
import { smartOpenUrl } from '@/lib/navigation-utils';
import { PRO_LINK_CONFIGS, getProTaskNavigationPath, type ProLinkType } from '@/lib/proTaskTypes';
import { PRO_LINK_EMOJIS } from '@/lib/proLinkPresentation';

interface FeedActionButtonProps {
  actionType: string;
  actionData: Record<string, any>;
}

export function FeedActionButton({ actionType, actionData }: FeedActionButtonProps) {
  const navigate = useNavigate();

  if (actionType === 'none') return null;

  const handleClick = () => {
    // New pro_link action type
    if (actionType === 'pro_link' && actionData.proLinkType) {
      const path = getProTaskNavigationPath(actionData.proLinkType as ProLinkType, actionData.proLinkValue || null);
      navigate(path);
      return;
    }

    // Legacy action types
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
          smartOpenUrl(actionData.meetingUrl, navigate);
        }
        break;
      case 'view_materials':
        if (actionData.courseSlug) {
          navigate(`/app/programs/${actionData.courseSlug}`);
        } else if (actionData.url) {
          smartOpenUrl(actionData.url, navigate);
        }
        break;
      case 'external_link':
        if (actionData.url) {
          smartOpenUrl(actionData.url, navigate);
        }
        break;
      case 'rate_app':
        navigate('/app/rate');
        break;
    }
  };

  const getButtonContent = () => {
    const label = actionData.label;

    // New pro_link type
    if (actionType === 'pro_link' && actionData.proLinkType) {
      const config = PRO_LINK_CONFIGS[actionData.proLinkType as ProLinkType];
      const emoji = PRO_LINK_EMOJIS[actionData.proLinkType as ProLinkType];
      if (config) {
        return (
          <>
            <span className="mr-1.5">{emoji}</span>
            {label || config.badgeText}
          </>
        );
      }
    }

    // Legacy types
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
