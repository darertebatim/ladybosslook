import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  LayoutGrid,
  Music,
  Users,
  Headset,
  BookOpen,
  Wind,
  Droplets,
  HeartHandshake,
  Heart,
  CalendarPlus,
  GraduationCap,
  User,
  LogOut,
  Zap,
  Settings,
  Moon,
  Sun,
  Languages,
  Flame,
  ChevronRight,
  Target,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { PushPermissionDot } from "@/components/app/PushPermissionDot";
import { useTranslation } from "react-i18next";
import { useNewHomeData } from "@/hooks/useNewHomeData";
// language change moved to Settings page
interface NavItem {
  id: string;
  /** i18n key under `menu.items.*` */
  nameKey: string;
  icon: React.ReactNode;
  route: string;
  color: string;
}

const navPages: NavItem[] = [
  {
    id: "listen",
    nameKey: "listen",
    icon: <Music className="h-4 w-4" />,
    route: "/app/listen",
    color: "text-rose-600 bg-rose-100",
  },
  {
    id: "channels",
    nameKey: "chats",
    icon: <Users className="h-4 w-4" />,
    route: "/app/feed",
    color: "text-teal-600 bg-teal-100",
  },
  {
    id: "chat",
    nameKey: "support",
    icon: <Headset className="h-4 w-4" />,
    route: "/app/chat",
    color: "text-orange-600 bg-orange-100",
  },
];

const toolItems: NavItem[] = [
  {
    id: "reflections",
    nameKey: "reflections",
    icon: <BookOpen className="h-4 w-4" />,
    route: "/app/reflections",
    color: "text-orange-600 bg-orange-100",
  },
  {
    id: "mood",
    nameKey: "mood",
    icon: <Heart className="h-4 w-4" />,
    route: "/app/mood",
    color: "text-yellow-600 bg-yellow-100",
  },
  {
    id: "breathe",
    nameKey: "breathe",
    icon: <Wind className="h-4 w-4" />,
    route: "/app/breathe",
    color: "text-teal-600 bg-teal-100",
  },
  {
    id: "water",
    nameKey: "water",
    icon: <Droplets className="h-4 w-4" />,
    route: "/app/water",
    color: "text-blue-600 bg-blue-100",
  },
  // Emotions temporarily hidden from burger menu
  // {
  //   id: "emotions",
  //   nameKey: "emotions",
  //   icon: <HeartHandshake className="h-4 w-4" />,
  //   route: "/app/emotion",
  //   color: "text-violet-600 bg-violet-100",
  // },
  {
    id: "period",
    nameKey: "period",
    icon: <Heart className="h-4 w-4" />,
    route: "/app/period",
    color: "text-pink-600 bg-pink-100",
  },
  {
    id: "fasting",
    nameKey: "fasting",
    icon: <Zap className="h-4 w-4" />,
    route: "/app/fasting",
    color: "text-amber-600 bg-amber-100",
  },
  {
    id: "routines",
    nameKey: "routines",
    icon: <CalendarPlus className="h-4 w-4" />,
    route: "/app/routines",
    color: "text-emerald-600 bg-emerald-100",
  },
  {
    id: "selfCareGoals",
    nameKey: "selfCareGoals",
    icon: <Target className="h-4 w-4" />,
    route: "/app/tasksbank",
    color: "text-rose-600 bg-rose-100",
  },
];

// "Tools hub" entry highlighted at the top of the Tools section
const toolsHubItem: NavItem = {
  id: "tools",
  nameKey: "tools",
  icon: <LayoutGrid className="h-4 w-4" />,
  route: "/app/tools",
  color: "text-violet-600 bg-violet-100",
};

const accountItems: NavItem[] = [
  {
    id: "programs",
    nameKey: "myPrograms",
    icon: <GraduationCap className="h-4 w-4" />,
    route: "/app/myprograms",
    color: "text-amber-600 bg-amber-100",
  },
  {
    id: "profile",
    nameKey: "myProfile",
    icon: <User className="h-4 w-4" />,
    route: "/app/myprofile",
    color: "text-slate-600 bg-slate-100",
  },
  {
    id: "settings",
    nameKey: "settings",
    icon: <Settings className="h-4 w-4" />,
    route: "/app/settings",
    color: "text-gray-600 bg-gray-100",
  },
];

export function HomeMenu() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { t } = useTranslation();
  const { streak } = useNewHomeData();
  const [isDark, setIsDark] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const saved = localStorage.getItem("rilo_theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  const toggleDarkMode = () => {
    haptic.light();
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("rilo_theme", next ? "dark" : "light");
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
    navigate("/auth");
  };

  const goToLanguageSettings = () => {
    haptic.light();
    setOpen(false);
    navigate("/app/settings?section=language");
  };

  // Resolve user display name + initial
  const userMeta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const displayName =
    (typeof userMeta.full_name === "string" && userMeta.full_name) ||
    (typeof userMeta.name === "string" && userMeta.name) ||
    (typeof localStorage !== "undefined" &&
      localStorage.getItem("simora_onboarding_nickname")) ||
    user?.email?.split("@")[0] ||
    "Friend";
  const initial = (displayName as string).trim().charAt(0).toUpperCase() || "R";
  const currentStreak = (streak as { current_streak?: number } | null)?.current_streak ?? 0;

  const renderPills = (items: NavItem[]) => (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => handleNavClick(item.route)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
            "text-[13px] font-medium transition-all active:scale-95",
            item.color,
          )}
        >
          {item.icon}
          <span>{t(`menu.items.${item.nameKey}`)}</span>
        </button>
      ))}
    </div>
  );

  const renderToolGrid = (items: NavItem[]) => (
    <div className="grid grid-cols-4 gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => handleNavClick(item.route)}
          className={cn(
            "flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl",
            "transition-all active:scale-95",
            item.color,
          )}
        >
          <span className="[&>svg]:h-5 [&>svg]:w-5">{item.icon}</span>
          <span className="text-[10px] font-semibold leading-tight text-center px-1">
            {t(`menu.items.${item.nameKey}`)}
          </span>
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
      <SheetContent
        side="left"
        className="w-[280px] p-0 overflow-y-auto"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{t("menu.title")}</SheetTitle>
        </SheetHeader>

        {/* User card */}
        <button
          onClick={() => handleNavClick("/app/myprofile")}
          className="w-full flex items-center gap-3 p-4 pb-4 border-b border-border/40 text-left active:bg-muted/40 transition-colors"
        >
          <div
            className={cn(
              "h-11 w-11 rounded-full flex items-center justify-center",
              "bg-[hsl(var(--brand-primary))] text-white text-base font-bold shrink-0",
            )}
          >
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold text-foreground truncate">
              {displayName as string}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full">
                <Flame className="h-3 w-3" />
                {currentStreak}
              </span>
              <span className="text-[11px] text-muted-foreground truncate">
                {t("menu.viewProfile")}
              </span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>

        <div className="px-4 py-4 space-y-5">
          {/* Navigation Pages */}
          <section>
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {t("menu.navigate")}
            </h3>
            {renderPills(navPages)}
          </section>

          {/* Tools — icon grid */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                {t("menu.tools")}
              </h3>
              <button
                onClick={() => handleNavClick(toolsHubItem.route)}
                className="text-[11px] font-semibold text-[hsl(var(--brand-primary))] active:opacity-70"
              >
                {t("menu.viewAll")}
              </button>
            </div>
            {renderToolGrid(toolItems)}
          </section>

          {/* Account */}
          <section>
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              {t("menu.account")}
            </h3>
            {renderPills(accountItems)}
          </section>

          {/* Language — links to Settings */}
          <section className="pt-2 border-t border-border/40">
            <button
              onClick={goToLanguageSettings}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                "text-[13px] font-medium transition-all active:scale-95",
                "text-slate-700 bg-slate-100",
              )}
            >
              <Languages className="h-4 w-4" />
              <span>{t("menu.language")}</span>
            </button>
          </section>
          {/* Dark Mode Toggle */}
          <section className="pt-2 border-t border-border/40">
            <button
              onClick={toggleDarkMode}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                "text-[13px] font-medium transition-all active:scale-95",
                isDark
                  ? "text-amber-600 bg-amber-100"
                  : "text-indigo-600 bg-indigo-100",
              )}
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span>{isDark ? t("menu.lightMode") : t("menu.darkMode")}</span>
            </button>
          </section>

          {/* Sign Out */}
          <section className="pt-2 border-t border-border/40">
            <button
              onClick={handleSignOut}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full",
                "text-[13px] font-medium transition-all active:scale-95",
                "text-destructive bg-destructive/10",
              )}
            >
              <LogOut className="h-4 w-4" />
              <span>{t("menu.signOut")}</span>
            </button>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
