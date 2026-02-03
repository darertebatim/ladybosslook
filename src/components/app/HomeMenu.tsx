import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { wellnessTools, audioTools } from '@/lib/toolsConfig';
import { ToolCard } from '@/components/app/ToolCard';
import { haptic } from '@/lib/haptics';

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
      <SheetContent side="left" className="w-[300px] p-0 overflow-y-auto">
        <SheetHeader className="p-4 pb-2">
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>
        
        <div className="px-4 pb-6 space-y-6">
          {/* Wellness Tools */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Wellness Tools
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

          {/* Audio & Video */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Audio & Video
            </h3>
            <div className="grid grid-cols-3 gap-4 justify-items-center">
              {audioTools.filter(t => !t.hidden).map(tool => (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool.route, tool.comingSoon)}
                >
                  <ToolCard tool={tool} size="compact" />
                </button>
              ))}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
