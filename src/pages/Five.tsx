import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Sparkles } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { simpleSubscriptionSchema } from '@/lib/validation';
import { z } from 'zod';

const Five = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'PageView');
      (window as any).fbq('track', 'ViewContent', {
        content_type: 'paid_class',
        content_name: 'Five Languages of Empowered Woman',
        content_category: 'online_class',
        value: 100,
        currency: 'USD'
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setValidationErrors({});
    try {
      simpleSubscriptionSchema.parse({ name, email });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
        toast({
          title: "Error",
          description: "Please fill out the form carefully",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
        body: {
          program: 'five-languages',
          email: email.trim().toLowerCase(),
          name: name.trim()
        }
      });

      if (paymentError) throw paymentError;

      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('trackCustom', 'FiveLanguagesRegistration', {
          content_name: 'Five Languages of Empowered Woman',
          value: 1,
          currency: 'USD'
        });
      }

      if (paymentData?.url) {
        window.location.href = paymentData.url;
      } else {
        throw new Error('Payment URL not received');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "Error",
        description: "Something went wrong, please try again",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const languages = [
    { 
      number: "01",
      title: "Language of Self-Talk", 
      desc: "Master your inner dialogue and transform limiting beliefs into empowering thoughts"
    },
    { 
      number: "02",
      title: "Language of Assertion", 
      desc: "Express your needs confidently and set boundaries with grace and strength"
    },
    { 
      number: "03",
      title: "Language of Presence", 
      desc: "Command attention through body language, voice tone, and authentic confidence"
    },
    { 
      number: "04",
      title: "Language of Influence", 
      desc: "Create compelling narratives and build meaningful connections through strategic communication"
    },
    { 
      number: "05",
      title: "Language of Leadership", 
      desc: "Inspire and guide others while maintaining your authentic voice and values"
    }
  ];

  return (
    <>
      <SEOHead 
        title="Five Languages of Empowered Woman | Transform Your Communication"
        description="Master the five essential languages every empowered woman needs to lead, influence, and thrive in any environment."
      />
      
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-8 border border-luxury-charcoal/20 rounded-full">
              <Sparkles className="w-4 h-4 text-luxury-accent" />
              <span className="text-sm text-luxury-charcoal tracking-wide">EXCLUSIVE MASTERCLASS</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-elegant text-5xl md:text-7xl lg:text-8xl font-light text-luxury-black mb-6 leading-tight tracking-tight">
              Five Languages of<br />
              <span className="italic font-normal">Empowered Woman</span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-luxury-charcoal/70 mb-12 max-w-2xl mx-auto leading-relaxed">
              Master the art of powerful communication and transform how you show up in every area of your life
            </p>

            {/* CTA */}
            <Button 
              size="lg"
              onClick={() => setShowRegistrationForm(true)}
              className="bg-luxury-black hover:bg-luxury-charcoal text-white px-12 py-6 text-lg rounded-none transition-all duration-300 h-auto"
            >
              Reserve Your Spot
            </Button>
          </div>
        </div>

        {/* Divider */}
        <div className="container mx-auto px-4">
          <div className="border-t border-luxury-charcoal/10"></div>
        </div>

        {/* Five Languages Section */}
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-elegant text-4xl md:text-5xl text-luxury-black text-center mb-20">
              The Five Languages
            </h2>

            <div className="space-y-16">
              {languages.map((lang, index) => (
                <div 
                  key={index}
                  className="group border-b border-luxury-charcoal/10 pb-12 last:border-b-0 hover:border-luxury-accent/30 transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-start">
                    {/* Number */}
                    <div className="font-elegant text-6xl md:text-7xl text-luxury-charcoal/20 group-hover:text-luxury-accent/40 transition-colors duration-300">
                      {lang.number}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pt-2">
                      <h3 className="font-elegant text-2xl md:text-3xl text-luxury-black mb-3">
                        {lang.title}
                      </h3>
                      <p className="text-lg text-luxury-charcoal/70 leading-relaxed">
                        {lang.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="container mx-auto px-4">
          <div className="border-t border-luxury-charcoal/10"></div>
        </div>

        {/* What You'll Gain Section */}
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-elegant text-4xl md:text-5xl text-luxury-black text-center mb-16">
              What You'll Gain
            </h2>

            <div className="grid md:grid-cols-2 gap-12">
              {[
                "Unshakeable confidence in any conversation",
                "The ability to command respect naturally",
                "Tools to express yourself with clarity and power",
                "Skills to influence without manipulation",
                "Authentic leadership presence",
                "Freedom from self-doubt and overthinking"
              ].map((benefit, index) => (
                <div key={index} className="flex gap-4 items-start group">
                  <CheckCircle2 className="w-6 h-6 text-luxury-accent mt-1 flex-shrink-0" />
                  <p className="text-lg text-luxury-charcoal/80 group-hover:text-luxury-black transition-colors duration-300">
                    {benefit}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="container mx-auto px-4">
          <div className="border-t border-luxury-charcoal/10"></div>
        </div>

        {/* Final CTA Section */}
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-elegant text-4xl md:text-6xl text-luxury-black mb-8">
              Transform Your Voice.<br />
              <span className="italic">Transform Your Life.</span>
            </h2>
            
            <p className="text-xl text-luxury-charcoal/70 mb-12">
              Join us for this transformative experience
            </p>

            <Button 
              size="lg"
              onClick={() => setShowRegistrationForm(true)}
              className="bg-luxury-black hover:bg-luxury-charcoal text-white px-12 py-6 text-lg rounded-none transition-all duration-300 h-auto"
            >
              Reserve Your Spot Now
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-luxury-charcoal/10 py-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-luxury-charcoal/50">
              © 2025 LadyBoss Academy. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Registration Dialog */}
      <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
        <DialogContent className="sm:max-w-md bg-white border-luxury-charcoal/10">
          <DialogHeader>
            <DialogTitle className="font-elegant text-3xl text-luxury-black text-center mb-2">
              Reserve Your Spot
            </DialogTitle>
            <DialogDescription className="text-center text-luxury-charcoal/70">
              Enter your details to secure your place
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-luxury-black">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
                className="border-luxury-charcoal/20 focus:border-luxury-black rounded-none"
              />
              {validationErrors.name && (
                <p className="text-sm text-destructive">{validationErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-luxury-black">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="border-luxury-charcoal/20 focus:border-luxury-black rounded-none"
              />
              {validationErrors.email && (
                <p className="text-sm text-destructive">{validationErrors.email}</p>
              )}
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-luxury-black hover:bg-luxury-charcoal text-white py-6 rounded-none h-auto"
            >
              {isSubmitting ? "Processing..." : "Complete Registration"}
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-luxury-charcoal/50">
              <CheckCircle2 className="w-3 h-3" />
              <span>Secure Payment</span>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Five;
