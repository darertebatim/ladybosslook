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
import { Calendar, Plus, Trash2, Edit, Video, FolderOpen, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { Textarea } from "@/components/ui/textarea";

interface ProgramRound {
  id: string;
  program_slug: string;
  round_name: string;
  round_number: number;
  start_date: string;
  end_date: string | null;
  status: 'upcoming' | 'active' | 'completed';
  max_students: number | null;
  google_meet_link: string | null;
  google_drive_link: string | null;
  first_session_date: string | null;
  first_session_duration: number | null;
  important_message: string | null;
  whatsapp_support_number: string | null;
}

interface RoundFormData {
  program_slug: string;
  round_name: string;
  round_number: number;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'completed';
  max_students: string;
  google_meet_link: string;
  google_drive_link: string;
  first_session_date: string;
  first_session_duration: string;
  first_session_timezone: string;
  important_message: string;
  whatsapp_support_number: string;
}

export const ProgramRoundsManager = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<RoundFormData>({
    program_slug: "",
    round_name: "",
    round_number: 1,
    start_date: "",
    end_date: "",
    status: "upcoming",
    max_students: "",
    google_meet_link: "",
    google_drive_link: "",
    first_session_date: "",
    first_session_duration: "90",
    first_session_timezone: "America/New_York",
    important_message: "",
    whatsapp_support_number: "",
  });

  // Fetch programs for dropdown
  const { data: programs } = useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_catalog")
        .select("slug, title, delivery_method")
        .eq("is_active", true)
        .eq("delivery_method", "live-online")
        .order("title");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch rounds
  const { data: rounds, isLoading } = useQuery({
    queryKey: ["program-rounds"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_rounds")
        .select("*")
        .order("program_slug", { ascending: true })
        .order("round_number", { ascending: false });
      
      if (error) throw error;
      return data as ProgramRound[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: RoundFormData) => {
      // Convert datetime-local with timezone to UTC ISO string
      let firstSessionISO = null;
      if (data.first_session_date && data.first_session_timezone) {
        // Parse the datetime-local value as being in the selected timezone
        const localDate = new Date(data.first_session_date);
        // Convert from the selected timezone to UTC
        const utcDate = fromZonedTime(localDate, data.first_session_timezone);
        firstSessionISO = utcDate.toISOString();
      }

      const roundData = {
        program_slug: data.program_slug,
        round_name: data.round_name,
        round_number: data.round_number,
        start_date: data.start_date,
        end_date: data.end_date || null,
        status: data.status,
        max_students: data.max_students ? parseInt(data.max_students) : null,
        google_meet_link: data.google_meet_link || null,
        google_drive_link: data.google_drive_link || null,
        first_session_date: firstSessionISO,
        first_session_duration: data.first_session_duration ? parseInt(data.first_session_duration) : 90,
        important_message: data.important_message || null,
        whatsapp_support_number: data.whatsapp_support_number || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from("program_rounds")
          .update(roundData)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("program_rounds")
          .insert(roundData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-rounds"] });
      toast.success(editingId ? "Round updated" : "Round created");
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
        .from("program_rounds")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program-rounds"] });
      toast.success("Round deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      program_slug: "",
      round_name: "",
      round_number: 1,
      start_date: "",
      end_date: "",
      status: "upcoming",
      max_students: "",
      google_meet_link: "",
      google_drive_link: "",
      first_session_date: "",
      first_session_duration: "90",
      first_session_timezone: "America/New_York",
      important_message: "",
      whatsapp_support_number: "",
    });
    setEditingId(null);
  };

  const handleEdit = (round: ProgramRound) => {
    // Convert UTC ISO string to local datetime for the default timezone
    let localDateTime = "";
    const defaultTimezone = "America/New_York";
    
    if (round.first_session_date) {
      const utcDate = new Date(round.first_session_date);
      // Convert to the default timezone
      const zonedDate = toZonedTime(utcDate, defaultTimezone);
      // Format to YYYY-MM-DDTHH:mm for datetime-local input
      const year = zonedDate.getFullYear();
      const month = String(zonedDate.getMonth() + 1).padStart(2, '0');
      const day = String(zonedDate.getDate()).padStart(2, '0');
      const hours = String(zonedDate.getHours()).padStart(2, '0');
      const minutes = String(zonedDate.getMinutes()).padStart(2, '0');
      localDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    setFormData({
      program_slug: round.program_slug,
      round_name: round.round_name,
      round_number: round.round_number,
      start_date: round.start_date,
      end_date: round.end_date || "",
      status: round.status,
      max_students: round.max_students?.toString() || "",
      google_meet_link: round.google_meet_link || "",
      google_drive_link: round.google_drive_link || "",
      first_session_date: localDateTime,
      first_session_duration: round.first_session_duration?.toString() || "90",
      first_session_timezone: defaultTimezone,
      important_message: round.important_message || "",
      whatsapp_support_number: round.whatsapp_support_number || "",
    });
    setEditingId(round.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {editingId ? "Edit Round" : "Create New Round"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Program (Live Courses Only)</Label>
                <Select
                  value={formData.program_slug}
                  onValueChange={(value) =>
                    setFormData({ ...formData, program_slug: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs?.map((program) => (
                      <SelectItem key={program.slug} value={program.slug}>
                        {program.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Round Name</Label>
                <Input
                  value={formData.round_name}
                  onChange={(e) =>
                    setFormData({ ...formData, round_name: e.target.value })
                  }
                  placeholder="e.g., Spring 2025"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Round Number</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.round_number}
                  onChange={(e) =>
                    setFormData({ ...formData, round_number: parseInt(e.target.value) })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'upcoming' | 'active' | 'completed') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>End Date (Optional)</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Max Students (Optional)</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.max_students}
                  onChange={(e) =>
                    setFormData({ ...formData, max_students: e.target.value })
                  }
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </div>

            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-semibold">Course Resources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Google Meet Link</Label>
                  <Input
                    type="url"
                    value={formData.google_meet_link}
                    onChange={(e) =>
                      setFormData({ ...formData, google_meet_link: e.target.value })
                    }
                    placeholder="https://meet.google.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Google Drive Folder Link</Label>
                  <Input
                    type="url"
                    value={formData.google_drive_link}
                    onChange={(e) =>
                      setFormData({ ...formData, google_drive_link: e.target.value })
                    }
                    placeholder="https://drive.google.com/..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>First Session Date & Time</Label>
                  <Input
                    type="datetime-local"
                    value={formData.first_session_date}
                    onChange={(e) =>
                      setFormData({ ...formData, first_session_date: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={formData.first_session_timezone}
                    onValueChange={(value) =>
                      setFormData({ ...formData, first_session_timezone: value })
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
                      <SelectItem value="America/Phoenix">Arizona (MST)</SelectItem>
                      <SelectItem value="America/Anchorage">Alaska Time (AKT)</SelectItem>
                      <SelectItem value="Pacific/Honolulu">Hawaii Time (HT)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="Europe/London">London (GMT/BST)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                      <SelectItem value="Asia/Dubai">Dubai (GST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Session Duration (minutes)</Label>
                  <Input
                    type="number"
                    min="15"
                    step="15"
                    value={formData.first_session_duration}
                    onChange={(e) =>
                      setFormData({ ...formData, first_session_duration: e.target.value })
                    }
                    placeholder="90"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="important_message">Important Message (Welcome/Instructions)</Label>
              <Textarea
                id="important_message"
                value={formData.important_message}
                onChange={(e) => setFormData({ ...formData, important_message: e.target.value })}
                placeholder="Write a welcome message or important instructions for students in this round..."
                rows={4}
              />
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="whatsapp_support_number">WhatsApp Support Number</Label>
              <Input
                id="whatsapp_support_number"
                type="tel"
                value={formData.whatsapp_support_number}
                onChange={(e) => setFormData({ ...formData, whatsapp_support_number: e.target.value })}
                placeholder="e.g., +1234567890"
              />
              <p className="text-xs text-muted-foreground">Include country code (e.g., +1 for US)</p>
            </div>

            <div className="flex gap-2 mt-6">
              <Button type="submit" disabled={saveMutation.isPending}>
                <Plus className="h-4 w-4 mr-2" />
                {editingId ? "Update Round" : "Create Round"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Rounds</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading rounds...</p>
          ) : rounds && rounds.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Program</TableHead>
                  <TableHead>Round</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Resources</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rounds.map((round) => (
                  <TableRow key={round.id}>
                    <TableCell className="font-medium">
                      {programs?.find(p => p.slug === round.program_slug)?.title || round.program_slug}
                    </TableCell>
                    <TableCell>{round.round_name}</TableCell>
                    <TableCell>#{round.round_number}</TableCell>
                    <TableCell>{format(new Date(round.start_date), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(round.status)}`}>
                        {round.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {round.google_meet_link && (
                          <div title="Meet link added">
                            <Video className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        {round.google_drive_link && (
                          <div title="Drive folder added">
                            <FolderOpen className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        {round.first_session_date && (
                          <div title="First session scheduled">
                            <CalendarDays className="h-4 w-4 text-primary" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(round)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMutation.mutate(round.id)}
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
            <p className="text-muted-foreground">No rounds created yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
