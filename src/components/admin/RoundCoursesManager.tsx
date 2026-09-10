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
import { toast } from "sonner";
import { GraduationCap, Plus, Trash2 } from "lucide-react";

interface Props {
  roundId: string;
}

/** Attach Learn courses to a program round (same link table the Courses admin uses). */
export const RoundCoursesManager = ({ roundId }: Props) => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>("");

  const { data: courses = [] } = useQuery({
    queryKey: ["round-courses-options"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learn_courses")
        .select("id, title")
        .order("sort_order");
      if (error) throw error;
      return data || [];
    },
  });

  const { data: linked = [], isLoading } = useQuery({
    queryKey: ["round-courses", roundId],
    enabled: !!roundId,
    staleTime: 0,
    refetchOnMount: "always",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learn_course_rounds")
        .select("id, course_id, learn_courses(title)")
        .eq("round_id", roundId);
      if (error) throw error;
      return data || [];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["round-courses", roundId] });
    queryClient.invalidateQueries({ queryKey: ["learn-round-course"] });
    queryClient.invalidateQueries({ queryKey: ["admin-learn-courses"] });
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!selectedId) throw new Error("Pick a course first");
      const { error } = await supabase
        .from("learn_course_rounds")
        .insert({ round_id: roundId, course_id: selectedId });
      if (error) throw error;
    },
    onSuccess: () => {
      setSelectedId("");
      toast.success("Course attached");
      invalidate();
    },
    onError: (e: any) =>
      toast.error(
        e?.code === "23505" ? "That course is already attached" : e.message || "Failed to attach"
      ),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("learn_course_rounds").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Course removed");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message || "Failed to remove"),
  });

  const nameFor = (courseId: string) =>
    (courses as any[]).find((c) => c.id === courseId)?.title || "(deleted course)";

  const available = (courses as any[]).filter(
    (c) => !(linked as any[]).some((l) => l.course_id === c.id)
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="space-y-1 flex-1 min-w-[200px]">
          <p className="text-xs text-muted-foreground">Course</p>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a course" />
            </SelectTrigger>
            <SelectContent>
              {available.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => addMutation.mutate()} disabled={!selectedId || addMutation.isPending}>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : linked.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No courses attached yet. Students enrolled in this round get access to attached courses.
        </p>
      ) : (
        <div className="space-y-2">
          {(linked as any[]).map((row) => (
            <div key={row.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium flex-1 truncate">{nameFor(row.course_id)}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => removeMutation.mutate(row.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
