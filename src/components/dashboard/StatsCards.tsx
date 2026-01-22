import { Card, CardContent } from "@/components/ui/card";
import { Headphones, Newspaper, CheckCircle2, NotebookPen } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StatsCardsProps {
  listeningMinutes: number;
  unreadPosts: number;
  completedTracks: number;
  journalStreak: number;
}

export function StatsCards({ 
  listeningMinutes, 
  unreadPosts, 
  completedTracks, 
  journalStreak 
}: StatsCardsProps) {
  const navigate = useNavigate();

  // Format listening time (e.g., "2h 15m" or "45m")
  const formatListening = () => {
    const hours = Math.floor(listeningMinutes / 60);
    const mins = listeningMinutes % 60;
    if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h`;
    return `${mins}m`;
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
      {/* Listening Time */}
      <Card 
        className="overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => navigate('/app/player')}
      >
        <CardContent className="p-3 lg:pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-muted-foreground">Listen Time</p>
              <h3 className="text-xl lg:text-2xl font-bold mt-0.5 lg:mt-2">{formatListening()}</h3>
            </div>
            <div className="h-8 w-8 lg:h-12 lg:w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Headphones className="h-4 w-4 lg:h-6 lg:w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unread Posts */}
      <Card 
        className="overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => navigate('/app/channels')}
      >
        <CardContent className="p-3 lg:pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-muted-foreground">New Posts</p>
              <h3 className="text-xl lg:text-2xl font-bold mt-0.5 lg:mt-2">{unreadPosts} unread</h3>
            </div>
            <div className="h-8 w-8 lg:h-12 lg:w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Newspaper className="h-4 w-4 lg:h-6 lg:w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completed Tracks */}
      <Card 
        className="overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => navigate('/app/player')}
      >
        <CardContent className="p-3 lg:pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-muted-foreground">Audio Tracks</p>
              <h3 className="text-xl lg:text-2xl font-bold mt-0.5 lg:mt-2">{completedTracks} done</h3>
            </div>
            <div className="h-8 w-8 lg:h-12 lg:w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 lg:h-6 lg:w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Journal */}
      <Card 
        className="overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => navigate('/app/journal')}
      >
        <CardContent className="p-3 lg:pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-muted-foreground">Journal</p>
              <h3 className="text-xl lg:text-2xl font-bold mt-0.5 lg:mt-2">
                {journalStreak > 0 ? `🔥 ${journalStreak} days` : 'Start today'}
              </h3>
            </div>
            <div className="h-8 w-8 lg:h-12 lg:w-12 rounded-full bg-violet-500/10 flex items-center justify-center">
              <NotebookPen className="h-4 w-4 lg:h-6 lg:w-6 text-violet-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
