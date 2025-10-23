import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Key } from "lucide-react";

export const VapidKeyGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [keys, setKeys] = useState<{ publicKey: string; privateKey: string } | null>(null);
  const { toast } = useToast();

  const generateKeys = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-vapid-keys');
      
      if (error) throw error;
      
      setKeys({
        publicKey: data.publicKey,
        privateKey: data.privateKey
      });
      
      toast({
        title: "VAPID Keys Generated",
        description: "Copy and save these keys as Supabase secrets",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Generate VAPID Keys
        </CardTitle>
        <CardDescription>
          Generate VAPID keys for push notifications. Save these as Supabase secrets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={generateKeys} 
          disabled={loading}
          className="w-full"
        >
          {loading ? "Generating..." : "Generate New VAPID Keys"}
        </Button>

        {keys && (
          <div className="space-y-4 mt-6">
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">Public Key:</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(keys.publicKey, "Public key")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <code className="text-xs break-all block bg-background p-2 rounded">
                {keys.publicKey}
              </code>
            </div>

            <div className="p-4 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">Private Key:</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(keys.privateKey, "Private key")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <code className="text-xs break-all block bg-background p-2 rounded">
                {keys.privateKey}
              </code>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg space-y-2">
              <p className="font-semibold text-sm">Next Steps:</p>
              <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground">
                <li>Copy the Public Key and save it as <code className="bg-background px-1 rounded">VAPID_PUBLIC_KEY</code> in Supabase secrets</li>
                <li>Copy the Private Key and save it as <code className="bg-background px-1 rounded">VAPID_PRIVATE_KEY</code> in Supabase secrets</li>
                <li>Update <code className="bg-background px-1 rounded">src/lib/pushNotifications.ts</code> with the public key</li>
              </ol>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
