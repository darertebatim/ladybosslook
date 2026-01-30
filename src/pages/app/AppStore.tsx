import { supabase } from '@/integrations/supabase/client';
import { usePrograms } from '@/hooks/usePrograms';
import { SEOHead } from '@/components/SEOHead';
import { Search, X, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';
import { useEnrollments, useInvalidateAllEnrollmentData } from '@/hooks/useAppData';
import { ProgramCard } from '@/components/app/ProgramCard';
import { CategoryCircle } from '@/components/app/CategoryCircle';
import { ToolCard } from '@/components/app/ToolCard';
import { Input } from '@/components/ui/input';
import { wellnessTools, audioTools, getVisibleComingSoon } from '@/lib/toolsConfig';

// Category configuration for filtering programs
const categoryConfig = [
  { id: 'all', name: 'All', icon: 'LayoutGrid', color: 'purple' },
  { id: 'course', name: 'Courses', icon: 'BookOpen', color: 'purple' },
  { id: 'audiobook', name: 'Audiobook', icon: 'Headphones', color: 'orange' },
  { id: 'meditate', name: 'Meditate', icon: 'Brain', color: 'indigo' },
  { id: 'soundscape', name: 'Sounds', icon: 'Waves', color: 'teal' },
  { id: 'workout', name: 'Workout', icon: 'Dumbbell', color: 'rose' },
  { id: 'group-coaching', name: 'Coaching', icon: 'Users', color: 'pink' },
  { id: '1o1-session', name: '1-on-1', icon: 'UserCheck', color: 'blue' },
  { id: 'webinar', name: 'Webinar', icon: 'Video', color: 'green' },
  { id: 'event', name: 'Events', icon: 'Calendar', color: 'rose' },
];

const AppStore = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { programs, isLoading: programsLoading } = usePrograms();
  const [enrollingSlug, setEnrollingSlug] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: enrollments = [] } = useEnrollments();
  const invalidateAllEnrollmentData = useInvalidateAllEnrollmentData();

  const isEnrolled = (slug: string) => {
    return enrollments.includes(slug);
  };

  // Filter to show only free programs or programs marked free on iOS
  const freePrograms = useMemo(() => {
    return programs.filter(p => 
      p.isFree || 
      p.priceAmount === 0 || 
      p.is_free_on_ios === true
    );
  }, [programs]);

  // Get available categories based on actual programs
  const availableCategories = useMemo(() => {
    const types = new Set(freePrograms.map(p => p.type as string).filter(Boolean));
    return categoryConfig.filter(cat => cat.id === 'all' || types.has(cat.id));
  }, [freePrograms]);

  // Filter tools by search
  const filteredWellnessTools = useMemo(() => {
    if (!searchQuery.trim()) return wellnessTools;
    const query = searchQuery.toLowerCase();
    return wellnessTools.filter(t => 
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const filteredAudioTools = useMemo(() => {
    if (!searchQuery.trim()) return audioTools;
    const query = searchQuery.toLowerCase();
    return audioTools.filter(t => 
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  // Filter programs by category and search
  const filteredPrograms = useMemo(() => {
    let result = freePrograms;
    
    if (selectedCategory) {
      result = result.filter(p => p.type === selectedCategory);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [freePrograms, selectedCategory, searchQuery]);

  // Check if any tools match search
  const hasToolMatches = filteredWellnessTools.length > 0 || filteredAudioTools.length > 0;
  const hasProgramMatches = filteredPrograms.length > 0;

  const handleEnroll = async (program: typeof freePrograms[0]) => {
    if (!user?.id) {
      toast.error('Please sign in to enroll');
      return;
    }
    
    setEnrollingSlug(program.slug);
    
    try {
      let roundId: string | null = null;
      const { data: autoEnroll } = await supabase
        .from('program_auto_enrollment')
        .select('round_id')
        .eq('program_slug', program.slug)
        .maybeSingle();
      
      if (autoEnroll?.round_id) {
        roundId = autoEnroll.round_id;
      }
      
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
        invalidateAllEnrollmentData();
        navigate('/app/programs');
      }
    } finally {
      setEnrollingSlug(null);
    }
  };

  const comingSoonTools = getVisibleComingSoon();

  return (
    <div className="min-h-full bg-background pb-24">
      <SEOHead 
        title="Browse - LadyBoss Academy"
        description="Browse tools, audio experiences, and educational programs"
      />

      {/* Header */}
      <div className="bg-gradient-to-b from-violet-50 to-background dark:from-violet-950/20 dark:to-background px-4 pt-3 pb-4">
        <div className="flex items-center justify-between">
          {showSearch ? (
            <div className="flex-1 flex items-center gap-2">
              <Input
                type="text"
                placeholder="Search tools & programs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-10 bg-white/80 dark:bg-black/20 border-border/50 rounded-xl"
                autoFocus
              />
              <button 
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className="p-2 rounded-full transition-transform active:scale-95"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-foreground">Browse</h1>
              <button 
                onClick={() => setShowSearch(true)}
                className="p-2 rounded-full transition-transform active:scale-95"
              >
                <Search className="h-5 w-5 text-muted-foreground" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="px-4 space-y-4">
        {programsLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Tools Section */}
            {(!searchQuery || filteredWellnessTools.length > 0) && (
              <section>
                <h2 className="text-sm font-semibold text-foreground mb-2 px-1">
                  Tools
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {filteredWellnessTools.map((tool) => (
                    <ToolCard key={tool.id} tool={tool} />
                  ))}
                </div>
              </section>
            )}


            {/* Programs Section */}
            {(!searchQuery || hasProgramMatches) && freePrograms.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold text-foreground mb-2 px-1">
                  Browse Programs
                </h2>

                {/* Category Filters - only show if multiple categories and not searching */}
                {!searchQuery && availableCategories.length > 2 && (
                  <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
                    {availableCategories.map((category) => (
                      <CategoryCircle
                        key={category.id}
                        name={category.name}
                        icon={category.icon}
                        color={category.color}
                        isSelected={selectedCategory === (category.id === 'all' ? null : category.id)}
                        onClick={() => setSelectedCategory(category.id === 'all' ? null : category.id)}
                      />
                    ))}
                  </div>
                )}

                {/* Programs Grid */}
                {filteredPrograms.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground text-sm">
                      No programs found
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {filteredPrograms.map((program) => {
                      const enrolled = isEnrolled(program.slug);
                      const isEnrolling = enrollingSlug === program.slug;
                      
                      return (
                        <div key={program.slug} className="relative">
                          <ProgramCard
                            title={program.title}
                            image={program.image}
                            type={program.type}
                            isFree={program.isFree || program.priceAmount === 0}
                            isEnrolled={enrolled}
                            onClick={() => navigate(`/app/course/${program.slug}`)}
                          />
                          {isEnrolling && (
                            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                              <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* No Results */}
            {searchQuery && !hasToolMatches && !hasProgramMatches && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                  <Search className="w-7 h-7 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold mb-1">No Results Found</h2>
                <p className="text-muted-foreground text-sm">
                  No tools or programs match "{searchQuery}"
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AppStore;
