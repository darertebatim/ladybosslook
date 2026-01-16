import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePrograms } from '@/hooks/usePrograms';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/SEOHead';
import { ShoppingBag, CheckCircle2, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { AppHeader, AppHeaderSpacer } from '@/components/app/AppHeader';
import { useState } from 'react';

const AppStore = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { programs, isLoading: programsLoading } = usePrograms();
  const queryClient = useQueryClient();
  const [enrollingSlug, setEnrollingSlug] = useState<string | null>(null);

  // Fetch user's enrollments
  const { data: enrollments = [] } = useQuery({
    queryKey: ['user-enrollments'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('course_enrollments')
        .select('program_slug, status')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;
      return data || [];
    },
  });

  const isEnrolled = (slug: string) => {
    return enrollments.some(e => e.program_slug === slug);
  };

  // Filter to show only free programs or programs marked free on iOS
  const freePrograms = programs.filter(p => 
    p.isFree || 
    p.priceAmount === 0 || 
    p.is_free_on_ios === true
  );

  if (programsLoading) {
    return (
      <>
        <AppHeader title="Browse Courses" subtitle="Loading..." />
        <AppHeaderSpacer />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title="Browse Courses - LadyBoss Academy"
        description="Browse our free educational programs and courses"
      />

      <AppHeader 
        title="Browse Courses" 
        subtitle="Explore our free educational programs"
      />
      <AppHeaderSpacer />

      <div className="container max-w-4xl py-4 px-4">
        <div className="space-y-6">
          {/* Programs Grid */}
          {freePrograms.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No Courses Available</h2>
              <p className="text-muted-foreground">
                Check back later for new courses
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {freePrograms.map((program) => {
              const enrolled = isEnrolled(program.slug);
              
              return (
                <Card key={program.slug} className="overflow-hidden">
                  {/* Program Image */}
                  {program.image && (
                    <div className="relative h-48 overflow-hidden">
                      <img 
                        src={program.image} 
                        alt={program.title}
                        className="w-full h-full object-cover"
                      />
                      {enrolled && (
                        <div className="absolute top-4 right-4">
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Enrolled
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{program.title}</CardTitle>
                        {program.description && (
                          <CardDescription className="line-clamp-2">
                            {program.description}
                          </CardDescription>
                        )}
                      </div>
                    </div>

                    {/* Features */}
                    {program.features && program.features.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {program.features.slice(0, 3).map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardHeader>

                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Learn More Button */}
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => navigate(`/app/course/${program.slug}`)}
                      >
                        Learn More
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>

                      {enrolled ? (
                        <Button
                          className="flex-1"
                          onClick={() => navigate(`/app/course/${program.slug}`)}
                        >
                          View Course
                        </Button>
                      ) : (
                        <Button 
                          className="flex-1"
                          disabled={enrollingSlug === program.slug}
                          onClick={async () => {
                            if (!user?.id) {
                              toast.error('Please sign in to enroll');
                              return;
                            }
                            
                            setEnrollingSlug(program.slug);
                            
                            try {
                              // Check if there's an auto-enrollment round for this program
                              let roundId: string | null = null;
                              const { data: autoEnroll } = await supabase
                                .from('program_auto_enrollment')
                                .select('round_id')
                                .eq('program_slug', program.slug)
                                .maybeSingle();
                              
                              if (autoEnroll?.round_id) {
                                roundId = autoEnroll.round_id;
                              }
                              
                              // Create free enrollment with round_id if available
                              const { error } = await supabase
                                .from('course_enrollments')
                                .insert({
                                  user_id: user.id,
                                  course_name: program.title,
                                  program_slug: program.slug,
                                  round_id: roundId,
                                  status: 'active'
                                });
                              
                              if (error) {
                                toast.error('Failed to enroll. Please try again.');
                              } else {
                                toast.success('Enrolled successfully!');
                                
                                // Invalidate queries to refresh data immediately
                                queryClient.invalidateQueries({ queryKey: ['user-enrollments'] });
                                queryClient.invalidateQueries({ queryKey: ['courses-data', user.id] });
                                queryClient.invalidateQueries({ queryKey: ['home-data', user.id] });
                                queryClient.invalidateQueries({ queryKey: ['player-data', user.id] });
                                
                                navigate('/app/courses');
                              }
                            } finally {
                              setEnrollingSlug(null);
                            }
                          }}
                        >
                          {enrollingSlug === program.slug ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Enrolling...
                            </>
                          ) : (
                            'Enroll Free'
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          )}

          {freePrograms.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Courses Available</h3>
                <p className="text-muted-foreground">
                  Check back later for new free courses.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
};

export default AppStore;