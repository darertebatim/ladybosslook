import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Sparkles, Calendar as CalendarIcon } from "lucide-react";

export function Announcements() {
  const announcements = [
    {
      title: "New Course: Courageous Character Workshop",
      description: "Transform your mindset and build unshakeable confidence. Early bird pricing available!",
      date: "2 days ago",
      type: "new" as const,
      badge: "New Course"
    },
    {
      title: "Upcoming: Money Literacy Live Workshop",
      description: "Join us for an exclusive live session on financial planning and wealth building strategies.",
      date: "5 days ago",
      type: "event" as const,
      badge: "Live Event"
    },
    {
      title: "Community Update",
      description: "Join our Ladyboss VIP Club for exclusive monthly workshops and direct mentorship access.",
      date: "1 week ago",
      type: "update" as const,
      badge: "Community"
    }
  ];

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Announcements & Updates
        </CardTitle>
        <CardDescription>Stay updated with the latest news and events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {announcements.map((announcement, index) => (
            <div key={index} className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {getIcon(announcement.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="font-medium text-sm">{announcement.title}</h4>
                  <Badge variant="secondary" className="text-xs flex-shrink-0">
                    {announcement.badge}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">{announcement.description}</p>
                <p className="text-xs text-muted-foreground">{announcement.date}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
