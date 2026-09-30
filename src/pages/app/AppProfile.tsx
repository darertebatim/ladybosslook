import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  User, Mail, Phone, MapPin, Calendar as CalendarIcon, BookOpen, Wallet,
  Receipt, Pencil, TrendingUp, TrendingDown, ChevronRight,
  ChevronDown, Settings, Camera, Globe, Heart, Briefcase, Instagram, Send, MessageSquare, Sparkles, Plus
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { PageHeader } from '@/components/app/ui/PageHeader';
import { IOSIconButton } from '@/components/app/ui/IOSIconButton';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { format, startOfMonth } from 'date-fns';
import { useJournalEntries, JournalEntry } from '@/hooks/useJournal';
import { SubscriptionCard } from '@/components/app/SubscriptionManagement';
import { SyncStatusCard } from '@/components/app/SyncStatusCard';
import { LinkPaymentEmailSheet } from '@/components/app/LinkPaymentEmailSheet';
import { EditProfileSheet, GENDER_OPTIONS, RELATIONSHIP_OPTIONS, LANGUAGE_OPTIONS } from '@/components/app/EditProfileSheet';

// Stats Pill Component — used in the hero stats row.
const StatPill = ({ label, value, icon: Icon }: { label: string; value: number | string; icon?: React.ComponentType<{ className?: string }> }) => (
  <div className="flex-1 flex flex-col items-center justify-center bg-card-warm rounded-2xl shadow-card-warm px-3 py-3">
    {Icon && <Icon className="h-4 w-4 text-[hsl(var(--brand-primary))] mb-1" />}
    <span className="text-xl font-bold text-[hsl(var(--fg-warm))] leading-none">{value}</span>
    <span className="text-[10px] text-[hsl(var(--fg-warm-muted))] mt-1">{label}</span>
  </div>
);

// Small detail pill for the compact profile header (Presence-card style).
const HeaderInfoPill = ({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[hsl(var(--tint-peach))]/60 text-[11px] text-[hsl(var(--fg-warm))] font-medium max-w-full">
    <Icon className="h-3 w-3 shrink-0 text-[hsl(var(--brand-primary))]" />
    <span className="truncate">{text}</span>
  </span>
);

const calculateMonthlyPresence = (entries: JournalEntry[]): number => {
  if (!entries || entries.length === 0) return 0;
  const now = new Date();
  const monthStart = startOfMonth(now);
  const uniqueDays = new Set<string>();
  entries.forEach(entry => {
    const entryDate = new Date(entry.created_at);
    if (entryDate >= monthStart) uniqueDays.add(format(entryDate, 'yyyy-MM-dd'));
  });
  return uniqueDays.size;
};


const AppProfile = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Journal entries for monthly presence
  const { data: journalEntries } = useJournalEntries();
  const daysThisMonth = useMemo(() => calculateMonthlyPresence(journalEntries || []), [journalEntries]);

  // Edit profile sheet
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Accordion
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  const toggleSection = useCallback((id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user?.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Linked purchase emails
  const [linkEmailOpen, setLinkEmailOpen] = useState(false);
  const { data: linkedEmails } = useQuery({
    queryKey: ['linked-purchase-emails', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('account_email_aliases')
        .select('id, email')
        .eq('primary_user_id', user?.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });



  const { data: enrollments } = useQuery({
    queryKey: ['profile-enrollments', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('course_enrollments').select('*, program_rounds(round_name, status)').eq('user_id', user?.id).eq('status', 'active').order('enrolled_at', { ascending: false }).limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: wallet } = useQuery({
    queryKey: ['profile-wallet', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('user_wallets').select('credits_balance').eq('user_id', user?.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: transactions } = useQuery({
    queryKey: ['profile-transactions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('credit_transactions').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(5);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: orders } = useQuery({
    queryKey: ['profile-orders', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from('orders').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(10);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });



  const handleAvatarUpload = async (rawFile: File) => {
    if (!user?.id) return;
    setIsUploadingAvatar(true);
    try {
      // Crop to centered square and resize to 512x512
      const { cropImageToSquare } = await import('@/lib/cropImageToSquare');
      const file = await cropImageToSquare(rawFile, 512);
      const filePath = `${user.id}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlWithCacheBust } as any)
        .eq('id', user.id);
      if (updateError) throw updateError;

      toast({ title: t('profile.toasts.photoUpdated'), description: t('profile.toasts.photoUpdatedDesc') });
      refetchProfile();
    } catch (error: any) {
      toast({ title: t('profile.toasts.error'), description: error.message || t('profile.toasts.uploadFailed'), variant: 'destructive' });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarClick = async () => {
    if (Capacitor.isNativePlatform()) {
      try {
        const { Camera: CapCamera, CameraResultType, CameraSource } = await import('@capacitor/camera');
        const image = await CapCamera.getPhoto({
          quality: 85,
          allowEditing: true,
          resultType: CameraResultType.Uri,
          source: CameraSource.Prompt,
          width: 512,
          height: 512,
        });
        if (image.webPath) {
          const response = await fetch(image.webPath);
          const blob = await response.blob();
          const file = new File([blob], `avatar.${image.format || 'jpg'}`, { type: `image/${image.format || 'jpeg'}` });
          await handleAvatarUpload(file);
        }
      } catch (error: any) {
        if (error.message !== 'User cancelled photos app') {
          toast({ title: t('profile.toasts.error'), description: t('profile.toasts.cameraFailed'), variant: 'destructive' });
        }
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: t('profile.toasts.fileTooLarge'), description: t('profile.toasts.fileTooLargeDesc'), variant: 'destructive' });
        return;
      }
      handleAvatarUpload(file);
    }
  };


  const formatCurrency = (amount: number, currency: string = 'usd') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amount / 100);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'refunded': return 'destructive';
      case 'pending': return 'secondary';
      default: return 'outline' as const;
    }
  };

  const p = profile as any;
  const initials = p?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || user?.email?.[0].toUpperCase() || 'U';
  const programCount = enrollments?.length || 0;
  const creditBalance = wallet?.credits_balance || 0;
  const avatarUrl = p?.avatar_url;

  const genderLabel = (() => { const o = GENDER_OPTIONS.find(o => o.value === (p?.gender || '')); return o ? t(o.labelKey) : undefined; })();
  const relationshipLabel = (() => { const o = RELATIONSHIP_OPTIONS.find(o => o.value === (p?.relationship_status || '')); return o ? t(o.labelKey) : undefined; })();
  const languageLabel = (() => { const o = LANGUAGE_OPTIONS.find(o => o.value === (p?.preferred_language || '')); return o ? (o.labelKey ? t(o.labelKey) : o.label) : undefined; })();

  // Compact header detail pills (Presence-card style)
  const locationLabel = [p?.city, p?.country].filter(Boolean).join(', ') || null;
  const timezoneLabel = p?.timezone
    ? p.timezone.replace(/_/g, ' ').replace('America/', '').replace('Europe/', '').replace('Asia/', '')
    : null;
  const birthdayLabel = (() => {
    if (!p?.date_of_birth) return null;
    try {
      return new Date(p.date_of_birth + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return null; }
  })();
  const relationshipLabelCompact = p?.relationship_status || null;

  // Helper for info rows in view mode
  const InfoRow = ({ icon: Icon, value, label }: { icon: React.ComponentType<{ className?: string }>; value?: string | null; label?: string }) => {
    if (!value) return null;
    return (
      <div className="flex items-center gap-3 text-sm px-3 py-2.5 bg-[hsl(var(--tint-peach))]/35 rounded-xl">
        <div className="h-8 w-8 rounded-lg bg-white/70 dark:bg-white/10 flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
        </div>
        <div className="min-w-0 flex-1">
          {label && <p className="text-[10px] text-[hsl(var(--fg-warm-muted))]">{label}</p>}
          <span className="truncate block text-[hsl(var(--fg-warm))] font-medium">{value}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <SEOHead title="Profile - LadyBoss Academy" description="Your profile" />

      {/* Hidden file input for web avatar upload */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

      {/* Glassy iOS 18 header */}
      <PageHeader
        title={t('profile.title')}
        back
        right={
          <IOSIconButton onClick={() => navigate('/app/settings')} aria-label={t('profile.settings')}>
            <Settings className="h-5 w-5" />
          </IOSIconButton>
        }
      />

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-safe space-y-3 pt-3">

        {/* Compact identity card with integrated linked accounts */}
        <div className="relative rounded-3xl bg-card-warm shadow-card-warm p-4">
          {/* Edit profile pen */}
          <button
            onClick={() => setEditSheetOpen(true)}
            aria-label={t('profile.editProfile')}
            className="absolute top-3 right-3 h-9 w-9 rounded-full bg-bg-warm flex items-center justify-center shadow-ios active:scale-90 transition-transform"
          >
            <Pencil className="h-3.5 w-3.5 text-[hsl(var(--fg-warm-muted))]" />
          </button>
          {/* Identity row */}
          <div className="flex items-center gap-3.5">
            <button
              onClick={handleAvatarClick}
              disabled={isUploadingAvatar}
              className="relative shrink-0 active:scale-95 transition-transform"
              aria-label="Change profile photo"
            >
              <Avatar className="h-16 w-16 border-2 border-white shadow-ios">
                {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile photo" />}
                <AvatarFallback className="text-xl font-bold bg-[hsl(var(--tint-peach))] text-[hsl(var(--brand-primary))]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-[hsl(var(--brand-primary))] flex items-center justify-center shadow-ios ring-2 ring-card-warm">
                <Camera className="h-3.5 w-3.5 text-white" />
              </div>
              {isUploadingAvatar && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                  <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-[hsl(var(--fg-warm))] truncate leading-tight">
                {p?.full_name || t('profile.user')}
              </h2>
              <p className="flex items-center gap-1.5 text-xs text-[hsl(var(--fg-warm-muted))] mt-0.5">
                <Mail className="h-3 w-3 shrink-0" />
                <span className="truncate">{user?.email}</span>
              </p>
            </div>
          </div>

          {/* Detail pills */}
          {(locationLabel || timezoneLabel || birthdayLabel || relationshipLabelCompact || p?.bio) && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {locationLabel && <HeaderInfoPill icon={MapPin} text={locationLabel} />}
              {timezoneLabel && <HeaderInfoPill icon={Globe} text={timezoneLabel} />}
              {birthdayLabel && <HeaderInfoPill icon={CalendarIcon} text={birthdayLabel} />}
              {relationshipLabelCompact && <HeaderInfoPill icon={Heart} text={relationshipLabelCompact} />}
              {p?.bio && <HeaderInfoPill icon={MessageSquare} text={p.bio} />}
            </div>
          )}

          {/* Linked accounts */}
          <div className="mt-3.5 pt-3.5 border-t border-[hsl(var(--border-warm))]/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[hsl(var(--fg-warm-muted))]">
                {t('profile.mergeEmails.linkedTitle', 'Linked accounts')}
              </span>
              <button
                onClick={() => setLinkEmailOpen(true)}
                className="flex items-center gap-1 text-xs font-bold text-[hsl(var(--brand-primary))] px-2 py-1.5 -mr-2 rounded-full active:opacity-60"
              >
                <Plus className="h-3.5 w-3.5" />
                {t('profile.mergeEmails.mergeNew', 'Merge new')}
              </button>
            </div>
            {(linkedEmails || []).length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {(linkedEmails || []).map((a: { id: string; email: string }) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-bg-warm border border-[hsl(var(--border-warm))]/60 text-[hsl(var(--fg-warm))]"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-mint shrink-0" />
                    {a.email}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[hsl(var(--fg-warm-muted))] leading-relaxed">
                {t('profile.mergeEmails.hint', 'Have another account or paid with a different email? Add that email here and everything moves into this account.')}
              </p>
            )}
          </div>
        </div>

        <LinkPaymentEmailSheet open={linkEmailOpen} onOpenChange={setLinkEmailOpen} />
        <EditProfileSheet open={editSheetOpen} onOpenChange={setEditSheetOpen} profile={profile} onSaved={refetchProfile} />

        {/* Stats row */}
        <div className="flex gap-2">
          <StatPill
            label="Member since"
            value={user?.created_at ? format(new Date(user.created_at), 'MMM yyyy') : '—'}
            icon={Sparkles}
          />
          <StatPill label={t('profile.sections.programs')} value={programCount} icon={BookOpen} />
          <StatPill label={t('profile.credits')} value={creditBalance} icon={Wallet} />
        </div>

        {/* Edit Profile button */}
        <Button
          className="w-full rounded-full h-12 bg-[hsl(var(--brand-primary))] text-white shadow-ios border-0 active:bg-[hsl(var(--brand-primary-dark))]"
          onClick={() => setEditSheetOpen(true)}
        >
          <Pencil className="mr-2 h-4 w-4" />{t('profile.editProfile')}
        </Button>

        {/* Subscription Card */}
        <SubscriptionCard />

        {/* Profile Info Card */}
        <Card className="rounded-2xl shadow-card-warm border-0 bg-card-warm">
          <CardContent className="space-y-3 pt-4">
            <>
              <InfoRow icon={Mail} value={p?.email || user?.email} label={t('profile.fields.email')} />
              <InfoRow icon={User} value={p?.full_name} label={t('profile.fields.name')} />
              <InfoRow icon={Phone} value={p?.phone} label={t('profile.fields.phone')} />
              <InfoRow icon={CalendarIcon} value={p?.date_of_birth ? format(new Date(p.date_of_birth), 'PPP') : undefined} label={t('profile.fields.dob')} />
              <InfoRow icon={User} value={genderLabel && genderLabel !== t('profile.gender.preferNot') ? genderLabel : undefined} label={t('profile.fields.gender')} />
              <InfoRow icon={MapPin} value={[p?.city, p?.country].filter(Boolean).join(', ') || undefined} label={t('profile.fields.location')} />
              <InfoRow icon={Briefcase} value={p?.occupation} label={t('profile.fields.occupation')} />
              <InfoRow icon={Heart} value={relationshipLabel && relationshipLabel !== t('profile.relationship.preferNot') ? relationshipLabel : undefined} label={t('profile.fields.relationship')} />
              <InfoRow icon={Globe} value={languageLabel && languageLabel !== t('profile.language.notSet') ? languageLabel : undefined} label={t('profile.fields.secondLanguage')} />
              <InfoRow icon={Globe} value={p?.timezone || undefined} label={t('profile.fields.timezone')} />
              {p?.goals && p.goals.length > 0 && (
                <div className="p-2.5 bg-muted/30 rounded-lg">
                  <p className="text-[10px] text-muted-foreground mb-1.5">{t('profile.fields.goals')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.goals.map((g: string) => (
                      <Badge key={g} variant="secondary" className="text-xs">{t(`profile.goalsList.${g}`, g)}</Badge>
                    ))}
                  </div>
                </div>
              )}
              <InfoRow icon={Instagram} value={p?.social_instagram ? `@${p.social_instagram.replace('@', '')}` : undefined} label={t('profile.fields.instagram')} />
              <InfoRow icon={Send} value={p?.social_telegram ? `@${p.social_telegram.replace('@', '')}` : undefined} label={t('profile.fields.telegram')} />

              {!p?.full_name && !p?.phone && !p?.bio && (
                <p className="text-sm text-muted-foreground p-2 text-center">{t('profile.tapEditHint')}</p>
              )}
            </>
          </CardContent>
        </Card>




        {/* Journal Stats */}
        {/* Presence link */}
        <button
          onClick={() => navigate('/app/presence')}
          className="flex items-center justify-between w-full p-4 bg-card-warm rounded-2xl shadow-card-warm active:bg-[hsl(var(--tint-peach))]/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[hsl(var(--tint-peach))] flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
            </div>
            <span className="font-medium text-sm text-[hsl(var(--fg-warm))]">Presence</span>
          </div>
          <ChevronRight className="h-4 w-4 text-[hsl(var(--fg-warm-muted))]" />
        </button>

        {/* My Programs */}
        <Collapsible open={openSections.has('programs')} onOpenChange={() => toggleSection('programs')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card-warm rounded-2xl shadow-card-warm active:bg-[hsl(var(--tint-peach))]/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[hsl(var(--tint-peach))] flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
              </div>
              <span className="font-medium text-sm text-[hsl(var(--fg-warm))]">{t('profile.sections.programs')}</span>
            </div>
            <div className="flex items-center gap-2">
              {programCount > 0 && <Badge variant="secondary" className="text-xs bg-[hsl(var(--tint-peach))] text-[hsl(var(--brand-primary))] border-0">{programCount}</Badge>}
              <ChevronDown className={`h-4 w-4 text-[hsl(var(--fg-warm-muted))] transition-transform duration-200 ${openSections.has('programs') ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1">
            <Card className="rounded-2xl shadow-card-warm border-0 bg-card-warm">
              <CardContent className="pt-4">
                {enrollments && enrollments.length > 0 ? (
                  <div className="space-y-2">
                    {enrollments.map((enrollment) => (
                      <Link key={enrollment.id} to={`/app/myprograms/${enrollment.program_slug || enrollment.course_name}`} className="flex items-center justify-between p-3 bg-[hsl(var(--tint-peach))]/35 rounded-xl active:bg-[hsl(var(--tint-peach))]/60 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate text-[hsl(var(--fg-warm))]">{enrollment.course_name}</p>
                          <p className="text-xs text-[hsl(var(--fg-warm-muted))]">{t('profile.enrolled', { date: format(new Date(enrollment.enrolled_at), 'MMM d, yyyy') })}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{(enrollment.program_rounds as any)?.status || 'active'}</Badge>
                          <ChevronRight className="h-4 w-4 text-[hsl(var(--fg-warm-muted))]" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <BookOpen className="h-8 w-8 mx-auto text-[hsl(var(--fg-warm-muted))] mb-2" />
                    <p className="text-sm text-[hsl(var(--fg-warm-muted))]">{t('profile.noCourses')}</p>
                    <Button variant="link" size="sm" asChild><Link to="/app/store">{t('profile.browsePrograms')}</Link></Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Wallet & Credits */}
        <Collapsible open={openSections.has('wallet')} onOpenChange={() => toggleSection('wallet')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card-warm rounded-2xl shadow-card-warm active:bg-[hsl(var(--tint-peach))]/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[hsl(var(--tint-peach))] flex items-center justify-center">
                <Wallet className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
              </div>
              <span className="font-medium text-sm text-[hsl(var(--fg-warm))]">{t('profile.sections.wallet')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[hsl(var(--fg-warm-muted))] font-medium">${creditBalance}</span>
              <ChevronDown className={`h-4 w-4 text-[hsl(var(--fg-warm-muted))] transition-transform duration-200 ${openSections.has('wallet') ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1">
            <Card className="rounded-2xl shadow-card-warm border-0 bg-card-warm">
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-center justify-between p-4 bg-[hsl(var(--tint-peach))]/40 rounded-xl">
                  <div>
                    <p className="text-xs text-[hsl(var(--fg-warm-muted))]">{t('profile.currentBalance')}</p>
                    <p className="text-2xl font-bold text-[hsl(var(--fg-warm))]">{wallet?.credits_balance || 0} {t('profile.credits')}</p>
                  </div>
                  <Wallet className="h-8 w-8 text-[hsl(var(--brand-primary))]/40" />
                </div>
                {transactions && transactions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[hsl(var(--fg-warm-muted))]">{t('profile.recentTransactions')}</p>
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between py-2 px-3 bg-[hsl(var(--tint-peach))]/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          {tx.amount > 0 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                          <span className="text-sm truncate max-w-[140px] text-[hsl(var(--fg-warm))]">{tx.description || tx.transaction_type}</span>
                        </div>
                        <span className={`text-sm font-medium ${tx.amount > 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Order History */}
        <Collapsible open={openSections.has('orders')} onOpenChange={() => toggleSection('orders')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card-warm rounded-2xl shadow-card-warm active:bg-[hsl(var(--tint-peach))]/40 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-[hsl(var(--tint-peach))] flex items-center justify-center">
                <Receipt className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
              </div>
              <span className="font-medium text-sm text-[hsl(var(--fg-warm))]">{t('profile.sections.orders')}</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-[hsl(var(--fg-warm-muted))] transition-transform duration-200 ${openSections.has('orders') ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1">
            <Card className="rounded-2xl shadow-card-warm border-0 bg-card-warm">
              <CardContent className="pt-4">
                {orders && orders.length > 0 ? (
                  <div className="space-y-2">
                    {orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-[hsl(var(--tint-peach))]/30 rounded-xl">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate text-[hsl(var(--fg-warm))]">{order.product_name}</p>
                          <p className="text-xs text-[hsl(var(--fg-warm-muted))]">{format(new Date(order.created_at), 'MMM d, yyyy')}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm font-medium text-[hsl(var(--fg-warm))]">{formatCurrency(order.amount, order.currency || 'usd')}</span>
                          <Badge variant={getStatusBadgeVariant(order.status || 'completed')}>
                            {order.refunded
                              ? t('profile.refunded')
                              : order.status === 'partially_refunded'
                                ? t('profile.partiallyRefunded', 'Partially refunded')
                                : (order.status || t('profile.completed'))}

                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Receipt className="h-8 w-8 mx-auto text-[hsl(var(--fg-warm-muted))] mb-2" />
                    <p className="text-sm text-[hsl(var(--fg-warm-muted))]">{t('profile.noOrders')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Settings Button */}
        <SyncStatusCard />
        <button
          onClick={() => navigate('/app/settings')}
          className="flex items-center justify-between w-full p-4 bg-card-warm rounded-2xl shadow-card-warm active:bg-[hsl(var(--tint-peach))]/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[hsl(var(--tint-peach))] flex items-center justify-center">
              <Settings className="h-4 w-4 text-[hsl(var(--brand-primary))]" />
            </div>
            <span className="font-medium text-sm text-[hsl(var(--fg-warm))]">{t('profile.settings')}</span>
          </div>
          <ChevronRight className="h-4 w-4 text-[hsl(var(--fg-warm-muted))]" />
        </button>

      </div>
    </div>
  );
};

export default AppProfile;
