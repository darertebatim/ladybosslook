import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, Compass, Music, Users, MessageCircle,
  BookOpen, Wind, Droplets, HeartHandshake, Heart, Sparkles, GraduationCap, User
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  route: string;
  color: string;
}

const navPages: NavItem[] = [
  { id: 'explore', name: 'Explore', icon: <Compass className="h-4 w-4" />, route: '/app/player', color: 'text-violet-600 bg-violet-100' },
  { id: 'listen', name: 'Listen', icon: <Music className="h-4 w-4" />, route: '/app/inspire', color: 'text-rose-600 bg-rose-100' },
  { id: 'channels', name: 'Channels', icon: <Users className="h-4 w-4" />, route: '/app/feed', color: 'text-teal-600 bg-teal-100' },
  { id: 'chat', name: 'Chat', icon: <MessageCircle className="h-4 w-4" />, route: '/app/chat', color: 'text-blue-600 bg-blue-100' },
];

const toolItems: NavItem[] = [
  { id: 'journal', name: 'Journal', icon: <BookOpen className="h-4 w-4" />, route: '/app/journal', color: 'text-orange-600 bg-orange-100' },
  { id: 'breathe', name: 'Breathe', icon: <Wind className="h-4 w-4" />, route: '/app/breathe', color: 'text-teal-600 bg-teal-100' },
  { id: 'water', name: 'Water', icon: <Droplets className="h-4 w-4" />, route: '/app/water', color: 'text-blue-600 bg-blue-100' },
  { id: 'emotions', name: 'Emotions', icon: <HeartHandshake className="h-4 w-4" />, route: '/app/emotion', color: 'text-violet-600 bg-violet-100' },
  { id: 'period', name: 'Period', icon: <Heart className="h-4 w-4" />, route: '/app/period', color: 'text-pink-600 bg-pink-100' },
  { id: 'routines', name: 'Routines', icon: <Sparkles className="h-4 w-4" />, route: '/app/routines', color: 'text-emerald-600 bg-emerald-100' },
];

const accountItems: NavItem[] = [
  { id: 'programs', name: 'My Programs', icon: <GraduationCap className="h-4 w-4" />, route: '/app/programs', color: 'text-amber-600 bg-amber-100' },
  { id: 'profile', name: 'My Profile', icon: <User className="h-4 w-4" />, route: '/app/profile', color: 'text-slate-600 bg-slate-100' },
];

export function HomeMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleNavClick = (route: string) => {
    haptic.light();
    setOpen(false);
    navigate(route);
  };

  const renderPills = (items: NavItem[]) => (
    <div className="flex flex-wrap gap-2">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => handleNavClick(item.route)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
            'text-[13px] font-medium transition-all active:scale-95',
            item.color
          )}
        >
          {item.icon}
          <span>{item.name}</span>
        </button>
      ))}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button 
          className="p-2 -ml-2 text-foreground/70 hover:text-foreground transition-colors"
          onClick={() => haptic.light()}
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[260px] p-0 overflow-y-auto">
        <SheetHeader className="p-4 pb-3 border-b border-border/40">
          <SheetTitle className="text-left text-base font-semibold">Menu</SheetTitle>
        </SheetHeader>
        
        <div className="px-4 py-4 space-y-5">
          {/* Navigation Pages */}
          <section>
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Navigate
            </h3>
            {renderPills(navPages)}
          </section>

          {/* Tools */}
          <section>
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Tools
            </h3>
            {renderPills(toolItems)}
          </section>

          {/* Account */}
          <section>
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Account
            </h3>
            {renderPills(accountItems)}
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
