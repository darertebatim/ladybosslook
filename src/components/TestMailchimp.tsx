import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function TestMailchimp() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleTest = async () => {
    setLoading(true);
    try {
      console.log("Testing Mailchimp integration...");
      
      const { data, error } = await supabase.functions.invoke('test-mailchimp');
      
      if (error) {
        console.error("Test function error:", error);
        toast({
          title: "Test Failed",
          description: `Error: ${error.message}`,
          variant: "destructive"
        });
      } else {
        console.log("Test function result:", data);
        toast({
          title: "Test Sent!",
          description: "Mailchimp test subscription sent to alilotfihami@gmail.com with workshop tag",
        });
      }
    } catch (err) {
      console.error("Test error:", err);
      toast({
        title: "Test Failed", 
        description: "Failed to run test",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button 
        onClick={handleTest}
        disabled={loading}
        className="bg-purple-600 hover:bg-purple-700"
      >
        {loading ? "Testing..." : "Test Mailchimp"}
      </Button>
    </div>
  );
}