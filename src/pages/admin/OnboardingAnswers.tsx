import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, User, Calendar, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface AnswerRow {
  id: string;
  user_id: string;
  flow_id: string;
  step_id: string;
  answer: string[];
  created_at: string;
  profile?: { full_name: string | null; email: string };
}

interface GroupedAnswers {
  user_id: string;
  name: string;
  email: string;
  flow_id: string;
  answers: AnswerRow[];
  started_at: string;
}

// Step labels for display
const STEP_LABELS: Record<string, string> = {
  'mp-5': 'Sleep duration',
  'mp-6': 'Wake up time',
  'mp-7': 'Energy level',
  'mp-8': 'Lifestyle satisfaction',
  'mp-10': 'Better life goals',
  'mp-12': 'Distraction level',
  'mp-13': 'Procrastination',
  'mp-14': 'Support system',
  'mp-15': 'Motivation',
  'mp-17': 'Organization influences',
  'mp-18': 'Anxious (Yes/No)',
  'mp-19': 'Not enough time (Yes/No)',
  'mp-20': 'Concentrating (Yes/No)',
  'mp-21': 'End of day regret (Yes/No)',
  'mp-31': 'Contract commitments',
};

export default function OnboardingAnswers() {
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [flowFilter, setFlowFilter] = useState('all');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchAnswers();
  }, []);

  const fetchAnswers = async () => {
    setLoading(true);
    
    // Fetch answers
    const { data: rawData, error } = await supabase
      .from('onboarding_answers')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('Failed to fetch onboarding answers:', error);
      setLoading(false);
      return;
    }

    const rows = (rawData || []).map(r => ({
      ...r,
      answer: Array.isArray(r.answer) ? r.answer as string[] : [String(r.answer)],
    }));

    // Fetch profiles for unique user_ids
    const userIds = [...new Set(rows.map(r => r.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    setAnswers(rows.map(r => ({
      ...r,
      profile: profileMap.get(r.user_id) as any,
    })));
    setLoading(false);
  };

  const grouped = useMemo(() => {
    const map = new Map<string, GroupedAnswers>();
    
    for (const row of answers) {
      const key = `${row.user_id}_${row.flow_id}`;
      if (!map.has(key)) {
        map.set(key, {
          user_id: row.user_id,
          name: row.profile?.full_name || 'Unknown',
          email: row.profile?.email || row.user_id.slice(0, 8),
          flow_id: row.flow_id,
          answers: [],
          started_at: row.created_at,
        });
      }
      const g = map.get(key)!;
      g.answers.push(row);
      if (row.created_at < g.started_at) g.started_at = row.created_at;
    }

    let result = Array.from(map.values());

    // Filters
    if (flowFilter !== 'all') {
      result = result.filter(g => g.flow_id === flowFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(g =>
        g.name.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.user_id.toLowerCase().includes(q)
      );
    }

    // Sort by most recent
    result.sort((a, b) => b.started_at.localeCompare(a.started_at));
    return result;
  }, [answers, search, flowFilter]);

  const flows = useMemo(() => {
    const set = new Set(answers.map(a => a.flow_id));
    return Array.from(set);
  }, [answers]);

  const toggleUser = (key: string) => {
    setExpandedUsers(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Onboarding Answers</h1>
        <p className="text-sm text-muted-foreground mt-1">View user responses from onboarding flows</p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={flowFilter} onValueChange={setFlowFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All flows" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All flows</SelectItem>
            {flows.map(f => (
              <SelectItem key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <User className="h-4 w-4" />
          {grouped.length} users
        </span>
        <span className="flex items-center gap-1.5">
          <FileText className="h-4 w-4" />
          {answers.length} total answers
        </span>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No onboarding answers found</div>
      ) : (
        <ScrollArea className="h-[calc(100vh-280px)]">
          <div className="space-y-2">
            {grouped.map(g => {
              const key = `${g.user_id}_${g.flow_id}`;
              const isExpanded = expandedUsers.has(key);

              return (
                <div key={key} className="border rounded-xl bg-card overflow-hidden">
                  {/* User header */}
                  <button
                    onClick={() => toggleUser(key)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground">{g.name}</span>
                      <span className="text-muted-foreground text-sm ml-2">{g.email}</span>
                    </div>
                    <Badge variant="secondary" className="shrink-0">{g.flow_id}</Badge>
                    <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(g.started_at), 'MMM d, yyyy')}
                    </span>
                    <Badge variant="outline" className="shrink-0">{g.answers.length} answers</Badge>
                  </button>

                  {/* Expanded answers */}
                  {isExpanded && (
                    <div className="border-t px-4 py-3 space-y-2 bg-muted/20">
                      {g.answers
                        .sort((a, b) => a.step_id.localeCompare(b.step_id))
                        .map(ans => (
                          <div key={ans.id} className="flex items-start gap-3 text-sm py-1.5">
                            <Badge variant="outline" className="shrink-0 font-mono text-xs min-w-[70px] justify-center">
                              {ans.step_id}
                            </Badge>
                            <span className="text-muted-foreground shrink-0 min-w-[160px]">
                              {STEP_LABELS[ans.step_id] || ans.step_id}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {ans.answer.map((a, i) => (
                                <Badge key={i} className="bg-primary/10 text-primary border-0 font-normal">
                                  {a}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
