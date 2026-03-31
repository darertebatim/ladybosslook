import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { FileText, Upload, Trash2, Download, Loader2, Search, Eye, FolderInput, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { DocumentFolderSidebar } from '@/components/admin/documents/DocumentFolderSidebar';

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
  folder_id: string | null;
}

const ACCEPTED_TYPES = '.pdf,.doc,.docx,.txt,.md,.pages,.key,.keynote';
const ACCEPTED_LABEL = 'PDF, DOC, DOCX, TXT, MD, Pages, Keynote — max 20MB each';

export default function Documents() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [uploadFolderId, setUploadFolderId] = useState<string>('none');
  const [files, setFiles] = useState<File[]>([]);
  const [viewingDoc, setViewingDoc] = useState<AdminDocument | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [moveDialogDoc, setMoveDialogDoc] = useState<AdminDocument | null>(null);
  const [moveFolderId, setMoveFolderId] = useState<string>('none');
  const [reExtractingId, setReExtractingId] = useState<string | null>(null);
  const [bulkExtracting, setBulkExtracting] = useState(false);

  const reExtractDocument = async (docId: string) => {
    setReExtractingId(docId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Please log in'); return; }

      const formData = new FormData();
      formData.append('document_id', docId);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-document-text`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Extraction failed');
      const result = await response.json();
      if (result.text) {
        toast.success('Text extracted successfully');
        queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
      } else {
        toast.error(result.error || 'No text could be extracted');
      }
    } catch {
      toast.error('Failed to extract text');
    } finally {
      setReExtractingId(null);
    }
  };

  const bulkReExtract = async () => {
    const unindexed = documents.filter(d => !d.extracted_text);
    if (unindexed.length === 0) { toast.info('All documents are already indexed'); return; }

    setBulkExtracting(true);
    let success = 0, failed = 0;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Please log in');
      setBulkExtracting(false);
      return;
    }

    for (const doc of unindexed) {
      try {
        const formData = new FormData();
        formData.append('document_id', doc.id);

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
          if (result.text) success++; else failed++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }

    queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
    toast.success(`Indexed ${success} documents${failed > 0 ? `, ${failed} failed` : ''}`);
    setBulkExtracting(false);
  };

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

  const { data: folders = [] } = useQuery({
    queryKey: ['document-folders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_folders')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const documentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    documents.forEach(d => {
      if (d.folder_id) counts[d.folder_id] = (counts[d.folder_id] || 0) + 1;
    });
    return counts;
  }, [documents]);

  const unfiledCount = useMemo(() => documents.filter(d => !d.folder_id).length, [documents]);

  const deleteMutation = useMutation({
    mutationFn: async (doc: AdminDocument) => {
      const path = doc.file_url.split('/admin-documents/')[1];
      if (path) await supabase.storage.from('admin-documents').remove([path]);
      const { error } = await supabase.from('admin_documents').delete().eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
      toast.success('Document deleted');
    },
    onError: () => toast.error('Failed to delete document'),
  });

  const moveMutation = useMutation({
    mutationFn: async ({ docId, folderId }: { docId: string; folderId: string | null }) => {
      const { error } = await supabase.from('admin_documents').update({ folder_id: folderId }).eq('id', docId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
      setMoveDialogDoc(null);
      toast.success('Document moved');
    },
    onError: () => toast.error('Failed to move document'),
  });

  const uploadSingleFile = async (file: File, session: any) => {
    const ext = file.name.split('.').pop();
    const filePath = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('admin-documents').upload(filePath, file);
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from('admin-documents').getPublicUrl(filePath);

    let extractedText: string | null = null;
    if (file.type === 'text/plain') {
      extractedText = await file.text();
    } else if (session) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extract-document-text`,
          { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` }, body: formData }
        );
        if (response.ok) { const result = await response.json(); extractedText = result.text || null; }
      } catch { /* continue */ }
    }

    const title = file.name.replace(/\.[^/.]+$/, '');
    const { error: dbError } = await supabase.from('admin_documents').insert({
      title, description: description.trim() || null, file_name: file.name,
      file_url: urlData.publicUrl, file_size_bytes: file.size,
      mime_type: file.type || `application/${ext}`, extracted_text: extractedText,
      uploaded_by: session?.user?.id,
      folder_id: uploadFolderId === 'none' ? null : uploadFolderId,
    });
    if (dbError) throw dbError;
  };

  const handleUpload = async () => {
    if (files.length === 0) { toast.error('Please select at least one file'); return; }
    setUploading(true);
    setUploadProgress({ current: 0, total: files.length });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      let successCount = 0, failCount = 0;
      for (let i = 0; i < files.length; i++) {
        setUploadProgress({ current: i + 1, total: files.length });
        try { await uploadSingleFile(files[i], session); successCount++; }
        catch (err: any) { failCount++; console.error(`Failed to upload ${files[i].name}:`, err); }
      }
      queryClient.invalidateQueries({ queryKey: ['admin-documents'] });
      if (failCount === 0) toast.success(`${successCount} document${successCount > 1 ? 's' : ''} uploaded`);
      else toast.warning(`${successCount} uploaded, ${failCount} failed`);
      setDescription(''); setFiles([]); setUploadDialogOpen(false); setUploadFolderId('none');
    } catch (err: any) { toast.error(err.message || 'Upload failed'); }
    finally { setUploading(false); setUploadProgress({ current: 0, total: 0 }); }
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const filtered = documents.filter(d => {
    const matchesSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.file_name.toLowerCase().includes(search.toLowerCase()) ||
      (d.description || '').toLowerCase().includes(search.toLowerCase());
    const matchesFolder = selectedFolderId === null ? true :
      selectedFolderId === 'unfiled' ? !d.folder_id : d.folder_id === selectedFolderId;
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-sm text-muted-foreground">Upload reference documents — the AI Assistant can read these when you chat.</p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button><Upload className="h-4 w-4 mr-2" /> Upload Documents</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Upload Documents</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Folder</Label>
                <Select value={uploadFolderId} onValueChange={setUploadFolderId}>
                  <SelectTrigger><SelectValue placeholder="No folder" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No folder</SelectItem>
                    {folders.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What are these documents about?" rows={2} />
              </div>
              <div>
                <Label>Files *</Label>
                <Input type="file" multiple accept={ACCEPTED_TYPES} onChange={e => setFiles(Array.from(e.target.files || []))} />
                <p className="text-xs text-muted-foreground mt-1">{ACCEPTED_LABEL}</p>
                {files.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {files.map((f, i) => (
                      <div key={i} className="text-xs text-muted-foreground flex items-center gap-2">
                        <FileText className="h-3 w-3" /><span className="truncate">{f.name}</span>
                        <span className="shrink-0">({formatSize(f.size)})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {uploading && uploadProgress.total > 1 && (
                <div className="space-y-1">
                  <Progress value={(uploadProgress.current / uploadProgress.total) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">Uploading {uploadProgress.current} of {uploadProgress.total}...</p>
                </div>
              )}
              <Button onClick={handleUpload} disabled={uploading || files.length === 0} className="w-full">
                {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</> : `Upload ${files.length > 0 ? files.length : ''} File${files.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-6">
        <DocumentFolderSidebar
          selectedFolderId={selectedFolderId}
          onSelect={setSelectedFolderId}
          documentCounts={documentCounts}
          totalCount={documents.length}
          unfiledCount={unfiledCount}
        />

        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents..." className="pl-9" />
            </div>
            {documents.some(d => !d.extracted_text) && (
              <Button variant="outline" size="sm" onClick={bulkReExtract} disabled={bulkExtracting}>
                {bulkExtracting ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Indexing...</> : <><RefreshCw className="h-4 w-4 mr-1" /> Index All for AI</>}
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
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
                        <span>{doc.file_name}</span><span>•</span>
                        <span>{formatSize(doc.file_size_bytes)}</span><span>•</span>
                        <span>{formatDistanceToNow(new Date(doc.created_at), { addSuffix: true })}</span>
                      </div>
                      {doc.description && <p className="text-xs text-muted-foreground mt-1 truncate">{doc.description}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      {doc.extracted_text ? (
                        <Badge variant="secondary" className="text-xs">AI indexed</Badge>
                      ) : (
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => reExtractDocument(doc.id)} disabled={reExtractingId === doc.id}>
                          {reExtractingId === doc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><RefreshCw className="h-3 w-3 mr-1" /> Index</>}
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setMoveDialogDoc(doc)} title="Move to folder">
                        <FolderInput className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewingDoc(doc)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                        onClick={() => { if (confirm('Delete this document?')) deleteMutation.mutate(doc); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Move to folder dialog */}
      <Dialog open={!!moveDialogDoc} onOpenChange={open => !open && setMoveDialogDoc(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Move to Folder</DialogTitle></DialogHeader>
          <Select value={moveFolderId} onValueChange={setMoveFolderId}>
            <SelectTrigger><SelectValue placeholder="Select folder" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No folder (Unfiled)</SelectItem>
              {folders.map(f => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button className="w-full" onClick={() => {
            if (moveDialogDoc) moveMutation.mutate({ docId: moveDialogDoc.id, folderId: moveFolderId === 'none' ? null : moveFolderId });
          }}>
            Move
          </Button>
        </DialogContent>
      </Dialog>

      {/* View document details */}
      <Dialog open={!!viewingDoc} onOpenChange={open => !open && setViewingDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{viewingDoc?.title}</DialogTitle></DialogHeader>
          {viewingDoc && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p>{viewingDoc.file_name} • {formatSize(viewingDoc.file_size_bytes)}</p>
                {viewingDoc.description && <p className="mt-1">{viewingDoc.description}</p>}
              </div>
              {viewingDoc.extracted_text ? (
                <div>
                  <Label className="text-xs">Extracted Text (what AI sees)</Label>
                  <pre className="mt-1 p-3 bg-muted rounded-md text-xs whitespace-pre-wrap max-h-96 overflow-y-auto">{viewingDoc.extracted_text}</pre>
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
