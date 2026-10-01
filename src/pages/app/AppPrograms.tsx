import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useCoursesData } from "@/hooks/useAppData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  BookOpen,
  GraduationCap,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { haptic } from "@/lib/haptics";
import { SEOHead } from "@/components/SEOHead";
import { PageHeader } from "@/components/app/ui/PageHeader";
import { PathProfileQuickCard } from "@/components/app/PathProfileQuickCard";
import { useUnseenContentContext } from "@/contexts/UnseenContentContext";
import { CoursesSkeleton } from "@/components/app/skeletons";
import { usePrograms } from "@/hooks/usePrograms";
import { EnrolledProgramCard } from "@/components/app/EnrolledProgramCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const AppCourses = () => {
  const { t, i18n } = useTranslation();
  // Use centralized data hook
  const { enrollments, nextSessionMap, nextContentMap, isLoading } =
    useCoursesData();
  const { programs, isLoading: programsLoading } = usePrograms();

  // Get unseen content - wrap in try/catch in case provider is missing
  let unseenEnrollments = new Set<string>();
  let unseenRounds = new Set<string>();
  let markEnrollmentViewed: ((id: string) => Promise<void>) | null = null;
  let markRoundViewed: ((id: string) => Promise<void>) | null = null;
  try {
    const unseenContent = useUnseenContentContext();
    unseenEnrollments = unseenContent.unseenEnrollments;
    unseenRounds = unseenContent.unseenRounds;
    markEnrollmentViewed = unseenContent.markEnrollmentViewed;
    markRoundViewed = unseenContent.markRoundViewed;
  } catch {
    // Provider not available, ignore
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title={t("programs.myPrograms")} back />
        <CoursesSkeleton />
      </>
    );
  }

  // Filter out simora-plus from enrolled programs (it's a subscription, not a program)
  const filteredEnrollments =
    enrollments?.filter((e) => e.program_slug !== "simora-plus") || [];

  // Get enrolled program slugs
  const enrolledSlugs = new Set(filteredEnrollments.map((e) => e.program_slug));

  // Filter browse programs: free/free-on-iOS + waitlist programs that aren't enrolled
  const browsePrograms = programs.filter(
    (p) =>
      !enrolledSlugs.has(p.slug) &&
      (p.isFree ||
        p.priceAmount === 0 ||
        p.is_free_on_ios === true ||
        (p as any).show_in_app_waitlist === true),
  );

  // Separate enrollments into active/upcoming and completed
  // For rounds: check round.status; for self-paced: check enrollment.status
  const activeRounds = filteredEnrollments.filter(
    (e) => e.program_rounds && e.program_rounds.status !== "completed",
  );
  const completedRounds = filteredEnrollments.filter(
    (e) =>
      (e.program_rounds && e.program_rounds.status === "completed") ||
      (!e.program_rounds && e.status === "completed"),
  );

  // Self-paced enrollments that are still active (not completed)
  const selfPacedEnrollments = filteredEnrollments.filter(
    (e) => !e.program_rounds && e.status !== "completed",
  );

  // Sort active rounds: prioritize those with actual scheduled sessions, then by nearest date
  // Effective upcoming session: a real scheduled session, or the round's
  // first_session_date when it's still in the future.
  const upcomingSessionFor = (e: any): string | null => {
    if (e.program_rounds?.is_self_paced) return null;
    const roundId = e.program_rounds?.id;
    const scheduled = roundId ? nextSessionMap[roundId] : null;
    if (scheduled) return scheduled;
    const first = e.program_rounds?.first_session_date;
    if (first && new Date(first).getTime() > Date.now() - 2 * 60 * 60 * 1000) return first;
    return null;
  };

  const sortedActiveRounds = [...activeRounds].sort((a, b) => {
    const aRoundId = a.program_rounds?.id;
    const bRoundId = b.program_rounds?.id;

    const aNextSession = upcomingSessionFor(a);
    const bNextSession = upcomingSessionFor(b);

    // Check if program has actual content drip schedule
    const aNextContent = aRoundId ? nextContentMap[aRoundId] : null;
    const bNextContent = bRoundId ? nextContentMap[bRoundId] : null;

    // Priority scoring: programs with scheduled sessions get highest priority
    const aHasScheduledSession = !!aNextSession;
    const bHasScheduledSession = !!bNextSession;
    const aHasContentSchedule = !!aNextContent;
    const bHasContentSchedule = !!bNextContent;

    // Programs with scheduled sessions come first
    if (aHasScheduledSession && !bHasScheduledSession) return -1;
    if (!aHasScheduledSession && bHasScheduledSession) return 1;


    // If both have sessions OR both don't, check content schedule
    if (aHasContentSchedule && !bHasContentSchedule) return -1;
    if (!aHasContentSchedule && bHasContentSchedule) return 1;

    // Finally sort by nearest date
    const aDate =
      aNextSession ||
      a.program_rounds?.first_session_date ||
      a.program_rounds?.start_date;
    const bDate =
      bNextSession ||
      b.program_rounds?.first_session_date ||
      b.program_rounds?.start_date;

    if (aDate && !bDate) return -1;
    if (!aDate && bDate) return 1;
    if (!aDate && !bDate) return 0;

    return new Date(aDate!).getTime() - new Date(bDate!).getTime();
  });

  // Helper to get notification and session info for a card
  const getCardProps = (enrollment: (typeof enrollments)[0]) => {
    const round = enrollment.program_rounds;
    const isEnrollmentUnseen = unseenEnrollments.has(enrollment.id);
    const isRoundUnseen = round?.id ? unseenRounds.has(round.id) : false;
    const hasNotification = isEnrollmentUnseen || isRoundUnseen;
    const nextSessionDate = round?.id && !round.is_self_paced ? nextSessionMap[round.id] : null;
    const nextContent = round?.id ? nextContentMap[round.id] : null;

    const onMarkViewed = () => {
      if (isEnrollmentUnseen && markEnrollmentViewed) {
        markEnrollmentViewed(enrollment.id);
      }
      if (round?.id && isRoundUnseen && markRoundViewed) {
        markRoundViewed(round.id);
      }
    };

    return { hasNotification, nextSessionDate, nextContent, onMarkViewed };
  };

  // Nearest upcoming live session across all active rounds
  const upcoming = sortedActiveRounds
    .map((e) => {
      if (e.program_rounds?.is_self_paced) return null;
      const roundId = e.program_rounds?.id;
      const date =
        (roundId && nextSessionMap[roundId]) ||
        e.program_rounds?.first_session_date ||
        null;
      return date ? { enrollment: e, date: new Date(date) } : null;
    })
    .filter(Boolean)
    .filter((s) => s!.date.getTime() > Date.now() - 2 * 60 * 60 * 1000)
    .sort((a, b) => a!.date.getTime() - b!.date.getTime())[0] as
    | { enrollment: (typeof sortedActiveRounds)[0]; date: Date }
    | undefined;


  const totalPrograms = filteredEnrollments.length;

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <SEOHead
        title={t("programs.seoTitle")}
        description={t("programs.seoDesc")}
      />

      <PageHeader
        title={t("programs.myPrograms")}
        back
        subRow={
          totalPrograms > 0 ? (
            <p className="text-xs text-fg-warm-muted">
              {t("programs.enrolledCount", { count: totalPrograms })}
            </p>
          ) : undefined
        }
      />

      {/* Scroll container */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="container max-w-4xl py-4 px-4 space-y-6 pb-safe">
          {/* Profile peek — one-row shortcut into My Profile */}
          <PathProfileQuickCard />

          {/* Next live session */}
          {upcoming && (
            <Link
              to={`/app/programs/${upcoming.enrollment.program_slug}${
                upcoming.enrollment.program_rounds?.id
                  ? `/${upcoming.enrollment.program_rounds.id}`
                  : ""
              }`}
              onClick={() => haptic.light()}
              className="block rounded-3xl bg-gradient-orange p-5 text-white shadow-ios active:scale-[0.99] transition-transform"
            >
              <div className="text-xs uppercase tracking-wide opacity-90">
                Next live session
              </div>
              <div className="mt-1 text-lg font-semibold line-clamp-1">
                {upcoming.enrollment.course_name}
              </div>
              <div className="mt-1 text-sm opacity-95">
                {format(upcoming.date, "EEEE, MMMM d • h:mm a")} (your local
                time)
              </div>
            </Link>
          )}

          {/* Merge accounts banner */}
          <Link
            to="/app/myprofile"
            onClick={() => haptic.light()}
            className="block rounded-xl bg-bg-warm border border-[hsl(var(--border-warm))]/60 px-3 py-2.5 active:opacity-70"
          >
            <p className="text-xs font-bold text-[hsl(var(--fg-warm))]">
              {i18n.language === "fa"
                ? "برنامه‌ای که اخیراً ثبت‌نام کردید را پیدا نمی‌کنید؟"
                : "Trouble finding your program that enrolled recently?"}
            </p>
            <p className="mt-1 text-xs text-[hsl(var(--fg-warm-muted))] leading-relaxed">
              {i18n.language === "fa"
                ? "حساب دیگری دارید یا با ایمیل دیگری خرید کردید؟ در پروفایلم آن را ادغام کنید تا دوره‌ها و سوابق شما به این حساب منتقل شود. "
                : "Have another account or paid with a different email? Merge it in My Profile to bring your programs, purchases, and progress into this account. "}
              <span className="inline-flex items-center gap-0.5 whitespace-nowrap text-[11px] font-bold text-[hsl(var(--brand-primary))] align-baseline">
                {i18n.language === "fa" ? "ادغام حساب‌ها" : "Merge accounts"}
                <ChevronRight className="inline h-3 w-3 rtl:rotate-180" />
              </span>
            </p>
          </Link>

          {/* Active Rounds Section */}
          {(sortedActiveRounds.length > 0 ||
            selfPacedEnrollments.length > 0) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold flex items-center gap-2 text-fg-warm">
                  <GraduationCap className="h-4 w-4 text-brand" />
                  {t("programs.active")}
                </h2>
                <Badge className="text-xs bg-brand/12 text-brand border-0">
                  {sortedActiveRounds.length + selfPacedEnrollments.length}
                </Badge>
              </div>

              <div className="flex flex-col gap-3">
                {sortedActiveRounds.map((enrollment) => {
                  const props = getCardProps(enrollment);
                  return (
                    <EnrolledProgramCard
                      key={enrollment.id}
                      enrollment={enrollment}
                      nextSessionDate={props.nextSessionDate}
                      nextContent={props.nextContent}
                      hasNotification={props.hasNotification}
                      onMarkViewed={props.onMarkViewed}
                    />
                  );
                })}
                {selfPacedEnrollments.map((enrollment) => {
                  const props = getCardProps(enrollment);
                  return (
                    <EnrolledProgramCard
                      key={enrollment.id}
                      enrollment={enrollment}
                      nextSessionDate={props.nextSessionDate}
                      nextContent={props.nextContent}
                      hasNotification={props.hasNotification}
                      onMarkViewed={props.onMarkViewed}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Completed Rounds Section */}
          {completedRounds.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold flex items-center gap-2 text-fg-warm-muted">
                  <CheckCircle2 className="h-4 w-4" />
                  {t("programs.completed")}
                </h2>
                <Badge className="text-xs bg-fg-warm/8 text-fg-warm-muted border-0">
                  {completedRounds.length}
                </Badge>
              </div>

              <div className="flex flex-col gap-3">
                {completedRounds.map((enrollment) => {
                  const props = getCardProps(enrollment);
                  return (
                    <EnrolledProgramCard
                      key={enrollment.id}
                      enrollment={enrollment}
                      isCompleted
                      nextSessionDate={props.nextSessionDate}
                      nextContent={props.nextContent}
                      hasNotification={props.hasNotification}
                      onMarkViewed={props.onMarkViewed}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state if no programs at all */}
          {totalPrograms === 0 && browsePrograms.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                {t("programs.noProgramsAvailable")}
              </p>
            </div>
          )}

          {/* Empty enrolled state with browse below */}
          {totalPrograms === 0 && browsePrograms.length > 0 && (
            <div className="text-center py-8 mb-4">
              <GraduationCap className="h-10 w-10 mx-auto mb-2 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground">
                {t("programs.noProgramsEnrolled")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("programs.browseEnrollHint")}
              </p>
            </div>
          )}

          {/* Academy — hero banner + quick carousel */}
          {browsePrograms.length > 0 && (
            <section className="mt-2 overflow-hidden rounded-3xl bg-card-warm shadow-ios">
              {/* Hero header */}
              <div className="relative bg-gradient-orange px-4 pb-5 pt-4 text-white">
                <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/15" />
                <div className="pointer-events-none absolute -bottom-12 -left-6 h-24 w-24 rounded-full bg-white/10" />
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                      <GraduationCap className="h-4 w-4 text-white" />
                    </span>
                    <h2 className="text-lg font-bold leading-none text-white">
                      {i18n.language === "fa" ? "آکادمی" : "Academy"}
                    </h2>
                    <Badge
                      variant="secondary"
                      className="h-5 border-0 bg-white/25 px-2 text-[10px] font-semibold text-white"
                    >
                      {browsePrograms.length}
                    </Badge>
                  </div>
                  <p className="mt-2 max-w-[90%] text-[12.5px] font-medium leading-snug text-white/90">
                    {i18n.language === "fa"
                      ? "دوره‌های جامع، مسترکلاس‌ها و برنامه‌های تخصصی برای رشد گام‌به‌گام شما"
                      : "Guided masterclasses, intensive sprints and self-paced toolkits."}
                  </p>
                  <Link
                    to="/app/academy"
                    onClick={() => haptic.light()}
                    className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-3.5 py-2 text-[12.5px] font-semibold text-brand shadow-ios active:scale-[0.98] transition-transform"
                  >
                    {i18n.language === "fa"
                      ? "مشاهده همه برنامه‌ها"
                      : "Browse all programs"}
                    <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
                  </Link>
                </div>
              </div>

              {/* Quick carousel */}
              <div className="py-4">
                <Carousel opts={{ align: "start", loop: false }} className="w-full">
                  <CarouselContent className="-ml-2 pl-4 pr-4">
                    {browsePrograms.map((program) => (
                      <CarouselItem
                        key={program.slug}
                        className="pl-2 basis-[150px]"
                      >
                        <Link
                          to={`/app/programs/${program.slug}`}
                          onClick={() => haptic.light()}
                          className="block active:scale-[0.98] transition-transform"
                        >
                          <div className="relative aspect-square overflow-hidden rounded-2xl shadow-ios">
                            <img
                              src={program.image}
                              alt={program.title}
                              className="h-full w-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                            <div className="absolute inset-x-0 bottom-0 p-2.5">
                              <p className="line-clamp-2 text-[11.5px] font-semibold leading-tight text-white">
                                {program.title}
                              </p>
                            </div>
                          </div>
                        </Link>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>
            </section>
          )}


          {/* Tab bar clearance */}
          <div className="h-24" />
        </div>
      </div>
    </div>
  );
};

export default AppCourses;
