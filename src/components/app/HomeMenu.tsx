import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Compass, Music, Users, MessageCircle, Headset } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { wellnessTools } from '@/lib/toolsConfig';
import { ToolCard } from '@/components/app/ToolCard';
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
  { id: 'explore', name: 'Explore', icon: <Compass className="h-5 w-5" />, route: '/app/player', color: 'text-violet-600 bg-violet-100' },
  { id: 'listen', name: 'Listen', icon: <Music className="h-5 w-5" />, route: '/app/inspire', color: 'text-rose-600 bg-rose-100' },
  { id: 'channels', name: 'Channels', icon: <Users className="h-5 w-5" />, route: '/app/feed', color: 'text-teal-600 bg-teal-100' },
  { id: 'chat', name: 'Chat', icon: <MessageCircle className="h-5 w-5" />, route: '/app/chat', color: 'text-blue-600 bg-blue-100' },
  { id: 'support', name: 'Support', icon: <Headset className="h-5 w-5" />, route: '/app/chat', color: 'text-amber-600 bg-amber-100' },
];

export function HomeMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleToolClick = (route: string, comingSoon?: boolean) => {
    if (comingSoon) {
      haptic.light();
      return;
    }
    haptic.light();
    setOpen(false);
    navigate(route);
  };

  const handleNavClick = (route: string) => {
    haptic.light();
    setOpen(false);
    navigate(route);
  };

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
      <SheetContent side="left" className="w-[280px] p-0 overflow-y-auto">
        <SheetHeader className="p-4 pb-2 border-b border-border/50">
          <SheetTitle className="text-left text-base">Menu</SheetTitle>
        </SheetHeader>
        
        <div className="px-3 py-4 space-y-5">
          {/* Navigation Pages */}
          <section>
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Navigate
            </h3>
            <div className="flex flex-wrap gap-2">
              {navPages.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.route)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-full',
                    'text-sm font-medium transition-all active:scale-95',
                    item.color
                  )}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Wellness Tools */}
          <section>
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              Tools
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {wellnessTools.filter(t => !t.hidden).map(tool => (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool.route, tool.comingSoon)}
                  className="text-left"
                >
                  <ToolCard tool={tool} size="default" />
                </button>
              ))}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
