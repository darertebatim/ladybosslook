import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Plus, Minus } from 'lucide-react';
import { AudiencePresetPicker } from './AudiencePresetPicker';

export type TargetType = 'all' | 'enrolled' | 'custom';

const TOOLS = [
  { slug: 'journal', label: '📔 Journal', description: 'Users who have journal entries' },
  { slug: 'breathe', label: '🌬️ Breathe', description: 'Users who have breathing sessions' },
  { slug: 'water', label: '💧 Water', description: 'Users who tracked water' },
  { slug: 'emotion', label: '💜 Emotion', description: 'Users who logged emotions' },
  { slug: 'period', label: '❤️ Period', description: 'Users who use period tracker' },
  { slug: 'planner', label: '📅 Planner', description: 'Users who have tasks' },
  { slug: 'mood', label: '🫧 Mood', description: 'Users who tracked mood' },
  { slug: 'fasting', label: '⏳ Fasting', description: 'Users who use fasting tracker' },
  { slug: 'reflections', label: '✏️ Reflections', description: 'Users who wrote reflections' },
  { slug: 'routines', label: '🚀 Routines', description: 'Users who use routine player' },
  { slug: 'timer', label: '⏱️ Timer', description: 'Users who use focus timer' },
  { slug: 'presence', label: '🔥 Presence', description: 'Users who track presence streak' },
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: '🇺🇸 English' },
  { value: 'fa', label: '🇮🇷 فارسی (Persian)' },
  { value: 'ar', label: '🇸🇦 العربية (Arabic)' },
  { value: 'es', label: '🇪🇸 Español' },
  { value: 'fr', label: '🇫🇷 Français' },
  { value: 'de', label: '🇩🇪 Deutsch' },
  { value: 'tr', label: '🇹🇷 Türkçe' },
  { value: 'hi', label: '🇮🇳 हिन्दी (Hindi)' },
  { value: 'zh', label: '🇨🇳 中文 (Chinese)' },
];

const TIMEZONE_GROUPS = [
  { label: '🇺🇸 US Pacific', values: ['America/Los_Angeles'] },
  { label: '🇺🇸 US Mountain', values: ['America/Denver'] },
  { label: '🇺🇸 US Central', values: ['America/Chicago'] },
  { label: '🇺🇸 US Eastern', values: ['America/New_York'] },
  { label: '🇬🇧 UK / GMT', values: ['Europe/London'] },
  { label: '🇪🇺 Central Europe', values: ['Europe/Berlin', 'Europe/Paris', 'Europe/Rome'] },
  { label: '🇮🇷 Iran', values: ['Asia/Tehran'] },
  { label: '🇹🇷 Turkey', values: ['Europe/Istanbul'] },
  { label: '🇦🇪 UAE / Gulf', values: ['Asia/Dubai'] },
  { label: '🇮🇳 India', values: ['Asia/Kolkata', 'Asia/Calcutta'] },
  { label: '🇨🇳 China', values: ['Asia/Shanghai'] },
  { label: '🇦🇺 Australia', values: ['Australia/Sydney', 'Australia/Melbourne'] },
];

interface PromoAudienceSelectorProps {
  targetType: TargetType;
  setTargetType: (type: TargetType) => void;
  includePrograms: string[];
  setIncludePrograms: (programs: string[]) => void;
  excludePrograms: string[];
  setExcludePrograms: (programs: string[]) => void;
  includePlaylists: string[];
  setIncludePlaylists: (playlists: string[]) => void;
  excludePlaylists: string[];
  setExcludePlaylists: (playlists: string[]) => void;
  includeTools: string[];
  setIncludeTools: (tools: string[]) => void;
  excludeTools: string[];
  setExcludeTools: (tools: string[]) => void;
  targetLanguages: string[];
  setTargetLanguages: (langs: string[]) => void;
  targetTimezones: string[];
  setTargetTimezones: (tzs: string[]) => void;
  includeUpdateStatus: string[];
  setIncludeUpdateStatus: (statuses: string[]) => void;
  targetInstructorIds?: string[];
  setTargetInstructorIds?: (ids: string[]) => void;
  /** Optional: preset linkage. When provided, a saved-audience picker is shown. */
  presetId?: string | null;
  setPresetId?: (id: string | null) => void;
}

export function PromoAudienceSelector({
  targetType,
  setTargetType,
  includePrograms,
  setIncludePrograms,
  excludePrograms,
  setExcludePrograms,
  includePlaylists,
  setIncludePlaylists,
  excludePlaylists,
  setExcludePlaylists,
  includeTools,
  setIncludeTools,
  excludeTools,
  setExcludeTools,
  targetLanguages,
  setTargetLanguages,
  targetTimezones,
  setTargetTimezones,
  includeUpdateStatus,
  setIncludeUpdateStatus,
  targetInstructorIds = [],
  setTargetInstructorIds,
  presetId,
  setPresetId,
}: PromoAudienceSelectorProps) {
  const UPDATE_STATUS_OPTIONS = [
    { slug: 'latest', label: '🆕 Last Update', description: 'Users on the latest app version' },
    { slug: 'previous', label: '📦 Previous Updates', description: 'Users on older app versions' },
  ];

  // Fetch programs
  const { data: programs } = useQuery({
    queryKey: ['programs-for-targeting'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_catalog')
        .select('id, title, slug, type')
        .eq('is_active', true)
        .order('title');
      if (error) throw error;
      return data;
    },
  });

  // Fetch playlists
  const { data: playlists } = useQuery({
    queryKey: ['playlists-for-targeting'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_playlists')
        .select('id, name')
        .eq('is_hidden', false)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch instructors for instructor-scoped targeting
  const { data: instructors } = useQuery({
    queryKey: ['instructors-for-targeting'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instructors')
        .select('id, display_name, slug, is_active')
        .order('display_name');
      if (error) throw error;
      return data;
    },
  });

  const toggleItem = (
    list: string[],
    setList: (items: string[]) => void,
    item: string
  ) => {
    if (list.includes(item)) {
      setList(list.filter((i) => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const toggleTimezoneGroup = (groupValues: string[]) => {
    const allIncluded = groupValues.every(v => targetTimezones.includes(v));
    if (allIncluded) {
      setTargetTimezones(targetTimezones.filter(tz => !groupValues.includes(tz)));
    } else {
      const newTzs = [...new Set([...targetTimezones, ...groupValues])];
      setTargetTimezones(newTzs);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course': return '📚';
      case 'group-coaching': return '👥';
      case '1o1-session': return '💼';
      case 'webinar': return '🎥';
      case 'audiobook': return '🎧';
      default: return '🎉';
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <Label className="text-sm font-medium">Target Audience</Label>
      </div>

      {/* Target Type */}
      <div className="space-y-2">
        <Select value={targetType} onValueChange={(v) => setTargetType(v as TargetType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">🌍 All Users</SelectItem>
            <SelectItem value="enrolled">🎓 Any Enrolled User</SelectItem>
            <SelectItem value="custom">⚙️ Custom Targeting</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {targetType === 'custom' && (
        <div className="space-y-6 pt-2">
          {/* Programs Section */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Programs
            </Label>
            
            {/* Include Programs */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-green-600">
                <Plus className="h-3 w-3" />
                Include users enrolled in:
              </div>
              <div className="flex flex-wrap gap-2">
                {programs?.map((program) => (
                  <Badge
                    key={program.slug}
                    variant={includePrograms.includes(program.slug) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => toggleItem(includePrograms, setIncludePrograms, program.slug)}
                  >
                    {getTypeIcon(program.type)} {program.title}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Exclude Programs */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-red-600">
                <Minus className="h-3 w-3" />
                Exclude users enrolled in:
              </div>
              <div className="flex flex-wrap gap-2">
                {programs?.map((program) => (
                  <Badge
                    key={program.slug}
                    variant={excludePrograms.includes(program.slug) ? 'destructive' : 'outline'}
                    className="cursor-pointer hover:bg-destructive/10"
                    onClick={() => toggleItem(excludePrograms, setExcludePrograms, program.slug)}
                  >
                    {getTypeIcon(program.type)} {program.title}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Playlists Section */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Playlists
            </Label>
            
            {/* Include Playlists */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-green-600">
                <Plus className="h-3 w-3" />
                Include users who accessed:
              </div>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {playlists?.map((playlist) => (
                  <Badge
                    key={playlist.id}
                    variant={includePlaylists.includes(playlist.id) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => toggleItem(includePlaylists, setIncludePlaylists, playlist.id)}
                  >
                    🎧 {playlist.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Exclude Playlists */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-red-600">
                <Minus className="h-3 w-3" />
                Exclude users who accessed:
              </div>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {playlists?.map((playlist) => (
                  <Badge
                    key={playlist.id}
                    variant={excludePlaylists.includes(playlist.id) ? 'destructive' : 'outline'}
                    className="cursor-pointer hover:bg-destructive/10"
                    onClick={() => toggleItem(excludePlaylists, setExcludePlaylists, playlist.id)}
                  >
                    🎧 {playlist.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Tools Section */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              App Tools Usage
            </Label>
            
            {/* Include Tools */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-green-600">
                <Plus className="h-3 w-3" />
                Include users who use:
              </div>
              <div className="flex flex-wrap gap-2">
                {TOOLS.map((tool) => (
                  <Badge
                    key={tool.slug}
                    variant={includeTools.includes(tool.slug) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => toggleItem(includeTools, setIncludeTools, tool.slug)}
                  >
                    {tool.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Exclude Tools */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-red-600">
                <Minus className="h-3 w-3" />
                Exclude users who use:
              </div>
              <div className="flex flex-wrap gap-2">
                {TOOLS.map((tool) => (
                  <Badge
                    key={tool.slug}
                    variant={excludeTools.includes(tool.slug) ? 'destructive' : 'outline'}
                    className="cursor-pointer hover:bg-destructive/10"
                    onClick={() => toggleItem(excludeTools, setExcludeTools, tool.slug)}
                  >
                    {tool.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* App Update Status Section */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              App Update Status
            </Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-green-600">
                <Plus className="h-3 w-3" />
                Include users on:
              </div>
              <div className="flex flex-wrap gap-2">
                {UPDATE_STATUS_OPTIONS.map((opt) => (
                  <Badge
                    key={opt.slug}
                    variant={includeUpdateStatus.includes(opt.slug) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => toggleItem(includeUpdateStatus, setIncludeUpdateStatus, opt.slug)}
                  >
                    {opt.label}
                  </Badge>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground">
                "Last Update" = users on the latest app version. "Previous Updates" = users on older versions.
              </p>
            </div>
          </div>

          {/* Instructor Section */}
          {setTargetInstructorIds && (
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                Instructor Audience
              </Label>
              <p className="text-xs text-muted-foreground">
                Show only to users who were referred by one of these instructors (empty = all users).
              </p>
              <div className="flex flex-wrap gap-2">
                {instructors?.map((inst) => (
                  <Badge
                    key={inst.id}
                    variant={targetInstructorIds.includes(inst.id) ? 'default' : 'outline'}
                    className={`cursor-pointer hover:bg-primary/10 ${!inst.is_active ? 'opacity-60' : ''}`}
                    onClick={() => toggleItem(targetInstructorIds, setTargetInstructorIds, inst.id)}
                  >
                    👩‍🏫 {inst.display_name}
                  </Badge>
                ))}
                {!instructors?.length && (
                  <span className="text-xs text-muted-foreground italic">No instructors yet</span>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Preferred Language (Second Language)
            </Label>
            <p className="text-xs text-muted-foreground">Show only to users whose preferred language matches (empty = all languages)</p>
            <div className="flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((lang) => (
                <Badge
                  key={lang.value}
                  variant={targetLanguages.includes(lang.value) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => toggleItem(targetLanguages, setTargetLanguages, lang.value)}
                >
                  {lang.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Timezone Section */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Timezone
            </Label>
            <p className="text-xs text-muted-foreground">Show only to users in selected timezones (empty = all timezones)</p>
            <div className="flex flex-wrap gap-2">
              {TIMEZONE_GROUPS.map((group) => {
                const allIncluded = group.values.every(v => targetTimezones.includes(v));
                return (
                  <Badge
                    key={group.label}
                    variant={allIncluded ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/10"
                    onClick={() => toggleTimezoneGroup(group.values)}
                  >
                    {group.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          {(includePrograms.length > 0 || excludePrograms.length > 0 || 
            includePlaylists.length > 0 || excludePlaylists.length > 0 ||
            includeTools.length > 0 || excludeTools.length > 0 ||
            includeUpdateStatus.length > 0 ||
            targetLanguages.length > 0 || targetTimezones.length > 0 ||
            targetInstructorIds.length > 0) && (
            <div className="text-xs text-muted-foreground bg-background p-2 rounded border">
              <strong>Summary:</strong>
              {includePrograms.length > 0 && <span className="text-green-600"> +{includePrograms.length} programs</span>}
              {excludePrograms.length > 0 && <span className="text-red-600"> -{excludePrograms.length} programs</span>}
              {includePlaylists.length > 0 && <span className="text-green-600"> +{includePlaylists.length} playlists</span>}
              {excludePlaylists.length > 0 && <span className="text-red-600"> -{excludePlaylists.length} playlists</span>}
              {includeTools.length > 0 && <span className="text-green-600"> +{includeTools.length} tools</span>}
              {excludeTools.length > 0 && <span className="text-red-600"> -{excludeTools.length} tools</span>}
              {includeUpdateStatus.length > 0 && <span className="text-green-600"> 📱 {includeUpdateStatus.join(', ')}</span>}
              {targetLanguages.length > 0 && <span className="text-blue-600"> 🌐 {targetLanguages.length} languages</span>}
              {targetTimezones.length > 0 && <span className="text-blue-600"> 🕐 {targetTimezones.length} timezone groups</span>}
              {targetInstructorIds.length > 0 && <span className="text-purple-600"> 👩‍🏫 {targetInstructorIds.length} instructors</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
