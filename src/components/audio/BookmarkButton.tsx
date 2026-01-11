import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface BookmarkButtonProps {
  currentTime: number;
  onAddBookmark: (timestampSeconds: number, note?: string) => void;
  isAdding?: boolean;
}

export function BookmarkButton({ 
  currentTime, 
  onAddBookmark, 
  isAdding 
}: BookmarkButtonProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [note, setNote] = useState("");
  const [savedTime, setSavedTime] = useState(0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClick = () => {
    setSavedTime(Math.floor(currentTime));
    setShowDialog(true);
  };

  const handleSave = () => {
    onAddBookmark(savedTime, note.trim() || undefined);
    setShowDialog(false);
    setNote("");
  };

  const handleQuickSave = () => {
    onAddBookmark(Math.floor(currentTime));
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        onDoubleClick={handleQuickSave}
        disabled={isAdding}
        className="h-10 w-10"
        title="Tap to add bookmark with note, double-tap for quick save"
      >
        <Bookmark className="h-5 w-5" />
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Bookmark at {formatTime(savedTime)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                placeholder="Add a note about this moment..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isAdding}>
              Save Bookmark
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
