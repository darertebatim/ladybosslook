import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Play, Video, FileText, ExternalLink } from 'lucide-react';

interface FeedActionButtonProps {
  actionType: 'none' | 'play_audio' | 'join_session' | 'view_materials' | 'external_link';
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
          window.open(actionData.meetingUrl, '_blank');
        }
        break;
      case 'view_materials':
        if (actionData.courseSlug) {
          navigate(`/app/courses/${actionData.courseSlug}`);
        } else if (actionData.url) {
          window.open(actionData.url, '_blank');
        }
        break;
      case 'external_link':
        if (actionData.url) {
          window.open(actionData.url, '_blank');
        }
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
