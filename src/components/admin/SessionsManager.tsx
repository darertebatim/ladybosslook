import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Calendar, Plus, Trash2, Edit, ArrowLeft, Wand2, Loader2, CalendarDays, CheckCircle, AlertTriangle, Save, X } from "lucide-react";
import { format, addWeeks, addDays } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { Textarea } from "@/components/ui/textarea";
import { useSessionComplete } from "@/hooks/useSessionComplete";
import { SessionCompleteDialog } from "@/components/admin/SessionCompleteDialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ProgramSession {
  id: string;
  round_id: string;
  session_number: number;
  title: string;
  description: string | null;
  session_date: string;
  duration_minutes: number;
  meeting_link: string | null;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
}

interface PreviewSession {
  tempId: string;
  session_number: number;
  title: string;
  session_date: string;
  duration_minutes: number;
  meeting_link: string | null;
  status: 'scheduled';
}

interface SessionFormData {
  session_number: number;
  title: string;
  description: string;
  session_date: string;
  session_timezone: string;
  duration_minutes: string;
  meeting_link: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
}

interface SessionsManagerProps {
  roundId: string;
  roundName: string;
  programTitle: string;
  programSlug: string;
  defaultMeetLink?: string;
  defaultDuration?: number;
  firstSessionDate?: string;
  startDate?: string;
  endDate?: string;
  onClose: () => void;
}

export const SessionsManager = ({
  roundId,
  roundName,
  programTitle,
  programSlug,
  defaultMeetLink,
  defaultDuration = 90,
  firstSessionDate,
  startDate,
  endDate,
  onClose,
}: SessionsManagerProps) => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isGenerating, setIsGenerating] = useState<'weekly' | 'daily' | null>(null);
  const [formData, setFormData] = useState<SessionFormData>({
    session_number: 1,
    title: "",
    description: "",
    session_date: "",
    session_timezone: "America/Los_Angeles",
    duration_minutes: defaultDuration.toString(),
    meeting_link: defaultMeetLink || "",
    status: "scheduled",
  });
  
  // Preview state for generated sessions
  const [previewSessions, setPreviewSessions] = useState<PreviewSession[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSavingPreview, setIsSavingPreview] = useState(false);
  const [editingPreviewId, setEditingPreviewId] = useState<string | null>(null);

  // Fetch sessions for this round
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["program-sessions", roundId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_sessions")
        .select("*")
        .eq("round_id", roundId)
        .order("session_number", { ascending: true });

      if (error) throw error;
      return data as ProgramSession[];
    },
  });

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (data: SessionFormData) => {
      // Convert datetime-local with timezone to UTC ISO string
      let sessionDateISO = null;
      if (data.session_date && data.session_timezone) {
        const localDate = new Date(data.session_date);
        const utcDate = fromZonedTime(localDate, data.session_timezone);
        sessionDateISO = utcDate.toISOString();
      }

      const sessionData = {
        round_id: roundId,
        session_number: data.session_number,
        title: data.title,
        description: data.description || null,
        session_date: sessionDateISO,
        duration_minutes: parseInt(data.duration_minutes) || 90,
        meeting_link: data.meeting_link || null,
        status: data.status,
      };

      if (editingId) {
        const { error } = await supabase
          .from("program_sessions")
          .update(sessionData)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("program_sessions")
          .insert(sessionData);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["program-sessions", roundId] });
      toast.success(editingId ? "Session updated" : "Session created");
      resetForm();
      // Send push notification for new sessions (not edits)
      if (!editingId) {
        await sendNewSessionsNotification(1);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("program_sessions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-sessions", roundId] });
      toast.success("Session deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Session complete with announcement
  const sessionComplete = useSessionComplete([["program-sessions", roundId]]);

  // Send push notification to enrolled users
  const sendNewSessionsNotification = async (sessionCount: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.functions.invoke('send-push-notification', {
        body: {
          title: '📅 New Sessions Added',
          message: `${sessionCount} new session${sessionCount > 1 ? 's' : ''} added to ${programTitle}. Sync your calendar!`,
          targetRoundId: roundId,
          destinationUrl: `/app/programs/${programSlug}`,
        },
      });
      toast.success('Push notification sent to enrolled users');
    } catch (error) {
      console.error('Failed to send push notification:', error);
    }
  };

  // Generate preview sessions (no database save yet)
  const handleGeneratePreview = (interval: 'weekly' | 'daily') => {
    if (!firstSessionDate) {
      toast.error("No first session date/time set for this round. Please set it in round settings first.");
      return;
    }

    setIsGenerating(interval);

    try {
      // Use firstSessionDate as the single source of truth for both date AND time
      const start = new Date(firstSessionDate);
      const end = endDate 
        ? new Date(endDate + 'T23:59:59') 
        : (interval === 'weekly' ? addWeeks(start, 8) : addDays(start, 30));
      
      const sessionsToPreview: PreviewSession[] = [];
      let sessionNumber = (sessions?.length || 0) + 1;
      let currentDate = new Date(start);

      while (currentDate <= end) {
        sessionsToPreview.push({
          tempId: `preview-${Date.now()}-${sessionNumber}`,
          session_number: sessionNumber,
          title: `${programTitle} - Session ${sessionNumber}`,
          session_date: currentDate.toISOString(),
          duration_minutes: defaultDuration,
          meeting_link: defaultMeetLink || null,
          status: 'scheduled',
        });
        sessionNumber++;
        currentDate = interval === 'weekly' ? addWeeks(currentDate, 1) : addDays(currentDate, 1);
      }

      if (sessionsToPreview.length === 0) {
        toast.error("No sessions to generate");
        return;
      }

      setPreviewSessions(sessionsToPreview);
      setIsPreviewMode(true);
      toast.info(`Generated ${sessionsToPreview.length} sessions for preview. Review and save when ready.`);
    } catch (error) {
      toast.error("Failed to generate preview");
    } finally {
      setIsGenerating(null);
    }
  };

  // Save preview sessions to database
  const handleSavePreview = async () => {
    if (previewSessions.length === 0) return;

    setIsSavingPreview(true);
    try {
      const sessionsToCreate = previewSessions.map(ps => ({
        round_id: roundId,
        session_number: ps.session_number,
        title: ps.title,
        session_date: ps.session_date,
        duration_minutes: ps.duration_minutes,
        meeting_link: ps.meeting_link,
        status: ps.status,
      }));

      const { error } = await supabase
        .from("program_sessions")
        .insert(sessionsToCreate);
      
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["program-sessions", roundId] });
      toast.success(`Saved ${sessionsToCreate.length} sessions`);
      
      // Send push notification to enrolled users
      await sendNewSessionsNotification(sessionsToCreate.length);
      
      // Clear preview
      setPreviewSessions([]);
      setIsPreviewMode(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to save sessions");
    } finally {
      setIsSavingPreview(false);
    }
  };

  // Cancel preview
  const handleCancelPreview = () => {
    setPreviewSessions([]);
    setIsPreviewMode(false);
    setEditingPreviewId(null);
    toast.info("Preview cancelled");
  };

  // Delete from preview
  const handleDeletePreviewSession = (tempId: string) => {
    setPreviewSessions(prev => prev.filter(s => s.tempId !== tempId));
  };

  // Update preview session
  const handleUpdatePreviewSession = (tempId: string, updates: Partial<PreviewSession>) => {
    setPreviewSessions(prev => prev.map(s => 
      s.tempId === tempId ? { ...s, ...updates } : s
    ));
    setEditingPreviewId(null);
  };

  const resetForm = () => {
    setFormData({
      session_number: (sessions?.length || 0) + 1,
      title: "",
      description: "",
      session_date: "",
      session_timezone: "America/Los_Angeles",
      duration_minutes: defaultDuration.toString(),
      meeting_link: defaultMeetLink || "",
      status: "scheduled",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (session: ProgramSession) => {
    const defaultTimezone = "America/Los_Angeles";
    let localDateTime = "";

    if (session.session_date) {
      const utcDate = new Date(session.session_date);
      const zonedDate = toZonedTime(utcDate, defaultTimezone);
      const year = zonedDate.getFullYear();
      const month = String(zonedDate.getMonth() + 1).padStart(2, '0');
      const day = String(zonedDate.getDate()).padStart(2, '0');
      const hours = String(zonedDate.getHours()).padStart(2, '0');
      const minutes = String(zonedDate.getMinutes()).padStart(2, '0');
      localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    setFormData({
      session_number: session.session_number,
      title: session.title,
      description: session.description || "",
      session_date: localDateTime,
      session_timezone: defaultTimezone,
      duration_minutes: session.duration_minutes?.toString() || "90",
      meeting_link: session.meeting_link || "",
      status: session.status,
    });
    setEditingId(session.id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleGenerate = (interval: 'weekly' | 'daily') => {
    handleGeneratePreview(interval);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'rescheduled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold">{programTitle}</h2>
            <p className="text-sm text-muted-foreground">{roundName} - Sessions</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleGenerate('daily')}
            disabled={!!isGenerating || !startDate}
          >
            {isGenerating === 'daily' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CalendarDays className="h-4 w-4 mr-2" />
            )}
            Generate Daily
          </Button>
          <Button
            variant="outline"
            onClick={() => handleGenerate('weekly')}
            disabled={!!isGenerating || !startDate}
          >
            {isGenerating === 'weekly' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4 mr-2" />
            )}
            Generate Weekly
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Session
          </Button>
        </div>
      </div>

      {/* Preview Mode Banner */}
      {isPreviewMode && (
        <Alert variant="default" className="border-amber-500 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Preview Mode - Sessions Not Saved Yet</AlertTitle>
          <AlertDescription className="text-amber-700">
            Review the {previewSessions.length} generated sessions below. You can edit or delete individual sessions before saving.
            <strong> Push notifications will only be sent after you click "Save All Sessions".</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Preview Sessions Table */}
      {isPreviewMode && previewSessions.length > 0 && (
        <Card className="border-amber-300">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Wand2 className="h-5 w-5" />
              Preview: {previewSessions.length} Sessions to Create
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancelPreview} disabled={isSavingPreview}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSavePreview} disabled={isSavingPreview} className="bg-green-600 hover:bg-green-700">
                {isSavingPreview ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save All & Notify
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewSessions.map((session) => (
                  <TableRow key={session.tempId} className="bg-amber-50/50">
                    <TableCell>{session.session_number}</TableCell>
                    <TableCell>
                      {editingPreviewId === session.tempId ? (
                        <Input
                          value={session.title}
                          onChange={(e) => handleUpdatePreviewSession(session.tempId, { title: e.target.value })}
                          onBlur={() => setEditingPreviewId(null)}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingPreviewId(null)}
                          autoFocus
                          className="w-full"
                        />
                      ) : (
                        <span className="font-medium">{session.title}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(session.session_date), 'MMM d, yyyy h:mm a')}
                    </TableCell>
                    <TableCell>{session.duration_minutes} min</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingPreviewId(session.tempId)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeletePreviewSession(session.tempId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {showForm && !isPreviewMode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {editingId ? "Edit Session" : "Add New Session"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Session Number</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.session_number}
                    onChange={(e) =>
                      setFormData({ ...formData, session_number: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Session 1: Introduction"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.session_date}
                    onChange={(e) =>
                      setFormData({ ...formData, session_date: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={formData.session_timezone}
                    onValueChange={(value) =>
                      setFormData({ ...formData, session_timezone: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    min="15"
                    step="15"
                    value={formData.duration_minutes}
                    onChange={(e) =>
                      setFormData({ ...formData, duration_minutes: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled') =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="rescheduled">Rescheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Meeting Link (Optional)</Label>
                  <Input
                    type="url"
                    value={formData.meeting_link}
                    onChange={(e) =>
                      setFormData({ ...formData, meeting_link: e.target.value })
                    }
                    placeholder="https://meet.google.com/..."
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Session description or notes..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={saveMutation.isPending}>
                  {editingId ? "Update Session" : "Add Session"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Existing Sessions (only show when not in preview mode) */}
      {!isPreviewMode && (
        <Card>
          <CardHeader>
            <CardTitle>Sessions ({sessions?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p>Loading sessions...</p>
            ) : sessions && sessions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell>{session.session_number}</TableCell>
                      <TableCell className="font-medium">{session.title}</TableCell>
                      <TableCell>
                        {format(new Date(session.session_date), 'MMM d, yyyy h:mm a')}
                      </TableCell>
                      <TableCell>{session.duration_minutes} min</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(session.status)}`}>
                          {session.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {session.status === 'scheduled' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:bg-green-50 hover:text-green-700"
                              onClick={() => sessionComplete.openDialog({
                                id: session.id,
                                title: session.title,
                                roundId: roundId,
                                programSlug: programSlug,
                              })}
                              title="Mark as completed"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(session)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteMutation.mutate(session.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No sessions created yet.</p>
                <p className="text-sm mt-1">Click "Generate Weekly" to auto-create sessions or "Add Session" to add manually.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <SessionCompleteDialog
        open={!!sessionComplete.sessionToComplete}
        sessionTitle={sessionComplete.sessionToComplete?.title}
        recordingLink={sessionComplete.recordingLink}
        onRecordingLinkChange={sessionComplete.setRecordingLink}
        onConfirm={sessionComplete.confirmComplete}
        onCancel={sessionComplete.closeDialog}
        isPending={sessionComplete.isPending}
      />
    </div>
  );
};
