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
      action: () => navigate("/programs"),
      color: "text-blue-600"
    },
    {
      icon: Calendar,
      label: "Book Consultation",
      description: "1-on-1 coaching session",
      action: () => navigate("/one"),
      color: "text-green-600"
    },
    {
      icon: MessageCircle,
      label: "Get Support",
      description: "Contact us on WhatsApp",
      action: () => window.location.href = "https://wa.me/19292603007",
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
        <div className="grid grid-cols-2 lg:grid-cols-2 gap-2 lg:gap-3">
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
