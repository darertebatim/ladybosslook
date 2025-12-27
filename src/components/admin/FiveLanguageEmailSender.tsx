import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Loader2, CheckCircle, AlertCircle, Tag } from "lucide-react";

interface EmailResult {
  success: boolean;
  message: string;
  sent: number;
  failed: number;
  emails: string[];
  errors: string[];
}

interface TagResult {
  success: boolean;
  message: string;
  tagged: number;
  alreadyTagged: number;
  notFound: number;
  failed: number;
  emails: string[];
  errors: string[];
}

export function FiveLanguageEmailSender() {
  const [sending, setSending] = useState(false);
  const [tagging, setTagging] = useState(false);
  const [result, setResult] = useState<EmailResult | null>(null);
  const [tagResult, setTagResult] = useState<TagResult | null>(null);

  const sendEmails = async () => {
    setSending(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await supabase.functions.invoke("send-five-language-confirmation", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setResult(response.data);
      
      if (response.data.sent > 0) {
        toast.success(`Successfully sent ${response.data.sent} emails!`);
      }
      if (response.data.failed > 0) {
        toast.warning(`${response.data.failed} emails failed to send`);
      }
    } catch (error: any) {
      console.error("Error sending emails:", error);
      toast.error(`Failed to send emails: ${error.message}`);
    } finally {
      setSending(false);
    }
  };

  const tagBuyers = async () => {
    setTagging(true);
    setTagResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const response = await supabase.functions.invoke("tag-five-language-buyers", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setTagResult(response.data);
      
      if (response.data.tagged > 0) {
        toast.success(`Successfully tagged ${response.data.tagged} members!`);
      }
      if (response.data.alreadyTagged > 0) {
        toast.info(`${response.data.alreadyTagged} members already had the tag`);
      }
      if (response.data.failed > 0) {
        toast.warning(`${response.data.failed} failed to tag`);
      }
    } catch (error: any) {
      console.error("Error tagging buyers:", error);
      toast.error(`Failed to tag buyers: ${error.message}`);
    } finally {
      setTagging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mailchimp Tagging Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tag Five Language Buyers in Mailchimp
          </CardTitle>
          <CardDescription>
            Add "five_language" and "paid_customer" tags to all Five Language buyers in Mailchimp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={tagBuyers} 
            disabled={tagging}
            variant="outline"
            className="w-full"
          >
            {tagging ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Tagging Members...
              </>
            ) : (
              <>
                <Tag className="mr-2 h-4 w-4" />
                Add Tags to All Buyers
              </>
            )}
          </Button>

          {tagResult && (
            <div className="space-y-3">
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                tagResult.failed === 0 ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"
              }`}>
                {tagResult.failed === 0 ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span className="font-medium">{tagResult.message}</span>
              </div>

              {tagResult.errors.length > 0 && (
                <div className="text-sm">
                  <p className="font-medium text-red-600 mb-1">✗ Errors:</p>
                  <div className="max-h-40 overflow-y-auto bg-red-500/10 rounded p-2">
                    {tagResult.errors.map((error, i) => (
                      <div key={i} className="text-red-600">{error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Sending Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Five Language Payment Confirmation
          </CardTitle>
          <CardDescription>
            Send payment confirmation emails to all Five Language customers with Telegram support link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
            <p><strong>Email includes:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Payment confirmation (bilingual Farsi/English)</li>
              <li>10-night challenge details</li>
              <li>Start date: January 5, 2026</li>
              <li>Telegram support link: t.me/ladybosslook</li>
            </ul>
          </div>

          <Button 
            onClick={sendEmails} 
            disabled={sending}
            className="w-full"
          >
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending Emails...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Send Confirmation Emails
              </>
            )}
          </Button>

          {result && (
            <div className="space-y-3">
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                result.failed === 0 ? "bg-green-500/10 text-green-600" : "bg-yellow-500/10 text-yellow-600"
              }`}>
                {result.failed === 0 ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span className="font-medium">{result.message}</span>
              </div>

              {result.emails.length > 0 && (
                <div className="text-sm">
                  <p className="font-medium text-green-600 mb-1">✓ Sent to:</p>
                  <div className="max-h-40 overflow-y-auto bg-muted/30 rounded p-2">
                    {result.emails.map((email, i) => (
                      <div key={i} className="text-muted-foreground">{email}</div>
                    ))}
                  </div>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="text-sm">
                  <p className="font-medium text-red-600 mb-1">✗ Failed:</p>
                  <div className="max-h-40 overflow-y-auto bg-red-500/10 rounded p-2">
                    {result.errors.map((error, i) => (
                      <div key={i} className="text-red-600">{error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
