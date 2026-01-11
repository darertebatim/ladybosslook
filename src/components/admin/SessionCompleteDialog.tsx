import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle, Loader2, Video } from 'lucide-react';

interface SessionCompleteDialogProps {
  open: boolean;
  sessionTitle?: string;
  recordingLink: string;
  onRecordingLinkChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

export function SessionCompleteDialog({
  open,
  sessionTitle,
  recordingLink,
  onRecordingLinkChange,
  onConfirm,
  onCancel,
  isPending,
}: SessionCompleteDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Mark Session Complete
          </DialogTitle>
          <DialogDescription>
            {sessionTitle && (
              <span className="font-medium text-foreground">{sessionTitle}</span>
            )}
            <br />
            This will announce the completion in the community feed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="recording-link" className="flex items-center gap-2">
              <Video className="h-4 w-4" />
              Recording Link (optional)
            </Label>
            <Input
              id="recording-link"
              type="url"
              placeholder="https://drive.google.com/..."
              value={recordingLink}
              onChange={(e) => onRecordingLinkChange(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              If provided, a "Watch Recording" button will appear in the announcement
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Mark Complete & Announce
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
