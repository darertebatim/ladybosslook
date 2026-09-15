import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Mail, Eye, Send, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PreviewResult {
  subject: string;
  html: string;
  language: string;
  round: { id: string; round_name: string | null; round_number: number | null } | null;
}

export function EnrollmentEmailsManager() {
  const [programSlug, setProgramSlug] = useState<string>('');
  const [roundId, setRoundId] = useState<string>('auto');
  const [previewName, setPreviewName] = useState<string>('');
  const [testEmail, setTestEmail] = useState<string>('');
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: programs, isLoading: programsLoading } = useQuery({
    queryKey: ['admin-programs-for-enrollment-email'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_catalog')
        .select('slug, title, is_active, language')
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: rounds } = useQuery({
    queryKey: ['admin-rounds-for-enrollment-email', programSlug],
    enabled: !!programSlug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_rounds')
        .select('id, round_name, round_number, status, start_date')
        .eq('program_slug', programSlug)
        .order('round_number', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    setRoundId('auto');
    setPreview(null);
  }, [programSlug]);

  const selectedProgram = useMemo(
    () => programs?.find((p) => p.slug === programSlug),
    [programs, programSlug]
  );

  const buildBody = (extra: Record<string, unknown> = {}) => ({
    program_slug: programSlug,
    round_id: roundId !== 'auto' ? roundId : undefined,
    preview_name: previewName || undefined,
    ...extra,
  });

  const handlePreview = async () => {
    if (!programSlug) {
      toast.error('Pick a program first');
      return;
    }
    setLoadingPreview(true);
    setPreview(null);
    try {
      const { data, error } = await supabase.functions.invoke('send-enrollment-confirmation', {
        body: buildBody({ preview: true }),
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(String(data.error));
        return;
      }
      setPreview(data as PreviewResult);
    } catch (err) {
      console.error('Preview failed', err);
      toast.error('Could not load the email preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSendTest = async () => {
    if (!programSlug) {
      toast.error('Pick a program first');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(testEmail)) {
      toast.error('Enter a valid email address');
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-enrollment-confirmation', {
        body: buildBody({ test_email: testEmail.trim().toLowerCase() }),
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(String(data.error));
        return;
      }
      toast.success(`Test email sent to ${testEmail}`);
    } catch (err) {
      console.error('Test send failed', err);
      toast.error('Could not send the test email');
    } finally {
      setSending(false);
    }
  };

  const copySubject = async () => {
    if (!preview) return;
    await navigator.clipboard.writeText(preview.subject);
    setCopied(true);
    toast.success('Subject copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Enrollment Emails
          </CardTitle>
          <CardDescription>
            See the exact enrollment confirmation email a student receives, and send yourself a test.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Program</Label>
              <Select value={programSlug} onValueChange={setProgramSlug}>
                <SelectTrigger>
                  <SelectValue placeholder={programsLoading ? 'Loading...' : 'Choose a program'} />
                </SelectTrigger>
                <SelectContent>
                  {programs?.map((p) => (
                    <SelectItem key={p.slug} value={p.slug}>
                      {p.title}
                      {!p.is_active ? ' (inactive)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Round</Label>
              <Select value={roundId} onValueChange={setRoundId} disabled={!programSlug}>
                <SelectTrigger>
                  <SelectValue placeholder="Automatic (same as real sends)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automatic (same as real sends)</SelectItem>
                  {rounds?.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      #{r.round_number} — {r.round_name || 'Untitled'} ({r.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Student name shown in the email (optional)</Label>
              <Input
                value={previewName}
                onChange={(e) => setPreviewName(e.target.value)}
                placeholder="e.g. Sara"
              />
            </div>

            <div className="space-y-2">
              <Label>Send a test to</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="you@example.com"
                />
                <Button onClick={handleSendTest} disabled={sending || !programSlug} variant="secondary">
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>

          <Button onClick={handlePreview} disabled={loadingPreview || !programSlug}>
            {loadingPreview ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading preview...
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Preview email
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {preview && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg">Preview</CardTitle>
              <Badge variant="outline">{preview.language === 'fa' ? 'فارسی' : 'English'}</Badge>
              {preview.round ? (
                <Badge variant="secondary">
                  Round #{preview.round.round_number} — {preview.round.round_name || 'Untitled'}
                </Badge>
              ) : (
                <Badge variant="destructive">No round matched</Badge>
              )}
              {selectedProgram && <Badge variant="outline">{selectedProgram.title}</Badge>}
            </div>
            <CardDescription>This is exactly what gets sent on enrollment. Nothing was sent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Subject</Label>
                <Button variant="ghost" size="sm" onClick={copySubject} className="h-8 px-2">
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="p-3 bg-muted rounded-md text-sm font-medium">{preview.subject}</div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Body</Label>
              <iframe
                title="Enrollment email preview"
                srcDoc={preview.html}
                className="w-full h-[70vh] rounded-md border bg-white"
                sandbox=""
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
