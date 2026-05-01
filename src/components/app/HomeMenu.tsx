import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, Compass, Music, Users, Headset,
  BookOpen, Wind, Droplets, HeartHandshake, Heart, CalendarPlus, GraduationCap, User, HelpCircle, LogOut, Zap, Settings, Moon, Sun, Languages
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { haptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { PushPermissionDot } from '@/components/app/PushPermissionDot';
import { useTranslation } from 'react-i18next';
import { setAppLanguage, type SupportedLanguage } from '@/i18n';
interface NavItem {
  id: string;
  /** i18n key under `menu.items.*` */
  nameKey: string;
  icon: React.ReactNode;
  route: string;
  color: string;
}

const navPages: NavItem[] = [
  { id: 'explore', nameKey: 'explore', icon: <Compass className="h-4 w-4" />, route: '/app/player', color: 'text-violet-600 bg-violet-100' },
  { id: 'listen', nameKey: 'listen', icon: <Music className="h-4 w-4" />, route: '/app/listen', color: 'text-rose-600 bg-rose-100' },
  { id: 'channels', nameKey: 'chats', icon: <Users className="h-4 w-4" />, route: '/app/feed', color: 'text-teal-600 bg-teal-100' },
  { id: 'chat', nameKey: 'support', icon: <Headset className="h-4 w-4" />, route: '/app/chat', color: 'text-orange-600 bg-orange-100' },
];

const toolItems: NavItem[] = [
  { id: 'reflections', nameKey: 'reflections', icon: <BookOpen className="h-4 w-4" />, route: '/app/reflections', color: 'text-orange-600 bg-orange-100' },
  { id: 'mood', nameKey: 'mood', icon: <Heart className="h-4 w-4" />, route: '/app/mood', color: 'text-yellow-600 bg-yellow-100' },
  { id: 'breathe', nameKey: 'breathe', icon: <Wind className="h-4 w-4" />, route: '/app/breathe', color: 'text-teal-600 bg-teal-100' },
  { id: 'water', nameKey: 'water', icon: <Droplets className="h-4 w-4" />, route: '/app/water', color: 'text-blue-600 bg-blue-100' },
  { id: 'emotions', nameKey: 'emotions', icon: <HeartHandshake className="h-4 w-4" />, route: '/app/emotion', color: 'text-violet-600 bg-violet-100' },
  { id: 'period', nameKey: 'period', icon: <Heart className="h-4 w-4" />, route: '/app/period', color: 'text-pink-600 bg-pink-100' },
  { id: 'fasting', nameKey: 'fasting', icon: <Zap className="h-4 w-4" />, route: '/app/fasting', color: 'text-amber-600 bg-amber-100' },
  { id: 'routines', nameKey: 'routines', icon: <CalendarPlus className="h-4 w-4" />, route: '/app/routines', color: 'text-emerald-600 bg-emerald-100' },
];

const accountItems: NavItem[] = [
  { id: 'programs', nameKey: 'myPrograms', icon: <GraduationCap className="h-4 w-4" />, route: '/app/myprograms', color: 'text-amber-600 bg-amber-100' },
  { id: 'profile', nameKey: 'myProfile', icon: <User className="h-4 w-4" />, route: '/app/myprofile', color: 'text-slate-600 bg-slate-100' },
  { id: 'settings', nameKey: 'settings', icon: <Settings className="h-4 w-4" />, route: '/app/settings', color: 'text-gray-600 bg-gray-100' },
];

interface HomeMenuProps {
  onStartTour?: () => void;
}

export function HomeMenu({ onStartTour }: HomeMenuProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language?.startsWith('fa') ? 'fa' : 'en') as SupportedLanguage;
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  useEffect(() => {
    const saved = localStorage.getItem('rilo_theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  }, []);

  const toggleDarkMode = () => {
    haptic.light();
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('rilo_theme', next ? 'dark' : 'light');
  };

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

  const handleLangChange = (lang: SupportedLanguage) => {
    if (lang === currentLang) return;
    haptic.light();
    setAppLanguage(lang);
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
          <span>{t(`menu.items.${item.nameKey}`)}</span>
        </button>
      ))}
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button 
          className="relative p-2 -ml-2 text-foreground hover:text-foreground transition-colors"
          onClick={() => haptic.light()}
        >
          <Menu className="h-5 w-5" />
          <PushPermissionDot className="top-1.5 right-1.5" />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[260px] p-0 overflow-y-auto" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <SheetHeader className="p-4 pb-3 border-b border-border/40">
          <SheetTitle className="text-left text-base font-semibold">{t('menu.title')}</SheetTitle>
        </SheetHeader>
        
        <div className="px-4 py-4 space-y-5">
          {/* Navigation Pages */}
          <section>
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {t('menu.navigate')}
            </h3>
            {renderPills(navPages)}
          </section>

          {/* Tools */}
          <section>
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {t('menu.tools')}
            </h3>
            {renderPills(toolItems)}
          </section>

          {/* Account */}
          <section>
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {t('menu.account')}
            </h3>
            {renderPills(accountItems)}
          </section>

          {/* Language toggle — EN / فا */}
          <section className="pt-2 border-t border-border/40">
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Languages className="h-3.5 w-3.5" />
              {t('menu.language')}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleLangChange('en')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                  'text-[13px] font-medium transition-all active:scale-95',
                  currentLang === 'en'
                    ? 'text-white bg-[#1a1f3d]'
                    : 'text-slate-700 bg-slate-100'
                )}
              >
                <span className="text-[13px] leading-none">🇺🇸</span>
                <span>English</span>
              </button>
              <button
                onClick={() => handleLangChange('fa')}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                  'text-[13px] font-medium transition-all active:scale-95',
                  currentLang === 'fa'
                    ? 'text-white bg-[#1a1f3d]'
                    : 'text-slate-700 bg-slate-100'
                )}
              >
                <span className="text-[13px] leading-none">🇮🇷</span>
                <span className="font-farsi">فارسی</span>
              </button>
            </div>
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
                <span>{t('menu.takeTour')}</span>
              </button>
            </section>
          )}

          {/* Dark Mode Toggle */}
          <section className="pt-2 border-t border-border/40">
            <button
              onClick={toggleDarkMode}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                'text-[13px] font-medium transition-all active:scale-95',
                isDark
                  ? 'text-amber-600 bg-amber-100'
                  : 'text-indigo-600 bg-indigo-100'
              )}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              <span>{isDark ? t('menu.lightMode') : t('menu.darkMode')}</span>
            </button>
          </section>

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
              <span>{t('menu.signOut')}</span>
            </button>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
