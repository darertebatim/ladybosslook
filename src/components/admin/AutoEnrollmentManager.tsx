import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, RefreshCw, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProgramCatalog {
  slug: string;
  title: string;
}

interface ProgramRound {
  id: string;
  round_number: number;
  round_name: string;
  program_slug: string;
  status: string;
}

interface AutoEnrollmentRule {
  id: string;
  program_slug: string;
  round_id: string;
  created_at: string;
  program_rounds: {
    round_name: string;
    round_number: number;
    program_slug: string;
  };
}

export default function AutoEnrollmentManager() {
  const [programs, setPrograms] = useState<ProgramCatalog[]>([]);
  const [rounds, setRounds] = useState<ProgramRound[]>([]);
  const [rules, setRules] = useState<AutoEnrollmentRule[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedRound, setSelectedRound] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load programs
      const { data: programsData, error: programsError } = await supabase
        .from('program_catalog')
        .select('slug, title')
        .eq('is_active', true)
        .order('title');

      if (programsError) throw programsError;
      setPrograms(programsData || []);

      // Load all rounds
      const { data: roundsData, error: roundsError } = await supabase
        .from('program_rounds')
        .select('id, round_number, round_name, program_slug, status')
        .order('program_slug, round_number');

      if (roundsError) throw roundsError;
      setRounds(roundsData || []);

      // Load existing rules
      await loadRules();
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadRules = async () => {
    const { data, error } = await supabase
      .from('program_auto_enrollment')
      .select(`
        id,
        program_slug,
        round_id,
        created_at,
        program_rounds (
          round_name,
          round_number,
          program_slug
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading rules:', error);
      return;
    }

    setRules(data || []);
  };

  const handleAddRule = async () => {
    if (!selectedProgram || !selectedRound) {
      toast({
        title: "Validation Error",
        description: "Please select both a program and a round",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('program_auto_enrollment')
        .upsert({
          program_slug: selectedProgram,
          round_id: selectedRound,
        }, {
          onConflict: 'program_slug'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Auto-enrollment rule saved successfully",
      });

      setSelectedProgram("");
      setSelectedRound("");
      await loadRules();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast({
        title: "Error",
        description: "Failed to save auto-enrollment rule",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('program_auto_enrollment')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Auto-enrollment rule deleted",
      });

      await loadRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete rule",
        variant: "destructive",
      });
    }
  };

  const getProgramTitle = (slug: string) => {
    return programs.find(p => p.slug === slug)?.title || slug;
  };

  const getAvailableRounds = () => {
    if (!selectedProgram) return [];
    return rounds.filter(r => r.program_slug === selectedProgram);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Auto-Enrollment Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auto-Enrollment Manager</CardTitle>
        <CardDescription>
          Configure which programs automatically enroll users into specific rounds upon purchase
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Rule Section */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <h3 className="text-sm font-semibold">Add Auto-Enrollment Rule</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Program</label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger>
                  <SelectValue placeholder="Select program..." />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((program) => (
                    <SelectItem key={program.slug} value={program.slug}>
                      {program.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Target Round</label>
              <Select 
                value={selectedRound} 
                onValueChange={setSelectedRound}
                disabled={!selectedProgram}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select round..." />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableRounds().map((round) => (
                    <SelectItem key={round.id} value={round.id}>
                      Round #{round.round_number} - {round.round_name} ({round.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleAddRule} 
            disabled={!selectedProgram || !selectedRound || isSaving}
            className="w-full"
          >
            {isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Rule
              </>
            )}
          </Button>
        </div>

        {/* Existing Rules List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Active Rules ({rules.length})</h3>
            <Button variant="ghost" size="sm" onClick={loadRules}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {rules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No auto-enrollment rules configured yet
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="font-medium">
                      {getProgramTitle(rule.program_slug)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Auto-enrolls to: <Badge variant="secondary">
                        Round #{rule.program_rounds.round_number} - {rule.program_rounds.round_name}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

