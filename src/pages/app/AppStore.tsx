import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePrograms } from '@/hooks/usePrograms';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PurchaseButton } from '@/components/PurchaseButton';
import { SEOHead } from '@/components/SEOHead';
import { ShoppingBag, CheckCircle2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AppStore = () => {
  const navigate = useNavigate();
  const { programs, isLoading: programsLoading } = usePrograms();

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

  const paidPrograms = programs.filter(p => !p.isFree);

  if (programsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-6 px-4">
      <SEOHead 
        title="Program Store - LadyBoss Academy"
        description="Browse and purchase LadyBoss Academy programs"
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Program Store</h1>
            <p className="text-muted-foreground">Browse available programs and courses</p>
          </div>
        </div>

        {/* Programs Grid */}
        <div className="grid gap-6">
          {paidPrograms.map((program) => {
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

                    {!enrolled && (
                      <PurchaseButton
                        programSlug={program.slug}
                        iosProductId={(program as any).ios_product_id || undefined}
                        price={program.priceAmount}
                        buttonText="Purchase"
                        className="flex-1"
                      />
                    )}
                    
                    {enrolled && (
                      <Button
                        className="flex-1"
                        onClick={() => navigate(`/app/course/${program.slug}`)}
                      >
                        View Course
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {paidPrograms.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Programs Available</h3>
              <p className="text-muted-foreground">
                Check back later for new programs and courses.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AppStore;
