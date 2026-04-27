import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { Megaphone, Bell, Mail, MessageCircle, Link as LinkIcon, X, UserMinus, Search, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { Badge } from '@/components/ui/badge';
import { AudiencePresetPicker, EMPTY_AUDIENCE, type AudiencePayload } from './AudiencePresetPicker';

interface Program {
  id: string;
  title: string;
  type: string;
  slug: string;
}

// Common in-app link options
const IN_APP_LINKS = [
  { value: 'none', label: 'No link' },
  { value: '/app/home', label: '🏠 Home' },
  { value: '/app/programs', label: '📚 My Programs' },
  { value: '/app/tools', label: '🔍 Tools' },
  { value: '/app/player', label: '🎧 Audio Player' },
  { value: '/app/chat', label: '💬 Support Chat' },
  { value: '/app/myprofile', label: '👤 Profile' },
  { value: '/app/rate', label: '⭐ Rate the App' },
  { value: '/app/reflections', label: '📓 Reflections' },
  { value: '/app/breathing', label: '🌬️ Breathing' },
  { value: '/app/focus', label: '🎯 Focus Timer' },
  { value: '/app/fasting', label: '⏰ Fasting Tracker' },
  { value: '/app/emotions', label: '🧠 Emotion Log' },
  { value: '/app/channels', label: '💬 Community Chats' },
  { value: 'custom', label: '✏️ Custom URL...' },
];

export function AnnouncementCreator() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetCourse, setTargetCourse] = useState<string>('all');
  const [targetRoundId, setTargetRoundId] = useState<string>('all');
  const [sendPush, setSendPush] = useState(true);
  const [sendEmail, setSendEmail] = useState(false);
  const [linkType, setLinkType] = useState('none');
  const [customLinkUrl, setCustomLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [loading, setLoading] = useState(false);
  const [programs, setPrograms] = useState<Program[]>([]);
  
  // Exclusion state
  const [excludeUserSearch, setExcludeUserSearch] = useState('');
  const [excludedUsers, setExcludedUsers] = useState<{ id: string; name: string; email: string }[]>([]);
  const [excludedPrograms, setExcludedPrograms] = useState<string[]>([]);
  const [showExclude, setShowExclude] = useState(false);
  const [audience, setAudience] = useState<AudiencePayload>(EMPTY_AUDIENCE);
  const [audiencePresetId, setAudiencePresetId] = useState<string | null>(null);
  const [previewing, setPreviewing] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();


  // Compute actual link URL
  const linkUrl = linkType === 'none' ? '' : (linkType === 'custom' ? customLinkUrl : linkType);

  // Fetch playlists
  const { data: playlists } = useQuery({
    queryKey: ['all-playlists-for-broadcast'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_playlists')
        .select('id, name, program_slug')
        .eq('is_hidden', false)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  // Fetch routines
  const { data: routines } = useQuery({
    queryKey: ['all-routines-for-broadcast'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routines_bank')
        .select('id, title, emoji')
        .eq('is_active', true)
        .order('title');
      if (error) throw error;
      return data;
    },
  });

  // Fetch rounds for the selected course
  const { data: rounds } = useQuery({
    queryKey: ["program-rounds", targetCourse],
    queryFn: async () => {
      if (targetCourse === "all") return [];
      const { data, error } = await supabase
        .from("program_rounds")
        .select("*")
        .eq("program_slug", targetCourse)
        .order("round_number", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: targetCourse !== "all",
  });

  // Search users for exclusion
  const { data: searchResults } = useQuery({
    queryKey: ['user-search-exclude', excludeUserSearch],
    queryFn: async () => {
      if (excludeUserSearch.length < 2) return [];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .or(`full_name.ilike.%${excludeUserSearch}%,email.ilike.%${excludeUserSearch}%`)
        .limit(8);
      if (error) throw error;
      return data;
    },
    enabled: excludeUserSearch.length >= 2,
  });

  useEffect(() => {
    const fetchPrograms = async () => {
      const { data, error } = await supabase
        .from('program_catalog')
        .select('id, title, type, slug')
        .eq('is_active', true)
        .order('title');
      if (!error && data) setPrograms(data);
    };
    fetchPrograms();
  }, []);

  // Reset round when course changes
  useEffect(() => {
    setTargetRoundId('all');
  }, [targetCourse]);

  const addExcludedUser = (user: { id: string; full_name: string | null; email: string }) => {
    if (excludedUsers.some(u => u.id === user.id)) return;
    setExcludedUsers(prev => [...prev, { id: user.id, name: user.full_name || 'Unknown', email: user.email }]);
    setExcludeUserSearch('');
  };

  const removeExcludedUser = (userId: string) => {
    setExcludedUsers(prev => prev.filter(u => u.id !== userId));
  };

  const toggleExcludedProgram = (slug: string) => {
    setExcludedPrograms(prev =>
      prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      toast({ title: "Error", description: "Please fill in title and message", variant: "destructive" });
      return;
    }

    if (linkType === 'custom' && customLinkUrl.trim() && !customLinkUrl.match(/^(https?:\/\/|\/app\/).+/)) {
      toast({ title: "Error", description: "Please enter a valid URL (https://... or /app/...)", variant: "destructive" });
      return;
    }

    setLoading(true);
    
    try {
      let targetType: 'all' | 'course' | 'round' = 'all';
      if (targetRoundId !== 'all' && targetRoundId) {
        targetType = 'round';
      } else if (targetCourse !== 'all') {
        targetType = 'course';
      }

      const { data, error } = await supabase.functions.invoke('send-broadcast-message', {
        body: {
          title: title.trim(),
          content: message.trim(),
          targetType,
          targetCourse: targetCourse !== 'all' ? targetCourse : undefined,
          targetRoundId: targetRoundId !== 'all' ? targetRoundId : undefined,
          sendPush,
          sendEmail,
          linkUrl: linkUrl.trim() || undefined,
          linkText: linkText.trim() || undefined,
          excludeUserIds: excludedUsers.length > 0 ? excludedUsers.map(u => u.id) : undefined,
          excludeProgramSlugs: excludedPrograms.length > 0 ? excludedPrograms : undefined,
          audience: audiencePresetId ? audience : undefined,
          audiencePresetId: audiencePresetId ?? undefined,
        }
      });

      if (error) throw error;

      const { messagesSent, pushSent, emailsSent } = data;
      
      let description = `Message delivered to ${messagesSent} users`;
      if (sendPush && pushSent > 0) description += `, ${pushSent} push notifications`;
      if (sendEmail && emailsSent > 0) description += `, ${emailsSent} emails`;
      
      toast({ title: "🎉 Broadcast Sent!", description });

      queryClient.invalidateQueries({ queryKey: ['broadcast-history'] });

      // Reset form
      setTitle('');
      setMessage('');
      setTargetCourse('all');
      setTargetRoundId('all');
      setSendPush(true);
      setSendEmail(false);
      setLinkType('none');
      setCustomLinkUrl('');
      setLinkText('');
      setExcludedUsers([]);
      setExcludedPrograms([]);
      setShowExclude(false);
      setAudience(EMPTY_AUDIENCE);
      setAudiencePresetId(null);
      
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send broadcast", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5" />
          Send Broadcast Message
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Broadcasts appear in each user's chat. They can reply directly to you.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input placeholder="Announcement title..." value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Message</Label>
          <Textarea placeholder="Your message to all users..." value={message} onChange={(e) => setMessage(e.target.value)} rows={4} />
        </div>

        {/* Link Button Section */}
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <Label className="text-sm font-medium flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            Add Button Link (Optional)
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Destination</Label>
              <Select value={linkType} onValueChange={setLinkType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {IN_APP_LINKS.map((link) => (
                    <SelectItem key={link.value || 'none'} value={link.value}>
                      {link.label}
                    </SelectItem>
                  ))}

                  {/* Playlists */}
                  {playlists && playlists.length > 0 && (
                    <>
                      <SelectItem value="divider-playlists" disabled className="text-xs text-muted-foreground">
                        ── Playlists ──
                      </SelectItem>
                      {playlists.map((pl) => (
                        <SelectItem key={`pl-${pl.id}`} value={`/app/playlist/${pl.id}`}>
                          🎵 {pl.name}
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {/* Routines */}
                  {routines && routines.length > 0 && (
                    <>
                      <SelectItem value="divider-routines" disabled className="text-xs text-muted-foreground">
                        ── Routines ──
                      </SelectItem>
                      {routines.map((r) => (
                        <SelectItem key={`rt-${r.id}`} value={`/app/tools/routine/${r.id}`}>
                          {r.emoji || '✨'} {r.title}
                        </SelectItem>
                      ))}
                    </>
                  )}

                  {/* Course Pages */}
                  {programs.length > 0 && (
                    <>
                      <SelectItem value="divider-courses" disabled className="text-xs text-muted-foreground">
                        ── Course Pages ──
                      </SelectItem>
                      {programs.map((program) => (
                        <SelectItem key={program.slug} value={`/app/programs/${program.slug}`}>
                          📚 {program.title}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
              
              {linkType === 'custom' && (
                <Input
                  value={customLinkUrl}
                  onChange={(e) => setCustomLinkUrl(e.target.value)}
                  placeholder="/app/player/playlist/123 or https://..."
                  className="mt-2"
                />
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Button Text</Label>
              <Input
                placeholder="View Details"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                disabled={linkType === 'none'}
              />
            </div>
          </div>
          {linkUrl && (
            <p className="text-xs text-muted-foreground">→ {linkUrl}</p>
          )}
        </div>

        {/* Target Audience */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Target Audience</Label>
            <Select value={targetCourse} onValueChange={setTargetCourse}>
              <SelectTrigger>
                <SelectValue placeholder="Select audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.slug}>
                    {program.title} • {program.type === 'course' ? '📚' : program.type === 'group-coaching' ? '👥' : program.type === '1o1-session' ? '💼' : program.type === 'webinar' ? '🎥' : program.type === 'audiobook' ? '🎧' : '🎉'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {targetCourse !== "all" && rounds && rounds.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="targetRound">Target Round</Label>
              <Select value={targetRoundId} onValueChange={setTargetRoundId} key={targetCourse}>
                <SelectTrigger id="targetRound">
                  <SelectValue placeholder="Select round" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rounds</SelectItem>
                  {rounds.map((round) => (
                    <SelectItem key={round.id} value={round.id}>
                      {round.round_name} (Round #{round.round_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Saved Audience filter (intersects with the simple selector above) */}
        <AudiencePresetPicker
          current={audience}
          presetId={audiencePresetId}
          onApplyPreset={(preset) => {
            if (!preset) {
              setAudience(EMPTY_AUDIENCE);
              setAudiencePresetId(null);
              return;
            }
            setAudience({
              target_type: preset.target_type,
              include_programs: preset.include_programs ?? [],
              exclude_programs: preset.exclude_programs ?? [],
              include_playlists: preset.include_playlists ?? [],
              exclude_playlists: preset.exclude_playlists ?? [],
              include_tools: preset.include_tools ?? [],
              exclude_tools: preset.exclude_tools ?? [],
              target_languages: preset.target_languages ?? [],
              target_timezones: preset.target_timezones ?? [],
              include_update_status: preset.include_update_status ?? [],
              target_instructor_ids: preset.target_instructor_ids ?? [],
            });
            setAudiencePresetId(preset.id);
          }}
        />

        {/* Exclusion Section */}
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              <UserMinus className="h-4 w-4" />
              Exclude from Broadcast
            </Label>
            <Switch checked={showExclude} onCheckedChange={setShowExclude} />
          </div>

          {showExclude && (
            <div className="space-y-4 pt-2">
              {/* Exclude specific users */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Exclude Users</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={excludeUserSearch}
                    onChange={(e) => setExcludeUserSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                {/* Search results */}
                {searchResults && searchResults.length > 0 && excludeUserSearch.length >= 2 && (
                  <div className="border rounded-md bg-background max-h-[160px] overflow-y-auto">
                    {searchResults
                      .filter(u => !excludedUsers.some(eu => eu.id === u.id))
                      .map((user) => (
                        <button
                          key={user.id}
                          onClick={() => addExcludedUser(user)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 flex items-center justify-between border-b last:border-b-0"
                        >
                          <span>{user.full_name || 'Unknown'}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </button>
                      ))}
                  </div>
                )}
                
                {/* Excluded users badges */}
                {excludedUsers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {excludedUsers.map((user) => (
                      <Badge key={user.id} variant="secondary" className="gap-1 pr-1">
                        {user.name}
                        <button onClick={() => removeExcludedUser(user.id)} className="ml-1 hover:bg-muted rounded-full p-0.5">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Exclude programs */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Exclude Program Groups</Label>
                <div className="flex flex-wrap gap-1.5">
                  {programs.map((program) => (
                    <Badge
                      key={program.slug}
                      variant={excludedPrograms.includes(program.slug) ? "destructive" : "outline"}
                      className="cursor-pointer select-none"
                      onClick={() => toggleExcludedProgram(program.slug)}
                    >
                      {excludedPrograms.includes(program.slug) && <X className="h-3 w-3 mr-1" />}
                      {program.title}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notification Options */}
        <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
          <Label className="text-sm font-medium">Notification Options</Label>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Push Notification</p>
                <p className="text-xs text-muted-foreground">Send iOS push notification</p>
              </div>
            </div>
            <Switch checked={sendPush} onCheckedChange={setSendPush} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email Notification</p>
                <p className="text-xs text-muted-foreground">Also send via email</p>
              </div>
            </div>
            <Switch checked={sendEmail} onCheckedChange={setSendEmail} />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={previewing}
            onClick={async () => {
              setPreviewing(true);
              try {
                const { data, error } = await supabase.functions.invoke(
                  'preview-audience-recipients',
                  {
                    body: {
                      channel: sendPush ? 'push' : 'broadcast',
                      audience: audiencePresetId ? audience : null,
                      targetCourse: null,
                      targetRoundId: null,
                    },
                  },
                );
                if (error) throw error;
                const users = data?.matched_users ?? 0;
                const total = data?.devices_total;
                const ios = data?.devices_ios ?? 0;
                const android = data?.devices_android ?? 0;
                toast({
                  title: `${users} user${users === 1 ? '' : 's'} match`,
                  description:
                    total === null || total === undefined
                      ? data?.note ?? 'No audience filter applied.'
                      : `${total} push device${total === 1 ? '' : 's'} (iOS: ${ios}, Android: ${android})`,
                });
              } catch (err: any) {
                toast({
                  title: 'Preview failed',
                  description: err?.message ?? 'Unknown error',
                  variant: 'destructive',
                });
              } finally {
                setPreviewing(false);
              }
            }}
          >
            <Eye className="mr-2 h-4 w-4" />
            {previewing ? 'Counting…' : 'Preview recipients'}
          </Button>
          <Button onClick={handleSubmit} disabled={loading} className="flex-1">
            <Megaphone className="mr-2 h-4 w-4" />
            {loading ? 'Sending...' : 'Send Broadcast'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
