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
          description: `Real email/phone test sent to Mailchimp for SMS verification (check your Mailchimp dashboard)`,
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

  const handleDirectTest = async () => {
    setLoading(true);
    try {
      console.log("Running direct Mailchimp API test...");
      
      const { data, error } = await supabase.functions.invoke('test-mailchimp-direct');
      
      if (error) {
        console.error("Direct test error:", error);
        toast({
          title: "Direct Test Failed",
          description: `Error: ${error.message}`,
          variant: "destructive"
        });
      } else {
        console.log("Direct test result:", data);
        toast({
          title: "Direct Test Complete!",
          description: `Check console for detailed API responses. List access: ${data.tests?.listAccess?.ok ? 'OK' : 'Failed'}`,
        });
      }
    } catch (err) {
      console.error("Direct test error:", err);
      toast({
        title: "Direct Test Failed", 
        description: "Failed to run direct test",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <Button 
        onClick={handleTest}
        disabled={loading}
        className="bg-purple-600 hover:bg-purple-700"
      >
        {loading ? "Testing..." : "Test Mailchimp"}
      </Button>
      <Button 
        onClick={handleDirectTest}
        disabled={loading}
        className="bg-red-600 hover:bg-red-700"
      >
        {loading ? "Testing..." : "Direct API Test"}
      </Button>
    </div>
  );
}