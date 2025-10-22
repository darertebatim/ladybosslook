import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Sparkles, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  badge: string | null;
  created_at: string;
  target_course: string | null;
}

export function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      setAnnouncements(data || []);
    } catch (error: any) {
      console.error('Error fetching announcements:', error);
      toast({
        title: "Error",
        description: "Failed to load announcements",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "new":
        return <Sparkles className="h-4 w-4" />;
      case "event":
        return <CalendarIcon className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Announcements & Updates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading announcements...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 lg:pb-6">
        <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
          <Bell className="h-4 w-4 lg:h-5 lg:w-5" />
          Announcements
        </CardTitle>
        <CardDescription className="text-xs lg:text-sm hidden lg:block">Latest news and events</CardDescription>
      </CardHeader>
      <CardContent>
        {announcements.length > 0 ? (
          <div className="space-y-2 lg:space-y-4">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="flex gap-2 lg:gap-4 p-2 lg:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                <div className="h-7 w-7 lg:h-10 lg:w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <div className="scale-75 lg:scale-100">{getIcon(announcement.type)}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-0.5 lg:mb-1">
                    <h4 className="font-medium text-xs lg:text-sm line-clamp-1">{announcement.title}</h4>
                    <Badge variant="secondary" className="text-[10px] lg:text-xs flex-shrink-0 h-5 lg:h-auto">
                      {announcement.badge || announcement.type}
                    </Badge>
                  </div>
                  <p className="text-xs lg:text-sm text-muted-foreground mb-1 lg:mb-2 line-clamp-2">{announcement.message}</p>
                  <p className="text-[10px] lg:text-xs text-muted-foreground">
                    {new Date(announcement.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 lg:py-8 text-muted-foreground text-xs lg:text-sm">
            No announcements yet
          </div>
        )}
      </CardContent>
    </Card>
  );
}