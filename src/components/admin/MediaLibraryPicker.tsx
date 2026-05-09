import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Library, Music, Video as VideoIcon } from 'lucide-react';

type Kind = 'video' | 'audio';

interface Props {
  kind: Kind;
  onPick: (item: { id: string; title: string; file_url: string }) => void;
  triggerLabel?: string;
}

export function MediaLibraryPicker({ kind, onPick, triggerLabel }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['media-library-picker', kind],
    queryFn: async () => {
      const table = kind === 'video' ? 'video_content' : 'audio_content';
      const { data, error } = await supabase
        .from(table)
        .select('id, title, file_url, cover_image_url, category')
        .not('file_url', 'is', null)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const filtered = items.filter((it: any) =>
    !search.trim() || (it.title || '').toLowerCase().includes(search.toLowerCase())
  );

  const Icon = kind === 'video' ? VideoIcon : Music;

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Library className="w-4 h-4" />
        {triggerLabel || `Pick from ${kind} library`}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Icon className="w-5 h-5" />
              Pick {kind === 'video' ? 'a video' : 'an audio'}
            </SheetTitle>
          </SheetHeader>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title..."
              className="pl-9"
            />
          </div>
          <ScrollArea className="flex-1 mt-4 -mx-6 px-6">
            {isLoading ? (
              <p className="text-sm text-muted-foreground p-4 text-center">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 text-center">No {kind}s found.</p>
            ) : (
              <div className="space-y-2 pb-6">
                {filtered.map((it: any) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => {
                      onPick({ id: it.id, title: it.title, file_url: it.file_url });
                      setOpen(false);
                    }}
                    className="w-full text-left flex items-center gap-3 p-2 rounded-lg border hover:bg-muted transition-colors"
                  >
                    {it.cover_image_url ? (
                      <img src={it.cover_image_url} alt="" className="w-12 h-12 rounded object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{it.title}</div>
                      {it.category && (
                        <div className="text-xs text-muted-foreground truncate">{it.category}</div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}