import * as LucideIcons from 'lucide-react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRO_LINK_CONFIGS, type ProLinkType } from '@/lib/proTaskTypes';
import type { ProTaskTemplate } from '@/hooks/useProTaskTemplates';

interface QuickActionCardProps {
  template: ProTaskTemplate;
  onClick?: () => void;
}

export function QuickActionCard({ template, onClick }: QuickActionCardProps) {
  const IconComponent = (LucideIcons as any)[template.icon] || LucideIcons.Zap;
  const linkConfig = PRO_LINK_CONFIGS[template.pro_link_type as ProLinkType];
  const LinkIcon = linkConfig?.icon || LucideIcons.Sparkles;

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative rounded-2xl overflow-hidden shrink-0 w-36 h-44 transition-all active:scale-[0.98]',
        linkConfig?.gradientClass || 'bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/40 dark:to-violet-900/40'
      )}
    >
      {/* Cover image if playlist has one */}
      {template.linked_playlist?.cover_image_url && (
        <>
          <img
            src={template.linked_playlist.cover_image_url}
            alt={template.title}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </>
      )}

      {/* Main icon - centered when no image */}
      {!template.linked_playlist?.cover_image_url && (
        <div className="absolute inset-0 flex items-center justify-center">
          <IconComponent className={cn('w-12 h-12 opacity-30', linkConfig?.iconColorClass || 'text-purple-600')} />
        </div>
      )}

      {/* Link type badge - top right */}
      <div className={cn(
        'absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm',
        template.linked_playlist?.cover_image_url 
          ? 'bg-black/40 text-white'
          : linkConfig?.badgeColorClass || 'bg-purple-500/20 text-purple-700'
      )}>
        <LinkIcon className="w-3 h-3" />
        <span>{linkConfig?.badgeText || 'Open'}</span>
      </div>

      {/* Content - at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
        <h3 className={cn(
          'font-semibold line-clamp-2 text-sm',
          template.linked_playlist?.cover_image_url 
            ? 'text-white drop-shadow-md'
            : 'text-foreground'
        )}>
          {template.title}
        </h3>
        
        <div className={cn(
          'flex items-center gap-1 mt-1 text-xs',
          template.linked_playlist?.cover_image_url 
            ? 'text-white/70'
            : 'text-muted-foreground'
        )}>
          <Clock className="w-3 h-3" />
          <span>{template.duration_minutes} min</span>
        </div>
      </div>
    </button>
  );
}
