import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, MessageCircle, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: BookOpen,
      label: "Browse Courses",
      description: "Explore all available programs",
      action: () => navigate("/#programs"),
      color: "text-blue-600"
    },
    {
      icon: Calendar,
      label: "Book Consultation",
      description: "Schedule a free call",
      action: () => window.open("https://calendar.app.google/kEWxSqUkm27SZHdk7", "_blank"),
      color: "text-green-600"
    },
    {
      icon: MessageCircle,
      label: "Get Support",
      description: "Contact us on WhatsApp",
      action: () => window.open("https://wa.me/19292603007", "_blank"),
      color: "text-purple-600"
    },
    {
      icon: GraduationCap,
      label: "My Workshops",
      description: "View upcoming events",
      action: () => navigate("/"),
      color: "text-orange-600"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Shortcuts to help you get started</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto py-4 px-4 flex items-start justify-start gap-3"
                onClick={action.action}
              >
                <div className={`h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 ${action.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <p className="font-medium">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
