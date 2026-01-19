import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, Share2, Clock, Star, CheckCircle, Loader2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/app/StarRating';
import { RoutinePreviewSheet, EditedTask } from '@/components/app/RoutinePreviewSheet';
import { useRoutinePlan, useAddRoutinePlan, useRateRoutinePlan } from '@/hooks/useRoutinePlans';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const colorGradients: Record<string, string> = {
  yellow: 'from-amber-400 to-amber-600',
  pink: 'from-pink-400 to-pink-600',
  purple: 'from-purple-400 to-purple-600',
  blue: 'from-blue-400 to-blue-600',
  green: 'from-emerald-400 to-emerald-600',
  orange: 'from-orange-400 to-orange-600',
  red: 'from-red-400 to-red-600',
  teal: 'from-teal-400 to-teal-600',
  indigo: 'from-indigo-400 to-indigo-600',
  rose: 'from-rose-400 to-rose-600',
};

export default function AppInspireDetail() {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [showPreviewSheet, setShowPreviewSheet] = useState(false);
  
  const { data: plan, isLoading } = useRoutinePlan(planId);
  const addRoutinePlan = useAddRoutinePlan();
  const rateRoutinePlan = useRateRoutinePlan();

  const handleAddClick = () => {
    if (!plan?.tasks?.length) {
      toast.error('No tasks in this routine');
      return;
    }
    setShowPreviewSheet(true);
  };

  const handleSaveRoutine = async (selectedTaskIds: string[], editedTasks: EditedTask[]) => {
    if (!planId) return;
    
    try {
      await addRoutinePlan.mutateAsync({ planId, selectedTaskIds, editedTasks });
      setShowPreviewSheet(false);
      toast.success(`${selectedTaskIds.length} tasks added!`);
      navigate('/app/planner');
    } catch (error) {
      toast.error('Failed to add routine');
    }
  };

  const handleRate = async (rating: number) => {
    if (!planId) return;
    
    try {
      await rateRoutinePlan.mutateAsync({ planId, rating });
      toast.success('Thanks for your rating!');
    } catch (error) {
      toast.error('Failed to submit rating');
    }
  };

  const handleShare = async () => {
    if (!plan) return;
    
    try {
      await navigator.share({
        title: plan.title,
        text: plan.subtitle || plan.description || '',
        url: window.location.href,
      });
    } catch {
      // User cancelled or share not supported
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-muted-foreground">Routine not found</p>
        <Button variant="outline" onClick={() => navigate('/app/inspire')}>
          Back to Inspire
        </Button>
      </div>
    );
  }

  const IconComponent = (LucideIcons as any)[plan.icon] || LucideIcons.Sparkles;
  const gradient = colorGradients[plan.color] || colorGradients.purple;

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Fixed Header */}
      <header 
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4"
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white">
            <Heart className="w-5 h-5" />
          </button>
          <button 
            onClick={handleShare}
            className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      <ScrollArea className="flex-1">
        {/* Hero Image/Gradient */}
        <div className={cn(
          'relative w-full bg-gradient-to-br',
          gradient
        )} style={{ height: 'calc(224px + env(safe-area-inset-top, 0px))' }}>
          {plan.cover_image_url ? (
            <img
              src={plan.cover_image_url}
              alt={plan.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center pt-12">
              <IconComponent className="w-24 h-24 text-white/30" />
            </div>
          )}
        </div>

        <div className="px-4 pb-40">
          {/* Title & Badges */}
          <div className="pt-4">
            <h1 className="text-2xl font-bold text-foreground">{plan.title}</h1>
            {plan.subtitle && (
              <p className="text-muted-foreground mt-1">{plan.subtitle}</p>
            )}
            
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1 bg-amber-100 text-amber-700 text-sm font-medium px-2.5 py-1 rounded-full">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{plan.points} pts</span>
              </div>
              <div className="flex items-center gap-1 bg-muted text-muted-foreground text-sm font-medium px-2.5 py-1 rounded-full">
                <Clock className="w-4 h-4" />
                <span>{plan.estimated_minutes} min</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {plan.description && (
            <div className="mt-6">
              <p className="text-muted-foreground leading-relaxed">{plan.description}</p>
            </div>
          )}

          {/* Tasks Catalog */}
          {plan.tasks && plan.tasks.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-foreground mb-3">What's Included</h2>
              <div className="space-y-2">
                {plan.tasks.map((task, index) => {
                  const TaskIcon = (LucideIcons as any)[task.icon] || LucideIcons.CheckCircle;
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {index + 1}
                      </div>
                      <TaskIcon className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <span className="text-foreground">{task.title}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {task.duration_minutes} min
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Educational Sections */}
          {plan.sections && plan.sections.length > 0 && (
            <div className="mt-8 space-y-6">
              {plan.sections.map((section) => (
                <div key={section.id}>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {section.title}
                  </h3>
                  {section.image_url && (
                    <img
                      src={section.image_url}
                      alt={section.title}
                      className="w-full h-40 object-cover rounded-xl mb-3"
                    />
                  )}
                  {section.content && (
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {section.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Completion Section */}
          <div className="mt-10 py-8 border-t border-border">
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-foreground">You're all set!</h3>
              <p className="text-muted-foreground mt-1">
                Add this routine to your planner to start building better habits.
              </p>
            </div>
          </div>

          {/* Rating Section */}
          <div className="mt-6 py-6 border-t border-border">
            <div className="text-center">
              <p className="text-muted-foreground mb-3">How did you find this content?</p>
              <StarRating
                rating={plan.userRating}
                onRate={handleRate}
                size="lg"
              />
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Sticky Add Button */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 72px)' }}
      >
        <Button
          onClick={handleAddClick}
          className="w-full h-12 text-base font-semibold"
          size="lg"
        >
          {plan.isAdded ? '+ Add again' : '+ Add to my routine'}
        </Button>
      </div>

      {/* Preview Sheet */}
      {plan.tasks && (
        <RoutinePreviewSheet
          open={showPreviewSheet}
          onOpenChange={setShowPreviewSheet}
          tasks={plan.tasks}
          routineTitle={plan.title}
          onSave={handleSaveRoutine}
          isSaving={addRoutinePlan.isPending}
        />
      )}
    </div>
  );
}
