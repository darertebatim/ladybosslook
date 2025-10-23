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
import { Calendar, Plus, Trash2, Edit } from "lucide-react";
import { format } from "date-fns";

interface ProgramRound {
  id: string;
  program_slug: string;
  round_name: string;
  round_number: number;
  start_date: string;
  end_date: string | null;
  status: 'upcoming' | 'active' | 'completed';
  max_students: number | null;
}

interface RoundFormData {
  program_slug: string;
  round_name: string;
  round_number: number;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'completed';
  max_students: string;
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
      const roundData = {
        program_slug: data.program_slug,
        round_name: data.round_name,
        round_number: data.round_number,
        start_date: data.start_date,
        end_date: data.end_date || null,
        status: data.status,
        max_students: data.max_students ? parseInt(data.max_students) : null,
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
    });
    setEditingId(null);
  };

  const handleEdit = (round: ProgramRound) => {
    setFormData({
      program_slug: round.program_slug,
      round_name: round.round_name,
      round_number: round.round_number,
      start_date: round.start_date,
      end_date: round.end_date || "",
      status: round.status,
      max_students: round.max_students?.toString() || "",
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

            <div className="flex gap-2">
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
                  <TableHead>Max Students</TableHead>
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
                    <TableCell>{round.max_students || 'Unlimited'}</TableCell>
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
