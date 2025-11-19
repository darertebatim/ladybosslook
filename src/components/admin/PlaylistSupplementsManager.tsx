import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, FileText, Video, Link as LinkIcon, ArrowUp, ArrowDown } from "lucide-react";

interface PlaylistSupplementsManagerProps {
  playlistId: string;
  playlistName: string;
  isOpen: boolean;
  onClose: () => void;
}

export const PlaylistSupplementsManager = ({
  playlistId,
  playlistName,
  isOpen,
  onClose,
}: PlaylistSupplementsManagerProps) => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    type: "video" as "video" | "pdf" | "link",
    url: "",
    description: "",
    sort_order: 0,
  });

  // Handle PDF file upload
  const handleFileUpload = async (file: File) => {
    if (!file.type.includes('pdf')) {
      toast.error('Please select a PDF file');
      return;
    }

    setUploadingFile(true);
    try {
      const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `supplements/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, url: publicUrl }));
      toast.success('PDF uploaded successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload PDF');
    } finally {
      setUploadingFile(false);
    }
  };

  // Fetch supplements
  const { data: supplements, isLoading } = useQuery({
    queryKey: ['playlist-supplements', playlistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('playlist_supplements')
        .select('*')
        .eq('playlist_id', playlistId)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  // Add supplement mutation
  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('playlist_supplements')
        .insert({
          playlist_id: playlistId,
          title: formData.title,
          type: formData.type,
          url: formData.url,
          description: formData.description,
          sort_order: formData.sort_order,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Supplement added successfully');
      queryClient.invalidateQueries({ queryKey: ['playlist-supplements', playlistId] });
      handleCloseAdd();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add supplement');
    },
  });

  // Delete supplement mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('playlist_supplements')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Supplement deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['playlist-supplements', playlistId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete supplement');
    },
  });

  // Reorder supplement mutation
  const reorderMutation = useMutation({
    mutationFn: async ({ id, newSortOrder }: { id: string; newSortOrder: number }) => {
      const { error } = await supabase
        .from('playlist_supplements')
        .update({ sort_order: newSortOrder })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist-supplements', playlistId] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reorder supplement');
    },
  });

  const handleMoveUp = (index: number) => {
    if (!supplements || index === 0) return;
    
    const current = supplements[index];
    const previous = supplements[index - 1];
    
    reorderMutation.mutate({ id: current.id, newSortOrder: previous.sort_order });
    reorderMutation.mutate({ id: previous.id, newSortOrder: current.sort_order });
  };

  const handleMoveDown = (index: number) => {
    if (!supplements || index === supplements.length - 1) return;
    
    const current = supplements[index];
    const next = supplements[index + 1];
    
    reorderMutation.mutate({ id: current.id, newSortOrder: next.sort_order });
    reorderMutation.mutate({ id: next.id, newSortOrder: current.sort_order });
  };

  const resetForm = () => {
    setFormData({
      title: "",
      type: "video",
      url: "",
      description: "",
      sort_order: 0,
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const handleCloseAdd = () => {
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="h-4 w-4" />;
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'link': return <LinkIcon className="h-4 w-4" />;
      default: return null;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      video: "bg-blue-500",
      pdf: "bg-red-500",
      link: "bg-green-500",
    };
    return colors[type as keyof typeof colors] || "bg-gray-500";
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Course Supplements - {playlistName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={handleOpenAdd} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Supplement
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              </div>
            ) : supplements && supplements.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Order</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>URL</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {supplements.map((supplement, index) => (
                    <TableRow key={supplement.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0 || reorderMutation.isPending}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMoveDown(index)}
                            disabled={index === supplements.length - 1 || reorderMutation.isPending}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getTypeBadge(supplement.type)}>
                          {getTypeIcon(supplement.type)}
                          <span className="ml-1">{supplement.type.toUpperCase()}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{supplement.title}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        <a 
                          href={supplement.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          {supplement.url}
                        </a>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteMutation.mutate(supplement.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No supplements added yet
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Course Supplement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <Label htmlFor="supplement_type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "video" | "pdf" | "link") => 
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="link">External Link</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="supplement_title">Title *</Label>
              <Input
                id="supplement_title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g., Session Recording, Workbook PDF"
              />
            </div>

            <div>
              <Label htmlFor="supplement_url">URL *</Label>
              {formData.type === 'pdf' ? (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-border rounded-lg p-4">
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      disabled={uploadingFile}
                      className="cursor-pointer"
                    />
                    {uploadingFile && (
                      <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading PDF...
                      </p>
                    )}
                    {formData.url && !uploadingFile && (
                      <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
                        ✓ PDF uploaded successfully
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Or paste URL directly:</Label>
                    <Input
                      id="supplement_url"
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                      placeholder="https://..."
                      disabled={uploadingFile}
                    />
                  </div>
                </div>
              ) : (
                <Input
                  id="supplement_url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  required
                  placeholder="https://..."
                />
              )}
            </div>

            <div>
              <Label htmlFor="supplement_description">Description</Label>
              <Textarea
                id="supplement_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Optional description"
              />
            </div>

            <div>
              <Label htmlFor="supplement_sort_order">Sort Order</Label>
              <Input
                id="supplement_sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCloseAdd}>
                Cancel
              </Button>
              <Button type="submit" disabled={addMutation.isPending}>
                {addMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Supplement'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
