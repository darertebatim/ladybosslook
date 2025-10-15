import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePrograms } from '@/hooks/usePrograms';

export function ProgramSyncButton() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { programs } = usePrograms();

  const handleSync = async () => {
    setLoading(true);
    try {
      // For each program, upsert into program_catalog
      const programCatalogData = programs.map(p => ({
        slug: p.slug,
        title: p.title,
        type: p.type,
        payment_type: p.paymentType,
        price_amount: p.priceAmount,
        is_active: true
      }));

      const { error } = await supabase
        .from('program_catalog')
        .upsert(programCatalogData, { 
          onConflict: 'slug',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Synced ${programs.length} programs to the database catalog`,
      });
    } catch (error: any) {
      console.error('Sync error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Program Catalog Sync
        </CardTitle>
        <CardDescription>
          Sync program definitions from code to database. This ensures the catalog is always up to date.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleSync} disabled={loading} className="w-full">
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Syncing...' : `Sync ${programs.length} Programs`}
        </Button>
      </CardContent>
    </Card>
  );
}
