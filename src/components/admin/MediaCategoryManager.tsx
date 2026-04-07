import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, GripVertical } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

interface MediaCategoryManagerProps {
  type: 'audio' | 'video';
}

interface CategoryForm {
  slug: string;
  label: string;
  emoji: string;
  sort_order: number;
  is_active: boolean;
  tags: string[];
}

const defaultForm: CategoryForm = {
  slug: "", label: "", emoji: "📁", sort_order: 0, is_active: true, tags: [],
};

export const MediaCategoryManager = ({ type }: MediaCategoryManagerProps) => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>({ ...defaultForm });

  const queryKey = [`media-categories-${type}`];

  const { data: categories, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('media_categories')
        .select('*')
        .eq('type', type)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const slug = form.slug || form.label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const { error } = await supabase.from('media_categories').insert({
        type, slug, label: form.label, emoji: form.emoji,
        sort_order: form.sort_order, is_active: form.is_active, tags: form.tags,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Category created');
      queryClient.invalidateQueries({ queryKey });
      setIsCreateOpen(false);
      setForm({ ...defaultForm });
    },
    onError: (e: any) => toast.error(e.message || 'Failed to create'),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      const { error } = await supabase.from('media_categories').update({
        label: form.label, emoji: form.emoji,
        sort_order: form.sort_order, is_active: form.is_active, tags: form.tags,
      }).eq('id', editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Category updated');
      queryClient.invalidateQueries({ queryKey });
      setIsEditOpen(false);
      setEditingId(null);
    },
    onError: (e: any) => toast.error(e.message || 'Failed to update'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('media_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Category deleted');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (e: any) => toast.error(e.message || 'Failed to delete'),
  });

  const handleEdit = (cat: any) => {
    setEditingId(cat.id);
    setForm({
      slug: cat.slug, label: cat.label, emoji: cat.emoji,
      sort_order: cat.sort_order, is_active: cat.is_active, tags: cat.tags || [],
    });
    setIsEditOpen(true);
  };

  const CategoryFormFields = ({ isEdit }: { isEdit: boolean }) => (
    <form onSubmit={(e) => { e.preventDefault(); isEdit ? updateMutation.mutate() : createMutation.mutate(); }} className="space-y-4">
      <div className="grid grid-cols-[80px_1fr] gap-4">
        <div>
          <Label>Emoji</Label>
          <Input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} className="text-center text-lg" maxLength={4} />
        </div>
        <div>
          <Label>Label *</Label>
          <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required placeholder="e.g. Podcast" />
        </div>
      </div>

      {!isEdit && (
        <div>
          <Label>Slug (auto-generated if empty)</Label>
          <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="e.g. podcast" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Sort Order</Label>
          <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} />
          <Label>Active</Label>
      </div>

      <div>
        <Label>Tags (comma-separated)</Label>
        <Input
          value={form.tags.join(', ')}
          onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
          placeholder="e.g. self-care, wellness"
        />
      </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => { isEdit ? setIsEditOpen(false) : setIsCreateOpen(false); }}>Cancel</Button>
        <Button type="submit" disabled={isEdit ? updateMutation.isPending : createMutation.isPending}>
          {(isEdit ? updateMutation.isPending : createMutation.isPending) ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
          {isEdit ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{type === 'audio' ? 'Audio' : 'Video'} Categories</CardTitle>
        <Button size="sm" onClick={() => { setForm({ ...defaultForm, sort_order: (categories?.length || 0) }); setIsCreateOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Add Category
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Order</TableHead>
                <TableHead className="w-16">Emoji</TableHead>
                <TableHead>Label</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories?.map((cat) => (
                <TableRow key={cat.id} className={!cat.is_active ? 'opacity-50' : ''}>
                  <TableCell className="text-muted-foreground">{cat.sort_order}</TableCell>
                  <TableCell className="text-lg">{cat.emoji}</TableCell>
                  <TableCell className="font-medium">{cat.label}</TableCell>
                  <TableCell><Badge variant="outline" className="font-mono text-xs">{cat.slug}</Badge></TableCell>
                  <TableCell>
                    {cat.is_active ? (
                      <Badge variant="secondary">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {((cat.tags as string[]) || []).map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => { if (confirm('Delete this category?')) deleteMutation.mutate(cat.id); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!categories?.length && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No categories yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent><DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader><CategoryFormFields isEdit={false} /></DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent><DialogHeader><DialogTitle>Edit Category</DialogTitle></DialogHeader><CategoryFormFields isEdit={true} /></DialogContent>
      </Dialog>
    </Card>
  );
};
