import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Search, Tag, Users, Loader2, X, Plus, Eye, Send } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface MemberInfo {
  email: string;
  status: string;
  tags: string[];
  merge_fields: Record<string, any>;
  created: string;
  updated: string;
}

interface TagResult {
  tagged: number;
  already_tagged: number;
  not_found: number;
  failed: number;
  errors: string[];
}

export function MailchimpTagManager() {
  const { toast } = useToast();
  
  // Tag by Program state
  const [selectedProgram, setSelectedProgram] = useState<string>('');
  const [selectedRound, setSelectedRound] = useState<string>('');
  const [programTags, setProgramTags] = useState<string[]>(['paid_customer']);
  const [newProgramTag, setNewProgramTag] = useState('');
  const [isPreviewingProgram, setIsPreviewingProgram] = useState(false);
  const [isTaggingProgram, setIsTaggingProgram] = useState(false);
  const [programPreview, setProgramPreview] = useState<{ count: number; emails: string[] } | null>(null);
  const [programResult, setProgramResult] = useState<TagResult | null>(null);

  // Member Lookup state
  const [lookupEmail, setLookupEmail] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [memberNotFound, setMemberNotFound] = useState(false);
  const [newMemberTag, setNewMemberTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [removingTag, setRemovingTag] = useState<string | null>(null);

  // Fetch programs
  const { data: programs } = useQuery({
    queryKey: ['programs-for-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_catalog')
        .select('slug, title')
        .eq('is_active', true)
        .order('title');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch rounds for selected program
  const { data: rounds } = useQuery({
    queryKey: ['rounds-for-tags', selectedProgram],
    queryFn: async () => {
      if (!selectedProgram) return [];
      const { data, error } = await supabase
        .from('program_rounds')
        .select('id, round_name, round_number')
        .eq('program_slug', selectedProgram)
        .order('round_number', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProgram
  });

  // Add tag to program tags list
  const addProgramTag = () => {
    if (newProgramTag && !programTags.includes(newProgramTag)) {
      setProgramTags([...programTags, newProgramTag]);
      setNewProgramTag('');
    }
  };

  // Remove tag from program tags list
  const removeProgramTag = (tag: string) => {
    setProgramTags(programTags.filter(t => t !== tag));
  };

  // Preview program tagging
  const previewProgramTagging = async () => {
    if (!selectedProgram || programTags.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a program and add at least one tag",
        variant: "destructive"
      });
      return;
    }

    setIsPreviewingProgram(true);
    setProgramPreview(null);
    setProgramResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('mailchimp-tag-by-program', {
        body: {
          program_slug: selectedProgram,
          round_id: selectedRound || undefined,
          tags: programTags,
          preview_only: true
        }
      });

      if (error) throw error;

      if (data.success) {
        setProgramPreview({ count: data.count, emails: data.emails });
        toast({
          title: "Preview Ready",
          description: `Found ${data.count} customers to tag`
        });
      }
    } catch (error) {
      toast({
        title: "Preview Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsPreviewingProgram(false);
    }
  };

  // Apply tags to program customers
  const applyProgramTags = async () => {
    if (!selectedProgram || programTags.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a program and add at least one tag",
        variant: "destructive"
      });
      return;
    }

    setIsTaggingProgram(true);
    setProgramResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('mailchimp-tag-by-program', {
        body: {
          program_slug: selectedProgram,
          round_id: selectedRound || undefined,
          tags: programTags,
          preview_only: false
        }
      });

      if (error) throw error;

      if (data.success) {
        setProgramResult(data.results);
        toast({
          title: "Tagging Complete",
          description: `Tagged: ${data.results.tagged}, Already Tagged: ${data.results.already_tagged}, Not Found: ${data.results.not_found}`
        });
      }
    } catch (error) {
      toast({
        title: "Tagging Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsTaggingProgram(false);
    }
  };

  // Lookup member
  const lookupMember = async () => {
    if (!lookupEmail) {
      toast({
        title: "Validation Error",
        description: "Please enter an email address",
        variant: "destructive"
      });
      return;
    }

    setIsLookingUp(true);
    setMemberInfo(null);
    setMemberNotFound(false);

    try {
      const { data, error } = await supabase.functions.invoke('mailchimp-manage-member', {
        body: {
          action: 'lookup',
          email: lookupEmail
        }
      });

      if (error) throw error;

      if (data.success) {
        if (data.found) {
          setMemberInfo(data.member);
        } else {
          setMemberNotFound(true);
        }
      }
    } catch (error) {
      toast({
        title: "Lookup Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  // Add tag to member
  const addTagToMember = async () => {
    if (!newMemberTag || !memberInfo) return;

    setIsAddingTag(true);
    try {
      const { data, error } = await supabase.functions.invoke('mailchimp-manage-member', {
        body: {
          action: 'add_tags',
          email: memberInfo.email,
          tags: [newMemberTag]
        }
      });

      if (error) throw error;

      if (data.success) {
        setMemberInfo({
          ...memberInfo,
          tags: [...memberInfo.tags, newMemberTag]
        });
        setNewMemberTag('');
        toast({
          title: "Tag Added",
          description: `Added "${newMemberTag}" to ${memberInfo.email}`
        });
      }
    } catch (error) {
      toast({
        title: "Failed to Add Tag",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsAddingTag(false);
    }
  };

  // Remove tag from member
  const removeTagFromMember = async (tag: string) => {
    if (!memberInfo) return;

    setRemovingTag(tag);
    try {
      const { data, error } = await supabase.functions.invoke('mailchimp-manage-member', {
        body: {
          action: 'remove_tags',
          email: memberInfo.email,
          tags: [tag]
        }
      });

      if (error) throw error;

      if (data.success) {
        setMemberInfo({
          ...memberInfo,
          tags: memberInfo.tags.filter(t => t !== tag)
        });
        toast({
          title: "Tag Removed",
          description: `Removed "${tag}" from ${memberInfo.email}`
        });
      }
    } catch (error) {
      toast({
        title: "Failed to Remove Tag",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setRemovingTag(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tag Customers by Program */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Tag Customers by Program
          </CardTitle>
          <CardDescription>
            Add Mailchimp tags to all customers who purchased a specific program
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Program</Label>
              <Select value={selectedProgram} onValueChange={(value) => {
                setSelectedProgram(value);
                setSelectedRound('');
                setProgramPreview(null);
                setProgramResult(null);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a program" />
                </SelectTrigger>
                <SelectContent>
                  {programs?.map(p => (
                    <SelectItem key={p.slug} value={p.slug}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Round (Optional)</Label>
              <Select value={selectedRound} onValueChange={setSelectedRound} disabled={!selectedProgram}>
                <SelectTrigger>
                  <SelectValue placeholder="All Rounds" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Rounds</SelectItem>
                  {rounds?.map(r => (
                    <SelectItem key={r.id} value={r.id}>{r.round_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags to Apply</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {programTags.map(tag => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button onClick={() => removeProgramTag(tag)} className="ml-1 hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={newProgramTag}
                onChange={(e) => setNewProgramTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addProgramTag()}
              />
              <Button variant="outline" onClick={addProgramTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={previewProgramTagging} disabled={isPreviewingProgram || !selectedProgram}>
              {isPreviewingProgram ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
              Preview
            </Button>
            <Button onClick={applyProgramTags} disabled={isTaggingProgram || !selectedProgram}>
              {isTaggingProgram ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Apply Tags to Mailchimp
            </Button>
          </div>

          {programPreview && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="font-medium">Preview: {programPreview.count} customers will be tagged</p>
              {programPreview.emails.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  Sample: {programPreview.emails.slice(0, 5).join(', ')}{programPreview.count > 5 && '...'}
                </p>
              )}
            </div>
          )}

          {programResult && (
            <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
              <p className="font-medium">Tagging Results:</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="default">{programResult.tagged}</Badge>
                  <span>Tagged</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{programResult.already_tagged}</Badge>
                  <span>Already Tagged</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{programResult.not_found}</Badge>
                  <span>Not Found</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">{programResult.failed}</Badge>
                  <span>Failed</span>
                </div>
              </div>
              {programResult.errors.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-destructive">Errors:</p>
                  <ul className="text-xs text-muted-foreground max-h-20 overflow-y-auto">
                    {programResult.errors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Lookup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Member Lookup
          </CardTitle>
          <CardDescription>
            Search for a member by email to view and manage their tags
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter email address..."
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && lookupMember()}
            />
            <Button onClick={lookupMember} disabled={isLookingUp}>
              {isLookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {memberNotFound && (
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-muted-foreground">Member not found in Mailchimp</p>
            </div>
          )}

          {memberInfo && (
            <div className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{memberInfo.email}</p>
                  <p className="text-sm text-muted-foreground">Status: {memberInfo.status}</p>
                </div>
                <Badge variant={memberInfo.status === 'subscribed' ? 'default' : 'secondary'}>
                  {memberInfo.status}
                </Badge>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-2">Current Tags:</p>
                <div className="flex flex-wrap gap-2">
                  {memberInfo.tags.length === 0 ? (
                    <span className="text-sm text-muted-foreground">No tags</span>
                  ) : (
                    memberInfo.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button 
                          onClick={() => removeTagFromMember(tag)} 
                          disabled={removingTag === tag}
                          className="ml-1 hover:text-destructive"
                        >
                          {removingTag === tag ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add new tag..."
                  value={newMemberTag}
                  onChange={(e) => setNewMemberTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTagToMember()}
                />
                <Button variant="outline" onClick={addTagToMember} disabled={isAddingTag || !newMemberTag}>
                  {isAddingTag ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                </Button>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-2">Merge Fields:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(memberInfo.merge_fields || {}).map(([key, value]) => (
                    value && (
                      <div key={key} className="flex gap-2">
                        <span className="font-medium">{key}:</span>
                        <span className="text-muted-foreground">{String(value)}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
