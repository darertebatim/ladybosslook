import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { Plus, Pencil, Trash2, GripVertical, ChevronUp, ChevronDown, Copy } from 'lucide-react';
import { toast } from 'sonner';

interface QuizOption {
  label: string;
  emoji?: string;
  score?: number;
}

interface QuizQuestion {
  id?: string;
  quiz_id?: string;
  sort_order: number;
  question_text: string;
  type: string;
  options: QuizOption[];
  is_active: boolean;
}

interface QuizResult {
  id?: string;
  quiz_id?: string;
  result_key: string;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  characteristics: string[];
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  score_min: number;
  score_max: number;
}

interface Quiz {
  id?: string;
  title: string;
  slug: string;
  overview: string;
  description: string;
  cover_url: string;
  theme_color: string;
  is_active: boolean;
  is_premium: boolean;
  sort_order: number;
}

const emptyQuiz: Quiz = {
  title: '', slug: '', overview: '', description: '', cover_url: '',
  theme_color: '#7c3aed', is_active: true, is_premium: false, sort_order: 0,
};

const emptyQuestion: QuizQuestion = {
  sort_order: 0, question_text: '', type: 'single-select',
  options: [{ label: '', score: 1 }, { label: '', score: 2 }], is_active: true,
};

const emptyResult: QuizResult = {
  result_key: '', title: '', subtitle: '', description: '', image_url: '',
  characteristics: [], strengths: [], weaknesses: [], suggestions: [],
  score_min: 0, score_max: 100,
};

export default function Quizzes() {
  const [quizzes, setQuizzes] = useState<(Quiz & { question_count?: number })[]>([]);
  const [editing, setEditing] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchQuizzes(); }, []);

  async function fetchQuizzes() {
    setLoading(true);
    const { data } = await supabase.from('admin_quizzes').select('*').order('sort_order');
    if (data) {
      // Get question counts
      const { data: qCounts } = await supabase.from('admin_quiz_questions').select('quiz_id');
      const countMap: Record<string, number> = {};
      qCounts?.forEach(q => { countMap[q.quiz_id] = (countMap[q.quiz_id] || 0) + 1; });
      setQuizzes(data.map(q => ({ ...q, question_count: countMap[q.id] || 0 })));
    }
    setLoading(false);
  }

  async function openEditor(quiz?: Quiz) {
    if (quiz?.id) {
      setEditing(quiz);
      const { data: qs } = await supabase.from('admin_quiz_questions')
        .select('*').eq('quiz_id', quiz.id).order('sort_order');
      setQuestions((qs as unknown as QuizQuestion[]) || []);
      const { data: rs } = await supabase.from('admin_quiz_results')
        .select('*').eq('quiz_id', quiz.id).order('score_min');
      setResults((rs as unknown as QuizResult[]) || []);
    } else {
      setEditing({ ...emptyQuiz });
      setQuestions([]);
      setResults([]);
    }
  }

  async function saveQuiz() {
    if (!editing) return;
    const { id, ...data } = editing as any;
    try {
      let quizId = id;
      if (id) {
        await supabase.from('admin_quizzes').update(data).eq('id', id).throwOnError();
      } else {
        const { data: inserted } = await supabase.from('admin_quizzes').insert(data).select().single().throwOnError();
        quizId = inserted.id;
      }
      // Save questions
      const existingQIds = questions.filter(q => q.id).map(q => q.id!);
      // Delete removed questions
      if (existingQIds.length > 0) {
        await supabase.from('admin_quiz_questions').delete()
          .eq('quiz_id', quizId).not('id', 'in', `(${existingQIds.join(',')})`);
      } else if (id) {
        await supabase.from('admin_quiz_questions').delete().eq('quiz_id', quizId);
      }
      for (const q of questions) {
        const qData = { quiz_id: quizId, sort_order: q.sort_order, question_text: q.question_text, type: q.type, options: q.options as any, is_active: q.is_active };
        if (q.id) {
          await supabase.from('admin_quiz_questions').update(qData).eq('id', q.id);
        } else {
          await supabase.from('admin_quiz_questions').insert(qData);
        }
      }
      // Save results
      const existingRIds = results.filter(r => r.id).map(r => r.id!);
      if (existingRIds.length > 0) {
        await supabase.from('admin_quiz_results').delete()
          .eq('quiz_id', quizId).not('id', 'in', `(${existingRIds.join(',')})`);
      } else if (id) {
        await supabase.from('admin_quiz_results').delete().eq('quiz_id', quizId);
      }
      for (const r of results) {
        const rData = { quiz_id: quizId, result_key: r.result_key, title: r.title, subtitle: r.subtitle || '', description: r.description || '', image_url: r.image_url || '', characteristics: r.characteristics as any, strengths: r.strengths as any, weaknesses: r.weaknesses as any, suggestions: r.suggestions as any, score_min: r.score_min, score_max: r.score_max };
        if (r.id) {
          await supabase.from('admin_quiz_results').update(rData).eq('id', r.id);
        } else {
          await supabase.from('admin_quiz_results').insert(rData);
        }
      }
      toast.success('Quiz saved');
      setEditing(null);
      fetchQuizzes();
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    }
  }

  async function deleteQuiz(id: string) {
    if (!confirm('Delete this quiz?')) return;
    await supabase.from('admin_quizzes').delete().eq('id', id);
    toast.success('Deleted');
    fetchQuizzes();
  }

  async function toggleActive(id: string, active: boolean) {
    await supabase.from('admin_quizzes').update({ is_active: !active }).eq('id', id);
    fetchQuizzes();
  }

  // Question helpers
  function addQuestion() {
    setQuestions(prev => [...prev, { ...emptyQuestion, sort_order: prev.length }]);
  }
  function updateQuestion(idx: number, field: string, value: any) {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
  }
  function removeQuestion(idx: number) {
    setQuestions(prev => prev.filter((_, i) => i !== idx).map((q, i) => ({ ...q, sort_order: i })));
  }
  function moveQuestion(idx: number, dir: -1 | 1) {
    setQuestions(prev => {
      const arr = [...prev];
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return prev;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr.map((q, i) => ({ ...q, sort_order: i }));
    });
  }

  // Option helpers
  function updateOption(qIdx: number, oIdx: number, field: string, value: any) {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q;
      const opts = [...q.options];
      opts[oIdx] = { ...opts[oIdx], [field]: value };
      return { ...q, options: opts };
    }));
  }
  function addOption(qIdx: number) {
    setQuestions(prev => prev.map((q, i) => i === qIdx ? { ...q, options: [...q.options, { label: '', score: 0 }] } : q));
  }
  function removeOption(qIdx: number, oIdx: number) {
    setQuestions(prev => prev.map((q, i) => i === qIdx ? { ...q, options: q.options.filter((_, j) => j !== oIdx) } : q));
  }

  // Result helpers
  function addResult() {
    setResults(prev => [...prev, { ...emptyResult }]);
  }
  function updateResult(idx: number, field: string, value: any) {
    setResults(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
  }
  function removeResult(idx: number) {
    setResults(prev => prev.filter((_, i) => i !== idx));
  }
  function updateResultArray(idx: number, field: string, value: string) {
    const arr = value.split('\n').filter(Boolean);
    updateResult(idx, field, arr);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quiz Center</h1>
          <p className="text-sm text-muted-foreground">Manage personality quizzes and tests</p>
        </div>
        <Button onClick={() => openEditor()}><Plus className="h-4 w-4 mr-2" />New Quiz</Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : quizzes.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No quizzes yet. Create your first one!</CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map(q => (
            <Card key={q.id} className="overflow-hidden">
              {q.cover_url && (
                <div className="aspect-[6/4] overflow-hidden bg-muted">
                  <img src={q.cover_url} alt={q.title} className="w-full h-full object-cover" />
                </div>
              )}
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm">{q.title}</h3>
                  <div className="flex gap-1">
                    {!q.is_active && <Badge variant="secondary">Draft</Badge>}
                    {q.is_premium && <Badge variant="outline">Premium</Badge>}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{q.question_count} questions</p>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" onClick={() => openEditor(q)}><Pencil className="h-3 w-3 mr-1" />Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => toggleActive(q.id!, q.is_active)}>
                    {q.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => deleteQuiz(q.id!)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Quiz Editor Dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'Edit Quiz' : 'New Quiz'}</DialogTitle>
          </DialogHeader>

          {editing && (
            <Tabs defaultValue="details">
              <TabsList className="w-full">
                <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                <TabsTrigger value="questions" className="flex-1">Questions ({questions.length})</TabsTrigger>
                <TabsTrigger value="results" className="flex-1">Results ({results.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value })} placeholder="e.g. social-style" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Overview</Label>
                  <Textarea value={editing.overview} onChange={e => setEditing({ ...editing, overview: e.target.value })} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Description (What you'll get)</Label>
                  <Textarea value={editing.description} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={3} />
                </div>
                <ImageUploader value={editing.cover_url} onChange={url => setEditing({ ...editing, cover_url: url })} label="Cover Image (6:4)" bucket="routine-images" folder="quiz-covers" />
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Theme Color</Label>
                    <Input type="color" value={editing.theme_color} onChange={e => setEditing({ ...editing, theme_color: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch checked={editing.is_active} onCheckedChange={v => setEditing({ ...editing, is_active: v })} />
                    <Label>Active</Label>
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch checked={editing.is_premium} onCheckedChange={v => setEditing({ ...editing, is_premium: v })} />
                    <Label>Premium</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="questions" className="space-y-4 mt-4">
                {questions.map((q, qi) => (
                  <Card key={qi}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs text-muted-foreground font-mono">Q{qi + 1}</span>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveQuestion(qi, -1)}><ChevronUp className="h-3 w-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => moveQuestion(qi, 1)}><ChevronDown className="h-3 w-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeQuestion(qi)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                      <Input value={q.question_text} onChange={e => updateQuestion(qi, 'question_text', e.target.value)} placeholder="Question text" />
                      <Select value={q.type} onValueChange={v => updateQuestion(qi, 'type', v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="single-select">Single Select</SelectItem>
                          <SelectItem value="multi-select">Multi Select</SelectItem>
                          <SelectItem value="yes-no">Yes / No</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="space-y-2">
                        <Label className="text-xs">Options</Label>
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex gap-2 items-center">
                            <Input value={opt.emoji || ''} onChange={e => updateOption(qi, oi, 'emoji', e.target.value)} className="w-14" placeholder="😊" />
                            <Input value={opt.label} onChange={e => updateOption(qi, oi, 'label', e.target.value)} placeholder="Option label" className="flex-1" />
                            <Input type="number" value={opt.score ?? 0} onChange={e => updateOption(qi, oi, 'score', parseInt(e.target.value) || 0)} className="w-16" placeholder="Score" />
                            <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => removeOption(qi, oi)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        ))}
                        <Button size="sm" variant="outline" onClick={() => addOption(qi)}><Plus className="h-3 w-3 mr-1" />Option</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button onClick={addQuestion} variant="outline" className="w-full"><Plus className="h-4 w-4 mr-2" />Add Question</Button>
              </TabsContent>

              <TabsContent value="results" className="space-y-4 mt-4">
                {results.map((r, ri) => (
                  <Card key={ri}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <span className="text-xs text-muted-foreground font-mono">Result {ri + 1}</span>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => removeResult(ri)}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Input value={r.result_key} onChange={e => updateResult(ri, 'result_key', e.target.value)} placeholder="Key (e.g. introvert)" />
                        <Input value={r.title} onChange={e => updateResult(ri, 'title', e.target.value)} placeholder="Title" />
                      </div>
                      <Input value={r.subtitle} onChange={e => updateResult(ri, 'subtitle', e.target.value)} placeholder="Subtitle" />
                      <Textarea value={r.description} onChange={e => updateResult(ri, 'description', e.target.value)} placeholder="Description" rows={2} />
                      <ImageUploader value={r.image_url} onChange={url => updateResult(ri, 'image_url', url)} label="Result Image" bucket="routine-images" folder="quiz-results" />
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Score Min</Label>
                          <Input type="number" value={r.score_min} onChange={e => updateResult(ri, 'score_min', parseInt(e.target.value) || 0)} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Score Max</Label>
                          <Input type="number" value={r.score_max} onChange={e => updateResult(ri, 'score_max', parseInt(e.target.value) || 0)} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Characteristics (one per line)</Label>
                        <Textarea value={(r.characteristics || []).join('\n')} onChange={e => updateResultArray(ri, 'characteristics', e.target.value)} rows={3} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Strengths (one per line)</Label>
                        <Textarea value={(r.strengths || []).join('\n')} onChange={e => updateResultArray(ri, 'strengths', e.target.value)} rows={3} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Weaknesses (one per line)</Label>
                        <Textarea value={(r.weaknesses || []).join('\n')} onChange={e => updateResultArray(ri, 'weaknesses', e.target.value)} rows={3} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Suggestions (one per line)</Label>
                        <Textarea value={(r.suggestions || []).join('\n')} onChange={e => updateResultArray(ri, 'suggestions', e.target.value)} rows={3} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button onClick={addResult} variant="outline" className="w-full"><Plus className="h-4 w-4 mr-2" />Add Result</Button>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveQuiz}>Save Quiz</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
