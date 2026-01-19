import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, FileText, Video, ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import { isNativeApp } from "@/lib/platform";
import { Browser } from "@capacitor/browser";
import { cn } from "@/lib/utils";

interface Module {
  id: string;
  title: string;
  type: string;
  url: string;
  description?: string;
  audio_id?: string;
  sort_order: number;
}

interface ModuleContext {
  modules: Module[];
  currentIndex: number;
  isCompleted: boolean;
  onComplete: (moduleId: string) => void;
  onNavigate: (module: Module, index: number) => void;
  getModuleCompleted: (moduleId: string) => boolean;
}

interface SupplementViewerProps {
  isOpen: boolean;
  onClose: () => void;
  supplement: {
    id: string;
    title: string;
    type: string;
    url: string;
    description?: string;
  } | null;
  moduleContext?: ModuleContext;
}

const extractYouTubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/,
    /youtube\.com\/embed\/([^&\s]+)/,
    /youtube\.com\/shorts\/([^&\s]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const extractVimeoId = (url: string): string | null => {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
};

const getVideoEmbedUrl = (url: string): string | null => {
  const youtubeId = extractYouTubeId(url);
  if (youtubeId) {
    const params = new URLSearchParams({
      playsinline: '1',
      rel: '0',
      modestbranding: '1',
    });
    return `https://www.youtube.com/embed/${youtubeId}?${params.toString()}`;
  }
  
  const vimeoId = extractVimeoId(url);
  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}?playsinline=1`;
  }
  
  return null;
};

const getVideoPlatformName = (url: string): string => {
  if (extractYouTubeId(url)) return 'YouTube';
  if (extractVimeoId(url)) return 'Vimeo';
  return 'External Site';
};

export function SupplementViewer({ isOpen, onClose, supplement, moduleContext }: SupplementViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const [showCompletedFeedback, setShowCompletedFeedback] = useState(false);

  // Reset states when supplement changes
  useEffect(() => {
    setIsLoading(true);
    setVideoError(false);
    setShowCompletedFeedback(false);
  }, [supplement?.url, supplement?.id]);

  if (!supplement) return null;

  const hasModuleContext = !!moduleContext;
  const currentIndex = moduleContext?.currentIndex ?? 0;
  const totalModules = moduleContext?.modules.length ?? 1;
  const isFirstModule = currentIndex === 0;
  const isLastModule = currentIndex === totalModules - 1;
  const isCurrentCompleted = moduleContext?.isCompleted ?? false;

  const handleOpenExternal = async () => {
    if (isNativeApp()) {
      await Browser.open({ url: supplement.url });
    } else {
      window.open(supplement.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleComplete = () => {
    if (!moduleContext || !supplement) return;
    
    // Mark as complete
    moduleContext.onComplete(supplement.id);
    
    // Show feedback
    setShowCompletedFeedback(true);
    
    // Auto-advance after brief delay if not last module
    if (!isLastModule) {
      setTimeout(() => {
        handleNext();
      }, 600);
    } else {
      // On last module, close after showing feedback
      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  const handleNext = () => {
    if (!moduleContext || isLastModule) return;
    const nextModule = moduleContext.modules[currentIndex + 1];
    if (nextModule) {
      setShowCompletedFeedback(false);
      moduleContext.onNavigate(nextModule, currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (!moduleContext || isFirstModule) return;
    const prevModule = moduleContext.modules[currentIndex - 1];
    if (prevModule) {
      setShowCompletedFeedback(false);
      moduleContext.onNavigate(prevModule, currentIndex - 1);
    }
  };

  const renderContent = () => {
    if (supplement.type === 'video') {
      const embedUrl = getVideoEmbedUrl(supplement.url);
      const platformName = getVideoPlatformName(supplement.url);
      
      if (!embedUrl || videoError) {
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 bg-muted rounded-2xl">
            <Video className="h-16 w-16 text-muted-foreground" />
            <p className="text-center text-muted-foreground px-4">
              Tap below to watch the video
            </p>
            <Button 
              size="lg" 
              onClick={handleOpenExternal}
              className="gap-2 rounded-full px-6"
            >
              <ExternalLink className="h-4 w-4" />
              Watch on {platformName}
            </Button>
          </div>
        );
      }

      return (
        <div className="space-y-3">
          <div className="relative w-full pt-[56.25%] bg-muted rounded-2xl overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            <iframe
              src={embedUrl}
              className="absolute top-0 left-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => setIsLoading(false)}
              onError={() => setVideoError(true)}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenExternal}
            className="w-full text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Having trouble? Open on {platformName}
          </Button>
        </div>
      );
    }

    if (supplement.type === 'pdf') {
      if (isNativeApp()) {
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 bg-muted rounded-2xl">
            <FileText className="h-16 w-16 text-muted-foreground" />
            <p className="text-center text-muted-foreground px-4">
              Tap below to view the PDF document
            </p>
            <Button 
              size="lg" 
              onClick={handleOpenExternal}
              className="gap-2 rounded-full px-6"
            >
              <ExternalLink className="h-4 w-4" />
              Open PDF
            </Button>
          </div>
        );
      }

      return (
        <div className="space-y-3">
          <div className="relative w-full h-[50vh] bg-muted rounded-2xl overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            <iframe
              src={supplement.url}
              className="w-full h-full"
              onLoad={() => setIsLoading(false)}
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenExternal}
            className="w-full text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Having trouble? Open in new tab
          </Button>
        </div>
      );
    }

    if (supplement.type === 'link') {
      return (
        <div className="flex flex-col items-center justify-center py-12 space-y-4 bg-muted rounded-2xl">
          <ExternalLink className="h-16 w-16 text-muted-foreground" />
          <p className="text-center text-muted-foreground px-4">
            This module opens an external resource
          </p>
          <Button 
            size="lg" 
            onClick={handleOpenExternal}
            className="gap-2 rounded-full px-6"
          >
            <ExternalLink className="h-4 w-4" />
            Open Link
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="h-[90vh] rounded-t-3xl p-0 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-background/95 backdrop-blur sticky top-0 z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="gap-1 -ml-2"
          >
            <X className="h-5 w-5" />
          </Button>
          
          {hasModuleContext && (
            <span className="text-sm font-medium text-muted-foreground">
              Module {currentIndex + 1} of {totalModules}
            </span>
          )}
          
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Module Title & Description */}
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">{supplement.title}</h2>
            {supplement.description && (
              <p className="text-muted-foreground text-sm">{supplement.description}</p>
            )}
          </div>

          {/* Content Area */}
          {renderContent()}
        </div>

        {/* Footer Navigation */}
        <div className="border-t bg-background/95 backdrop-blur p-4 pb-safe space-y-3">
          {/* Completion Feedback */}
          {showCompletedFeedback && (
            <div className="flex items-center justify-center gap-2 py-2 text-primary animate-fade-in">
              <Check className="h-5 w-5" />
              <span className="font-medium">
                {isLastModule ? "Course completed!" : "Completed!"}
              </span>
            </div>
          )}

          {hasModuleContext ? (
            <div className="flex gap-3">
              {/* Previous Button */}
              <Button
                variant="outline"
                size="lg"
                onClick={handlePrevious}
                disabled={isFirstModule}
                className="flex-1 rounded-full"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>

              {/* Complete/Next Button */}
              {isCurrentCompleted ? (
                // Already completed - just show Next
                <Button
                  size="lg"
                  onClick={isLastModule ? onClose : handleNext}
                  className="flex-1 rounded-full"
                >
                  {isLastModule ? "Close" : "Next"}
                  {!isLastModule && <ChevronRight className="h-4 w-4 ml-1" />}
                </Button>
              ) : (
                // Not completed - show Complete button
                <Button
                  size="lg"
                  onClick={handleComplete}
                  className={cn(
                    "flex-1 rounded-full gap-2",
                    isLastModule 
                      ? "bg-green-600 hover:bg-green-700" 
                      : ""
                  )}
                >
                  <Check className="h-4 w-4" />
                  {isLastModule ? "Complete" : "Complete & Next"}
                </Button>
              )}
            </div>
          ) : (
            // No module context - simple close button
            <Button
              variant="outline"
              size="lg"
              onClick={onClose}
              className="w-full rounded-full"
            >
              Close
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
