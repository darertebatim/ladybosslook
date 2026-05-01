import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Dices, BookOpen, X, CalendarPlus, Lightbulb } from "lucide-react";
import {
  useTaskTemplates,
  TaskTemplate,
  TASK_COLORS,
  TaskColor,
} from "@/hooks/useTaskPlanner";
import { useRoutineBankCategories } from "@/hooks/useRoutinesBank";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { FluentEmoji } from "@/components/ui/FluentEmoji";
import { haptic } from "@/lib/haptics";
import { useTranslation } from "react-i18next";

// Map time_period values to translation keys
const TIME_PERIOD_KEYS: Record<string, string> = {
  morning: "quickStart.morning",
  afternoon: "quickStart.afternoon",
  evening: "quickStart.evening",
  night: "quickStart.bedtime",
};

interface TaskQuickStartSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: (taskName: string, template?: TaskTemplate) => void;
}

export const TaskQuickStartSheet = ({
  open,
  onOpenChange,
  onContinue,
}: TaskQuickStartSheetProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [taskName, setTaskName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("popular");
  const [isRolling, setIsRolling] = useState(false);
  const [showIdeas, setShowIdeas] = useState(false);
  const { data: templates = [] } = useTaskTemplates();
  const { data: rawCategories = [] } = useRoutineBankCategories();

  // Sort categories by task_display_order (0 = end of line)
  const categories = useMemo(() => {
    return [...rawCategories].sort((a, b) => {
      if (a.slug === "pro") return 1;
      if (b.slug === "pro") return -1;
      const aOrder = a.task_display_order || 0;
      const bOrder = b.task_display_order || 0;
      if (aOrder === 0 && bOrder === 0) return 0;
      if (aOrder === 0) return 1;
      if (bOrder === 0) return -1;
      return aOrder - bOrder;
    });
  }, [rawCategories]);

  const handleContinue = () => {
    if (taskName.trim()) {
      onContinue(taskName.trim());
      setTaskName("");
      onOpenChange(false);
    }
  };

  const handleTemplateSelect = (template: TaskTemplate) => {
    haptic.light();
    onContinue(template.title, template);
    setTaskName("");
    onOpenChange(false);
  };

  const handleRandomAction = () => {
    if (templates.length === 0 || isRolling) return;

    setIsRolling(true);
    haptic.light();

    // Dice roll delay with haptic pulses
    let pulseCount = 0;
    const pulseInterval = setInterval(() => {
      haptic.light();
      pulseCount++;
      if (pulseCount >= 3) clearInterval(pulseInterval);
    }, 200);

    // After ~1 second, select and add the action
    setTimeout(() => {
      clearInterval(pulseInterval);
      const randomIndex = Math.floor(Math.random() * templates.length);
      const randomTemplate = templates[randomIndex];
      setIsRolling(false);
      if (randomTemplate) {
        haptic.success();
        handleTemplateSelect(randomTemplate);
      }
    }, 1000);
  };

  const handleBrowseAll = () => {
    haptic.light();
    onOpenChange(false);
    navigate("/app/routines");
  };

  const handleClose = () => {
    setTaskName("");
    setSelectedCategory("popular");
    setShowIdeas(false);
    onOpenChange(false);
  };

  // Filter templates based on search and category
  const filteredSuggestions = useMemo(() => {
    let items = templates;

    // Apply category filter
    if (selectedCategory === "popular") {
      items = items.filter((t) => t.is_popular);
    } else if (selectedCategory !== "all") {
      items = items.filter((t) => t.category === selectedCategory);
    }

    // Apply search filter if exists
    if (taskName.trim()) {
      const search = taskName.toLowerCase();
      items = items.filter(
        (t) =>
          t.title.toLowerCase().includes(search) ||
          t.category?.toLowerCase().includes(search),
      );
    }

    return items.slice(0, 6);
  }, [templates, selectedCategory, taskName]);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-3xl p-0 pb-safe"
        hideCloseButton
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Fixed header area */}
          <div className="shrink-0">
            {/* Compact Header with help button */}
            <div className="pt-3 pb-2 px-4 flex items-center justify-between">
              <div className="w-8" />
              <div className="w-10 h-1 bg-muted-foreground/30 rounded-full" />
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>

            {/* Title input */}
            <div className="px-4 pb-3">
              <div className="rounded-xl p-3">
                <Input
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value.slice(0, 50))}
                  placeholder={t("quickStart.typeNew")}
                  className="text-xl font-semibold text-center border-0 bg-transparent focus-visible:ring-0 placeholder:text-muted-foreground/40 h-auto py-2"
                  maxLength={50}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (taskName.trim()) {
                        handleContinue();
                      } else {
                        (e.target as HTMLInputElement).blur();
                        if (Capacitor.isNativePlatform()) {
                          Keyboard.hide();
                        }
                      }
                    }
                  }}
                />
                <div className="text-[10px] text-muted-foreground/60 text-center mt-1">
                  {taskName.length}/50
                </div>
              </div>
            </div>

            {/* Continue button - appears when name is entered */}
            {taskName.trim() && (
              <div className="px-4 pb-3">
                <Button
                  onClick={handleContinue}
                  className="w-full h-11 rounded-full bg-foreground text-background font-semibold text-sm hover:bg-foreground/90"
                >
                  {t("common.continue")}
                </Button>
              </div>
            )}

            {/* Need inspiration toggle - only show when not typing */}
            {!taskName.trim() && !showIdeas && (
              <div className="px-4 pb-4">
                <button
                  onClick={() => {
                    haptic.light();
                    setShowIdeas(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-muted/40 hover:bg-muted/60 border border-border/20 transition-all active:scale-[0.98]"
                >
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {t("quickStart.needInspiration")}
                  </span>
                </button>
              </div>
            )}

            {/* Action buttons - visible when toggled OR searching */}
            {/* Category Pills - only when browsing, not searching */}
            {(showIdeas || taskName.trim()) && !taskName.trim() && (
              <div className="pb-2">
                <ScrollArea className="w-full">
                  <div className="flex gap-1.5 px-4">
                    <button
                      onClick={() => {
                        haptic.light();
                        setSelectedCategory("popular");
                      }}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 border",
                        selectedCategory === "popular"
                          ? "bg-primary/15 text-primary border-primary/30"
                          : "bg-muted text-foreground hover:bg-muted/80 border-transparent",
                      )}
                    >
                      ⭐ {t("quickStart.popular")}
                    </button>
                    {categories.map((cat) => (
                      <button
                        key={cat.slug}
                        onClick={() => {
                          haptic.light();
                          setSelectedCategory(cat.slug);
                        }}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 border",
                          selectedCategory === cat.slug
                            ? "bg-primary/15 text-primary border-primary/30"
                            : "bg-muted text-foreground hover:bg-muted/80 border-transparent",
                        )}
                      >
                        {cat.emoji && (
                          <span className="mr-0.5">{cat.emoji}</span>
                        )}
                        {cat.name}
                      </button>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="invisible" />
                </ScrollArea>
              </div>
            )}
          </div>

          {/* Scrollable suggestions area */}
          <div
            className="flex-1 overflow-y-auto overscroll-contain"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {(showIdeas || taskName.trim()) && (
              <div className="px-4 pb-4 tour-action-suggestions">
                {/* Random & Browse All - above suggestions */}
                <div className="tour-action-buttons space-y-2 mb-3">
                  <button
                    onClick={handleBrowseAll}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted active:bg-muted/70 transition-all active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {t("quickStart.browseAll")}
                    </span>
                  </button>
                </div>

                {filteredSuggestions.length > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">
                      {taskName.trim()
                        ? t("quickStart.matching")
                        : t("quickStart.suggestions")}
                    </p>
                    <div className="space-y-2 tour-action-list">
                      {filteredSuggestions.map((template) => {
                        const bgColor =
                          TASK_COLORS[template.color as TaskColor] ||
                          TASK_COLORS.blue;
                        const timePeriodLabel = template.time_period
                          ? TIME_PERIOD_KEYS[template.time_period]
                            ? t(TIME_PERIOD_KEYS[template.time_period])
                            : template.time_period
                          : t("quickStart.anytime");

                        return (
                          <button
                            key={template.id}
                            onClick={() => handleTemplateSelect(template)}
                            className="w-full text-left rounded-xl border border-border/50 overflow-hidden active:scale-[0.98] transition-transform"
                            style={{ backgroundColor: bgColor }}
                          >
                            <div className="flex items-center gap-3 p-3">
                              <FluentEmoji
                                emoji={template.emoji || "📝"}
                                size={32}
                                className="shrink-0"
                              />

                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-black truncate">
                                  {template.title}
                                </p>
                                <p className="text-xs text-black/70 truncate">
                                  {template.category}
                                  {template.repeat_pattern &&
                                    template.repeat_pattern !== "none" && (
                                      <span>
                                        {" • "}
                                        {template.repeat_pattern === "daily"
                                          ? t("quickStart.daily")
                                          : template.repeat_pattern === "weekly"
                                            ? t("quickStart.weekly")
                                            : template.repeat_pattern ===
                                                "monthly"
                                              ? t("quickStart.monthly")
                                              : template.repeat_pattern ===
                                                  "weekend"
                                                ? t("quickStart.weekends")
                                                : ""}
                                      </span>
                                    )}
                                  {(!template.repeat_pattern ||
                                    template.repeat_pattern === "none") && (
                                    <span>
                                      {" • "}
                                      {t("quickStart.once")}
                                    </span>
                                  )}
                                  <span>
                                    {" • "}
                                    {timePeriodLabel}
                                  </span>
                                </p>
                              </div>

                              <div
                                className="shrink-0 p-2.5 rounded-full bg-foreground"
                                aria-hidden="true"
                              >
                                <CalendarPlus className="h-5 w-5 text-background" />
                              </div>
                            </div>

                            {template.description && (
                              <div className="mx-2 mb-2 p-2.5 bg-white/90 rounded-lg">
                                <p className="text-xs text-black/80 leading-relaxed line-clamp-2">
                                  {template.description}
                                </p>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Bottom safe area padding */}
            <div className="h-2" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
