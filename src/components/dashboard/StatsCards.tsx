import { Card, CardContent } from "@/components/ui/card";
import { Headphones, Newspaper, CheckCircle2, Calendar } from "lucide-react";
import { format, isToday, isTomorrow } from "date-fns";

interface StatsCardsProps {
  listeningMinutes: number;
  unreadPosts: number;
  completedTracks: number;
  nextSession: Date | null;
}

export function StatsCards({ 
  listeningMinutes, 
  unreadPosts, 
  completedTracks, 
  nextSession 
}: StatsCardsProps) {
  // Format listening time (e.g., "2h 15m" or "45m")
  const formatListening = () => {
    const hours = Math.floor(listeningMinutes / 60);
    const mins = listeningMinutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  // Format next session date
  const formatNextSession = () => {
    if (!nextSession) return 'None';
    if (isToday(nextSession)) return 'Today';
    if (isTomorrow(nextSession)) return 'Tomorrow';
    return format(nextSession, 'MMM d');
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
      {/* Listening Time */}
      <Card className="overflow-hidden">
        <CardContent className="p-3 lg:pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-muted-foreground">Listening</p>
              <h3 className="text-xl lg:text-2xl font-bold mt-0.5 lg:mt-2">{formatListening()}</h3>
            </div>
            <div className="h-8 w-8 lg:h-12 lg:w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Headphones className="h-4 w-4 lg:h-6 lg:w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unread Posts */}
      <Card className="overflow-hidden">
        <CardContent className="p-3 lg:pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-muted-foreground">Unread</p>
              <h3 className="text-xl lg:text-2xl font-bold mt-0.5 lg:mt-2">{unreadPosts}</h3>
            </div>
            <div className="h-8 w-8 lg:h-12 lg:w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Newspaper className="h-4 w-4 lg:h-6 lg:w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completed Tracks - Desktop only */}
      <Card className="overflow-hidden hidden lg:block">
        <CardContent className="p-3 lg:pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-muted-foreground">Completed</p>
              <h3 className="text-xl lg:text-2xl font-bold mt-0.5 lg:mt-2">{completedTracks}</h3>
            </div>
            <div className="h-8 w-8 lg:h-12 lg:w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 lg:h-6 lg:w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Session - Desktop only */}
      <Card className="overflow-hidden hidden lg:block">
        <CardContent className="p-3 lg:pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-muted-foreground">Next Session</p>
              <h3 className="text-xl lg:text-2xl font-bold mt-0.5 lg:mt-2">{formatNextSession()}</h3>
            </div>
            <div className="h-8 w-8 lg:h-12 lg:w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Calendar className="h-4 w-4 lg:h-6 lg:w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
