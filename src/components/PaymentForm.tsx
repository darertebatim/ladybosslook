import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CreditCard, Shield, CheckCircle } from 'lucide-react';

interface PaymentFormProps {
  program: string;
  programName: string;
  price: number;
  description: string;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({ 
  program, 
  programName, 
  price, 
  description 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          program: program,
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        
        toast({
          title: "Redirecting to Payment",
          description: "Please complete your payment in the new tab that opened.",
        });
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return (cents / 100).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
  };

  return (
    <Card className="w-full max-w-lg mx-auto bg-white shadow-xl border-0">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl font-bold text-primary">
          {programName}
        </CardTitle>
        <CardDescription className="text-lg text-muted-foreground">
          {description}
        </CardDescription>
        <div className="mt-4">
          <span className="text-4xl font-bold text-primary">
            {formatPrice(price)}
          </span>
          <span className="text-sm text-muted-foreground ml-2">one-time payment</span>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Full Name *
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="h-12"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email Address *
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleInputChange}
              required
              className="h-12"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number (Optional)
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Enter your phone number"
              value={formData.phone}
              onChange={handleInputChange}
              className="h-12"
            />
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary-dark"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-5 w-5" />
                  Secure Checkout
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-6 text-xs text-muted-foreground">
            <div className="flex items-center">
              <Shield className="mr-1 h-4 w-4" />
              Secure Payment
            </div>
            <div className="flex items-center">
              <CheckCircle className="mr-1 h-4 w-4" />
              Instant Access
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Powered by Stripe. Your payment information is secure and encrypted.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};