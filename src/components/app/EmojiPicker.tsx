import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { FluentEmoji } from '@/components/ui/FluentEmoji';

// Curated emoji categories for task planner (~300 emojis)
const EMOJI_CATEGORIES = {
  common: [
    '☀️', '🎯', '💪', '❤️', '⭐', '✨', '📖', '✏️', '☕', '💧',
    '🕐', '📅', '🔔', '✅', '⭕', '🔥', '⚡', '🌟', '💡', '🎉',
    '🏅', '🎖️', '🏆', '🥇', '📌', '🔗', '🔒', '🔓', '💎', '🪄',
  ],
  wellness: [
    '🧘', '🍎', '👶', '🛁', '🛏️', '🧠', '🌸', '🤲', '🌿', '🌙',
    '🥗', '😊', '🍲', '🌅', '🌇', '🌳', '💨', '🧘‍♀️', '💆', '🏃',
    '🧖', '🩺', '💊', '🫁', '🫀', '🦷', '👁️', '💤', '🥱', '🧴',
    '🪥', '🧹', '🧼', '🩹', '🌡️', '🥛', '🍵', '🍯', '🥑', '🥦',
    '🥕', '🍇', '🍓', '🫐', '🥝', '🍌', '🥜', '🌰', '🍳', '🥚',
  ],
  work: [
    '💼', '🏢', '🧮', '📊', '📋', '💳', '💵', '📄', '📂', '💻',
    '✉️', '💬', '📱', '🐷', '📈', '👥', '👛', '🖊️', '📝', '🗂️',
    '🖥️', '⌨️', '🖨️', '📎', '📐', '📏', '🗄️', '📮', '🏷️', '📑',
    '🗓️', '🗒️', '✒️', '🔍', '🧾', '💰', '🏦', '📠', '🗃️', '📧',
  ],
  lifestyle: [
    '🚴', '📚', '📷', '🚗', '🐕', '🎮', '🎁', '🥤', '🎧', '🏠',
    '🔑', '🧳', '🗺️', '🎵', '🎨', '✈️', '🛍️', '🛒', '👕', '🎟️',
    '🏆', '📺', '🍽️', '🍷', '🎸', '🎹', '🎤', '🎬', '🎭', '🎪',
    '🏋️', '🤸', '⛹️', '🏊', '🚶', '🧗', '🏄', '🎣', '🛶', '⛷️',
    '🎿', '🏕️', '⛺', '🏖️', '🌊', '🚲', '🛵', '🏍️', '🚌', '🚂',
    '🛳️', '🎠', '🎡', '🎢', '🏰', '🗼', '🗽', '⛩️', '🕌', '🕍',
  ],
  social: [
    '👋', '🤝', '💑', '👨‍👩‍👧', '🎂', '🎊', '💝', '📞', '👭', '🗣️',
    '💌', '🙏', '🤗', '😍', '🥳', '👏', '🫂', '💐', '🌹', '🎀',
    '🍰', '🧁', '🎈', '🪅', '🎇', '🎆', '💒', '👰', '🤵', '👪',
  ],
  animals: [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
    '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦅', '🦉',
    '🦋', '🐛', '🐝', '🐞', '🦀', '🐙', '🐬', '🐳', '🦈', '🐊',
    '🦕', '🦖', '🐢', '🐍', '🦎', '🦩', '🦚', '🐿️', '🦔', '🐾',
  ],
  nature: [
    '🌍', '🌎', '🌏', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓',
    '☁️', '🌧️', '⛈️', '🌈', '❄️', '🌊', '🌺', '🌻', '🌼', '🌷',
    '🌱', '🪴', '🌵', '🍀', '🍁', '🍂', '🍃', '🌾', '💐', '🪻',
  ],
  objects: [
    '⏰', '🔧', '🔨', '🪛', '🧲', '🪜', '🧯', '🛡️', '🗡️', '⚙️',
    '🧪', '🔬', '🔭', '📡', '🛸', '🚀', '🎯', '🧩', '🎲', '♟️',
    '🪁', '🧸', '🪆', '🖼️', '🪞', '🪟', '🛋️', '🪑', '🚪', '🪣',
  ],
};

// All emojis flattened with duplicates removed
const ALL_EMOJIS = [...new Set(Object.values(EMOJI_CATEGORIES).flat())];

interface EmojiPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedEmoji: string;
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({
  open,
  onOpenChange,
  selectedEmoji,
  onSelect,
}: EmojiPickerProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES | 'all'>('common');

  const filteredEmojis = useMemo(() => {
    const emojiList = activeCategory === 'all' 
      ? ALL_EMOJIS 
      : EMOJI_CATEGORIES[activeCategory];
    
    if (!search.trim()) return emojiList;
    
    // Basic emoji search by matching characters
    return emojiList.filter(emoji => 
      emoji.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, activeCategory]);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    onOpenChange(false);
    setSearch('');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader className="pb-2">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-bold">Choose Emoji</SheetTitle>
          </div>
        </SheetHeader>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            className="pl-9 rounded-xl bg-muted/50 border-0"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-hide">
          {(['common', 'wellness', 'work', 'lifestyle', 'social', 'animals', 'nature', 'objects', 'all'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                activeCategory === cat
                  ? 'bg-violet-600 text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {cat === 'all' ? 'All' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Emoji grid */}
        <div className="overflow-y-auto h-[calc(100%-140px)] overscroll-contain">
          <div className="grid grid-cols-6 gap-2">
            {filteredEmojis.map((emoji, index) => (
              <button
                key={`${emoji}-${index}`}
                onClick={() => handleSelect(emoji)}
                className={cn(
                  'aspect-square rounded-2xl flex items-center justify-center transition-all active:scale-95',
                  'bg-muted/60 hover:bg-muted',
                  selectedEmoji === emoji && 'bg-violet-100 ring-2 ring-violet-500'
                )}
              >
                <FluentEmoji emoji={emoji} size={28} />
              </button>
            ))}
          </div>
          
          {filteredEmojis.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No emojis found
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default EmojiPicker;
