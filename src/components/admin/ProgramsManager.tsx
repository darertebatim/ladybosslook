import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { GraduationCap, Plus, RefreshCw, Pencil, Trash2, Copy, Link2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { RichTextEditor } from './RichTextEditor';

interface ProgramCatalog {
  id: string;
  slug: string;
  title: string;
  type: string;
  payment_type: string;
  price_amount: number;
  original_price?: number | null;
  duration?: string | null;
  delivery_method?: string | null;
  subscription_full_payment_discount?: number | null;
  subscription_full_payment_price?: number | null;
  description?: string | null;
  features?: any;
  is_active: boolean;
  created_at: string;
  available_on_web: boolean;
  available_on_mobile: boolean;
  is_free_on_ios?: boolean;
  ios_product_id?: string | null;
  android_product_id?: string | null;
}

export function ProgramsManager() {
  const [programs, setPrograms] = useState<ProgramCatalog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    slug: '',
    title: '',
    type: 'course',
    payment_type: 'one-time',
    price_amount: 0,
    original_price: 0,
    deposit_price: 0,
    duration: '',
    delivery_method: 'on-demand',
    subscription_duration: '',
    subscription_interval: 'month' as string,
    subscription_interval_count: 1 as number,
    subscription_full_payment_price: 0,
    subscription_full_payment_discount: 0,
    description: '',
    is_active: true,
    audio_playlist_id: null as string | null,
    video_url: '',
    available_on_web: true,
    available_on_mobile: true,
    is_free_on_ios: false,
    ios_product_id: '',
    android_product_id: '',
    // Balance payment fields for deposit-type programs
    balance_full_price: 0,
    balance_monthly_price: 0,
    balance_monthly_count: 0,
    balance_full_discount: 0,
    // Stripe product IDs for reuse
    stripe_product_id: '',
    stripe_price_id: '',
  });

  // Fetch playlists for dropdown
  const { data: playlists } = useQuery({
    queryKey: ['audio-playlists'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audio_playlists')
        .select('id, name, program_slug')
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const fetchPrograms = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('program_catalog')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPrograms((data || []) as any);
    } catch (error: any) {
      console.error('Error fetching programs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch programs',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      slug: '',
      title: '',
      type: 'course',
      payment_type: 'one-time',
      price_amount: 0,
      original_price: 0,
      deposit_price: 0,
      duration: '',
      delivery_method: 'on-demand',
      subscription_duration: '',
      subscription_interval: 'month',
      subscription_interval_count: 1,
      subscription_full_payment_price: 0,
      subscription_full_payment_discount: 0,
      description: '',
      is_active: true,
      audio_playlist_id: null,
      video_url: '',
      available_on_web: true,
      available_on_mobile: true,
      is_free_on_ios: false,
      ios_product_id: '',
      android_product_id: '',
      balance_full_price: 0,
      balance_monthly_price: 0,
      balance_monthly_count: 0,
      balance_full_discount: 0,
      stripe_product_id: '',
      stripe_price_id: '',
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingId) {
        const { error } = await supabase
          .from('program_catalog')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Program updated successfully',
        });
      } else {
        const { error } = await supabase
          .from('program_catalog')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: 'Success',
          description: 'Program created successfully',
        });
      }

      resetForm();
      fetchPrograms();
    } catch (error: any) {
      console.error('Error saving program:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save program',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (program: ProgramCatalog) => {
    setFormData({
      slug: program.slug,
      title: program.title,
      type: program.type,
      payment_type: program.payment_type,
      price_amount: program.price_amount,
      original_price: program.original_price || 0,
      deposit_price: (program as any).deposit_price || 0,
      duration: program.duration || '',
      delivery_method: program.delivery_method || 'on-demand',
      subscription_duration: (program as any).subscription_duration || '',
      subscription_interval: (program as any).subscription_interval || 'month',
      subscription_interval_count: (program as any).subscription_interval_count || 1,
      subscription_full_payment_price: (program as any).subscription_full_payment_price || 0,
      subscription_full_payment_discount: program.subscription_full_payment_discount || 0,
      description: program.description || '',
      is_active: program.is_active,
      audio_playlist_id: (program as any).audio_playlist_id || null,
      video_url: (program as any).video_url || '',
      available_on_web: program.available_on_web,
      available_on_mobile: program.available_on_mobile,
      is_free_on_ios: program.is_free_on_ios || false,
      ios_product_id: program.ios_product_id || '',
      android_product_id: program.android_product_id || '',
      balance_full_price: (program as any).balance_full_price || 0,
      balance_monthly_price: (program as any).balance_monthly_price || 0,
      balance_monthly_count: (program as any).balance_monthly_count || 0,
      balance_full_discount: (program as any).balance_full_discount || 0,
      stripe_product_id: (program as any).stripe_product_id || '',
      stripe_price_id: (program as any).stripe_price_id || '',
    });
    setEditingId(program.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('program_catalog')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Program deleted successfully',
      });

      fetchPrograms();
    } catch (error: any) {
      console.error('Error deleting program:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete program',
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
  };

  const copyProductPageLink = (slug: string) => {
    const link = `https://ladybosslook.com/${slug}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Copied!',
      description: 'Product page link copied to clipboard',
    });
  };

  const copyPaymentLink = (slug: string) => {
    const link = `https://ladybosslook.com/${slug}pay`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Copied!',
      description: 'Payment link copied to clipboard',
    });
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Programs Management
              </CardTitle>
              <CardDescription>
                Manage your programs, courses, and coaching offerings
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchPrograms} variant="outline" size="sm" disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={() => setShowForm(!showForm)} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Program
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    const { programs } = await import('@/data/programs');
                    
                    for (const program of programs) {
                      const programData = {
                        slug: program.slug,
                        title: program.title,
                        type: program.type,
                        payment_type: program.paymentType,
                        price_amount: program.priceAmount * 100, // Convert dollars to cents
                        original_price: program.originalPrice ? parseFloat(program.originalPrice.replace('$', '').replace(',', '')) * 100 : null,
                        duration: program.duration,
                        delivery_method: program.type === 'course' ? 'on-demand' : 'live-online',
                        description: program.description,
                        is_active: true,
                      };

                      const { error } = await supabase
                        .from('program_catalog')
                        .upsert(programData, { 
                          onConflict: 'slug',
                          ignoreDuplicates: false 
                        });

                      if (error && error.code !== '23505') {
                        throw error;
                      }
                    }

                    toast({
                      title: 'Success',
                      description: `Synced ${programs.length} programs from code`,
                    });

                    fetchPrograms();
                  } catch (error: any) {
                    console.error('Sync error:', error);
                    toast({
                      title: 'Error',
                      description: 'Failed to sync programs',
                      variant: 'destructive',
                    });
                  } finally {
                    setIsLoading(false);
                  }
                }} 
                variant="outline" 
                size="sm"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Sync from Code
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-accent/5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Program Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Money Literacy Course"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL identifier)</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g., money-literacy-course"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Program Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course">Course</SelectItem>
                      <SelectItem value="group-coaching">Group Coaching</SelectItem>
                      <SelectItem value="1o1-session">1-on-1 Session</SelectItem>
                      <SelectItem value="webinar">Webinar</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                      <SelectItem value="audiobook">🎧 Audiobook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delivery_method">Delivery Method</Label>
                  <Select value={formData.delivery_method} onValueChange={(value) => setFormData({ ...formData, delivery_method: value })}>
                    <SelectTrigger id="delivery_method">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="live-online">Live Online Course</SelectItem>
                      <SelectItem value="on-demand">On-Demand Course</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 6 weeks, 3 months, Self-paced"
                  />
                </div>

                {formData.payment_type === 'subscription' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="subscription_interval">Billing Interval</Label>
                      <Select value={formData.subscription_interval} onValueChange={(value) => setFormData({ ...formData, subscription_interval: value })}>
                        <SelectTrigger id="subscription_interval">
                          <SelectValue placeholder="Select interval" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="week">Weekly</SelectItem>
                          <SelectItem value="month">Monthly</SelectItem>
                          <SelectItem value="year">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subscription_interval_count">Number of Payments (Auto-Cancel After)</Label>
                      <Select 
                        value={String(formData.subscription_interval_count)} 
                        onValueChange={(value) => setFormData({ ...formData, subscription_interval_count: parseInt(value) })}
                      >
                        <SelectTrigger id="subscription_interval_count">
                          <SelectValue placeholder="Select count" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="6">6</SelectItem>
                          <SelectItem value="9">9</SelectItem>
                          <SelectItem value="12">12</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Subscription auto-cancels after {formData.subscription_interval_count} {formData.subscription_interval}(s)
                      </p>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="payment_type">Payment Type</Label>
                  <Select value={formData.payment_type} onValueChange={(value) => setFormData({ ...formData, payment_type: value })}>
                    <SelectTrigger id="payment_type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-time">One-Time</SelectItem>
                      <SelectItem value="subscription">Subscription</SelectItem>
                      <SelectItem value="deposit">Deposit (Partial Payment)</SelectItem>
                      <SelectItem value="free">Free</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="original_price">Original Price ($)</Label>
                  <Input
                    id="original_price"
                    type="number"
                    value={formData.original_price / 100}
                    onChange={(e) => setFormData({ ...formData, original_price: Math.round(parseFloat(e.target.value || '0') * 100) })}
                    placeholder="e.g., 497"
                  />
                  <p className="text-xs text-muted-foreground">
                    Original: ${(formData.original_price / 100).toFixed(2)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price">Sale Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price_amount / 100}
                    onChange={(e) => setFormData({ ...formData, price_amount: Math.round(parseFloat(e.target.value || '0') * 100) })}
                    placeholder="e.g., 97"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Sale: ${(formData.price_amount / 100).toFixed(2)}
                  </p>
                </div>

                {formData.payment_type === 'deposit' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="deposit_price">Deposit Amount ($)</Label>
                      <Input
                        id="deposit_price"
                        type="number"
                        value={formData.deposit_price / 100}
                        onChange={(e) => setFormData({ ...formData, deposit_price: Math.round(parseFloat(e.target.value || '0') * 100) })}
                        placeholder="e.g., 100"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Deposit: ${(formData.deposit_price / 100).toFixed(2)} (Customer pays this now)
                      </p>
                    </div>

                    {/* Balance Payment Options Section */}
                    <div className="col-span-2 space-y-4 border-t pt-4 mt-2">
                      <Label className="text-base font-semibold">💳 Balance Payment Options</Label>
                      <p className="text-xs text-muted-foreground -mt-2">
                        Configure how customers can pay the remaining balance after deposit
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="balance_full_price">One-Time Balance ($)</Label>
                          <Input
                            id="balance_full_price"
                            type="number"
                            value={formData.balance_full_price / 100}
                            onChange={(e) => setFormData({ ...formData, balance_full_price: Math.round(parseFloat(e.target.value || '0') * 100) })}
                            placeholder="e.g., 747"
                          />
                          <p className="text-xs text-muted-foreground">
                            Full balance if paid at once: ${(formData.balance_full_price / 100).toFixed(2)}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="balance_full_discount">Discount for Full Payment ($)</Label>
                          <Input
                            id="balance_full_discount"
                            type="number"
                            value={formData.balance_full_discount / 100}
                            onChange={(e) => setFormData({ ...formData, balance_full_discount: Math.round(parseFloat(e.target.value || '0') * 100) })}
                            placeholder="e.g., 150"
                          />
                          <p className="text-xs text-muted-foreground">
                            Savings: ${(formData.balance_full_discount / 100).toFixed(2)}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="balance_monthly_price">Monthly Payment ($)</Label>
                          <Input
                            id="balance_monthly_price"
                            type="number"
                            value={formData.balance_monthly_price / 100}
                            onChange={(e) => setFormData({ ...formData, balance_monthly_price: Math.round(parseFloat(e.target.value || '0') * 100) })}
                            placeholder="e.g., 299"
                          />
                          <p className="text-xs text-muted-foreground">
                            Per month: ${(formData.balance_monthly_price / 100).toFixed(2)}
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="balance_monthly_count">Number of Monthly Payments</Label>
                          <Select 
                            value={String(formData.balance_monthly_count || 0)} 
                            onValueChange={(value) => setFormData({ ...formData, balance_monthly_count: parseInt(value) })}
                          >
                            <SelectTrigger id="balance_monthly_count">
                              <SelectValue placeholder="Select count" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Not applicable</SelectItem>
                              <SelectItem value="2">2 months</SelectItem>
                              <SelectItem value="3">3 months</SelectItem>
                              <SelectItem value="4">4 months</SelectItem>
                              <SelectItem value="6">6 months</SelectItem>
                              <SelectItem value="9">9 months</SelectItem>
                              <SelectItem value="12">12 months</SelectItem>
                            </SelectContent>
                          </Select>
                          {formData.balance_monthly_count > 0 && (
                            <p className="text-xs text-muted-foreground">
                              Total: ${((formData.balance_monthly_price / 100) * formData.balance_monthly_count).toFixed(2)} ({formData.balance_monthly_count} × ${(formData.balance_monthly_price / 100).toFixed(2)})
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {formData.payment_type === 'subscription' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="subscription_full_price">One-Time Full Payment ($)</Label>
                      <Input
                        id="subscription_full_price"
                        type="number"
                        value={formData.subscription_full_payment_price / 100}
                        onChange={(e) => setFormData({ ...formData, subscription_full_payment_price: Math.round(parseFloat(e.target.value || '0') * 100) })}
                        placeholder="e.g., 1194"
                      />
                      <p className="text-xs text-muted-foreground">
                        Full: ${(formData.subscription_full_payment_price / 100).toFixed(2)} (pay once instead of monthly)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subscription_discount">Savings Amount ($)</Label>
                      <Input
                        id="subscription_discount"
                        type="number"
                        value={formData.subscription_full_payment_discount / 100}
                        onChange={(e) => setFormData({ ...formData, subscription_full_payment_discount: Math.round(parseFloat(e.target.value || '0') * 100) })}
                        placeholder="e.g., 597"
                      />
                      <p className="text-xs text-muted-foreground">
                        Savings: ${(formData.subscription_full_payment_discount / 100).toFixed(2)} off monthly total
                      </p>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.is_active ? 'active' : 'inactive'} onValueChange={(value) => setFormData({ ...formData, is_active: value === 'active' })}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <RichTextEditor
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Program description... Use the toolbar to format text with bold, lists, headers, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="audio_playlist_id">Featured Playlist (Optional)</Label>
                <Select 
                  value={formData.audio_playlist_id || 'none'} 
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    audio_playlist_id: value === 'none' ? null : value 
                  })}
                >
                  <SelectTrigger id="audio_playlist_id">
                    <SelectValue placeholder="Select a playlist" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Playlist</SelectItem>
                    {playlists?.map((playlist) => (
                      <SelectItem key={playlist.id} value={playlist.id}>
                        🎧 {playlist.name}
                        {playlist.program_slug && (
                          <span className="text-xs text-muted-foreground ml-2">
                            ({playlist.program_slug})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Playlist button will appear on course detail page in the app
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="video_url">Video URL (Optional)</Label>
                <Input
                  id="video_url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=... or Vimeo URL"
                />
                <p className="text-xs text-muted-foreground">
                  Promotional or intro video for this program
                </p>
              </div>

              {/* Stripe Product IDs Section */}
              {(formData.payment_type === 'subscription' || formData.payment_type === 'one-time') && (
                <div className="space-y-4 border-t pt-4">
                  <Label className="text-base font-semibold">💳 Stripe Product Configuration</Label>
                  <p className="text-xs text-muted-foreground -mt-2">
                    Store Stripe IDs to reuse the same product/price (prevents duplicates in Stripe dashboard)
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stripe_product_id">Stripe Product ID</Label>
                      <Input
                        id="stripe_product_id"
                        value={formData.stripe_product_id}
                        onChange={(e) => setFormData({ ...formData, stripe_product_id: e.target.value })}
                        placeholder="prod_xxx"
                      />
                      <p className="text-xs text-muted-foreground">
                        For one-time payments. Find in Stripe Dashboard → Products
                      </p>
                    </div>

                    {formData.payment_type === 'subscription' && (
                      <div className="space-y-2">
                        <Label htmlFor="stripe_price_id">Stripe Price ID</Label>
                        <Input
                          id="stripe_price_id"
                          value={formData.stripe_price_id}
                          onChange={(e) => setFormData({ ...formData, stripe_price_id: e.target.value })}
                          placeholder="price_xxx"
                        />
                        <p className="text-xs text-muted-foreground">
                          For subscriptions. Find in Stripe Dashboard → Products → Pricing
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Platform Availability Section */}
              <div className="space-y-4 border-t pt-4">
                <Label className="text-base font-semibold">Platform Availability</Label>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="available_on_web"
                    checked={formData.available_on_web}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, available_on_web: checked as boolean })
                    }
                  />
                  <Label htmlFor="available_on_web" className="text-sm font-normal cursor-pointer">
                    Available on Web (Stripe Payment)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="available_on_mobile"
                    checked={formData.available_on_mobile}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, available_on_mobile: checked as boolean })
                    }
                  />
                  <Label htmlFor="available_on_mobile" className="text-sm font-normal cursor-pointer">
                    Show in Mobile App
                  </Label>
                </div>

                {formData.available_on_mobile && (
                  <div className="flex items-center space-x-2 pl-6">
                    <Checkbox 
                      id="is_free_on_ios"
                      checked={formData.is_free_on_ios}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, is_free_on_ios: checked as boolean })
                      }
                    />
                    <Label htmlFor="is_free_on_ios" className="text-sm font-normal cursor-pointer">
                      Free on iOS (for App Store submission without IAP)
                    </Label>
                  </div>
                )}

                {/* Show IAP Product IDs only if mobile is enabled and NOT free on iOS */}
                {formData.available_on_mobile && !formData.is_free_on_ios && (
                  <div className="space-y-3 pl-6 border-l-2 border-primary/30">
                    <div className="space-y-2">
                      <Label htmlFor="ios_product_id">iOS Product ID</Label>
                      <Input
                        id="ios_product_id"
                        placeholder="com.ladybosslook.audiobook.productname"
                        value={formData.ios_product_id}
                        onChange={(e) => setFormData({ ...formData, ios_product_id: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Product ID from App Store Connect (must match exactly)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="android_product_id">Android Product ID</Label>
                      <Input
                        id="android_product_id"
                        placeholder="productname_audiobook"
                        value={formData.android_product_id}
                        onChange={(e) => setFormData({ ...formData, android_product_id: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        Product ID from Google Play Console (must match exactly)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingId ? 'Update Program' : 'Create Program'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          )}

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading programs...
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No programs found. Click "Add Program" to create one.
            </div>
          ) : (
            <div className="space-y-3">
              {programs.map((program) => (
                <div
                  key={program.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{program.title}</h4>
                      <Badge variant={program.is_active ? 'default' : 'secondary'}>
                        {program.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">{program.type}</Badge>
                    </div>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span>Slug: {program.slug}</span>
                        <span>•</span>
                        <span>{program.duration || 'N/A'}</span>
                        <span>•</span>
                        <span>{program.delivery_method === 'live-online' ? 'Live Online' : 'On-Demand'}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        {program.original_price && (
                          <>
                            <span className="line-through">${(program.original_price / 100).toFixed(2)}</span>
                            <span>→</span>
                          </>
                        )}
                        <span className="font-semibold text-primary">${(program.price_amount / 100).toFixed(2)}</span>
                        <span>•</span>
                        <span>{program.payment_type}</span>
                        {(program as any).deposit_price > 0 && program.payment_type === 'deposit' && (
                          <>
                            <span>•</span>
                            <span className="text-orange-600 font-semibold">Deposit: ${((program as any).deposit_price / 100).toFixed(2)}</span>
                            <span>•</span>
                            <span>Remaining: ${((program.price_amount - (program as any).deposit_price) / 100).toFixed(2)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => copyProductPageLink(program.slug)}
                      title="Copy Product Page Link"
                    >
                      <Link2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => copyPaymentLink(program.slug)}
                      title="Copy Payment Link"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(program)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(program.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Program</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this program? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
