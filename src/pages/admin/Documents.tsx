import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Upload, Trash2, Download, Loader2, Search, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { formatDistanceToNow } from 'date-fns';

interface AdminDocument {
  id: string;
  title: string;
  description: string | null;
  file_name: string;
  file_url: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  extracted_text: string | null;
  created_at: string;
}

export default function Documents() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [viewingDoc, setViewingDoc] = useState<AdminDocument | null>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['admin-documents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_documents')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AdminDocument[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: AdminDocument) => {
      const path = doc.file_url.split('/admin-documents/')[1];
      if (path) {
        await supabase.storage.from('admin-documents').remove([path]);
      }
      const { error } = await supabase.from('admin_documents').delete().eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
      toast.success('Document deleted');
    },
    onError: () => toast.error('Failed to delete document'),
  });

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      toast.error('Please provide a title and file');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('admin-documents')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('admin-documents')
        .getPublicUrl(filePath);

      // Extract text from the file on the client side for txt files
      let extractedText: string | null = null;
      if (file.type === 'text/plain') {
        extractedText = await file.text();
      }

      const { data: { session } } = await supabase.auth.getSession();

      // Try to extract text via edge function for PDFs
      if (file.type === 'application/pdf' && session) {
        try {
          const formData = new FormData();
          formData.append('file', file);
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-document-text`,
            {
              method: 'POST',
              headers: { Authorization: `Bearer ${session.access_token}` },
              body: formData,
            }
          );
          if (response.ok) {
            const result = await response.json();
            extractedText = result.text || null;
          }
        } catch {
          // Text extraction failed, continue without it
        }
      }

      const { error: dbError } = await supabase.from('admin_documents').insert({
        title: title.trim(),
        description: description.trim() || null,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size_bytes: file.size,
        mime_type: file.type,
        extracted_text: extractedText,
        uploaded_by: session?.user?.id,
      });
      if (dbError) throw dbError;

      queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
      toast.success('Document uploaded');
      setTitle('');
      setDescription('');
      setFile(null);
      setUploadDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filtered = documents.filter(d =>
    d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.file_name.toLowerCase().includes(search.toLowerCase()) ||
    (d.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-sm text-muted-foreground">
            Upload reference documents — the AI Assistant can read these when you chat.
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="h-4 w-4 mr-2" /> Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Brand Guidelines" />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this document about?" rows={2} />
              </div>
              <div>
                <Label>File *</Label>
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.md"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground mt-1">PDF, DOC, DOCX, TXT, MD — max 20MB</p>
              </div>
              <Button onClick={handleUpload} disabled={uploading || !file || !title.trim()} className="w-full">
                {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</> : 'Upload'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..." className="pl-9" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{documents.length === 0 ? 'No documents yet. Upload your first one!' : 'No matches found.'}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(doc => (
            <Card key={doc.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{doc.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{doc.file_name}</span>
                    <span>•</span>
                    <span>{formatSize(doc.file_size_bytes)}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}</span>
                  </div>
                  {doc.description && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">{doc.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {doc.extracted_text && (
                    <Badge variant="secondary" className="text-xs">AI indexed</Badge>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingDoc(doc)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => {
                      if (confirm('Delete this document?')) deleteMutation.mutate(doc);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View document details */}
      <Dialog open={!!viewingDoc} onOpenChange={open => !open && setViewingDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingDoc?.title}</DialogTitle>
          </DialogHeader>
          {viewingDoc && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>{viewingDoc.file_name} • {formatSize(viewingDoc.file_size_bytes)}</p>
                {viewingDoc.description && <p className="mt-1">{viewingDoc.description}</p>}
              </div>
              {viewingDoc.extracted_text ? (
                <div>
                  <Label className="text-xs">Extracted Text (what AI sees)</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-xs whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {viewingDoc.extracted_text}
                  </pre>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No text extracted — AI cannot read this document yet.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
