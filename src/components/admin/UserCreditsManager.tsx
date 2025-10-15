import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Wallet, Plus, Users } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface UserWallet {
  user_id: string;
  credits_balance: number;
  profiles: {
    email: string;
    full_name: string | null;
  };
}

export function UserCreditsManager() {
  const [users, setUsers] = useState<UserWallet[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [creditAmount, setCreditAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          user_wallets!inner (
            credits_balance
          )
        `);

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedData = (data || []).map((profile: any) => ({
        user_id: profile.id,
        credits_balance: profile.user_wallets?.[0]?.credits_balance || 0,
        profiles: {
          email: profile.email,
          full_name: profile.full_name
        }
      }));
      
      setUsers(transformedData);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
    }
  };

  const handleAddCredits = async () => {
    if (!selectedUserId || !creditAmount || parseInt(creditAmount) <= 0) {
      toast({
        title: "Invalid input",
        description: "Please select a user and enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Get current balance
      const { data: walletData, error: walletError } = await supabase
        .from('user_wallets')
        .select('credits_balance')
        .eq('user_id', selectedUserId)
        .single();

      if (walletError) throw walletError;

      const newBalance = (walletData?.credits_balance || 0) + parseInt(creditAmount);

      // Update wallet balance
      const { error: updateError } = await supabase
        .from('user_wallets')
        .update({ credits_balance: newBalance })
        .eq('user_id', selectedUserId);

      if (updateError) throw updateError;

      // Record transaction
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: selectedUserId,
          amount: parseInt(creditAmount),
          transaction_type: 'credit',
          description: description || 'Credits added by admin',
          admin_id: user?.id
        });

      if (transactionError) throw transactionError;

      toast({
        title: "Success",
        description: `Added ${creditAmount} credits successfully`
      });

      setCreditAmount('');
      setDescription('');
      loadUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          User Credits Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Credits Form */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <h3 className="font-semibold flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Credits to User
          </h3>
          
          <div className="space-y-2">
            <Label htmlFor="user-select">Select User</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger id="user-select">
                <SelectValue placeholder="Choose a user..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((wallet) => (
                  <SelectItem key={wallet.user_id} value={wallet.user_id}>
                    {wallet.profiles?.email} - Current: {wallet.credits_balance} credits
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="credit-amount">Credits Amount</Label>
            <Input
              id="credit-amount"
              type="number"
              min="1"
              value={creditAmount}
              onChange={(e) => setCreditAmount(e.target.value)}
              placeholder="Enter amount to add..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Reason for adding credits..."
              rows={2}
            />
          </div>

          <Button 
            onClick={handleAddCredits}
            disabled={isLoading || !selectedUserId || !creditAmount}
            className="w-full"
          >
            {isLoading ? 'Processing...' : 'Add Credits'}
          </Button>
        </div>

        {/* Users List */}
        <div className="space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Users ({users.length})
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {users.map((wallet) => (
              <div
                key={wallet.user_id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">
                    {wallet.profiles?.full_name || 'No name'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {wallet.profiles?.email}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{wallet.credits_balance}</p>
                  <p className="text-xs text-muted-foreground">credits</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}