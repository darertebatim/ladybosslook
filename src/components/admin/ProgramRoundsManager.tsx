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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Calendar, Plus, Trash2, Edit, Video, FolderOpen, CalendarDays, ListChecks, Copy, Pause, FastForward } from "lucide-react";
import { SessionsManager } from "./SessionsManager";
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
  audio_playlist_id: string | null;
  video_url: string | null;
  drip_offset_days: number;
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
  support_link_url: string;
  support_link_label: string;
  audio_playlist_id: string;
  video_url: string;
}

export const ProgramRoundsManager = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [managingSessionsRound, setManagingSessionsRound] = useState<ProgramRound | null>(null);
  
  // Drip adjustment dialog state
  const [adjustingDripRound, setAdjustingDripRound] = useState<ProgramRound | null>(null);
  const [dripAdjustmentType, setDripAdjustmentType] = useState<'freeze' | 'forward'>('freeze');
  const [dripAdjustmentDays, setDripAdjustmentDays] = useState<string>('7');
  
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
    first_session_timezone: "America/Los_Angeles",
    important_message: "",
    support_link_url: "",
    support_link_label: "",
    audio_playlist_id: "none",
    video_url: "",
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

  // Fetch audio playlists for dropdown
  const { data: playlists } = useQuery({
    queryKey: ["audio-playlists"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audio_playlists")
        .select("id, name, program_slug")
        .order("name");
      
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
        support_link_url: data.support_link_url || null,
        support_link_label: data.support_link_label || null,
        audio_playlist_id: data.audio_playlist_id === "none" ? null : data.audio_playlist_id || null,
        video_url: data.video_url || null,
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

  // Update drip offset mutation
  const updateDripOffsetMutation = useMutation({
    mutationFn: async ({ roundId, offsetChange }: { roundId: string; offsetChange: number }) => {
      // Get current offset
      const { data: round, error: fetchError } = await supabase
        .from('program_rounds')
        .select('drip_offset_days')
        .eq('id', roundId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const currentOffset = round?.drip_offset_days || 0;
      const newOffset = currentOffset + offsetChange;
      
      const { error } = await supabase
        .from('program_rounds')
        .update({ drip_offset_days: newOffset })
        .eq('id', roundId);
      
      if (error) throw error;
      return newOffset;
    },
    onSuccess: (newOffset) => {
      queryClient.invalidateQueries({ queryKey: ['program-rounds'] });
      toast.success(`Drip offset updated to ${newOffset >= 0 ? '+' : ''}${newOffset} days`);
      setAdjustingDripRound(null);
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
      first_session_timezone: "America/Los_Angeles",
      important_message: "",
      support_link_url: "",
      support_link_label: "",
      audio_playlist_id: "none",
      video_url: "",
    });
    setEditingId(null);
  };

  const handleEdit = (round: ProgramRound) => {
    // Convert UTC ISO string to local datetime for the default timezone
    let localDateTime = "";
    const defaultTimezone = "America/Los_Angeles";
    
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
      support_link_url: (round as any).support_link_url || "",
      support_link_label: (round as any).support_link_label || "",
      audio_playlist_id: round.audio_playlist_id || "none",
      video_url: round.video_url || "",
    });
    setEditingId(round.id);
  };

  const handleDuplicate = (round: ProgramRound) => {
    // Find the highest round number for this program
    const programRounds = rounds?.filter(r => r.program_slug === round.program_slug) || [];
    const maxRoundNumber = Math.max(...programRounds.map(r => r.round_number), 0);

    setFormData({
      program_slug: round.program_slug,
      round_name: "", // Clear - user should set new name
      round_number: maxRoundNumber + 1,
      start_date: "", // Clear - user should set new dates
      end_date: "",
      status: "upcoming",
      max_students: round.max_students?.toString() || "",
      google_meet_link: round.google_meet_link || "",
      google_drive_link: round.google_drive_link || "",
      first_session_date: "", // Clear - user should set new date
      first_session_duration: round.first_session_duration?.toString() || "90",
      first_session_timezone: "America/Los_Angeles",
      important_message: round.important_message || "",
      support_link_url: (round as any).support_link_url || "",
      support_link_label: (round as any).support_link_label || "",
      audio_playlist_id: round.audio_playlist_id || "none",
      video_url: round.video_url || "",
    });
    setEditingId(null); // This is a new round, not editing
    toast.info("Round duplicated - update the name and dates, then save");
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

  // If managing sessions, show the sessions manager
  if (managingSessionsRound) {
    const programTitle = programs?.find(p => p.slug === managingSessionsRound.program_slug)?.title || managingSessionsRound.program_slug;
    return (
      <SessionsManager
        roundId={managingSessionsRound.id}
        roundName={managingSessionsRound.round_name}
        programTitle={programTitle}
        programSlug={managingSessionsRound.program_slug}
        defaultMeetLink={managingSessionsRound.google_meet_link || undefined}
        defaultDuration={managingSessionsRound.first_session_duration || 90}
        firstSessionDate={managingSessionsRound.first_session_date || undefined}
        startDate={managingSessionsRound.start_date}
        endDate={managingSessionsRound.end_date || undefined}
        onClose={() => setManagingSessionsRound(null)}
      />
    );
  }

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
              <Label htmlFor="video_url">Video URL (YouTube, Vimeo, etc.)</Label>
              <Input
                id="video_url"
                type="url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="text-xs text-muted-foreground">Add a video to display above the important message</p>
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

            <div className="space-y-2">
              <Label htmlFor="support_link_url">Support Link URL (Optional)</Label>
              <Input
                id="support_link_url"
                type="url"
                value={formData.support_link_url}
                onChange={(e) => setFormData({ ...formData, support_link_url: e.target.value })}
                placeholder="e.g., https://t.me/username or https://wa.me/1234567890"
              />
              <p className="text-xs text-muted-foreground">
                Telegram: https://t.me/username • WhatsApp: https://wa.me/1234567890
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="support_link_label">Support Button Label (Optional)</Label>
              <Input
                id="support_link_label"
                type="text"
                value={formData.support_link_label}
                onChange={(e) => setFormData({ ...formData, support_link_label: e.target.value })}
                placeholder="e.g., Contact Telegram Support"
              />
              <p className="text-xs text-muted-foreground">The text shown on the support button</p>
            </div>

            <div className="space-y-2 mt-4">
              <Label htmlFor="audio_playlist">Audio Playlist (Optional)</Label>
              <Select
                value={formData.audio_playlist_id}
                onValueChange={(value) => setFormData({ ...formData, audio_playlist_id: value === "none" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select audio playlist" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {playlists?.map((playlist) => (
                    <SelectItem key={playlist.id} value={playlist.id}>
                      {playlist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Select the audio playlist for this round's supplementary materials</p>
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
                  <TableHead>Drip Offset</TableHead>
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
                    <TableCell>{format(new Date(round.start_date + 'T00:00:00'), 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(round.status)}`}>
                        {round.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          (round.drip_offset_days || 0) > 0 ? 'text-orange-600' : 
                          (round.drip_offset_days || 0) < 0 ? 'text-green-600' : 
                          'text-muted-foreground'
                        }`}>
                          {(round.drip_offset_days || 0) >= 0 ? '+' : ''}{round.drip_offset_days || 0}d
                        </span>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setAdjustingDripRound(round);
                              setDripAdjustmentType('freeze');
                              setDripAdjustmentDays('7');
                            }}
                            title="Freeze drip (delay all tracks)"
                          >
                            <Pause className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              setAdjustingDripRound(round);
                              setDripAdjustmentType('forward');
                              setDripAdjustmentDays('1');
                            }}
                            title="Forward drip (release earlier)"
                          >
                            <FastForward className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
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
                          onClick={() => setManagingSessionsRound(round)}
                          title="Manage Sessions"
                        >
                          <ListChecks className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicate(round)}
                          title="Duplicate Round"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(round)}
                          title="Edit Round"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteMutation.mutate(round.id)}
                          title="Delete Round"
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

      {/* Drip Adjustment Dialog */}
      <Dialog open={!!adjustingDripRound} onOpenChange={() => setAdjustingDripRound(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dripAdjustmentType === 'freeze' ? 'Freeze Drip Schedule' : 'Forward Drip Schedule'}
            </DialogTitle>
            <DialogDescription>
              {dripAdjustmentType === 'freeze' 
                ? 'Delay all track unlocks for this round. Use during holidays or breaks.'
                : 'Release tracks earlier than scheduled. Tracks will unlock sooner.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <Label>Days to {dripAdjustmentType === 'freeze' ? 'delay' : 'advance'}:</Label>
              <Input
                type="number"
                min="1"
                max="30"
                value={dripAdjustmentDays}
                onChange={(e) => setDripAdjustmentDays(e.target.value)}
                className="w-20"
              />
            </div>
            
            <p className="text-sm text-muted-foreground">
              Current offset: {(adjustingDripRound?.drip_offset_days || 0) >= 0 ? '+' : ''}
              {adjustingDripRound?.drip_offset_days || 0} days
            </p>
            
            <p className="text-sm text-muted-foreground">
              New offset will be: {(() => {
                const current = adjustingDripRound?.drip_offset_days || 0;
                const days = parseInt(dripAdjustmentDays) || 0;
                const newOffset = dripAdjustmentType === 'freeze' ? current + days : current - days;
                return `${newOffset >= 0 ? '+' : ''}${newOffset} days`;
              })()}
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdjustingDripRound(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                const days = parseInt(dripAdjustmentDays) || 0;
                const change = dripAdjustmentType === 'freeze' ? days : -days;
                updateDripOffsetMutation.mutate({ 
                  roundId: adjustingDripRound!.id, 
                  offsetChange: change 
                });
              }}
              disabled={updateDripOffsetMutation.isPending}
            >
              {dripAdjustmentType === 'freeze' ? 'Freeze' : 'Forward'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
