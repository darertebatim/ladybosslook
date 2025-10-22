import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { History, TrendingUp, TrendingDown } from 'lucide-react';

interface Transaction {
  id: string;
  amount: number;
  transaction_type: string;
  description: string | null;
  created_at: string;
}

export function CreditTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return null;
  }

  if (transactions.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2 lg:pb-6">
        <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
          <History className="h-4 w-4 lg:h-5 lg:w-5" />
          Credit History
        </CardTitle>
        <CardDescription className="text-xs lg:text-sm hidden lg:block">
          Your latest store credit activity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 lg:space-y-3">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-2 lg:p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
                <div className={`p-1.5 lg:p-2 rounded-full flex-shrink-0 ${
                  transaction.transaction_type === 'credit' 
                    ? 'bg-green-500/10' 
                    : 'bg-red-500/10'
                }`}>
                  {transaction.transaction_type === 'credit' ? (
                    <TrendingUp className="h-3 w-3 lg:h-4 lg:w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 lg:h-4 lg:w-4 text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-xs lg:text-sm truncate">
                    {transaction.description || 'Credit transaction'}
                  </p>
                  <p className="text-[10px] lg:text-xs text-muted-foreground">
                    {new Date(transaction.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`font-bold text-xs lg:text-base ${
                  transaction.transaction_type === 'credit' 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}>
                  {transaction.transaction_type === 'credit' ? '+' : '-'}
                  ${transaction.amount}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}