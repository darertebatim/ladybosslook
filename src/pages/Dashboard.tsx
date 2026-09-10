import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/ui/navigation';
import Footer from '@/components/sections/Footer';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCoursesData } from '@/hooks/useAppData';
import { EnrolledProgramCard } from '@/components/app/EnrolledProgramCard';
import { RILO_DOWNLOAD_URL } from '@/components/chat/DownloadRiloDialog';
import {
  GraduationCap,
  BookOpen,
  Flame,
  CalendarDays,
  MessageCircle,
  Headphones,
  Compass,
  Route as RouteIcon,
  ArrowRight,
  Smartphone,
} from 'lucide-react';

const QUICK_LINKS = [
  { to: '/app/myprograms', label: 'My Programs', description: 'Rounds, sessions and materials', icon: GraduationCap },
  { to: '/app/learn', label: 'Courses', description: 'Lessons, videos and PDFs', icon: BookOpen },
  { to: '/app/path', label: 'My Rilo Path', description: 'Your next steps', icon: RouteIcon },
  { to: '/app/player', label: 'Listen', description: 'Audio programs and playlists', icon: Headphones },
  { to: '/app/tools', label: 'Tools', description: 'Planner, journal, focus and more', icon: Compass },
  { to: '/dashboard/chat', label: 'Support', description: 'Chat with our team', icon: MessageCircle },
];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { enrollments, nextSessionMap, isLoading } = useCoursesData();

  useEffect(() => {
    if (!user) navigate('/auth?redirect=/dashboard', { replace: true });
  }, [user, navigate]);

  const { data: profile } = useQuery({
    queryKey: ['dashboard-profile', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user!.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: streak = 0 } = useQuery({
    queryKey: ['dashboard-streak', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', user!.id)
        .maybeSingle();
      return data?.current_streak || 0;
    },
    enabled: !!user?.id,
  });

  if (!user) return null;

  const active = enrollments.filter(
    (e: any) =>
      e.program_slug !== 'simora-plus' &&
      (e.program_rounds ? e.program_rounds.status !== 'completed' : e.status !== 'completed'),
  );
  const completed = enrollments.filter(
    (e: any) =>
      e.program_slug !== 'simora-plus' &&
      (e.program_rounds ? e.program_rounds.status === 'completed' : e.status === 'completed'),
  );

  // Nearest upcoming live session across all active rounds
  const upcoming = active
    .map((e: any) => {
      const roundId = e.program_rounds?.id;
      const date = (roundId && nextSessionMap[roundId]) || e.program_rounds?.first_session_date || null;
      return date ? { enrollment: e, date: new Date(date) } : null;
    })
    .filter(Boolean)
    .filter((s: any) => s.date.getTime() > Date.now() - 2 * 60 * 60 * 1000)
    .sort((a: any, b: any) => a.date.getTime() - b.date.getTime())[0] as
    | { enrollment: any; date: Date }
    | undefined;

  const firstName = (profile?.full_name || '').split(' ')[0];

  const stats = [
    { label: 'Active programs', value: active.length, icon: GraduationCap },
    { label: 'Completed', value: completed.length, icon: BookOpen },
    { label: 'Day streak', value: streak, icon: Flame },
    {
      label: 'Next live session',
      value: upcoming ? format(upcoming.date, 'MMM d') : '—',
      icon: CalendarDays,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Your Dashboard | Rilo"
        description="Your programs, live sessions, courses and support — all in one place."
      />
      <Navigation />

      <main className="container max-w-6xl py-10 px-4">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">
              Welcome back{firstName ? `, ${firstName}` : ''}
            </h1>
            <p className="text-muted-foreground mt-1">{user.email}</p>
          </div>
          <Button onClick={() => navigate('/app/path')} className="gap-2">
            Open Rilo <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-2xl bg-card shadow-ios p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{s.label}</span>
                  <Icon className="h-4 w-4 text-brand" />
                </div>
                <div className="mt-2 text-3xl font-bold">{isLoading ? '—' : s.value}</div>
              </div>
            );
          })}
        </div>

        {/* Next session */}
        {upcoming && (
          <Link
            to={`/app/myprograms/${upcoming.enrollment.program_slug}${
              upcoming.enrollment.program_rounds?.id ? `/${upcoming.enrollment.program_rounds.id}` : ''
            }`}
            className="mt-6 block rounded-2xl bg-gradient-to-r from-[hsl(var(--brand-primary))] to-[hsl(var(--brand-primary-dark))] p-5 text-white shadow-ios"
          >
            <div className="text-xs uppercase tracking-wide opacity-90">Next live session</div>
            <div className="mt-1 text-xl font-semibold">{upcoming.enrollment.course_name}</div>
            <div className="mt-1 text-sm opacity-95">
              {format(upcoming.date, 'EEEE, MMMM d • h:mm a')} (your local time)
            </div>
          </Link>
        )}

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Programs */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">My Programs</h2>
              <Link to="/app/myprograms" className="text-sm text-brand font-medium">
                See all
              </Link>
            </div>

            {isLoading ? (
              <div className="grid sm:grid-cols-2 gap-4">
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl" />
              </div>
            ) : active.length === 0 ? (
              <div className="rounded-2xl bg-card shadow-ios p-10 text-center">
                <GraduationCap className="h-10 w-10 mx-auto text-muted-foreground/50" />
                <p className="mt-3 text-muted-foreground">You are not enrolled in a program yet.</p>
                <Button className="mt-4" onClick={() => navigate('/programs')}>
                  Browse programs
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {active.slice(0, 6).map((e: any) => (
                  <EnrolledProgramCard
                    key={e.id}
                    enrollment={e}
                    nextSessionDate={e.program_rounds?.id ? nextSessionMap[e.program_rounds.id] : null}
                  />
                ))}
              </div>
            )}

            {completed.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-semibold text-muted-foreground">Completed</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {completed.slice(0, 4).map((e: any) => (
                    <EnrolledProgramCard key={e.id} enrollment={e} isCompleted />
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Side column */}
          <aside className="space-y-4">
            <div className="rounded-2xl bg-card shadow-ios p-4">
              <h2 className="text-sm font-semibold mb-3">Go to</h2>
              <div className="space-y-1">
                {QUICK_LINKS.map((l) => {
                  const Icon = l.icon;
                  return (
                    <Link
                      key={l.to}
                      to={l.to}
                      className="flex items-start gap-3 rounded-xl px-3 py-2.5 hover:bg-muted/60 transition-colors"
                    >
                      <Icon className="h-[18px] w-[18px] mt-0.5 text-brand" />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium">{l.label}</span>
                        <span className="block text-xs text-muted-foreground truncate">{l.description}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl bg-card shadow-ios p-5 text-center">
              <Smartphone className="h-6 w-6 mx-auto text-brand" />
              <p className="mt-2 text-sm font-semibold">Rilo on your phone</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Reminders, live session alerts and everything offline.
              </p>
              <a href={RILO_DOWNLOAD_URL} target="_blank" rel="noreferrer">
                <Button variant="outline" className="mt-3 w-full">
                  Get the app
                </Button>
              </a>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;
