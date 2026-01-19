import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2, FileText, Video } from "lucide-react";
import { useState, useEffect } from "react";
import { isNativeApp } from "@/lib/platform";
import { Browser } from "@capacitor/browser";

interface SupplementViewerProps {
  isOpen: boolean;
  onClose: () => void;
  supplement: {
    title: string;
    type: string;
    url: string;
    description?: string;
  } | null;
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
    // Add required parameters for better embedding compatibility
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

export function SupplementViewer({ isOpen, onClose, supplement }: SupplementViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [videoError, setVideoError] = useState(false);

  // Reset states when supplement changes
  useEffect(() => {
    setIsLoading(true);
    setVideoError(false);
  }, [supplement?.url]);

  if (!supplement) return null;

  const handleOpenInNewTab = () => {
    window.open(supplement.url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenExternal = async () => {
    if (isNativeApp()) {
      await Browser.open({ url: supplement.url });
    } else {
      window.open(supplement.url, '_blank', 'noopener,noreferrer');
    }
  };

  const renderContent = () => {
    if (supplement.type === 'video') {
      const embedUrl = getVideoEmbedUrl(supplement.url);
      const platformName = getVideoPlatformName(supplement.url);
      
      // If embed failed or not available, show fallback
      if (!embedUrl || videoError) {
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 bg-muted rounded-lg">
            <Video className="h-16 w-16 text-muted-foreground" />
            <p className="text-center text-muted-foreground px-4">
              This video needs to be opened externally
            </p>
            <Button 
              size="lg" 
              onClick={handleOpenExternal}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Watch on {platformName}
            </Button>
          </div>
        );
      }

      return (
        <div className="relative w-full pt-[56.25%] bg-muted rounded-lg overflow-hidden">
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
          {/* Fallback link if embed has issues */}
          <div className="mt-3 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenExternal}
              className="text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Having trouble? Open on {platformName}
            </Button>
          </div>
        </div>
      );
    }

    if (supplement.type === 'pdf') {
      // On native iOS, PDFs in iframes only show first page - use system viewer
      if (isNativeApp()) {
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4 bg-muted rounded-lg">
            <FileText className="h-16 w-16 text-muted-foreground" />
            <p className="text-center text-muted-foreground px-4">
              Tap below to view the full PDF document
            </p>
            <Button 
              size="lg" 
              onClick={handleOpenExternal}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open PDF
            </Button>
          </div>
        );
      }

      // On web, show iframe with fallback option
      return (
        <div className="space-y-3">
          <div className="relative w-full h-[60vh] bg-muted rounded-lg overflow-hidden">
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
          <p className="text-sm text-center text-muted-foreground">
            Having trouble viewing?{' '}
            <Button 
              variant="link" 
              className="p-0 h-auto text-sm"
              onClick={handleOpenInNewTab}
            >
              Open in new tab
            </Button>
          </p>
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{supplement.title}</DialogTitle>
          {supplement.description && (
            <DialogDescription>{supplement.description}</DialogDescription>
          )}
        </DialogHeader>
        
        <div className="space-y-4">
          {renderContent()}
          
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={handleOpenInNewTab}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in New Tab
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
