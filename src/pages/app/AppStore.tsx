import { supabase } from '@/integrations/supabase/client';
import { usePrograms } from '@/hooks/usePrograms';
import { SEOHead } from '@/components/SEOHead';
import { Search, ShoppingBag, X, Loader2, Sparkles, Dumbbell, Waves, Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';
import { useEnrollments, useInvalidateAllEnrollmentData } from '@/hooks/useAppData';
import { ProgramCard } from '@/components/app/ProgramCard';
import { CategoryCircle } from '@/components/app/CategoryCircle';
import { Input } from '@/components/ui/input';

// Category configuration for filtering (icon names as strings for CategoryCircle)
const categoryConfig = [
  { id: 'all', name: 'All', icon: 'LayoutGrid', color: 'purple' },
  { id: 'course', name: 'Courses', icon: 'BookOpen', color: 'purple' },
  { id: 'group-coaching', name: 'Coaching', icon: 'Users', color: 'pink' },
  { id: '1o1-session', name: '1-on-1', icon: 'UserCheck', color: 'blue' },
  { id: 'audiobook', name: 'Audiobook', icon: 'Headphones', color: 'orange' },
  { id: 'meditate', name: 'Meditate', icon: 'Sparkles', color: 'teal' },
  { id: 'workout', name: 'Workout', icon: 'Dumbbell', color: 'rose' },
  { id: 'soundscape', name: 'Soundscape', icon: 'Waves', color: 'blue' },
  { id: 'affirmations', name: 'Affirm', icon: 'Heart', color: 'pink' },
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

  // Use centralized enrollments hook - single source of truth
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

  // Filter programs by category and search
  const filteredPrograms = useMemo(() => {
    let result = freePrograms;
    
    // Filter by category
    if (selectedCategory) {
      result = result.filter(p => p.type === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [freePrograms, selectedCategory, searchQuery]);

  const handleEnroll = async (program: typeof freePrograms[0]) => {
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
        
        // Invalidate ALL enrollment-related caches atomically
        invalidateAllEnrollmentData();
        
        navigate('/app/programs');
      }
    } finally {
      setEnrollingSlug(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <SEOHead 
        title="Browse Courses - LadyBoss Academy"
        description="Browse our free educational programs and courses"
      />

      {/* Fixed Header */}
      <div 
        className="fixed top-0 left-0 right-0 z-40 bg-[#F4ECFE] dark:bg-violet-950/90 rounded-b-3xl shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="h-12 px-4 flex items-center justify-between">
          {showSearch ? (
            <div className="flex-1 flex items-center gap-2">
              <Input
                type="text"
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 h-9 bg-muted/50 border-0"
                autoFocus
              />
              <button 
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold">Browse</h1>
              <button 
                onClick={() => setShowSearch(true)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <Search className="h-5 w-5 text-muted-foreground" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-12" style={{ marginTop: 'env(safe-area-inset-top)' }} />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto pb-safe">
        {programsLoading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="px-4 py-4 space-y-6">
            {/* Category Filters - only show if multiple categories */}
            {availableCategories.length > 2 && (
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
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

            {/* Section Title */}
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {selectedCategory 
                  ? categoryConfig.find(c => c.id === selectedCategory)?.name || 'Programs'
                  : 'Available Programs'
                }
              </h2>
            </div>

            {/* Programs Grid */}
            {filteredPrograms.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h2 className="text-xl font-semibold mb-2">
                  {searchQuery ? 'No Results Found' : 'No Courses Available'}
                </h2>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? `No courses match "${searchQuery}"`
                    : 'Check back later for new courses'
                  }
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
          </div>
        )}
      </div>
    </div>
  );
};

export default AppStore;
