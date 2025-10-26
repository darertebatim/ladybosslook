import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

const EMAILS_TO_ENROLL = [
  "nazanin126@gmail.com",
  "honeymobarhan@icloud.com",
  "lfallahi385@gmail.com",
  "mahsa.akbaria.ma@gmail.com",
  "elhamghorbani16@gmail.com",
  "javanbakhtj@hotmail.com",
  "nooshcraft@yahoo.com",
  "vmoji63@gmail.com",
  "tabass1351@gmail.com",
  "mahtabbenham@gmail.com",
  "kianayazdan@yahoo.com",
  "sara.parvizi4@gmail.com",
  "ms.mary.abedi@gmail.com",
  "rozhan.mokhtari1379@gmail.com",
  "niloofar.aboodii@gmail.com",
  "fatemehmedicine@gmail.com",
  "zammarz@hotmail.com",
  "yalda.momeni92@gmail.com",
];

interface EnrollmentResult {
  email: string;
  status: "pending" | "success" | "error";
  message?: string;
}

export default function AutoEnrollUsers() {
  const [results, setResults] = useState<EnrollmentResult[]>(
    EMAILS_TO_ENROLL.map(email => ({ email, status: "pending" }))
  );
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const enrollUsers = async () => {
      setIsProcessing(true);
      const { data: session } = await supabase.auth.getSession();
      
      for (let i = 0; i < EMAILS_TO_ENROLL.length; i++) {
        const email = EMAILS_TO_ENROLL[i];
        
        try {
          const { data, error } = await supabase.functions.invoke("admin-create-enrollment", {
            body: {
              email: email.toLowerCase(),
              courseName: "Empowered Woman Coaching",
              programSlug: "empowered-woman-coaching",
              roundId: "41dac9da-d2d3-4ef0-936f-db88233b0f75", // US1
            },
            headers: {
              Authorization: `Bearer ${session.session?.access_token}`,
            },
          });

          if (error) {
            setResults(prev => prev.map((r, idx) => 
              idx === i ? { ...r, status: "error", message: error.message } : r
            ));
          } else {
            setResults(prev => prev.map((r, idx) => 
              idx === i ? { ...r, status: "success", message: data.message } : r
            ));
          }
        } catch (error: any) {
          setResults(prev => prev.map((r, idx) => 
            idx === i ? { ...r, status: "error", message: error.message } : r
          ));
        }
      }
      
      setIsProcessing(false);
    };

    enrollUsers();
  }, []);

  const successCount = results.filter(r => r.status === "success").length;
  const errorCount = results.filter(r => r.status === "error").length;
  const pendingCount = results.filter(r => r.status === "pending").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Auto-Enrolling Users to Empowered Woman Coaching (US1)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-4 text-sm">
          <span className="text-green-600">✓ Success: {successCount}</span>
          <span className="text-red-600">✗ Failed: {errorCount}</span>
          <span className="text-gray-600">⏳ Pending: {pendingCount}</span>
        </div>
        
        <div className="max-h-96 overflow-y-auto space-y-2">
          {results.map((result, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 p-2 rounded text-sm ${
                result.status === "success"
                  ? "bg-green-50 text-green-800"
                  : result.status === "error"
                  ? "bg-red-50 text-red-800"
                  : "bg-gray-50 text-gray-600"
              }`}
            >
              {result.status === "success" && <CheckCircle className="h-4 w-4" />}
              {result.status === "error" && <XCircle className="h-4 w-4" />}
              {result.status === "pending" && <Loader2 className="h-4 w-4 animate-spin" />}
              <span className="font-medium">{result.email}</span>
              {result.message && <span className="text-xs">- {result.message}</span>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
