import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, Compass, Music, Users, MessageCircle,
  BookOpen, Wind, Droplets, HeartHandshake, Heart, Sparkles, GraduationCap, User, HelpCircle, LogOut, Zap
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
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
  { id: 'mood', name: 'Mood', icon: <Heart className="h-4 w-4" />, route: '/app/mood', color: 'text-yellow-600 bg-yellow-100' },
  { id: 'breathe', name: 'Breathe', icon: <Wind className="h-4 w-4" />, route: '/app/breathe', color: 'text-teal-600 bg-teal-100' },
  { id: 'water', name: 'Water', icon: <Droplets className="h-4 w-4" />, route: '/app/water', color: 'text-blue-600 bg-blue-100' },
  { id: 'emotions', name: 'Emotions', icon: <HeartHandshake className="h-4 w-4" />, route: '/app/emotion', color: 'text-violet-600 bg-violet-100' },
  { id: 'period', name: 'Period', icon: <Heart className="h-4 w-4" />, route: '/app/period', color: 'text-pink-600 bg-pink-100' },
  { id: 'fasting', name: 'Fasting', icon: <Zap className="h-4 w-4" />, route: '/app/fasting', color: 'text-amber-600 bg-amber-100' },
  { id: 'routines', name: 'Rituals', icon: <Sparkles className="h-4 w-4" />, route: '/app/routines', color: 'text-emerald-600 bg-emerald-100' },
];

const accountItems: NavItem[] = [
  { id: 'programs', name: 'My Programs', icon: <GraduationCap className="h-4 w-4" />, route: '/app/programs', color: 'text-amber-600 bg-amber-100' },
  { id: 'profile', name: 'My Profile', icon: <User className="h-4 w-4" />, route: '/app/profile', color: 'text-slate-600 bg-slate-100' },
];

interface HomeMenuProps {
  onStartTour?: () => void;
}

export function HomeMenu({ onStartTour }: HomeMenuProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleNavClick = (route: string) => {
    haptic.light();
    setOpen(false);
    navigate(route);
  };

  const handleSignOut = async () => {
    haptic.medium();
    setOpen(false);
    await signOut();
    navigate('/auth');
  };

  const handleTakeTour = () => {
    haptic.light();
    setOpen(false);
    // Small delay to let menu close animation complete
    setTimeout(() => {
      onStartTour?.();
    }, 200);
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
          className="p-2 -ml-2 text-foreground hover:text-foreground transition-colors"
          onClick={() => haptic.light()}
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[260px] p-0 overflow-y-auto" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
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

          {/* Take Tour Button */}
          {onStartTour && (
            <section className="pt-2 border-t border-border/40">
              <button
                onClick={handleTakeTour}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                  'text-[13px] font-medium transition-all active:scale-95',
                  'text-primary bg-primary/10'
                )}
              >
                <HelpCircle className="h-4 w-4" />
                <span>Take a Tour</span>
              </button>
            </section>
          )}

          {/* Sign Out */}
          <section className="pt-2 border-t border-border/40">
            <button
              onClick={handleSignOut}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                'text-[13px] font-medium transition-all active:scale-95',
                'text-destructive bg-destructive/10'
              )}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
