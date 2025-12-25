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
import { Calendar, Plus, Trash2, Edit, ArrowLeft, Wand2, Loader2 } from "lucide-react";
import { format, addWeeks } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
  defaultMeetLink?: string;
  startDate?: string;
  endDate?: string;
  onClose: () => void;
}

export const SessionsManager = ({
  roundId,
  roundName,
  programTitle,
  defaultMeetLink,
  startDate,
  endDate,
  onClose,
}: SessionsManagerProps) => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState<SessionFormData>({
    session_number: 1,
    title: "",
    description: "",
    session_date: "",
    session_timezone: "America/New_York",
    duration_minutes: "90",
    meeting_link: defaultMeetLink || "",
    status: "scheduled",
  });

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-sessions", roundId] });
      toast.success(editingId ? "Session updated" : "Session created");
      resetForm();
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

  // Generate sessions mutation
  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!startDate) throw new Error("No start date set for this round");

      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : addWeeks(start, 8);
      const sessionsToCreate = [];
      let sessionNumber = (sessions?.length || 0) + 1;
      let currentDate = new Date(start);

      while (currentDate <= end) {
        sessionsToCreate.push({
          round_id: roundId,
          session_number: sessionNumber,
          title: `${programTitle} - Session ${sessionNumber}`,
          session_date: currentDate.toISOString(),
          duration_minutes: 90,
          meeting_link: defaultMeetLink || null,
          status: 'scheduled',
        });
        sessionNumber++;
        currentDate = addWeeks(currentDate, 1);
      }

      if (sessionsToCreate.length === 0) {
        throw new Error("No sessions to generate");
      }

      const { error } = await supabase
        .from("program_sessions")
        .insert(sessionsToCreate);
      if (error) throw error;

      return sessionsToCreate.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["program-sessions", roundId] });
      toast.success(`Generated ${count} sessions`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      session_number: (sessions?.length || 0) + 1,
      title: "",
      description: "",
      session_date: "",
      session_timezone: "America/New_York",
      duration_minutes: "90",
      meeting_link: defaultMeetLink || "",
      status: "scheduled",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (session: ProgramSession) => {
    const defaultTimezone = "America/New_York";
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

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateMutation.mutateAsync();
    } finally {
      setIsGenerating(false);
    }
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
            onClick={handleGenerate}
            disabled={isGenerating || !startDate}
          >
            {isGenerating ? (
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

      {showForm && (
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
    </div>
  );
};
