import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, Plus, Minus } from 'lucide-react';

export type TargetType = 'all' | 'enrolled' | 'custom';

const TOOLS = [
  { slug: 'journal', label: '📔 Journal', description: 'Users who have journal entries' },
  { slug: 'breathe', label: '🫁 Breathe', description: 'Users who have breathing sessions' },
  { slug: 'water', label: '💧 Water', description: 'Users who tracked water' },
  { slug: 'emotion', label: '😊 Emotion', description: 'Users who logged emotions' },
  { slug: 'period', label: '🌸 Period', description: 'Users who use period tracker' },
  { slug: 'planner', label: '📅 Planner', description: 'Users who have tasks' },
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
}: PromoAudienceSelectorProps) {
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

          {/* Summary */}
          {(includePrograms.length > 0 || excludePrograms.length > 0 || 
            includePlaylists.length > 0 || excludePlaylists.length > 0 ||
            includeTools.length > 0 || excludeTools.length > 0) && (
            <div className="text-xs text-muted-foreground bg-background p-2 rounded border">
              <strong>Summary:</strong>
              {includePrograms.length > 0 && <span className="text-green-600"> +{includePrograms.length} programs</span>}
              {excludePrograms.length > 0 && <span className="text-red-600"> -{excludePrograms.length} programs</span>}
              {includePlaylists.length > 0 && <span className="text-green-600"> +{includePlaylists.length} playlists</span>}
              {excludePlaylists.length > 0 && <span className="text-red-600"> -{excludePlaylists.length} playlists</span>}
              {includeTools.length > 0 && <span className="text-green-600"> +{includeTools.length} tools</span>}
              {excludeTools.length > 0 && <span className="text-red-600"> -{excludeTools.length} tools</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
