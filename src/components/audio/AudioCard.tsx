import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Headphones, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AudioCardProps {
  id: string;
  title: string;
  description?: string;
  coverImageUrl?: string;
  durationSeconds: number;
  isFree: boolean;
  isLocked: boolean;
  progress?: number;
  category: string;
}

export const AudioCard = ({
  id,
  title,
  description,
  coverImageUrl,
  durationSeconds,
  isFree,
  isLocked,
  progress = 0,
  category,
}: AudioCardProps) => {
  const navigate = useNavigate();

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    if (hours > 0) {
      return `${hours}h ${mins % 60}m`;
    }
    return `${mins}m`;
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'audiobook': return 'Audiobook';
      case 'course_supplement': return 'Course Audio';
      case 'podcast': return 'Podcast';
      default: return cat;
    }
  };

  return (
    <Card
      className={`overflow-hidden transition-all hover:shadow-lg ${
        isLocked ? 'opacity-60' : 'cursor-pointer'
      }`}
      onClick={() => !isLocked && navigate(`/app/player/${id}`)}
    >
      <div className="relative aspect-square">
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Headphones className="h-16 w-16 text-primary/40" />
          </div>
        )}
        {isLocked && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        {isFree && !isLocked && (
          <Badge className="absolute top-2 right-2" variant="secondary">
            Free
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold line-clamp-2 flex-1">{title}</h3>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {formatDuration(durationSeconds)}
          </span>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {getCategoryLabel(category)}
          </Badge>
          {progress > 0 && !isLocked && (
            <span className="text-xs text-muted-foreground">
              {Math.round(progress)}%
            </span>
          )}
        </div>
        {progress > 0 && !isLocked && (
          <Progress value={progress} className="mt-2 h-1" />
        )}
      </CardContent>
    </Card>
  );
};
