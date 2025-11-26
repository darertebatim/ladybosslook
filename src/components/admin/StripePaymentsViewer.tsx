import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Search, DollarSign, CreditCard, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Order {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  product_name: string;
  amount: number;
  currency: string;
  status: string;
  billing_city: string | null;
  billing_state: string | null;
  billing_country: string | null;
  stripe_session_id: string | null;
  program_slug: string | null;
  refunded: boolean;
  refunded_at: string | null;
  refund_amount: number | null;
  user_id: string | null;
}

export const StripePaymentsViewer = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [programs, setPrograms] = useState<Array<{ slug: string; title: string }>>([]);

  useEffect(() => {
    fetchOrders();
    fetchPrograms();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [searchTerm, startDate, endDate, selectedProgram, orders]);


  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('program_catalog')
        .select('slug, title')
        .order('title');

      if (error) throw error;
      setPrograms(data || []);
    } catch (error) {
      console.error('Error fetching programs:', error);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const numericTerm = parseFloat(searchTerm);
      
      filtered = filtered.filter(order => {
        // Search in text fields
        const textMatch = 
          order.email.toLowerCase().includes(term) ||
          order.name.toLowerCase().includes(term) ||
          (order.phone && order.phone.toLowerCase().includes(term));
        
        // Search in amount (compare as dollars)
        const amountMatch = !isNaN(numericTerm) && 
          (order.amount / 100).toFixed(2).includes(searchTerm);
        
        return textMatch || amountMatch;
      });
    }

    // Program filter
    if (selectedProgram !== 'all') {
      filtered = filtered.filter(order => order.program_slug === selectedProgram);
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(order => 
        new Date(order.created_at) >= new Date(startDate)
      );
    }
    if (endDate) {
      filtered = filtered.filter(order => 
        new Date(order.created_at) <= new Date(endDate + 'T23:59:59')
      );
    }

    setFilteredOrders(filtered);
  };

  const assignProduct = async (orderId: string, programSlug: string, userEmail: string, userId: string | null) => {
    try {
      // Get the program details
      const { data: program, error: programError } = await supabase
        .from('program_catalog')
        .select('title')
        .eq('slug', programSlug)
        .single();

      if (programError) throw programError;

      // Look up user by email if user_id is missing
      let finalUserId = userId;
      if (!finalUserId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', userEmail)
          .maybeSingle();

        if (profile) {
          finalUserId = profile.id;
          
          // Update the order to link the user_id
          await supabase
            .from('orders')
            .update({ user_id: finalUserId })
            .eq('id', orderId);
        }
      }

      // Update the order with the program
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          program_slug: programSlug,
          product_name: program.title
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // If user_id exists, enroll them in the course
      if (finalUserId) {
        const { error: enrollError } = await supabase
          .from('course_enrollments')
          .insert({
            user_id: finalUserId,
            course_name: program.title,
            program_slug: programSlug,
            status: 'active'
          });

        if (enrollError && !enrollError.message.includes('duplicate')) {
          throw enrollError;
        }
      }

      toast.success(`Product assigned${finalUserId ? ' and user enrolled' : ' (no user account found)'}`);
      fetchOrders(); // Refresh the list
    } catch (error: any) {
      console.error('Error assigning product:', error);
      toast.error(error.message || 'Failed to assign product');
    }
  };

  const exportToCSV = () => {
    const headers = [
      'ID',
      'Created Date (UTC)',
      'Amount',
      'Card Name',
      'Card Address City',
      'Card Address State',
      'Card Address Country',
      'Customer Email',
      'Customer Phone'
    ];

    const csvData = filteredOrders.map(order => [
      order.id,
      format(new Date(order.created_at), 'yyyy-MM-dd HH:mm:ss'),
      `${(order.amount / 100).toFixed(2)}`,
      order.name,
      order.billing_city || '',
      order.billing_state || '',
      order.billing_country || '',
      order.email,
      order.phone || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `stripe-payments-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('CSV exported successfully');
  };

  const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.amount, 0);
  const totalRefunded = filteredOrders.reduce((sum, order) => sum + (order.refund_amount || 0), 0);
  const completedPayments = filteredOrders.filter(o => !o.refunded).length;
  const refundedPayments = filteredOrders.filter(o => o.refunded).length;

  if (loading) {
    return <div className="p-8 text-center">Loading payments...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Filters</CardTitle>
          <CardDescription>Filter payments by date range and program to view specific analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Program</label>
              <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                <SelectTrigger>
                  <SelectValue placeholder="All Programs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs.map((program) => (
                    <SelectItem key={program.slug} value={program.slug}>
                      {program.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {(startDate || endDate || selectedProgram !== 'all') && (
              <div className="flex items-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setSelectedProgram('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">From {filteredOrders.length} payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Status</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedPayments}</div>
            <p className="text-xs text-muted-foreground">Completed • {refundedPayments} Refunded</p>
            {totalRefunded > 0 && (
              <p className="text-xs text-destructive mt-1">-${(totalRefunded / 100).toFixed(2)} refunded</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${filteredOrders.length > 0 ? ((totalRevenue / filteredOrders.length) / 100).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Stripe Payments</CardTitle>
          <CardDescription>View and export all payment transactions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, name, phone, or amount..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={exportToCSV} disabled={filteredOrders.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Payments Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const isUnknownProduct = order.product_name === 'Unknown Product';
                    
                    return (
                      <TableRow 
                        key={order.id}
                        className={isUnknownProduct ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}
                      >
                        <TableCell className="font-medium">
                          {format(new Date(order.created_at), 'MMM dd, yyyy')}
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(order.created_at), 'HH:mm')}
                          </div>
                        </TableCell>
                        <TableCell>{order.name}</TableCell>
                        <TableCell className="text-sm">{order.email}</TableCell>
                        <TableCell className="text-sm">{order.phone || '-'}</TableCell>
                        <TableCell className="max-w-[200px]">
                          {isUnknownProduct ? (
                            <Select 
                              onValueChange={(slug) => assignProduct(order.id, slug, order.email, order.user_id)}
                            >
                              <SelectTrigger className="w-full bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400">
                                <SelectValue placeholder="Unknown Product" />
                              </SelectTrigger>
                              <SelectContent>
                                {programs.map((program) => (
                                  <SelectItem key={program.slug} value={program.slug}>
                                    {program.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="truncate">{order.product_name}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {order.billing_city && (
                            <div>
                              {order.billing_city}
                              {order.billing_state && `, ${order.billing_state}`}
                              {order.billing_country && (
                                <div className="text-xs text-muted-foreground">{order.billing_country}</div>
                              )}
                            </div>
                          )}
                          {!order.billing_city && '-'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${(order.amount / 100).toFixed(2)}
                          <div className="text-xs text-muted-foreground uppercase">
                            {order.currency}
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.refunded ? (
                            <div className="space-y-1">
                              <Badge variant="destructive">Refunded</Badge>
                              {order.refunded_at && (
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(order.refunded_at), 'MMM dd, yyyy')}
                                </div>
                              )}
                            </div>
                          ) : (
                            <Badge variant={order.status === 'completed' || order.status === 'paid' ? 'default' : 'secondary'}>
                              {order.status}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
