import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

const UpdateMailchimpCities = () => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('update-mailchimp-cities', {
        body: {}
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Mailchimp Cities Updated! 🎉",
        description: `Successfully updated cities for faribanaseh@gmail.com (Calgary, Alberta) and yeganehkh80@gmail.com (Ankara)`,
      });

      console.log('Update results:', data);
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        title: "Update Failed",
        description: `Error: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-muted/50">
      <h3 className="font-semibold mb-2">Update Mailchimp Cities</h3>
      <p className="text-sm text-muted-foreground mb-4">
        This will update the city information for the 2 CCW participants from "Online" to their correct cities.
      </p>
      <Button 
        onClick={handleUpdate}
        disabled={isUpdating}
        size="sm"
      >
        {isUpdating ? 'Updating...' : 'Update Cities in Mailchimp'}
      </Button>
    </div>
  );
};

export default UpdateMailchimpCities;