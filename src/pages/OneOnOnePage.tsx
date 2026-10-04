import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { CalendarPlus, Video, Loader2, CalendarClock, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import Navigation from '@/components/ui/navigation';
import Footer from '@/components/sections/Footer';
import { SEOHead } from '@/components/SEOHead';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

type Booking = { id: string; start_time: string; end_time: string; join_url: string | null; reschedule_url: string | null };
type Program = { slug: string; title: string; booking_note: string | null; image_url?: string | null };

function ProgramMeetings({ program }: { program: Program }) {
  const [opening, setOpening] = useState(false);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['web-1on1', program.slug],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('calendly-booking', {
        body: { action: 'sync', programSlug: program.slug },
      });
      if (error) throw error;
      return data as { used: number; included: number; bookings: Booking[] };
    },
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });

  const bookings = (data?.bookings || [])
    .filter((b) => new Date(b.end_time || b.start_time).getTime() > Date.now())
    .sort((a, b) => +new Date(a.start_time) - +new Date(b.start_time));
  const used = data?.used ?? 0;
  const included = data?.included ?? 1;
  const canBook = !isLoading && used < included;

  const book = async () => {
    const win = window.open('', '_blank');
    setOpening(true);
    try {
      const { data, error } = await supabase.functions.invoke('calendly-booking', {
        body: { action: 'link', programSlug: program.slug },
      });
      let code = data?.error;
      if (error instanceof FunctionsHttpError) {
        try { code = JSON.parse(await error.context.text())?.error; } catch { /* ignore */ }
      }
      if (error || !data?.url) {
        win?.close();
        toast.error(code === 'limit_reached' ? "You've used all your 1-on-1 meetings" : "Couldn't open booking. Please try again.");
        refetch();
        return;
      }
      if (win) win.location.href = data.url;
      else window.location.href = data.url;
    } finally {
      setOpening(false);
    }
  };

  return (
    <section className="rounded-2xl bg-card shadow-ios p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg md:text-xl font-semibold">{program.title}</h2>
          {program.booking_note && <p className="mt-1 text-sm text-muted-foreground" dir="auto">{program.booking_note}</p>}
        </div>
        {!isLoading && (
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium">
            {used} of {included} meetings used
          </span>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {isLoading ? (
          <Skeleton className="h-20 rounded-xl" />
        ) : bookings.length === 0 ? (
          <p className="text-sm text-muted-foreground">No meeting booked yet.</p>
        ) : (
          bookings.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-muted/50 p-4">
              <CalendarClock className="h-5 w-5 text-brand shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{format(new Date(b.start_time), 'EEEE, MMMM d')}</div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(b.start_time), 'h:mm a')} – {format(new Date(b.end_time), 'h:mm a')} (your local time)
                </div>
                {b.reschedule_url && (
                  <a href={b.reschedule_url} target="_blank" rel="noreferrer" className="text-xs font-medium text-brand">
                    Reschedule or cancel
                  </a>
                )}
              </div>
              {b.join_url && (
                <a href={b.join_url} target="_blank" rel="noreferrer">
                  <Button className="gap-2 rounded-xl"><Video className="h-4 w-4" /> Join meeting</Button>
                </a>
              )}
            </div>
          ))
        )}
      </div>

      {canBook && (
        <Button onClick={book} disabled={opening} size="lg" className="mt-5 w-full gap-2 rounded-xl">
          {opening ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
          {used > 0 ? 'Book another meeting' : 'Book my 1-on-1 meeting'}
        </Button>
      )}
    </section>
  );
}

export default function OneOnOnePage() {
  const { slug } = useParams();
  const { user } = useAuth();

  const { data: programs, isLoading } = useQuery({
    queryKey: ['web-1on1-programs', user?.id, slug],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: enr } = await supabase
        .from('course_enrollments')
        .select('program_slug')
        .eq('user_id', user!.id)
        .eq('status', 'active');
      const slugs = [...new Set((enr || []).map((e: any) => e.program_slug).filter(Boolean))] as string[];
      const wanted = slug ? slugs.filter((s) => s === slug) : slugs;
      if (!wanted.length) return [] as Program[];
      const { data } = await supabase
        .from('program_catalog')
        .select('slug, title, booking_note, includes_one_on_one, booking_url')
        .in('slug', wanted);
      return ((data || []) as any[]).filter((p) => p.includes_one_on_one && p.booking_url) as Program[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Your 1-on-1 meetings | Rilo" description="Book and join your 1-on-1 meetings." />
      <Navigation />
      <main className="container max-w-3xl pt-24 md:pt-28 pb-12 px-4">
        <h1 className="text-2xl md:text-3xl font-bold">Your 1-on-1 meetings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Book, join or reschedule your private meetings.</p>

        <div className="mt-6 space-y-4">
          {isLoading || !user ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : programs && programs.length > 0 ? (
            programs.map((p) => <ProgramMeetings key={p.slug} program={p} />)
          ) : (
            <div className="rounded-2xl bg-card shadow-ios p-8 text-center">
              <p className="text-muted-foreground">
                {slug
                  ? "We couldn't find 1-on-1 meetings for this program on your account."
                  : "You don't have any programs with 1-on-1 meetings yet."}
              </p>
              <Link to="/dashboard/chat">
                <Button variant="outline" className="mt-4 gap-2"><MessageCircle className="h-4 w-4" /> Message support</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
