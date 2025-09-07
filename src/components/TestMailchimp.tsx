import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function TestMailchimp() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
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
          description: "Mailchimp test subscription sent to john.testuser@gmail.com",
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

  const handleCheck = async () => {
    setChecking(true);
    try {
      console.log("Checking Mailchimp member...");
      
      const { data, error } = await supabase.functions.invoke('check-mailchimp-member', {
        body: { email: "john.testuser@gmail.com" }
      });
      
      if (error) {
        console.error("Check function error:", error);
        toast({
          title: "Check Failed",
          description: `Error: ${error.message}`,
          variant: "destructive"
        });
      } else {
        console.log("Check function result:", data);
        if (data.exists) {
          const thankUrl = data.member.merge_fields?.THANKURL;
          toast({
            title: "Member Found!",
            description: `Status: ${data.member.status}, THANKURL: ${thankUrl || 'Not set'}`,
          });
          
          // Test the thank you URL
          if (thankUrl) {
            console.log("Testing THANKURL:", thankUrl);
            try {
              const urlTest = await fetch(thankUrl, { method: 'HEAD' });
              console.log("THANKURL test result:", urlTest.status);
              toast({
                title: "THANKURL Test",
                description: `URL returns status: ${urlTest.status}`,
              });
            } catch (urlError) {
              console.error("THANKURL test failed:", urlError);
              toast({
                title: "THANKURL Test Failed",
                description: "URL is not accessible",
                variant: "destructive"
              });
            }
          }
        } else {
          toast({
            title: "Member Not Found",
            description: "The test email was not found in Mailchimp list",
            variant: "destructive"
          });
        }
      }
    } catch (err) {
      console.error("Check error:", err);
      toast({
        title: "Check Failed", 
        description: "Failed to check member",
        variant: "destructive"
      });
    } finally {
      setChecking(false);
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
        onClick={handleCheck}
        disabled={checking}
        className="bg-blue-600 hover:bg-blue-700"
      >
        {checking ? "Checking..." : "Check Member"}
      </Button>
    </div>
  );
}