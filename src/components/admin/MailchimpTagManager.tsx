import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowRight, X, Plus, Search, RefreshCw, Tag, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface MemberInfo {
  email: string;
  status: string;
  tags: { id: number; name: string }[];
  merge_fields: Record<string, string>;
  timestamp_signup: string;
  timestamp_opt: string;
}

export function MailchimpTagManager() {
  const queryClient = useQueryClient();

  // Bulk rename state
  const [oldTagName, setOldTagName] = useState('');
  const [newTagName, setNewTagName] = useState('');

  // Add tag state (per program)
  const [newTagInputs, setNewTagInputs] = useState<Record<string, string>>({});

  // Member lookup state
  const [lookupEmail, setLookupEmail] = useState('');
  const [memberInfo, setMemberInfo] = useState<MemberInfo | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [memberTagInput, setMemberTagInput] = useState('');

  // Fetch all programs with their tags
  const { data: programs, isLoading: programsLoading } = useQuery({
    queryKey: ['programs-with-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('program_catalog')
        .select('id, slug, title, mailchimp_program_name, mailchimp_tags, is_active')
        .order('title');
      
      if (error) throw error;
      return data;
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
      setOldTagName('');
      setNewTagName('');
      queryClient.invalidateQueries({ queryKey: ['programs-with-tags'] });
    },
    onError: (error) => {
      toast.error(`Failed to rename tag: ${error.message}`);
    }
  });

  // Update program tags mutation
  const updateTagsMutation = useMutation({
    mutationFn: async ({ programId, tags }: { programId: string; tags: string[] }) => {
      const { error } = await supabase
        .from('program_catalog')
        .update({ mailchimp_tags: tags })
        .eq('id', programId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['programs-with-tags'] });
    },
    onError: (error) => {
      toast.error(`Failed to update tags: ${error.message}`);
    }
  });

  const handleBulkRename = () => {
    if (!oldTagName.trim() || !newTagName.trim()) {
      toast.error('Please enter both old and new tag names');
      return;
    }
    bulkRenameMutation.mutate({ oldTag: oldTagName.trim(), newTag: newTagName.trim() });
  };

  const handleRemoveTag = (programId: string, currentTags: string[], tagToRemove: string) => {
    const newTags = currentTags.filter(t => t !== tagToRemove);
    updateTagsMutation.mutate({ programId, tags: newTags });
    toast.success(`Removed tag "${tagToRemove}"`);
  };

  const handleAddTag = (programId: string, currentTags: string[]) => {
    const newTag = newTagInputs[programId]?.trim();
    if (!newTag) {
      toast.error('Please enter a tag name');
      return;
    }
    if (currentTags.includes(newTag)) {
      toast.error('Tag already exists');
      return;
    }
    updateTagsMutation.mutate({ programId, tags: [...currentTags, newTag] });
    setNewTagInputs(prev => ({ ...prev, [programId]: '' }));
    toast.success(`Added tag "${newTag}"`);
  };

  // Member lookup functions
  const lookupMember = async () => {
    if (!lookupEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    setLookupLoading(true);
    setMemberInfo(null);

    try {
      const response = await supabase.functions.invoke('mailchimp-manage-member', {
        body: { action: 'lookup', email: lookupEmail.trim() }
      });

      if (response.error) throw response.error;
      
      if (response.data.error) {
        toast.error(response.data.error);
      } else if (response.data.found === false) {
        toast.error('Member not found in Mailchimp');
      } else {
        setMemberInfo(response.data.member);
      }
    } catch (error: any) {
      toast.error(`Lookup failed: ${error.message}`);
    } finally {
      setLookupLoading(false);
    }
  };

  const addTagToMember = async () => {
    if (!memberTagInput.trim() || !memberInfo) return;

    try {
      const response = await supabase.functions.invoke('mailchimp-manage-member', {
        body: { action: 'add_tags', email: memberInfo.email, tags: [memberTagInput.trim()] }
      });

      if (response.error) throw response.error;
      
      toast.success(`Added tag "${memberTagInput}" to member`);
      setMemberTagInput('');
      lookupMember();
    } catch (error: any) {
      toast.error(`Failed to add tag: ${error.message}`);
    }
  };

  const removeTagFromMember = async (tagName: string) => {
    if (!memberInfo) return;

    try {
      const response = await supabase.functions.invoke('mailchimp-manage-member', {
        body: { action: 'remove_tags', email: memberInfo.email, tags: [tagName] }
      });

      if (response.error) throw response.error;
      
      toast.success(`Removed tag "${tagName}" from member`);
      lookupMember();
    } catch (error: any) {
      toast.error(`Failed to remove tag: ${error.message}`);
    }
  };

  // Get all unique tags across programs
  const allTags = programs?.reduce((acc, p) => {
    const tags = (p.mailchimp_tags as string[]) || [];
    tags.forEach(t => acc.add(t));
    return acc;
  }, new Set<string>()) || new Set();

  return (
    <div className="space-y-6">
      {/* Bulk Rename Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Bulk Rename Tag
          </CardTitle>
          <CardDescription>
            Rename a tag across all programs at once. Currently {allTags.size} unique tags in use.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label>Old Tag Name</Label>
              <Input
                value={oldTagName}
                onChange={(e) => setOldTagName(e.target.value)}
                placeholder="e.g., Old_Tag_Name"
              />
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground mb-2" />
            <div className="flex-1 space-y-2">
              <Label>New Tag Name</Label>
              <Input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="e.g., New_Tag_Name"
              />
            </div>
            <Button 
              onClick={handleBulkRename} 
              disabled={bulkRenameMutation.isPending}
            >
              {bulkRenameMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Rename All
            </Button>
          </div>
          {allTags.size > 0 && (
            <div className="mt-4">
              <Label className="text-sm text-muted-foreground">Existing tags (click to select):</Label>
              <div className="flex flex-wrap gap-1 mt-2">
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

      {/* Programs & Tags Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Program Tags Configuration
          </CardTitle>
          <CardDescription>
            View and edit Mailchimp tags for each program. These tags are applied to customers when they purchase.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {programsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Program</TableHead>
                  <TableHead className="w-[150px]">Mailchimp Name</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="w-[200px]">Add Tag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs?.map(program => {
                  const tags = (program.mailchimp_tags as string[]) || [];
                  return (
                    <TableRow key={program.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{program.title}</span>
                          {!program.is_active && (
                            <Badge variant="secondary" className="text-xs">Inactive</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">{program.slug}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {program.mailchimp_program_name || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {tags.length === 0 ? (
                            <span className="text-sm text-muted-foreground">No tags</span>
                          ) : (
                            tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="gap-1">
                                {tag}
                                <button
                                  onClick={() => handleRemoveTag(program.id, tags, tag)}
                                  className="hover:text-destructive ml-1"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Input
                            value={newTagInputs[program.id] || ''}
                            onChange={(e) => setNewTagInputs(prev => ({ 
                              ...prev, 
                              [program.id]: e.target.value 
                            }))}
                            placeholder="New tag..."
                            className="h-8 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleAddTag(program.id, tags);
                              }
                            }}
                          />
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleAddTag(program.id, tags)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Member Lookup Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Mailchimp Member Lookup
          </CardTitle>
          <CardDescription>
            Look up a member by email and manage their tags directly in Mailchimp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
              placeholder="Enter email address..."
              onKeyDown={(e) => e.key === 'Enter' && lookupMember()}
            />
            <Button onClick={lookupMember} disabled={lookupLoading}>
              {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {memberInfo && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="font-medium">{memberInfo.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={memberInfo.status === 'subscribed' ? 'default' : 'secondary'}>
                    {memberInfo.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Name</Label>
                  <p>{memberInfo.merge_fields?.FNAME} {memberInfo.merge_fields?.LNAME || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Signed Up</Label>
                  <p>{memberInfo.timestamp_signup ? new Date(memberInfo.timestamp_signup).toLocaleDateString() : '-'}</p>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Current Tags</Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {memberInfo.tags.length === 0 ? (
                    <span className="text-sm text-muted-foreground">No tags</span>
                  ) : (
                    memberInfo.tags.map(tag => (
                      <Badge key={tag.id} variant="secondary" className="gap-1">
                        {tag.name}
                        <button
                          onClick={() => removeTagFromMember(tag.name)}
                          className="hover:text-destructive ml-1"
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
                  value={memberTagInput}
                  onChange={(e) => setMemberTagInput(e.target.value)}
                  placeholder="Add tag to member..."
                  onKeyDown={(e) => e.key === 'Enter' && addTagToMember()}
                />
                <Button onClick={addTagToMember} size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add Tag
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
