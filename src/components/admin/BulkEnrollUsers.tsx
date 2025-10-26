import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePrograms } from "@/hooks/usePrograms";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function BulkEnrollUsers() {
  const [emails, setEmails] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedRound, setSelectedRound] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<Array<{ email: string; status: string; message: string }>>([]);
  const { toast } = useToast();
  const { programs, isLoading: programsLoading } = usePrograms();

  const { data: rounds = [], isLoading: roundsLoading } = useQuery({
    queryKey: ["rounds", selectedCourse],
    queryFn: async () => {
      if (!selectedCourse) return [];
      
      const program = programs.find(p => p.title === selectedCourse);
      if (!program) return [];

      const { data, error } = await supabase
        .from("program_rounds")
        .select("id, round_name, status")
        .eq("program_slug", program.slug)
        .in("status", ["upcoming", "active"])
        .order("round_number", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedCourse && !programsLoading,
  });

  const handleBulkEnroll = async () => {
    if (!emails.trim() || !selectedCourse) {
      toast({
        title: "Error",
        description: "Please provide emails and select a course",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setResults([]);

    // Parse emails (split by newline, comma, or semicolon)
    const emailList = emails
      .split(/[\n,;]/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0 && e.includes("@"));

    const program = programs.find(p => p.title === selectedCourse);
    const enrollmentResults: Array<{ email: string; status: string; message: string }> = [];

    for (const email of emailList) {
      try {
        const { data: session } = await supabase.auth.getSession();
        
        const { data, error } = await supabase.functions.invoke("admin-create-enrollment", {
          body: {
            email,
            courseName: selectedCourse,
            programSlug: program?.slug,
            roundId: selectedRound || undefined,
          },
          headers: {
            Authorization: `Bearer ${session.session?.access_token}`,
          },
        });

        if (error) {
          enrollmentResults.push({
            email,
            status: "error",
            message: error.message || "Unknown error",
          });
        } else {
          enrollmentResults.push({
            email,
            status: "success",
            message: data.message || "Enrolled successfully",
          });
        }
      } catch (error: any) {
        enrollmentResults.push({
          email,
          status: "error",
          message: error.message || "Failed to enroll",
        });
      }
    }

    setResults(enrollmentResults);
    setIsProcessing(false);

    const successCount = enrollmentResults.filter(r => r.status === "success").length;
    const errorCount = enrollmentResults.filter(r => r.status === "error").length;

    toast({
      title: "Bulk Enrollment Complete",
      description: `Successfully enrolled: ${successCount}, Failed: ${errorCount}`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Enroll Users</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Course</label>
          <Select
            value={selectedCourse}
            onValueChange={setSelectedCourse}
            disabled={programsLoading || isProcessing}
          >
            <SelectTrigger>
              <SelectValue placeholder={programsLoading ? "Loading courses..." : "Select a course"} />
            </SelectTrigger>
            <SelectContent>
              {programs && programs.length > 0 ? (
                programs.map((program) => (
                  <SelectItem key={program.slug} value={program.title}>
                    {program.title}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-programs" disabled>
                  No programs available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        {selectedCourse && (
          <div>
            <label className="text-sm font-medium mb-2 block">Round (Optional)</label>
            <Select
              value={selectedRound}
              onValueChange={setSelectedRound}
              disabled={roundsLoading || isProcessing}
            >
              <SelectTrigger>
                <SelectValue placeholder={roundsLoading ? "Loading rounds..." : "Select a round (optional)"} />
              </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No specific round</SelectItem>
              {rounds && rounds.length > 0 && rounds.map((round) => (
                <SelectItem key={round.id} value={round.id}>
                  {round.round_name} ({round.status})
                </SelectItem>
              ))}
            </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-2 block">
            Email Addresses (one per line or comma-separated)
          </label>
          <Textarea
            placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            rows={10}
            disabled={isProcessing}
          />
        </div>

        <Button
          onClick={handleBulkEnroll}
          disabled={isProcessing || !emails.trim() || !selectedCourse}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing {results.length} of {emails.split(/[\n,;]/).filter(e => e.trim()).length}...
            </>
          ) : (
            "Enroll All Users"
          )}
        </Button>

        {results.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="font-semibold">Results:</h3>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-2 rounded text-sm ${
                    result.status === "success"
                      ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                      : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                  }`}
                >
                  <span className="font-medium">{result.email}</span>: {result.message}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
