import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Clock, Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PRO_LINK_CONFIGS, getProTaskNavigationPath, type ProLinkType } from '@/lib/proTaskTypes';
import { useProTaskTemplate, useAddProTaskToPlanner } from '@/hooks/useProTaskTemplates';

export default function AppQuickActionDetail() {
  const { templateId } = useParams();
  const navigate = useNavigate();
  
  const { data: template, isLoading } = useProTaskTemplate(templateId);
  const addToPlanner = useAddProTaskToPlanner();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
        <p className="text-muted-foreground mb-4">Quick action not found</p>
        <Button variant="outline" onClick={() => navigate('/app/inspire')}>
          Go Back
        </Button>
      </div>
    );
  }

  const IconComponent = (LucideIcons as any)[template.icon] || LucideIcons.Zap;
  const linkConfig = PRO_LINK_CONFIGS[template.pro_link_type as ProLinkType];
  const ActionIcon = linkConfig?.icon || LucideIcons.Sparkles;
  const navigationPath = getProTaskNavigationPath(
    template.pro_link_type as ProLinkType,
    template.pro_link_value || template.linked_playlist_id
  );

  const handleAddToPlanner = async () => {
    await addToPlanner.mutateAsync({ template });
    navigate('/app/planner');
  };

  const handleGoNow = () => {
    navigate(navigationPath);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <div 
        className={cn(
          'relative pt-safe',
          template.linked_playlist?.cover_image_url
            ? 'h-72'
            : cn('h-56', linkConfig?.gradientClass || 'bg-gradient-to-br from-purple-100 to-violet-100')
        )}
      >
        {/* Cover image */}
        {template.linked_playlist?.cover_image_url && (
          <>
            <img
              src={template.linked_playlist.cover_image_url}
              alt={template.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
          </>
        )}

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className={cn(
            'absolute left-4 z-10 p-2 rounded-full backdrop-blur-sm',
            template.linked_playlist?.cover_image_url 
              ? 'bg-black/30 text-white'
              : 'bg-white/50 text-foreground'
          )}
          style={{ top: 'calc(env(safe-area-inset-top, 12px) + 12px)' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Centered icon when no image */}
        {!template.linked_playlist?.cover_image_url && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn(
              'w-24 h-24 rounded-full flex items-center justify-center',
              'bg-white/30 backdrop-blur-sm'
            )}>
              <IconComponent className={cn('w-12 h-12', linkConfig?.iconColorClass || 'text-purple-600')} />
            </div>
          </div>
        )}

        {/* Badge */}
        <div 
          className={cn(
            'absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm',
            template.linked_playlist?.cover_image_url
              ? 'bg-black/40 text-white'
              : linkConfig?.badgeColorClass || 'bg-purple-500/20 text-purple-700'
          )}
          style={{ top: 'calc(env(safe-area-inset-top, 12px) + 12px)' }}
        >
          <ActionIcon className="w-4 h-4" />
          <span>{linkConfig?.badgeText || 'Open'}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 -mt-6 bg-background rounded-t-3xl relative z-10">
        <h1 className="text-2xl font-bold text-foreground mb-2">{template.title}</h1>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{template.duration_minutes} minutes</span>
          </div>
          {template.category && (
            <span className="px-2 py-0.5 bg-muted rounded-full text-xs">
              {template.category}
            </span>
          )}
        </div>

        {template.description && (
          <p className="text-muted-foreground leading-relaxed mb-6">
            {template.description}
          </p>
        )}

        {/* What this action does */}
        <div className="bg-muted/50 rounded-xl p-4 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-2">What happens</h3>
          <p className="text-sm text-muted-foreground">
            {linkConfig?.description || 'Opens a feature in the app'}
            {template.linked_playlist && (
              <span className="block mt-1 font-medium text-foreground">
                → {template.linked_playlist.name}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Action buttons - fixed at bottom */}
      <div className="sticky bottom-0 p-4 pb-safe bg-background border-t border-border/50">
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleAddToPlanner}
            disabled={addToPlanner.isPending}
          >
            {addToPlanner.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add to Planner
          </Button>
          <Button
            className={cn('flex-1', linkConfig?.buttonClass)}
            onClick={handleGoNow}
          >
            <ActionIcon className="w-4 h-4 mr-2" />
            {linkConfig?.badgeText || 'Open'} Now
          </Button>
        </div>
      </div>
    </div>
  );
}
