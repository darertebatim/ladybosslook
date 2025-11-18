import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Music, BookOpen, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function WelcomeSection() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <Card className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <CardTitle className="text-2xl">Welcome to LadyBoss Academy!</CardTitle>
          </div>
          <CardDescription className="text-base">
            Start your journey with our free educational content. Discover courses and audiobooks designed to empower you.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Featured Free Content */}
      <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Featured Free Audiobook</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">Ready to Empowered</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Discover powerful insights and practical strategies to transform your mindset and achieve your goals.
            </p>
          </div>
          <Button 
            onClick={() => navigate('/app/store')} 
            className="w-full"
            size="lg"
          >
            Enroll Free Now
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/app/store')}>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Browse Free Courses</h3>
                <p className="text-sm text-muted-foreground">Explore all available courses</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/app/audio-player')}>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Music className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Listen to Podcasts</h3>
                <p className="text-sm text-muted-foreground">Discover inspiring audio content</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
