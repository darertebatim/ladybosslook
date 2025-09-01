import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Shield, User, Calendar, RefreshCw } from 'lucide-react';

interface SecurityEvent {
  id: string;
  user_id?: string | null;
  action: string;
  details?: any;
  created_at: string;
  ip_address?: string | null;
  user_agent?: string | null;
}

export default function SecurityAuditLog() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSecurityEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('security_audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      setEvents((data || []) as SecurityEvent[]);
    } catch (error: any) {
      console.error('Error fetching security events:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to load security events: ${error.message}`,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityEvents();
  }, []);

  const getEventColor = (action: string): string => {
    if (action.includes('failed') || action.includes('error')) {
      return 'destructive';
    }
    if (action.includes('success') || action.includes('assigned')) {
      return 'default';
    }
    if (action.includes('attempt') || action.includes('updated')) {
      return 'secondary';
    }
    return 'outline';
  };

  const getEventIcon = (action: string) => {
    if (action.includes('failed') || action.includes('error')) {
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    }
    if (action.includes('role') || action.includes('assigned')) {
      return <Shield className="h-4 w-4 text-primary" />;
    }
    return <User className="h-4 w-4 text-muted-foreground" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDetails = (details: any) => {
    if (!details) return null;
    
    try {
      const parsed = typeof details === 'string' ? JSON.parse(details) : details;
      return (
        <div className="mt-2 text-sm text-muted-foreground">
          <pre className="whitespace-pre-wrap bg-muted/50 p-2 rounded text-xs">
            {JSON.stringify(parsed, null, 2)}
          </pre>
        </div>
      );
    } catch {
      return (
        <div className="mt-2 text-sm text-muted-foreground">
          {String(details)}
        </div>
      );
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Audit Log
          </CardTitle>
          <CardDescription>Loading security events...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Audit Log
            </CardTitle>
            <CardDescription>
              Recent security events and user activities (last 50 events)
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchSecurityEvents}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No security events recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="mt-1">
                  {getEventIcon(event.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getEventColor(event.action) as any}>
                      {event.action.replace(/_/g, ' ').toUpperCase()}
                    </Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(event.created_at)}
                    </span>
                  </div>
                  {event.user_id && (
                    <div className="text-sm text-muted-foreground mb-1">
                      User ID: <code className="text-xs bg-muted px-1 rounded">{event.user_id}</code>
                    </div>
                  )}
                  {formatDetails(event.details)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}