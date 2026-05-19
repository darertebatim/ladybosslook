import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGoBack } from '@/hooks/useGoBack';
import { useReflectionPages, useReflections, useSaveReflectionResponse } from '@/hooks/useReflections';
import { useAutoCompleteProTask } from '@/hooks/useAutoCompleteProTask';
import { ArrowLeft, ArrowRight, Check, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useBilingualText } from '@/components/ui/BilingualText';
import { cn } from '@/lib/utils';
import { useRoutinePlayerContext } from '@/components/app/RoutinePlayerProvider';
import { format } from 'date-fns';
import { ReflectionCelebrationSheet } from '@/components/reflection/ReflectionCelebrationSheet';
import { BulletAnswerInput } from '@/components/reflection/BulletAnswerInput';
import { ReflectionReviewSheet, type ReviewItem } from '@/components/reflection/ReflectionReviewSheet';
import { useTranslation } from 'react-i18next';
import { recordMoment } from '@/lib/moments';
import { useAuth } from '@/hooks/useAuth';

export default function AppReflectionFlow() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { reflectionId } = useParams<{ reflectionId: string }>();
  const navigate = useNavigate();
  const goBack = useGoBack('/app/reflections');
  const { data: pages, isLoading } = useReflectionPages(reflectionId);
  const { data: reflections } = useReflections();
  const saveResponse = useSaveReflectionResponse();
  const { autoCompleteReflection } = useAutoCompleteProTask();

  let routinePlayer: { isActive: boolean; isMinimized: boolean; maximize: () => void } | null = null;
  try { routinePlayer = useRoutinePlayerContext(); } catch { /* not available */ }
  const hasActivePlayer = routinePlayer?.isActive && routinePlayer?.isMinimized;

  const [currentIndex, setCurrentIndex] = useState(0);
  // Per-page bullet answers, keyed by page id
  const [answersByPage, setAnswersByPage] = useState<Record<string, string[]>>({});
  const [showCelebration, setShowCelebration] = useState(false);
  const [showReview, setShowReview] = useState(false);

  // Single-page bullet answers
  const [singleLines, setSingleLines] = useState<string[]>(['']);

  const reflection = reflections?.find(r => r.id === reflectionId);

  const totalPages = pages?.length || 0;
  const page = pages?.[currentIndex];
  const isLast = currentIndex === totalPages - 1;
  const progress = totalPages > 0 ? ((currentIndex + 1) / totalPages) * 100 : 0;
  const isShuffleMode = reflection?.shuffle_mode === true;
  const isSinglePage = totalPages === 1 || isShuffleMode;

  // For shuffle mode, pick a random page
  const [shufflePageIndex, setShufflePageIndex] = useState<number>(0);
  const displayedPage = isShuffleMode ? pages?.[shufflePageIndex] : page;

  // Initialize shuffle with random page
  useEffect(() => {
    if (isShuffleMode && pages && pages.length > 0) {
      setShufflePageIndex(Math.floor(Math.random() * pages.length));
    }
  }, [isShuffleMode, pages?.length]);

  const handleShuffle = useCallback(() => {
    if (!pages || pages.length <= 1) return;
    let next: number;
    do {
      next = Math.floor(Math.random() * pages.length);
    } while (next === shufflePageIndex && pages.length > 1);
    setShufflePageIndex(next);
  }, [pages, shufflePageIndex]);

  const activePage = isSinglePage ? displayedPage : page;
  const { className: contentBilingualClassName, direction: contentDirection } = useBilingualText(activePage?.content || '');
  const { className: descBilingualClassName, direction: descDirection } = useBilingualText(activePage?.description || '');
  const { className: titleBiClass, direction: titleDir } = useBilingualText(reflection?.title || '');

  // Get/set bullet lines for current multi-page question
  const currentLines = useMemo(() => {
    if (!page) return [''];
    return answersByPage[page.id] || [''];
  }, [page, answersByPage]);

  const setCurrentLines = useCallback((next: string[]) => {
    if (!page) return;
    setAnswersByPage((prev) => ({ ...prev, [page.id]: next }));
  }, [page]);

  // Build review items from collected answers (skip info pages with no answer)
  const reviewItems: ReviewItem[] = useMemo(() => {
    if (!pages) return [];
    return pages
      .filter((p) => p.type === 'question')
      .map((p) => ({
        question: p.content || '',
        answer: (answersByPage[p.id] || []).filter((l) => l.trim()).join('\n'),
      }))
      .filter((it) => it.answer.trim().length > 0 || true); // keep all questions, even empty
  }, [pages, answersByPage]);

  const handleSaveSinglePage = async () => {
    const savePage = displayedPage || page;
    if (!savePage || !reflectionId) return;
    const content = singleLines.filter((l) => l.trim()).join('\n');
    try {
      await saveResponse.mutateAsync({
        reflectionId,
        pageId: savePage.id,
        responseText: content,
        isCompleted: true,
      });
      if (reflectionId) {
        await autoCompleteReflection(reflectionId);
      }
      if (user?.id && reflection?.title) {
        void recordMoment({
          userId: user.id,
          kind: 'reflection',
          title: reflection.title,
          payload: { ref_id: `reflection:${reflectionId}:${new Date().toISOString().slice(0, 10)}` },
        });
      }
      // Single-page: skip review sheet, go straight to celebration
      setShowCelebration(true);
    } catch (error) {
      console.error('Failed to save reflection response:', error);
      toast.error(t('reflectionsPage.saveFailed'));
    }
  };

  const handleNext = async () => {
    if (!page || !reflectionId) return;

    try {
      if (page.type === 'question') {
        const responseText = (answersByPage[page.id] || []).filter((l) => l.trim()).join('\n');
        await saveResponse.mutateAsync({
          reflectionId,
          pageId: page.id,
          responseText,
          isCompleted: isLast,
        });
      } else if (isLast) {
        await saveResponse.mutateAsync({
          reflectionId,
          pageId: page.id,
          isCompleted: true,
        });
      }

      if (isLast) {
        if (reflectionId) {
          await autoCompleteReflection(reflectionId);
        }
        if (user?.id && reflection?.title) {
          void recordMoment({
            userId: user.id,
            kind: 'reflection',
            title: reflection.title,
            payload: { ref_id: `reflection:${reflectionId}:${new Date().toISOString().slice(0, 10)}` },
          });
        }
        // Multi-page: show review sheet first; user taps Continue → celebration
        setShowReview(true);
      } else {
        setCurrentIndex((i) => i + 1);
      }
    } catch (error) {
      console.error('Failed to save reflection response:', error);
      toast.error(t('reflectionsPage.saveFailed'));
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    } else {
      goBack();
    }
  };

  if (isLoading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  if (!pages || pages.length === 0) {
    return (
      <div className="h-full bg-background flex flex-col items-center justify-center p-6">
        <p className="text-muted-foreground">{t('reflectionsPage.noPagesYet')}</p>
        <button onClick={() => goBack()} className="mt-4 text-primary underline">{t('reflectionsPage.goBack')}</button>
      </div>
    );
  }

  // Single-page: free-form style UI
  if (isSinglePage) {
    const today = format(new Date(), 'EEEE, MMM d');
    return (
      <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
        {/* Top bar */}
        <div
          className="px-4 pb-2 flex items-center justify-between shrink-0"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
        >
          <button onClick={() => goBack()} className="text-sm text-muted-foreground active:scale-95 transition-transform">
            {t('reflectionsPage.cancel')}
          </button>
          <button
            onClick={handleSaveSinglePage}
            disabled={saveResponse.isPending || singleLines.every((l) => !l.trim())}
            className="px-5 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold active:scale-95 transition-transform disabled:opacity-40"
          >
            {t('common.done')}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 px-5 pt-4 overflow-y-auto overscroll-contain" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}>
          {/* Date */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t('reflectionsPage.todayPrefix')}, {today.toUpperCase()}
            </p>
            {isShuffleMode && totalPages > 1 && (
              <button
                onClick={handleShuffle}
                className="p-2.5 rounded-full active:scale-90 transition-transform text-orange-500 hover:text-orange-600"
                aria-label={t('reflectionsPage.shuffleAria')}
              >
                <RefreshCw className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Title — use page content as the main title */}
          <h1 className={cn("text-2xl font-bold mt-1", contentBilingualClassName)} dir={contentDirection}>
            {displayedPage?.content}
          </h1>

          {/* Bullet entries */}
          <div className="mt-4">
            <BulletAnswerInput
              lines={singleLines}
              onLinesChange={setSingleLines}
              placeholder={displayedPage?.description || t('reflectionsPage.writeThoughts')}
              autoFocus
            />
          </div>
        </div>

        <ReflectionCelebrationSheet
          open={showCelebration}
          onOpenChange={setShowCelebration}
          onDone={() => goBack()}
        />
      </div>
    );
  }

  // Multi-page: standard flow UI
  return (
    <div
      className="h-[100dvh] bg-background flex flex-col overflow-hidden"
    >
      {/* Top bar: back + progress */}
      <div
        className="px-4 pb-2 flex items-center gap-3 shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <button onClick={handleBack} className="shrink-0 active:scale-95 transition-transform p-1">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 py-6 overflow-y-auto overscroll-contain">
        <p className={cn("text-xl font-bold leading-snug text-justify", contentBilingualClassName)} dir={contentDirection}>{page?.content}</p>
        {page?.description && (
          <p className={cn("mt-4 text-sm text-foreground leading-relaxed whitespace-pre-line text-justify", descBilingualClassName)} dir={descDirection}>{page.description}</p>
        )}

        {page?.type === 'question' && (
          <div className="mt-6">
            <BulletAnswerInput
              key={page.id}
              lines={currentLines}
              onLinesChange={setCurrentLines}
              placeholder={t('reflectionsPage.writeThoughts')}
              autoFocus
            />
          </div>
        )}
      </div>

      {/* FAB */}
      <div
        className="p-6 flex justify-end shrink-0"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
      >
        <button
          onClick={handleNext}
          disabled={saveResponse.isPending}
          className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50"
        >
          {isLast ? <Check className="h-6 w-6" /> : <ArrowRight className="h-6 w-6" />}
        </button>
      </div>

      <ReflectionCelebrationSheet
        open={showCelebration}
        onOpenChange={setShowCelebration}
        onDone={() => goBack()}
      />

      <ReflectionReviewSheet
        open={showReview}
        onOpenChange={setShowReview}
        title={reflection?.title || t('reflectionsPage.yourReflection')}
        items={reviewItems}
        onContinue={() => {
          setShowReview(false);
          setShowCelebration(true);
        }}
      />
    </div>
  );
}
