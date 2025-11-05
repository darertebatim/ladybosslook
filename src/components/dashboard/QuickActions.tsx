import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, GraduationCap, Music, Send } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function QuickActions() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleContactSupport = () => {
    const message = `Hi! I need support.\n\nName: ${profile?.full_name || 'N/A'}\nEmail: ${profile?.email || user?.email || 'N/A'}\nPhone: ${profile?.phone || 'N/A'}\nCity: ${profile?.city || 'N/A'}`;
    const telegramUrl = `https://t.me/ladybosslook?text=${encodeURIComponent(message)}`;
    window.open(telegramUrl, '_blank');
  };

  const actions = [
    {
      icon: BookOpen,
      label: "Browse Courses",
      description: "Explore all available programs",
      action: () => navigate("/programs"),
      color: "text-blue-600"
    },
    {
      icon: Music,
      label: "Audio Library",
      description: "Course supplement audios",
      action: () => navigate("/app/player"),
      color: "text-pink-600"
    },
    {
      icon: Calendar,
      label: "Book Consultation",
      description: "1-on-1 coaching session",
      action: () => navigate("/one"),
      color: "text-green-600"
    },
    {
      icon: Send,
      label: "Get Support",
      description: "Contact us on Telegram",
      action: handleContactSupport,
      color: "text-purple-600"
    },
    {
      icon: GraduationCap,
      label: "My Events",
      description: "View upcoming events",
      action: () => navigate("/events"),
      color: "text-orange-600"
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-2 lg:pb-6">
        <CardTitle className="text-base lg:text-lg">Quick Actions</CardTitle>
        <CardDescription className="text-xs lg:text-sm hidden lg:block">Shortcuts to help you get started</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto py-2 px-2 lg:py-4 lg:px-4 flex items-center lg:items-start justify-center lg:justify-start gap-2 lg:gap-3"
                onClick={action.action}
              >
                <div className={`h-7 w-7 lg:h-10 lg:w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 ${action.color}`}>
                  <Icon className="h-4 w-4 lg:h-5 lg:w-5" />
                </div>
                <div className="text-left hidden lg:block">
                  <p className="font-medium text-sm lg:text-base">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
                <div className="lg:hidden text-center flex-1">
                  <p className="font-medium text-xs leading-tight">{action.label}</p>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
