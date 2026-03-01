import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, Loader2, Search, X } from 'lucide-react';
import { usePrograms } from '@/hooks/usePrograms';
import { useEnrollments } from '@/hooks/useAppData';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProgramCard } from '@/components/app/ProgramCard';
import { SEOHead } from '@/components/SEOHead';
import { Input } from '@/components/ui/input';

const AppBrowsePrograms = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { programs, isLoading } = usePrograms();
  const { data: enrollments = [] } = useEnrollments();
  const [searchQuery, setSearchQuery] = useState('');

  const isEnrolled = (slug: string) => enrollments.includes(slug);

  // Free / IAP programs
  const freePrograms = useMemo(() => {
    return programs.filter(p =>
      p.isFree || p.priceAmount === 0 || p.is_free_on_ios === true || !!p.ios_product_id
    );
  }, [programs]);

  // Waitlist programs
  const { data: waitlistPrograms = [] } = useQuery({
    queryKey: ['waitlist-programs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_catalog')
        .select('slug, title, type, cover_image_url, description, language')
        .eq('show_in_app_waitlist', true)
        .eq('is_active', true) as any;
      if (error) throw error;
      return data || [];
    },
  });

  const waitlistSlugs = useMemo(() => new Set(waitlistPrograms.map((p: any) => p.slug)), [waitlistPrograms]);

  const allPrograms = useMemo(() => {
    const freeSlugs = new Set(freePrograms.map(p => p.slug));
    const markedFree = freePrograms.map(p => ({
      ...p,
      _isWaitlist: waitlistSlugs.has(p.slug),
    }));
    const waitlistOnly = waitlistPrograms
      .filter((p: any) => !freeSlugs.has(p.slug))
      .map((p: any) => ({
        title: p.title,
        slug: p.slug,
        description: p.description || '',
        image: p.cover_image_url || '',
        type: p.type,
        language: p.language,
        isFree: false,
        priceAmount: 999,
        is_free_on_ios: false,
        ios_product_id: undefined,
        _isWaitlist: true,
      }));
    return [...markedFree, ...waitlistOnly];
  }, [freePrograms, waitlistPrograms, waitlistSlugs]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return allPrograms;
    const q = searchQuery.toLowerCase();
    return allPrograms.filter((p: any) =>
      p.title.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)
    );
  }, [allPrograms, searchQuery]);

  return (
    <div className="h-full overflow-hidden flex flex-col bg-background">
      <SEOHead title="Browse Programs - Simora" description="Explore all available programs" />

      {/* Header */}
      <header
        className="shrink-0 z-40 bg-background border-b border-border/50"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="flex items-center gap-3 px-4 pt-3 pb-3">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 rounded-full transition-transform active:scale-90">
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <h1 className="text-lg font-bold text-foreground flex-1">Browse Programs</h1>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search programs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 bg-muted/50 border-border/50 rounded-xl"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-24" style={{ WebkitOverflowScrolling: 'touch' }}>
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">
              {searchQuery ? `No programs match "${searchQuery}"` : 'No programs available'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 pt-4">
            {filtered.map((program: any) => (
              <ProgramCard
                key={program.slug}
                title={program.title}
                image={program.image}
                type={program.type}
                language={program.language}
                isFree={!program._isWaitlist && (program.isFree || program.priceAmount === 0)}
                isEnrolled={isEnrolled(program.slug)}
                onClick={() => navigate(`/app/programs/${program.slug}`, { state: { from: location.pathname } })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AppBrowsePrograms;
