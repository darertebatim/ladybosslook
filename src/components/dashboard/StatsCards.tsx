import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Award, Clock, Wallet } from "lucide-react";

interface StatsCardsProps {
  enrolledCount: number;
  creditsBalance: number;
}

export function StatsCards({ enrolledCount, creditsBalance }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-4">
      <Card className="overflow-hidden">
        <CardContent className="p-3 lg:pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-muted-foreground">Courses</p>
              <h3 className="text-xl lg:text-2xl font-bold mt-0.5 lg:mt-2">{enrolledCount}</h3>
            </div>
            <div className="h-8 w-8 lg:h-12 lg:w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-4 w-4 lg:h-6 lg:w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardContent className="p-3 lg:pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-muted-foreground">Credits</p>
              <h3 className="text-xl lg:text-2xl font-bold mt-0.5 lg:mt-2">${creditsBalance}</h3>
            </div>
            <div className="h-8 w-8 lg:h-12 lg:w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Wallet className="h-4 w-4 lg:h-6 lg:w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden hidden lg:block">
        <CardContent className="p-3 lg:pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-muted-foreground">Completion</p>
              <h3 className="text-xl lg:text-2xl font-bold mt-0.5 lg:mt-2">0%</h3>
            </div>
            <div className="h-8 w-8 lg:h-12 lg:w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Award className="h-4 w-4 lg:h-6 lg:w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden hidden lg:block">
        <CardContent className="p-3 lg:pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs lg:text-sm font-medium text-muted-foreground">Learning</p>
              <h3 className="text-xl lg:text-2xl font-bold mt-0.5 lg:mt-2">0h</h3>
            </div>
            <div className="h-8 w-8 lg:h-12 lg:w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 lg:h-6 lg:w-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
