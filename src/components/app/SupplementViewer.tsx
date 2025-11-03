import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";

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
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
};

const extractVimeoId = (url: string): string | null => {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
};

const getVideoEmbedUrl = (url: string): string | null => {
  const youtubeId = extractYouTubeId(url);
  if (youtubeId) {
    return `https://www.youtube.com/embed/${youtubeId}`;
  }
  
  const vimeoId = extractVimeoId(url);
  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}`;
  }
  
  return null;
};

export function SupplementViewer({ isOpen, onClose, supplement }: SupplementViewerProps) {
  const [isLoading, setIsLoading] = useState(true);

  if (!supplement) return null;

  const handleOpenInNewTab = () => {
    window.open(supplement.url, '_blank', 'noopener,noreferrer');
  };

  const renderContent = () => {
    if (supplement.type === 'video') {
      const embedUrl = getVideoEmbedUrl(supplement.url);
      
      if (embedUrl) {
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
            />
          </div>
        );
      }
    }

    if (supplement.type === 'pdf') {
      return (
        <div className="relative w-full h-[70vh] bg-muted rounded-lg overflow-hidden">
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
