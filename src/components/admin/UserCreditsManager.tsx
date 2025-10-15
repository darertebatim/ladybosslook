import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Wallet, Search } from 'lucide-react';

interface UserWallet {
  id: string;
  user_id: string;
  credits_balance: number;
  email: string;
  full_name: string | null;
}

export function UserCreditsManager() {
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWallet | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const searchUser = async () => {
    if (!searchEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter a user email to search",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      // Search for user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', searchEmail.trim())
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profile) {
        toast({
          title: "User not found",
          description: "No user found with this email",
          variant: "destructive"
        });
        return;
      }

      // Get or create wallet for user
      const { data: wallet, error: walletError } = await supabase
        .from('user_wallets')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();

      if (walletError) throw walletError;

      setSelectedUser({
        id: wallet?.id || '',
        user_id: profile.id,
        credits_balance: wallet?.credits_balance || 0,
        email: profile.email,
        full_name: profile.full_name
      });

      toast({
        title: "User found",
        description: `${profile.full_name || profile.email} - Current balance: $${wallet?.credits_balance || 0}`
      });
    } catch (error: any) {
      toast({
        title: "Search failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const addCredits = async () => {
    if (!selectedUser) return;

    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount === 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid credit amount",
        variant: "destructive"
      });
      return;
    }

    setIsAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Update wallet balance
      const newBalance = selectedUser.credits_balance + amount;
      const { error: updateError } = await supabase
        .from('user_wallets')
        .update({ credits_balance: newBalance })
        .eq('user_id', selectedUser.user_id);

      if (updateError) throw updateError;

      // Record transaction
      const { error: txError } = await supabase
        .from('credit_transactions')
        .insert({
          user_id: selectedUser.user_id,
          amount: Math.abs(amount),
          transaction_type: amount > 0 ? 'credit' : 'debit',
          description: description || (amount > 0 ? 'Credits added by admin' : 'Credits deducted by admin'),
          admin_id: user?.id
        });

      if (txError) throw txError;

      toast({
        title: "Success",
        description: `${amount > 0 ? 'Added' : 'Deducted'} $${Math.abs(amount)} ${amount > 0 ? 'to' : 'from'} ${selectedUser.email}'s account`
      });

      // Update local state
      setSelectedUser({
        ...selectedUser,
        credits_balance: newBalance
      });

      setCreditAmount('');
      setDescription('');
    } catch (error: any) {
      toast({
        title: "Failed to update credits",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Manage User Credits
        </CardTitle>
        <CardDescription>
          Search for users and add or deduct store credits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Section */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="searchEmail">User Email</Label>
            <Input
              id="searchEmail"
              type="email"
              placeholder="user@example.com"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchUser()}
            />
          </div>
          <Button 
            onClick={searchUser} 
            disabled={isSearching}
            className="mt-6"
          >
            <Search className="mr-2 h-4 w-4" />
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {/* User Details & Credit Management */}
        {selectedUser && (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <div>
              <h3 className="font-semibold text-lg">{selectedUser.full_name || 'No name'}</h3>
              <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              <p className="text-2xl font-bold mt-2">
                Current Balance: <span className="text-green-600">${selectedUser.credits_balance}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="creditAmount">Amount (use negative to deduct)</Label>
                <Input
                  id="creditAmount"
                  type="number"
                  placeholder="e.g., 100 or -50"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="Reason for credit adjustment"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <Button 
              onClick={addCredits} 
              disabled={isAdding || !creditAmount}
              className="w-full"
            >
              <Wallet className="mr-2 h-4 w-4" />
              {isAdding ? 'Processing...' : 'Update Credits'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
