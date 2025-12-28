import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Loader2, X, Plus, Search, Tag, Users, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface MemberInfo {
  email: string;
  status: string;
  tags: string[];
  merge_fields: Record<string, string>;
  timestamp_signup: string;
  last_changed: string;
}

interface ProgramWithRounds {
  id: string;
  slug: string;
  title: string;
  mailchimp_tags: string[];
  mailchimp_program_name: string | null;
  price_amount: number;
  is_free_on_ios: boolean;
  rounds: {
    id: string;
    round_name: string;
    round_number: number;
    status: string;
    mailchimp_tags: string[];
  }[];
}

interface AutoTagProgress {
  tagType: 'paid_customer' | 'free_customer';
  total: number;
  processed: number;
  tagged: number;
  alreadyTagged: number;
  notFound: number;
  failed: number;
}

export function MailchimpTagManager() {
  const queryClient = useQueryClient();
  
  // Bulk rename state
  const [oldTagName, setOldTagName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  
  // New tag inputs per program/round
  const [newProgramTags, setNewProgramTags] = useState<Record<string, string>>({});
  const [newRoundTags, setNewRoundTags] = useState<Record<string, string>>({});
  
  // Expanded programs state
  const [expandedPrograms, setExpandedPrograms] = useState<Set<string>>(new Set());
  
  // Member lookup state
  const [lookupEmail, setLookupEmail] = useState('');
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [memberLoading, setMemberLoading] = useState(false);
  const [newMemberTag, setNewMemberTag] = useState('');

  // Auto-tagging state with progress
  const [autoTagProgress, setAutoTagProgress] = useState<AutoTagProgress | null>(null);

  // Fetch programs with their rounds
  const { data: programsWithRounds, isLoading: programsLoading } = useQuery({
    queryKey: ['programs-with-rounds-tags'],
    queryFn: async () => {
      // Fetch programs
      const { data: programs, error: programError } = await supabase
        .from('program_catalog')
        .select('id, slug, title, mailchimp_tags, mailchimp_program_name, price_amount, is_free_on_ios')
        .order('title');
      
      if (programError) throw programError;

      // Fetch rounds
      const { data: rounds, error: roundError } = await supabase
        .from('program_rounds')
        .select('id, program_slug, round_name, round_number, status, mailchimp_tags')
        .order('round_number');

      if (roundError) throw roundError;

      // Combine programs with their rounds
      const programsMap: ProgramWithRounds[] = (programs || []).map(program => ({
        ...program,
        mailchimp_tags: (program.mailchimp_tags as string[] | null) || [],
        rounds: (rounds || [])
          .filter(r => r.program_slug === program.slug)
          .map(r => ({
            ...r,
            mailchimp_tags: (r.mailchimp_tags as string[] | null) || []
          }))
      }));

      return programsMap;
    }
  });

  // Get all unique tags across all programs and rounds
  const allTags = new Set<string>();
  programsWithRounds?.forEach(p => {
    p.mailchimp_tags.forEach(t => allTags.add(t));
    p.rounds.forEach(r => r.mailchimp_tags.forEach(t => allTags.add(t)));
  });

  // Count enrollments for auto-tagging preview
  const { data: enrollmentCounts } = useQuery({
    queryKey: ['enrollment-counts'],
    queryFn: async () => {
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('program_slug')
        .eq('status', 'active');

      const { data: programs } = await supabase
        .from('program_catalog')
        .select('slug, price_amount, is_free_on_ios');

      if (!enrollments || !programs) return { paid: 0, free: 0 };

      const programMap = new Map(programs.map(p => [p.slug, p]));
      let paid = 0;
      let free = 0;

      enrollments.forEach(e => {
        const program = programMap.get(e.program_slug);
        if (program) {
          if (program.price_amount > 0 && !program.is_free_on_ios) {
            paid++;
          } else {
            free++;
          }
        }
      });

      return { paid, free };
    }
  });

  // Bulk rename mutation
  const bulkRenameMutation = useMutation({
    mutationFn: async ({ oldTag, newTag }: { oldTag: string; newTag: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('mailchimp-bulk-rename-tag', {
        body: { old_tag: oldTag, new_tag: newTag }
      });

      if (response.error) throw response.error;
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(`Renamed tag in ${data.updated_count} programs`);
      queryClient.invalidateQueries({ queryKey: ['programs-with-rounds-tags'] });
      setOldTagName('');
      setNewTagName('');
    },
    onError: (error: Error) => {
      toast.error(`Failed to rename tag: ${error.message}`);
    }
  });

  // Update program tags mutation
  const updateProgramTagsMutation = useMutation({
    mutationFn: async ({ slug, tags }: { slug: string; tags: string[] }) => {
      const { error } = await supabase
        .from('program_catalog')
        .update({ mailchimp_tags: tags })
        .eq('slug', slug);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs-with-rounds-tags'] });
      toast.success('Program tags updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update tags: ${error.message}`);
    }
  });

  // Update round tags mutation
  const updateRoundTagsMutation = useMutation({
    mutationFn: async ({ roundId, tags }: { roundId: string; tags: string[] }) => {
      const { error } = await supabase
        .from('program_rounds')
        .update({ mailchimp_tags: tags })
        .eq('id', roundId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs-with-rounds-tags'] });
      toast.success('Round tags updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update round tags: ${error.message}`);
    }
  });

  // Handle bulk rename
  const handleBulkRename = () => {
    if (!oldTagName.trim() || !newTagName.trim()) {
      toast.error('Please enter both old and new tag names');
      return;
    }
    bulkRenameMutation.mutate({ oldTag: oldTagName.trim(), newTag: newTagName.trim() });
  };

  // Handle program tag operations
  const handleRemoveProgramTag = (slug: string, currentTags: string[], tagToRemove: string) => {
    updateProgramTagsMutation.mutate({
      slug,
      tags: currentTags.filter(t => t !== tagToRemove)
    });
  };

  const handleAddProgramTag = (slug: string, currentTags: string[]) => {
    const newTag = newProgramTags[slug]?.trim();
    if (!newTag) return;
    if (currentTags.includes(newTag)) {
      toast.error('Tag already exists');
      return;
    }
    updateProgramTagsMutation.mutate({
      slug,
      tags: [...currentTags, newTag]
    });
    setNewProgramTags(prev => ({ ...prev, [slug]: '' }));
  };

  // Handle round tag operations
  const handleRemoveRoundTag = (roundId: string, currentTags: string[], tagToRemove: string) => {
    updateRoundTagsMutation.mutate({
      roundId,
      tags: currentTags.filter(t => t !== tagToRemove)
    });
  };

  const handleAddRoundTag = (roundId: string, currentTags: string[]) => {
    const newTag = newRoundTags[roundId]?.trim();
    if (!newTag) return;
    if (currentTags.includes(newTag)) {
      toast.error('Tag already exists');
      return;
    }
    updateRoundTagsMutation.mutate({
      roundId,
      tags: [...currentTags, newTag]
    });
    setNewRoundTags(prev => ({ ...prev, [roundId]: '' }));
  };

  // Toggle program expansion
  const toggleProgram = (slug: string) => {
    setExpandedPrograms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slug)) {
        newSet.delete(slug);
      } else {
        newSet.add(slug);
      }
      return newSet;
    });
  };

  // Member lookup function
  const lookupMember = async () => {
    if (!lookupEmail.trim()) {
      toast.error('Please enter an email');
      return;
    }

    setMemberLoading(true);
    setMemberInfo(null);

    try {
      const { data, error } = await supabase.functions.invoke('mailchimp-manage-member', {
        body: { action: 'lookup', email: lookupEmail.trim() }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      if (data.found === false) throw new Error('Member not found');

      setMemberInfo({
        ...data.member,
        tags: data.member.tags?.map((t: { name: string }) => t.name) || []
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to lookup member');
    } finally {
      setMemberLoading(false);
    }
  };

  // Add tag to member
  const addTagToMember = async (tag: string) => {
    if (!memberInfo) return;

    try {
      const { data, error } = await supabase.functions.invoke('mailchimp-manage-member', {
        body: { action: 'add_tags', email: memberInfo.email, tags: [tag] }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success(`Added tag "${tag}" to ${memberInfo.email}`);
      setMemberInfo(prev => prev ? { ...prev, tags: [...prev.tags, tag] } : null);
      setNewMemberTag('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add tag');
    }
  };

  // Remove tag from member
  const removeTagFromMember = async (tag: string) => {
    if (!memberInfo) return;

    try {
      const { data, error } = await supabase.functions.invoke('mailchimp-manage-member', {
        body: { action: 'remove_tags', email: memberInfo.email, tags: [tag] }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success(`Removed tag "${tag}" from ${memberInfo.email}`);
      setMemberInfo(prev => prev ? { ...prev, tags: prev.tags.filter(t => t !== tag) } : null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove tag');
    }
  };

  // Auto-tag enrollments with progress tracking
  const handleAutoTag = async (tagType: 'paid_customer' | 'free_customer') => {
    // Start with initial progress state
    setAutoTagProgress({
      tagType,
      total: tagType === 'paid_customer' ? (enrollmentCounts?.paid || 0) : (enrollmentCounts?.free || 0),
      processed: 0,
      tagged: 0,
      alreadyTagged: 0,
      notFound: 0,
      failed: 0
    });

    try {
      const { data, error } = await supabase.functions.invoke('mailchimp-tag-enrollments', {
        body: { tag_type: tagType, preview_only: false }
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);

      const { results } = data;
      
      // Update to final progress
      setAutoTagProgress({
        tagType,
        total: results.total,
        processed: results.total,
        tagged: results.tagged,
        alreadyTagged: results.already_tagged,
        notFound: results.not_found,
        failed: results.failed
      });

      toast.success(
        `Tagged ${results.tagged} users with "${tagType}". ` +
        `Already tagged: ${results.already_tagged}, Not found: ${results.not_found}`
      );
      
      // Clear progress after 3 seconds
      setTimeout(() => setAutoTagProgress(null), 3000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to auto-tag');
      setAutoTagProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Bulk Rename Tag */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Bulk Rename Tag
          </CardTitle>
          <CardDescription>
            Rename a tag across all programs and rounds at once
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Old tag name"
              value={oldTagName}
              onChange={(e) => setOldTagName(e.target.value)}
              className="max-w-[200px]"
            />
            <span className="text-muted-foreground">→</span>
            <Input
              placeholder="New tag name"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              className="max-w-[200px]"
            />
            <Button
              onClick={handleBulkRename}
              disabled={bulkRenameMutation.isPending}
            >
              {bulkRenameMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Rename All'
              )}
            </Button>
          </div>

          {allTags.size > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Existing tags (click to select):</p>
              <div className="flex flex-wrap gap-1">
                {Array.from(allTags).sort().map(tag => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => setOldTagName(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-Tag by Enrollment Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Auto-Tag by Enrollment Type
          </CardTitle>
          <CardDescription>
            Automatically tag customers based on their program enrollments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress bar when auto-tagging */}
          {autoTagProgress && (
            <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Tagging {autoTagProgress.tagType === 'paid_customer' ? 'Paid' : 'Free'} Customers...
                </h4>
                <span className="text-sm text-muted-foreground">
                  {autoTagProgress.processed === autoTagProgress.total 
                    ? 'Complete!' 
                    : `Processing ${autoTagProgress.total} users...`
                  }
                </span>
              </div>
              <Progress 
                value={autoTagProgress.total > 0 
                  ? (autoTagProgress.processed / autoTagProgress.total) * 100 
                  : autoTagProgress.processed === 0 ? 0 : 100
                } 
                className="h-2"
              />
              <div className="flex gap-4 text-sm">
                <span className="text-green-600">Tagged: {autoTagProgress.tagged}</span>
                <span className="text-blue-600">Already tagged: {autoTagProgress.alreadyTagged}</span>
                <span className="text-yellow-600">Not found: {autoTagProgress.notFound}</span>
                {autoTagProgress.failed > 0 && (
                  <span className="text-red-600">Failed: {autoTagProgress.failed}</span>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Paid Customers</h4>
                  <p className="text-sm text-muted-foreground">
                    {enrollmentCounts?.paid || 0} enrollments in paid programs
                  </p>
                </div>
                <Badge variant="default">paid_customer</Badge>
              </div>
              <Button
                onClick={() => handleAutoTag('paid_customer')}
                disabled={autoTagProgress !== null}
                className="w-full"
              >
                {autoTagProgress?.tagType === 'paid_customer' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Tag className="h-4 w-4 mr-2" />
                )}
                Tag All Paid Customers
              </Button>
            </div>

            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Free Customers</h4>
                  <p className="text-sm text-muted-foreground">
                    {enrollmentCounts?.free || 0} enrollments in free programs
                  </p>
                </div>
                <Badge variant="secondary">free_customer</Badge>
              </div>
              <Button
                variant="secondary"
                onClick={() => handleAutoTag('free_customer')}
                disabled={autoTagProgress !== null}
                className="w-full"
              >
                {autoTagProgress?.tagType === 'free_customer' ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Tag className="h-4 w-4 mr-2" />
                )}
                Tag All Free Customers
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Programs & Rounds Tags Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Programs & Rounds Tags
          </CardTitle>
          <CardDescription>
            Configure Mailchimp tags for each program and round. Click on a program to expand its rounds.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {programsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {programsWithRounds?.map(program => (
                <Collapsible
                  key={program.slug}
                  open={expandedPrograms.has(program.slug)}
                  onOpenChange={() => toggleProgram(program.slug)}
                >
                  <div className="border rounded-lg">
                    {/* Program Row */}
                    <div className="flex items-center gap-3 p-3 bg-muted/30">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          {expandedPrograms.has(program.slug) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{program.title}</span>
                          {program.price_amount === 0 || program.is_free_on_ios ? (
                            <Badge variant="outline" className="text-xs">Free</Badge>
                          ) : (
                            <Badge variant="default" className="text-xs">${program.price_amount / 100}</Badge>
                          )}
                          {program.rounds.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({program.rounds.length} rounds)
                            </span>
                          )}
                        </div>
                        {program.mailchimp_program_name && (
                          <p className="text-xs text-muted-foreground truncate">
                            Mailchimp: {program.mailchimp_program_name}
                          </p>
                        )}
                      </div>

                      {/* Program Tags */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {program.mailchimp_tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="gap-1">
                            {tag}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveProgramTag(program.slug, program.mailchimp_tags, tag);
                              }}
                              className="hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>

                      {/* Add tag input */}
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        <Input
                          placeholder="Add tag"
                          value={newProgramTags[program.slug] || ''}
                          onChange={(e) => setNewProgramTags(prev => ({ ...prev, [program.slug]: e.target.value }))}
                          className="h-7 w-24 text-xs"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddProgramTag(program.slug, program.mailchimp_tags);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => handleAddProgramTag(program.slug, program.mailchimp_tags)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Rounds */}
                    <CollapsibleContent>
                      {program.rounds.length === 0 ? (
                        <div className="p-3 pl-12 text-sm text-muted-foreground">
                          No rounds for this program
                        </div>
                      ) : (
                        <div className="divide-y">
                          {program.rounds.map(round => (
                            <div key={round.id} className="flex items-center gap-3 p-3 pl-12">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm">{round.round_name}</span>
                                  <Badge 
                                    variant={round.status === 'active' ? 'default' : 'outline'} 
                                    className="text-xs"
                                  >
                                    {round.status}
                                  </Badge>
                                </div>
                              </div>

                              {/* Round Tags */}
                              <div className="flex items-center gap-1 flex-wrap">
                                {round.mailchimp_tags.length === 0 ? (
                                  <span className="text-xs text-muted-foreground">(no tags)</span>
                                ) : (
                                  round.mailchimp_tags.map(tag => (
                                    <Badge key={tag} variant="outline" className="gap-1">
                                      {tag}
                                      <button
                                        onClick={() => handleRemoveRoundTag(round.id, round.mailchimp_tags, tag)}
                                        className="hover:text-destructive"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </Badge>
                                  ))
                                )}
                              </div>

                              {/* Add tag input for round */}
                              <div className="flex items-center gap-1">
                                <Input
                                  placeholder="Add tag"
                                  value={newRoundTags[round.id] || ''}
                                  onChange={(e) => setNewRoundTags(prev => ({ ...prev, [round.id]: e.target.value }))}
                                  className="h-7 w-24 text-xs"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleAddRoundTag(round.id, round.mailchimp_tags);
                                    }
                                  }}
                                />
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleAddRoundTag(round.id, round.mailchimp_tags)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mailchimp Member Lookup */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Mailchimp Member Lookup
          </CardTitle>
          <CardDescription>
            Search for a Mailchimp member by email to view and manage their tags
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter email address"
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && lookupMember()}
              className="max-w-md"
            />
            <Button onClick={lookupMember} disabled={memberLoading}>
              {memberLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {memberInfo && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <span className="ml-2 font-medium">{memberInfo.email}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant={memberInfo.status === 'subscribed' ? 'default' : 'secondary'} className="ml-2">
                    {memberInfo.status}
                  </Badge>
                </div>
                {memberInfo.merge_fields?.FNAME && (
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <span className="ml-2">{memberInfo.merge_fields.FNAME} {memberInfo.merge_fields.LNAME}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Signed up:</span>
                  <span className="ml-2">{new Date(memberInfo.timestamp_signup).toLocaleDateString()}</span>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Tags:</p>
                <div className="flex flex-wrap gap-1">
                  {memberInfo.tags.length === 0 ? (
                    <span className="text-sm text-muted-foreground">(no tags)</span>
                  ) : (
                    memberInfo.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          onClick={() => removeTagFromMember(tag)}
                          className="hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add new tag"
                  value={newMemberTag}
                  onChange={(e) => setNewMemberTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && newMemberTag && addTagToMember(newMemberTag)}
                  className="max-w-[200px]"
                />
                <Button
                  size="sm"
                  onClick={() => addTagToMember(newMemberTag)}
                  disabled={!newMemberTag}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Tag
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
