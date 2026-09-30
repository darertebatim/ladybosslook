import { useState, useEffect } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { X, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const GENDER_OPTIONS = [
  { value: '', labelKey: 'profile.gender.preferNot' },
  { value: 'female', labelKey: 'profile.gender.female' },
  { value: 'male', labelKey: 'profile.gender.male' },
  { value: 'non-binary', labelKey: 'profile.gender.nonBinary' },
  { value: 'other', labelKey: 'profile.gender.other' },
];

export const RELATIONSHIP_OPTIONS = [
  { value: '', labelKey: 'profile.relationship.preferNot' },
  { value: 'single', labelKey: 'profile.relationship.single' },
  { value: 'in-a-relationship', labelKey: 'profile.relationship.inRelationship' },
  { value: 'married', labelKey: 'profile.relationship.married' },
  { value: 'divorced', labelKey: 'profile.relationship.divorced' },
];

export const LANGUAGE_OPTIONS = [
  { value: '', labelKey: 'profile.language.notSet' },
  { value: 'en', label: 'American' },
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

interface EditProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
  onSaved: () => void;
}

const emptyFields = {
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
};

export const EditProfileSheet = ({ open, onOpenChange, profile, onSaved }: EditProfileSheetProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [editedFields, setEditedFields] = useState(emptyFields);

  // Seed the form each time the sheet opens
  useEffect(() => {
    if (open && profile) {
      const p = profile;
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
  }, [open, profile]);

  const toggleGoal = (goal: string) => {
    setEditedFields(prev => ({
      ...prev,
      goals: prev.goals.includes(goal) ? prev.goals.filter(g => g !== goal) : [...prev.goals, goal],
    }));
  };

  const handleSave = async () => {
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
      const newName = editedFields.full_name.trim();
      if (newName) {
        supabase.auth.updateUser({ data: { full_name: newName, name: newName } }).then(() => {});
      }
      toast({ title: t('profile.toasts.saved'), description: t('profile.toasts.savedDesc') });
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: t('profile.toasts.error'), description: error.message || t('profile.toasts.saveFailed'), variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="app-theme bg-bg-warm border-0 rounded-t-3xl px-5 pb-8 pt-5 max-h-[92vh] overflow-y-auto"
      >
        <div className="space-y-4">
          {/* Sheet header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[hsl(var(--fg-warm))]">{t('profile.editProfile')}</h2>
            <button
              onClick={() => onOpenChange(false)}
              aria-label={t('profile.cancel')}
              className="h-8 w-8 rounded-full bg-card-warm flex items-center justify-center shadow-ios active:scale-90 transition-transform"
            >
              <X className="h-4 w-4 text-[hsl(var(--fg-warm-muted))]" />
            </button>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--fg-warm-muted))]">{t('profile.fields.fullName')}</Label>
            <Input value={editedFields.full_name} onChange={e => setEditedFields(prev => ({ ...prev, full_name: e.target.value }))} placeholder={t('profile.placeholders.fullName')} className="h-11 rounded-2xl bg-card-warm border-0 shadow-card-warm" />
          </div>
          {/* Phone */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--fg-warm-muted))]">{t('profile.fields.phone')}</Label>
            <Input value={editedFields.phone} onChange={e => setEditedFields(prev => ({ ...prev, phone: e.target.value }))} placeholder={t('profile.placeholders.phone')} className="h-11 rounded-2xl bg-card-warm border-0 shadow-card-warm" dir="ltr" />
          </div>
          {/* Date of Birth */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--fg-warm-muted))]">{t('profile.fields.dob')}</Label>
            <div className="flex gap-2">
              <select
                className="flex h-11 flex-1 rounded-2xl border-0 bg-card-warm shadow-card-warm px-2 py-2 text-sm"
                value={editedFields.date_of_birth ? (editedFields.date_of_birth.getMonth() + 1).toString() : ''}
                onChange={e => {
                  const month = parseInt(e.target.value);
                  if (!month) { setEditedFields(prev => ({ ...prev, date_of_birth: null })); return; }
                  const current = editedFields.date_of_birth || new Date(2000, 0, 1);
                  setEditedFields(prev => ({ ...prev, date_of_birth: new Date(current.getFullYear(), month - 1, current.getDate()) }));
                }}
              >
                <option value="">{t('profile.fields.month')}</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{format(new Date(2000, i, 1), 'MMM')}</option>
                ))}
              </select>
              <select
                className="flex h-11 w-[70px] rounded-2xl border-0 bg-card-warm shadow-card-warm px-2 py-2 text-sm"
                value={editedFields.date_of_birth ? editedFields.date_of_birth.getDate().toString() : ''}
                onChange={e => {
                  const day = parseInt(e.target.value);
                  if (!day) return;
                  const current = editedFields.date_of_birth || new Date(2000, 0, 1);
                  setEditedFields(prev => ({ ...prev, date_of_birth: new Date(current.getFullYear(), current.getMonth(), day) }));
                }}
              >
                <option value="">{t('profile.fields.day')}</option>
                {Array.from({ length: 31 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
              <select
                className="flex h-11 w-[90px] rounded-2xl border-0 bg-card-warm shadow-card-warm px-2 py-2 text-sm"
                value={editedFields.date_of_birth ? editedFields.date_of_birth.getFullYear().toString() : ''}
                onChange={e => {
                  const year = parseInt(e.target.value);
                  if (!year) return;
                  const current = editedFields.date_of_birth || new Date(2000, 0, 1);
                  setEditedFields(prev => ({ ...prev, date_of_birth: new Date(year, current.getMonth(), current.getDate()) }));
                }}
              >
                <option value="">{t('profile.fields.year')}</option>
                {Array.from({ length: 100 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
          </div>
          {/* Gender */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--fg-warm-muted))]">{t('profile.fields.gender')}</Label>
            <select className="flex h-11 w-full rounded-2xl border-0 bg-card-warm shadow-card-warm px-3 py-2 text-sm" value={editedFields.gender} onChange={e => setEditedFields(prev => ({ ...prev, gender: e.target.value }))}>
              {GENDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(o.labelKey)}</option>)}
            </select>
          </div>
          {/* City */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--fg-warm-muted))]">{t('profile.fields.city')}</Label>
            <Input value={editedFields.city} onChange={e => setEditedFields(prev => ({ ...prev, city: e.target.value }))} placeholder={t('profile.placeholders.city')} className="h-11 rounded-2xl bg-card-warm border-0 shadow-card-warm" />
          </div>
          {/* Country */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--fg-warm-muted))]">{t('profile.fields.country')}</Label>
            <Input value={editedFields.country} onChange={e => setEditedFields(prev => ({ ...prev, country: e.target.value }))} placeholder={t('profile.placeholders.country')} className="h-11 rounded-2xl bg-card-warm border-0 shadow-card-warm" />
          </div>
          {/* Occupation */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--fg-warm-muted))]">{t('profile.fields.occupation')}</Label>
            <Input value={editedFields.occupation} onChange={e => setEditedFields(prev => ({ ...prev, occupation: e.target.value }))} placeholder={t('profile.placeholders.occupation')} className="h-11 rounded-2xl bg-card-warm border-0 shadow-card-warm" />
          </div>
          {/* Relationship Status */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--fg-warm-muted))]">{t('profile.fields.relationship')}</Label>
            <select className="flex h-11 w-full rounded-2xl border-0 bg-card-warm shadow-card-warm px-3 py-2 text-sm" value={editedFields.relationship_status} onChange={e => setEditedFields(prev => ({ ...prev, relationship_status: e.target.value }))}>
              {RELATIONSHIP_OPTIONS.map(o => <option key={o.value} value={o.value}>{t(o.labelKey)}</option>)}
            </select>
          </div>
          {/* Language */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--fg-warm-muted))]">{t('profile.fields.secondLanguage')}</Label>
            <select className="flex h-11 w-full rounded-2xl border-0 bg-card-warm shadow-card-warm px-3 py-2 text-sm" value={editedFields.preferred_language} onChange={e => setEditedFields(prev => ({ ...prev, preferred_language: e.target.value }))}>
              {LANGUAGE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.labelKey ? t(o.labelKey) : o.label}</option>)}
            </select>
          </div>
          {/* Goals */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--fg-warm-muted))]">{t('profile.fields.goals')}</Label>
            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map(goal => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => toggleGoal(goal)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                    editedFields.goals.includes(goal)
                      ? 'bg-[hsl(var(--brand-primary))] text-white'
                      : 'bg-card-warm text-[hsl(var(--fg-warm-muted))]'
                  )}
                >
                  {t(`profile.goalsList.${goal}`, goal)}
                </button>
              ))}
            </div>
          </div>
          {/* Bio */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--fg-warm-muted))]">{t('profile.fields.bio')}</Label>
            <Textarea value={editedFields.bio} onChange={e => setEditedFields(prev => ({ ...prev, bio: e.target.value }))} placeholder={t('profile.placeholders.bio')} rows={3} className="rounded-2xl bg-card-warm border-0 shadow-card-warm" />
          </div>
          {/* Instagram */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--fg-warm-muted))]">{t('profile.fields.instagram')}</Label>
            <Input value={editedFields.social_instagram} onChange={e => setEditedFields(prev => ({ ...prev, social_instagram: e.target.value }))} placeholder={t('profile.placeholders.username')} className="h-11 rounded-2xl bg-card-warm border-0 shadow-card-warm" dir="ltr" />
          </div>
          {/* Telegram */}
          <div className="space-y-1.5">
            <Label className="text-xs text-[hsl(var(--fg-warm-muted))]">{t('profile.fields.telegram')}</Label>
            <Input value={editedFields.social_telegram} onChange={e => setEditedFields(prev => ({ ...prev, social_telegram: e.target.value }))} placeholder={t('profile.placeholders.username')} className="h-11 rounded-2xl bg-card-warm border-0 shadow-card-warm" dir="ltr" />
          </div>

          {/* Save */}
          <Button
            className="w-full rounded-full h-12 bg-[hsl(var(--brand-primary))] text-white shadow-ios border-0 active:bg-[hsl(var(--brand-primary-dark))]"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Check className="mr-2 h-4 w-4" />{isSaving ? t('profile.saving') : t('profile.save')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
