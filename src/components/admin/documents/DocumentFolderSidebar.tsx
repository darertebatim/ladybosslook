import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Folder, FolderOpen, Plus, Trash2, Pencil, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface DocFolder {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

interface Props {
  selectedFolderId: string | null; // null = "All", "unfiled" = no folder
  onSelect: (folderId: string | null) => void;
  documentCounts: Record<string, number>;
  totalCount: number;
  unfiledCount: number;
}

export function DocumentFolderSidebar({ selectedFolderId, onSelect, documentCounts, totalCount, unfiledCount }: Props) {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const { data: folders = [] } = useQuery({
    queryKey: ['document-folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_folders')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data as DocFolder[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from('document_folders').insert({
        name,
        sort_order: folders.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-folders'] });
      setCreating(false);
      setNewName('');
      toast.success('Folder created');
    },
    onError: () => toast.error('Failed to create folder'),
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from('document_folders').update({ name }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-folders'] });
      setEditingId(null);
      toast.success('Folder renamed');
    },
    onError: () => toast.error('Failed to rename'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Unfiled docs in this folder first
      await supabase.from('admin_documents').update({ folder_id: null }).eq('folder_id', id);
      const { error } = await supabase.from('document_folders').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-folders', 'admin-documents'] });
      if (selectedFolderId && !folders.find(f => f.id !== selectedFolderId)) {
        onSelect(null);
      }
      toast.success('Folder deleted');
    },
    onError: () => toast.error('Failed to delete folder'),
  });

  return (
    <div className="w-56 shrink-0 space-y-1">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
          selectedFolderId === null ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'
        )}
      >
        <FileText className="h-4 w-4" />
        <span className="flex-1 text-left">All Documents</span>
        <span className="text-xs">{totalCount}</span>
      </button>

      <button
        onClick={() => onSelect('unfiled')}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
          selectedFolderId === 'unfiled' ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'
        )}
      >
        <FileText className="h-4 w-4" />
        <span className="flex-1 text-left">Unfiled</span>
        <span className="text-xs">{unfiledCount}</span>
      </button>

      <div className="pt-2 pb-1 px-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Folders</span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {creating && (
        <form
          onSubmit={e => { e.preventDefault(); if (newName.trim()) createMutation.mutate(newName.trim()); }}
          className="flex gap-1 px-2"
        >
          <Input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Folder name"
            className="h-8 text-sm"
            onBlur={() => { if (!newName.trim()) setCreating(false); }}
          />
        </form>
      )}

      {folders.map(folder => (
        <div key={folder.id} className="group relative">
          {editingId === folder.id ? (
            <form
              onSubmit={e => { e.preventDefault(); if (editName.trim()) renameMutation.mutate({ id: folder.id, name: editName.trim() }); }}
              className="flex gap-1 px-2"
            >
              <Input
                autoFocus
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="h-8 text-sm"
                onBlur={() => setEditingId(null)}
              />
            </form>
          ) : (
            <button
              onClick={() => onSelect(folder.id)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                selectedFolderId === folder.id ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'
              )}
            >
              {selectedFolderId === folder.id ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />}
              <span className="flex-1 text-left truncate">{folder.name}</span>
              <span className="text-xs">{documentCounts[folder.id] || 0}</span>
              <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); setEditingId(folder.id); setEditName(folder.name); }}
                  className="p-0.5 rounded hover:bg-muted"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); if (confirm(`Delete folder "${folder.name}"? Documents will be moved to Unfiled.`)) deleteMutation.mutate(folder.id); }}
                  className="p-0.5 rounded hover:bg-destructive/10 text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
