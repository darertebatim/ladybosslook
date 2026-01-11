import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Calendar, CheckCircle, Edit, AlertTriangle, Loader2 } from "lucide-react";
import { format, isPast } from "date-fns";
import { Badge } from "@/components/ui/badge";

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
  program_rounds: {
    id: string;
    round_number: number;
    round_name: string;
    program_slug: string;
  };
}

interface Filters {
  programSlug: string;
  status: string;
  showPastOnly: boolean;
}

export default function PastSessionsManager() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<Filters>({
    programSlug: "all",
    status: "scheduled",
    showPastOnly: true,
  });

  // Fetch all programs for filter
  const { data: programs } = useQuery({
    queryKey: ["programs-for-filter"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("program_catalog")
        .select("slug, title")
        .eq("is_active", true)
        .order("title");
      if (error) throw error;
      return data;
    },
  });

  // Fetch sessions with filters
  const { data: sessions, isLoading } = useQuery({
    queryKey: ["all-program-sessions", filters],
    queryFn: async () => {
      let query = supabase
        .from("program_sessions")
        .select(`
          *,
          program_rounds!inner (
            id,
            round_number,
            round_name,
            program_slug
          )
        `)
        .order("session_date", { ascending: false });

      // Apply status filter
      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      // Apply program filter
      if (filters.programSlug !== "all") {
        query = query.eq("program_rounds.program_slug", filters.programSlug);
      }

      // Apply past-only filter
      if (filters.showPastOnly) {
        query = query.lt("session_date", new Date().toISOString());
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as ProgramSession[];
    },
  });

  // Quick mark complete mutation
  const markCompleteMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from("program_sessions")
        .update({ status: 'completed' })
        .eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-program-sessions"] });
      toast.success("Session marked as completed");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Bulk mark complete mutation
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  
  const bulkMarkCompleteMutation = useMutation({
    mutationFn: async (sessionIds: string[]) => {
      const { error } = await supabase
        .from("program_sessions")
        .update({ status: 'completed' })
        .in("id", sessionIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-program-sessions"] });
      toast.success(`${selectedSessions.length} sessions marked as completed`);
      setSelectedSessions([]);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'scheduled': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      case 'rescheduled': return 'outline';
      default: return 'default';
    }
  };

  const toggleSession = (sessionId: string) => {
    setSelectedSessions(prev => 
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    );
  };

  const toggleAll = () => {
    if (!sessions) return;
    const scheduledSessions = sessions.filter(s => s.status === 'scheduled');
    if (selectedSessions.length === scheduledSessions.length) {
      setSelectedSessions([]);
    } else {
      setSelectedSessions(scheduledSessions.map(s => s.id));
    }
  };

  const pastScheduledCount = sessions?.filter(
    s => s.status === 'scheduled' && isPast(new Date(s.session_date))
  ).length || 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            All Sessions
          </CardTitle>
          <CardDescription>
            View and manage sessions across all programs and rounds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Program:</span>
              <Select
                value={filters.programSlug}
                onValueChange={(value) => setFilters(prev => ({ ...prev, programSlug: value }))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs?.filter(p => p.slug).map((program) => (
                    <SelectItem key={program.slug} value={program.slug}>
                      {program.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="rescheduled">Rescheduled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="past-only"
                checked={filters.showPastOnly}
                onCheckedChange={(checked) => 
                  setFilters(prev => ({ ...prev, showPastOnly: !!checked }))
                }
              />
              <label htmlFor="past-only" className="text-sm cursor-pointer">
                Past sessions only
              </label>
            </div>
          </div>

          {/* Alert for sessions needing attention */}
          {pastScheduledCount > 0 && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <span className="text-sm text-amber-800">
                <strong>{pastScheduledCount}</strong> past session{pastScheduledCount > 1 ? 's' : ''} still marked as "scheduled" - consider marking them complete
              </span>
            </div>
          )}

          {/* Bulk actions */}
          {selectedSessions.length > 0 && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedSessions.length} selected
              </span>
              <Button
                size="sm"
                onClick={() => bulkMarkCompleteMutation.mutate(selectedSessions)}
                disabled={bulkMarkCompleteMutation.isPending}
              >
                {bulkMarkCompleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Mark All Complete
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedSessions([])}
              >
                Clear
              </Button>
            </div>
          )}

          {/* Sessions table */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions && sessions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        sessions.filter(s => s.status === 'scheduled').length > 0 &&
                        selectedSessions.length === sessions.filter(s => s.status === 'scheduled').length
                      }
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>#</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Program / Round</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      {session.status === 'scheduled' && (
                        <Checkbox
                          checked={selectedSessions.includes(session.id)}
                          onCheckedChange={() => toggleSession(session.id)}
                        />
                      )}
                    </TableCell>
                    <TableCell>{session.session_number}</TableCell>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {session.title}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{session.program_rounds.program_slug}</div>
                        <div className="text-muted-foreground">{session.program_rounds.round_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {format(new Date(session.session_date), 'MMM d, yyyy')}
                        <div className="text-muted-foreground">
                          {format(new Date(session.session_date), 'h:mm a')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(session.status)}>
                        {session.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {session.status === 'scheduled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 hover:bg-green-50 hover:text-green-700"
                            onClick={() => markCompleteMutation.mutate(session.id)}
                            disabled={markCompleteMutation.isPending}
                            title="Mark as completed"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No sessions found matching your filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
