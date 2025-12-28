import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Copy, Check, Sparkles, Mail } from 'lucide-react';
import { toast } from 'sonner';

const EMAIL_TYPES = [
  { value: 'first_session', label: 'First Session Welcome', description: 'Welcome email for the first class' },
  { value: 'session_reminder', label: 'Session Reminder', description: 'Reminder about upcoming session' },
  { value: 'class_link', label: 'Class Link Announcement', description: 'Share meeting link' },
  { value: 'homework', label: 'Homework Assignment', description: 'Assign and explain homework' },
  { value: 'last_session', label: 'Last Session Wrap-up', description: 'Celebrate completion' },
  { value: 'custom_reminder', label: 'Custom Reminder', description: 'Custom message based on context' },
];

interface EmailContent {
  english: { subject: string; body: string };
  farsi: { subject: string; body: string };
}

interface GeneratedEmail {
  email_type: string;
  round_name: string;
  program_title: string;
  content: EmailContent;
}

export function EmailGenerator() {
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [emailType, setEmailType] = useState<string>('first_session');
  const [customContext, setCustomContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState<GeneratedEmail | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch active rounds
  const { data: rounds, isLoading: roundsLoading } = useQuery({
    queryKey: ['admin-rounds-for-email'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_rounds')
        .select(`
          id,
          round_name,
          round_number,
          program_slug,
          status,
          start_date
        `)
        .in('status', ['active', 'upcoming'])
        .order('start_date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleGenerate = async () => {
    if (!selectedRound) {
      toast.error('Please select a round');
      return;
    }

    setIsGenerating(true);
    setGeneratedEmail(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-email-content', {
        body: {
          round_id: selectedRound,
          email_type: emailType,
          custom_context: customContext || undefined,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setGeneratedEmail(data);
      toast.success('Email content generated!');
    } catch (err) {
      console.error('Error generating email:', err);
      toast.error('Failed to generate email content');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => copyToClipboard(text, field)}
      className="h-8 px-2"
    >
      {copiedField === field ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Email Generator
          </CardTitle>
          <CardDescription>
            Generate bilingual email content for Mailchimp campaigns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Round Selection */}
          <div className="space-y-2">
            <Label>Select Round</Label>
            <Select value={selectedRound} onValueChange={setSelectedRound}>
              <SelectTrigger>
                <SelectValue placeholder={roundsLoading ? "Loading..." : "Choose a round"} />
              </SelectTrigger>
              <SelectContent>
                {rounds?.map((round) => (
                  <SelectItem key={round.id} value={round.id}>
                    {round.round_name} ({round.program_slug})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Email Type */}
          <div className="space-y-3">
            <Label>Email Type</Label>
            <RadioGroup value={emailType} onValueChange={setEmailType} className="grid gap-2">
              {EMAIL_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-3">
                  <RadioGroupItem value={type.value} id={type.value} />
                  <Label htmlFor={type.value} className="flex flex-col cursor-pointer">
                    <span className="font-medium">{type.label}</span>
                    <span className="text-xs text-muted-foreground">{type.description}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Custom Context */}
          <div className="space-y-2">
            <Label htmlFor="context">Additional Context (Optional)</Label>
            <Textarea
              id="context"
              placeholder="Add any specific details, dates, homework descriptions, or special instructions..."
              value={customContext}
              onChange={(e) => setCustomContext(e.target.value)}
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedRound}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Email Content
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Content */}
      {generatedEmail && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* English Version */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-4 w-4" />
                English Version
              </CardTitle>
              <CardDescription>
                {generatedEmail.program_title} - {generatedEmail.round_name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Subject</Label>
                  <CopyButton text={generatedEmail.content.english.subject} field="en-subject" />
                </div>
                <div className="p-3 bg-muted rounded-md text-sm font-medium">
                  {generatedEmail.content.english.subject}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Body</Label>
                  <CopyButton text={generatedEmail.content.english.body} field="en-body" />
                </div>
                <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap max-h-96 overflow-y-auto">
                  {generatedEmail.content.english.body}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Farsi Version */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-4 w-4" />
                نسخه فارسی
              </CardTitle>
              <CardDescription dir="rtl">
                {generatedEmail.program_title} - {generatedEmail.round_name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">موضوع</Label>
                  <CopyButton text={generatedEmail.content.farsi.subject} field="fa-subject" />
                </div>
                <div className="p-3 bg-muted rounded-md text-sm font-medium" dir="rtl">
                  {generatedEmail.content.farsi.subject}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">متن</Label>
                  <CopyButton text={generatedEmail.content.farsi.body} field="fa-body" />
                </div>
                <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap max-h-96 overflow-y-auto" dir="rtl">
                  {generatedEmail.content.farsi.body}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
