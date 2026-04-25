import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  User, Mail, Phone, MapPin, Calendar as CalendarIcon, BookOpen, Wallet,
  Receipt, Pencil, Check, X, TrendingUp, TrendingDown, ChevronRight,
  ChevronDown, Settings, Camera, Globe, Heart, Briefcase, Instagram, Send, MessageSquare
} from 'lucide-react';
import { JournalStats } from '@/components/app/JournalStats';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { BackButton } from '@/components/app/BackButton';
import { useToast } from '@/hooks/use-toast';
import { SEOHead } from '@/components/SEOHead';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { format, startOfMonth } from 'date-fns';
import { useJournalEntries, JournalEntry } from '@/hooks/useJournal';
import { cn } from '@/lib/utils';
import { SubscriptionCard } from '@/components/app/SubscriptionManagement';
import { SyncStatusCard } from '@/components/app/SyncStatusCard';

// Stats Pill Component
const StatPill = ({ label, value, icon: Icon }: { label: string; value: number | string; icon?: React.ComponentType<{ className?: string }> }) => (
  <div className="flex flex-col items-center bg-background/60 dark:bg-background/30 px-4 py-2.5 rounded-xl backdrop-blur-sm min-w-[70px]">
    {Icon && <Icon className="h-4 w-4 text-muted-foreground mb-0.5" />}
    <span className="text-lg font-bold">{value}</span>
    <span className="text-[10px] text-muted-foreground">{label}</span>
  </div>
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

const GENDER_OPTIONS = [
  { value: '', label: 'Prefer not to say' },
  { value: 'female', label: 'Female (She/Her)' },
  { value: 'male', label: 'Male (He/Him)' },
  { value: 'non-binary', label: 'Non-Binary (They/Them)' },
  { value: 'other', label: 'Other' },
];

const RELATIONSHIP_OPTIONS = [
  { value: '', label: 'Prefer not to say' },
  { value: 'single', label: 'Single' },
  { value: 'in-a-relationship', label: 'In a Relationship' },
  { value: 'married', label: 'Married' },
  { value: 'divorced', label: 'Divorced' },
];

const LANGUAGE_OPTIONS = [
  { value: '', label: 'Not set' },
  { value: 'en', label: 'English' },
  { value: 'fa', label: 'فارسی (Persian)' },
  { value: 'ar', label: 'العربية (Arabic)' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'de', label: 'Deutsch' },
  { value: 'tr', label: 'Türkçe' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'zh', label: '中文 (Chinese)' },
];

const GOAL_OPTIONS = [
  'Personal Growth', 'Career', 'Relationships', 'Health', 'Finance',
  'Creativity', 'Mindfulness', 'Leadership', 'Confidence', 'Communication',
];

const AppProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Journal entries for monthly presence
  const { data: journalEntries } = useJournalEntries();
  const daysThisMonth = useMemo(() => calculateMonthlyPresence(journalEntries || []), [journalEntries]);

  // Editable profile state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [editedFields, setEditedFields] = useState({
    full_name: '',
    phone: '',
    city: '',
    country: '',
    gender: '',
    bio: '',
    occupation: '',
    relationship_status: '',
    preferred_language: '',
    goals: [] as string[],
    date_of_birth: null as Date | null,
    social_instagram: '',
    social_telegram: '',
  });

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

  // Initialize edit fields when profile loads
  useEffect(() => {
    if (profile) {
      const p = profile as any;
      setEditedFields({
        full_name: p.full_name || '',
        phone: p.phone || '',
        city: p.city || '',
        country: p.country || '',
        gender: p.gender || '',
        bio: p.bio || '',
        occupation: p.occupation || '',
        relationship_status: p.relationship_status || '',
        preferred_language: p.preferred_language || '',
        goals: p.goals || [],
        date_of_birth: p.date_of_birth ? new Date(p.date_of_birth) : null,
        social_instagram: p.social_instagram || '',
        social_telegram: p.social_telegram || '',
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editedFields.full_name.trim(),
          phone: editedFields.phone.trim(),
          city: editedFields.city.trim(),
          country: editedFields.country.trim(),
          gender: editedFields.gender || null,
          bio: editedFields.bio.trim() || null,
          occupation: editedFields.occupation.trim() || null,
          relationship_status: editedFields.relationship_status || null,
          preferred_language: editedFields.preferred_language || null,
          goals: editedFields.goals.length > 0 ? editedFields.goals : null,
          date_of_birth: editedFields.date_of_birth ? format(editedFields.date_of_birth, 'yyyy-MM-dd') : null,
          social_instagram: editedFields.social_instagram.trim() || null,
          social_telegram: editedFields.social_telegram.trim() || null,
        } as any)
        .eq('id', user.id);
      if (error) throw error;
      toast({ title: 'Profile Updated', description: 'Your profile has been saved successfully' });
      setIsEditing(false);
      refetchProfile();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to save profile', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    const p = profile as any;
    if (p) {
      setEditedFields({
        full_name: p.full_name || '',
        phone: p.phone || '',
        city: p.city || '',
        country: p.country || '',
        gender: p.gender || '',
        bio: p.bio || '',
        occupation: p.occupation || '',
        relationship_status: p.relationship_status || '',
        preferred_language: p.preferred_language || '',
        goals: p.goals || [],
        date_of_birth: p.date_of_birth ? new Date(p.date_of_birth) : null,
        social_instagram: p.social_instagram || '',
        social_telegram: p.social_telegram || '',
      });
    }
    setIsEditing(false);
  };

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

      toast({ title: 'Photo Updated', description: 'Your profile photo has been updated' });
      refetchProfile();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to upload photo', variant: 'destructive' });
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
          toast({ title: 'Error', description: 'Failed to access camera', variant: 'destructive' });
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
        toast({ title: 'File Too Large', description: 'Please select an image under 5MB', variant: 'destructive' });
        return;
      }
      handleAvatarUpload(file);
    }
  };

  const toggleGoal = (goal: string) => {
    setEditedFields(prev => ({
      ...prev,
      goals: prev.goals.includes(goal) ? prev.goals.filter(g => g !== goal) : [...prev.goals, goal],
    }));
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

  const genderLabel = GENDER_OPTIONS.find(o => o.value === (p?.gender || ''))?.label;
  const relationshipLabel = RELATIONSHIP_OPTIONS.find(o => o.value === (p?.relationship_status || ''))?.label;
  const languageLabel = LANGUAGE_OPTIONS.find(o => o.value === (p?.preferred_language || ''))?.label;

  // Helper for info rows in view mode
  const InfoRow = ({ icon: Icon, value, label }: { icon: React.ComponentType<{ className?: string }>; value?: string | null; label?: string }) => {
    if (!value) return null;
    return (
      <div className="flex items-center gap-3 text-sm p-2.5 bg-muted/30 rounded-lg">
        <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <div className="min-w-0 flex-1">
          {label && <p className="text-[10px] text-muted-foreground">{label}</p>}
          <span className="truncate block">{value}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <SEOHead title="Profile - LadyBoss Academy" description="Your profile" />

      {/* Hidden file input for web avatar upload */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

      {/* Hero Header */}
      <header
        className="shrink-0 bg-[#F4ECFE] dark:bg-violet-950/90 rounded-b-3xl shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="pt-3 pb-1 px-4 flex items-center">
          <BackButton to="/app" className="text-foreground" />
          <h1 className="font-semibold text-lg flex-1 text-center mr-8">Profile</h1>
        </div>

        {/* Avatar + Name + Bio */}
        <div className="flex flex-col items-center py-3">
          <button
            onClick={handleAvatarClick}
            disabled={isUploadingAvatar}
            className="relative"
          >
            <Avatar className="h-24 w-24 ring-4 ring-background/50 shadow-lg">
              {avatarUrl && <AvatarImage src={avatarUrl} alt="Profile photo" />}
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            {/* Small camera icon at bottom-right of avatar */}
            <div className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary flex items-center justify-center shadow-md border-2 border-background">
              <Camera className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            {isUploadingAvatar && (
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </button>
          <h2 className="font-bold text-lg mt-3">{p?.full_name || 'User'}</h2>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
          {p?.bio && <p className="text-xs text-muted-foreground mt-1 px-8 text-center line-clamp-2">{p.bio}</p>}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-safe space-y-2 mt-4">

        {/* Edit Profile / Settings buttons */}
        <div className="flex gap-2">
          {!isEditing ? (
            <Button variant="outline" className="flex-1 rounded-2xl h-12" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-2 h-4 w-4" />Edit Profile
            </Button>
          ) : (
            <>
              <Button variant="ghost" className="flex-1 rounded-2xl h-12" onClick={handleCancelEdit} disabled={isSaving}>
                <X className="mr-2 h-4 w-4" />Cancel
              </Button>
              <Button className="flex-1 rounded-2xl h-12" onClick={handleSaveProfile} disabled={isSaving}>
                <Check className="mr-2 h-4 w-4" />{isSaving ? 'Saving...' : 'Save'}
              </Button>
            </>
          )}
          <Button variant="outline" className="flex-1 rounded-2xl h-12" onClick={() => navigate('/app/settings')}>
            <Settings className="mr-2 h-4 w-4" />Settings
          </Button>
        </div>

        {/* Subscription Card */}
        <SubscriptionCard />

        {/* Profile Info Card */}
        <Card className="rounded-2xl shadow-sm border-0 bg-card">
          <CardContent className="space-y-3 pt-4">
            {isEditing ? (
              <>
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Full Name</Label>
                  <Input value={editedFields.full_name} onChange={e => setEditedFields(prev => ({ ...prev, full_name: e.target.value }))} placeholder="Your full name" />
                </div>
                {/* Phone */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <Input value={editedFields.phone} onChange={e => setEditedFields(prev => ({ ...prev, phone: e.target.value }))} placeholder="Your phone number" />
                </div>
                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Date of Birth</Label>
                  <div className="flex gap-2">
                    <select
                      className="flex h-10 flex-1 rounded-md border border-input bg-background px-2 py-2 text-sm"
                      value={editedFields.date_of_birth ? (editedFields.date_of_birth.getMonth() + 1).toString() : ''}
                      onChange={e => {
                        const month = parseInt(e.target.value);
                        if (!month) { setEditedFields(prev => ({ ...prev, date_of_birth: null })); return; }
                        const current = editedFields.date_of_birth || new Date(2000, 0, 1);
                        setEditedFields(prev => ({ ...prev, date_of_birth: new Date(current.getFullYear(), month - 1, current.getDate()) }));
                      }}
                    >
                      <option value="">Month</option>
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{format(new Date(2000, i, 1), 'MMM')}</option>
                      ))}
                    </select>
                    <select
                      className="flex h-10 w-[70px] rounded-md border border-input bg-background px-2 py-2 text-sm"
                      value={editedFields.date_of_birth ? editedFields.date_of_birth.getDate().toString() : ''}
                      onChange={e => {
                        const day = parseInt(e.target.value);
                        if (!day) return;
                        const current = editedFields.date_of_birth || new Date(2000, 0, 1);
                        setEditedFields(prev => ({ ...prev, date_of_birth: new Date(current.getFullYear(), current.getMonth(), day) }));
                      }}
                    >
                      <option value="">Day</option>
                      {Array.from({ length: 31 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                    <select
                      className="flex h-10 w-[90px] rounded-md border border-input bg-background px-2 py-2 text-sm"
                      value={editedFields.date_of_birth ? editedFields.date_of_birth.getFullYear().toString() : ''}
                      onChange={e => {
                        const year = parseInt(e.target.value);
                        if (!year) return;
                        const current = editedFields.date_of_birth || new Date(2000, 0, 1);
                        setEditedFields(prev => ({ ...prev, date_of_birth: new Date(year, current.getMonth(), current.getDate()) }));
                      }}
                    >
                      <option value="">Year</option>
                      {Array.from({ length: 100 }, (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return <option key={year} value={year}>{year}</option>;
                      })}
                    </select>
                  </div>
                </div>
                {/* Gender */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Gender / Pronouns</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={editedFields.gender} onChange={e => setEditedFields(prev => ({ ...prev, gender: e.target.value }))}>
                    {GENDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                {/* City */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">City</Label>
                  <Input value={editedFields.city} onChange={e => setEditedFields(prev => ({ ...prev, city: e.target.value }))} placeholder="Your city" />
                </div>
                {/* Country */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Country</Label>
                  <Input value={editedFields.country} onChange={e => setEditedFields(prev => ({ ...prev, country: e.target.value }))} placeholder="Your country" />
                </div>
                {/* Occupation */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Occupation</Label>
                  <Input value={editedFields.occupation} onChange={e => setEditedFields(prev => ({ ...prev, occupation: e.target.value }))} placeholder="Your occupation" />
                </div>
                {/* Relationship Status */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Relationship Status</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={editedFields.relationship_status} onChange={e => setEditedFields(prev => ({ ...prev, relationship_status: e.target.value }))}>
                    {RELATIONSHIP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                {/* Language */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Second Language</Label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={editedFields.preferred_language} onChange={e => setEditedFields(prev => ({ ...prev, preferred_language: e.target.value }))}>
                    {LANGUAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                {/* Goals */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Goals</Label>
                  <div className="flex flex-wrap gap-2">
                    {GOAL_OPTIONS.map(goal => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => toggleGoal(goal)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                          editedFields.goals.includes(goal) ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Bio */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Bio</Label>
                  <Textarea value={editedFields.bio} onChange={e => setEditedFields(prev => ({ ...prev, bio: e.target.value }))} placeholder="Tell us about yourself..." rows={3} />
                </div>
                {/* Instagram */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Instagram</Label>
                  <Input value={editedFields.social_instagram} onChange={e => setEditedFields(prev => ({ ...prev, social_instagram: e.target.value }))} placeholder="@username" />
                </div>
                {/* Telegram */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Telegram</Label>
                  <Input value={editedFields.social_telegram} onChange={e => setEditedFields(prev => ({ ...prev, social_telegram: e.target.value }))} placeholder="@username" />
                </div>
              </>
            ) : (
              <>
                <InfoRow icon={Mail} value={p?.email || user?.email} label="Email" />
                <InfoRow icon={User} value={p?.full_name} label="Name" />
                <InfoRow icon={Phone} value={p?.phone} label="Phone" />
                <InfoRow icon={CalendarIcon} value={p?.date_of_birth ? format(new Date(p.date_of_birth), 'PPP') : undefined} label="Date of Birth" />
                <InfoRow icon={User} value={genderLabel && genderLabel !== 'Prefer not to say' ? genderLabel : undefined} label="Gender" />
                <InfoRow icon={MapPin} value={[p?.city, p?.country].filter(Boolean).join(', ') || undefined} label="Location" />
                <InfoRow icon={Briefcase} value={p?.occupation} label="Occupation" />
                <InfoRow icon={Heart} value={relationshipLabel && relationshipLabel !== 'Prefer not to say' ? relationshipLabel : undefined} label="Relationship" />
                <InfoRow icon={Globe} value={languageLabel && languageLabel !== 'Not set' ? languageLabel : undefined} label="Second Language" />
                <InfoRow icon={Globe} value={p?.timezone || undefined} label="Timezone" />
                {p?.goals && p.goals.length > 0 && (
                  <div className="p-2.5 bg-muted/30 rounded-lg">
                    <p className="text-[10px] text-muted-foreground mb-1.5">Goals</p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.goals.map((g: string) => (
                        <Badge key={g} variant="secondary" className="text-xs">{g}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <InfoRow icon={Instagram} value={p?.social_instagram ? `@${p.social_instagram.replace('@', '')}` : undefined} label="Instagram" />
                <InfoRow icon={Send} value={p?.social_telegram ? `@${p.social_telegram.replace('@', '')}` : undefined} label="Telegram" />

                {!p?.full_name && !p?.phone && !p?.bio && (
                  <p className="text-sm text-muted-foreground p-2 text-center">Tap "Edit Profile" to add your details</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Journal Stats */}
        <Collapsible open={openSections.has('journal')} onOpenChange={() => toggleSection('journal')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card rounded-2xl shadow-sm active:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium text-sm">Journal Stats</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${openSections.has('journal') ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1">
            <JournalStats className="rounded-2xl shadow-sm border-0" />
          </CollapsibleContent>
        </Collapsible>

        {/* My Programs */}
        <Collapsible open={openSections.has('programs')} onOpenChange={() => toggleSection('programs')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card rounded-2xl shadow-sm active:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium text-sm">My Programs</span>
            </div>
            <div className="flex items-center gap-2">
              {programCount > 0 && <Badge variant="secondary" className="text-xs">{programCount}</Badge>}
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${openSections.has('programs') ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1">
            <Card className="rounded-2xl shadow-sm border-0 bg-card">
              <CardContent className="pt-4">
                {enrollments && enrollments.length > 0 ? (
                  <div className="space-y-2">
                    {enrollments.map((enrollment) => (
                      <Link key={enrollment.id} to={`/app/myprograms/${enrollment.program_slug || enrollment.course_name}`} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl active:bg-muted/50 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{enrollment.course_name}</p>
                          <p className="text-xs text-muted-foreground">Enrolled {format(new Date(enrollment.enrolled_at), 'MMM d, yyyy')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">{(enrollment.program_rounds as any)?.status || 'active'}</Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No courses yet</p>
                    <Button variant="link" size="sm" asChild><Link to="/app/store">Browse Programs</Link></Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Wallet & Credits */}
        <Collapsible open={openSections.has('wallet')} onOpenChange={() => toggleSection('wallet')}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card rounded-2xl shadow-sm active:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium text-sm">Wallet & Credits</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">${creditBalance}</span>
              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${openSections.has('wallet') ? 'rotate-180' : ''}`} />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1">
            <Card className="rounded-2xl shadow-sm border-0 bg-card">
              <CardContent className="space-y-3 pt-4">
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl">
                  <div>
                    <p className="text-xs text-muted-foreground">Current Balance</p>
                    <p className="text-2xl font-bold">{wallet?.credits_balance || 0} Credits</p>
                  </div>
                  <Wallet className="h-8 w-8 text-primary/30" />
                </div>
                {transactions && transactions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Recent Transactions</p>
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between py-2 px-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2">
                          {tx.amount > 0 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                          <span className="text-sm truncate max-w-[140px]">{tx.description || tx.transaction_type}</span>
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
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-card rounded-2xl shadow-sm active:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Receipt className="h-4 w-4 text-primary" />
              </div>
              <span className="font-medium text-sm">Order History</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${openSections.has('orders') ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1">
            <Card className="rounded-2xl shadow-sm border-0 bg-card">
              <CardContent className="pt-4">
                {orders && orders.length > 0 ? (
                  <div className="space-y-2">
                    {orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{order.product_name}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(order.created_at), 'MMM d, yyyy')}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-sm font-medium">{formatCurrency(order.amount, order.currency || 'usd')}</span>
                          <Badge variant={getStatusBadgeVariant(order.status || 'completed')}>
                            {order.refunded ? 'Refunded' : (order.status || 'Completed')}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Receipt className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No orders yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Settings Button */}
        <button
          onClick={() => navigate('/app/settings')}
          className="flex items-center justify-between w-full p-4 bg-card rounded-2xl shadow-sm active:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
              <Settings className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="font-medium text-sm">Settings</span>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </button>

      </div>
    </div>
  );
};

export default AppProfile;
