import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowRight, Play, Gift, Star, CheckCircle, Mail, MessageCircle, Send, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import assertiveTrainingHero from '@/assets/assertive-training-hero.png';

// Declare Facebook Pixel function
declare global {
  interface Window {
    fbq?: (command: string, event: string, parameters?: Record<string, any>) => void;
  }
}

const AssertLanding = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [preference, setPreference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Meta Pixel tracking
  useEffect(() => {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
      
      window.fbq('track', 'ViewContent', {
        content_type: 'landing_page',
        content_name: 'Express Assert Landing',
        content_category: 'Lead Generation',
        value: 0,
        currency: 'USD'
      });
      
      window.fbq('trackCustom', 'LandingPageVisit', {
        page_name: 'Express Assert Access',
        user_type: 'prospect',
        funnel_stage: 'awareness'
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !name || !city || !preference) {
      toast({
        title: "All fields required",
        description: "Please fill in all fields to access the video.",
        variant: "destructive",
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Track lead generation
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Lead', {
          content_name: 'Express Assert Access',
          content_category: 'Video Access',
          value: 1,
          currency: 'USD'
        });
        
        window.fbq('trackCustom', 'VideoAccessRequest', {
          source: 'asac_landing_page',
          communication_preference: preference,
          user_intent: 'video_access'
        });
      }

      // Add to Mailchimp
      const { error } = await supabase.functions.invoke('mailchimp-subscribe', {
        body: {
          email,
          name: name,
          city: city,
          phone: '',
          source: 'asac_landing_page',
          communication_preference: preference,
          tags: ['asac']
        }
      });

      if (error) {
        console.error('Mailchimp error:', error);
        // Don't throw error, still allow access
      }

      toast({
        title: "Access Granted! 🎉",
        description: "Redirecting you to the Express Assert video...",
      });

      // Reset form and close modal
      setEmail('');
      setName('');
      setCity('');
      setPreference('');
      setShowModal(false);

      // Redirect to ExpressAssert after 1 second
      setTimeout(() => {
        window.location.href = '/expressassert';
      }, 1000);

    } catch (error: any) {
      console.error('Error processing request:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead 
        title="Unlock Assertive Expression Training - LadyBoss Academy"
        description="Get exclusive access to our powerful assertive expression video training. Learn to communicate with confidence as an immigrant woman."
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
        <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section - Mobile Optimized */}
            <div className="text-center mb-4 sm:mb-6">
              <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-primary/10 rounded-full mb-3 sm:mb-4">
                <Gift size={14} className="sm:w-4 sm:h-4 mr-2 text-primary" />
                <span className="text-xs sm:text-sm font-medium text-primary">
                  Exclusive Video Training
                </span>
              </div>
              
              <h1 className="font-display text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 px-2 leading-tight">
                <span className="gradient-text">Assertive Expression Training</span>
                <br />
                <span className="text-sm sm:text-base md:text-lg font-normal">for Immigrant Women</span>
              </h1>
              
              <div className="mb-4 sm:mb-6 max-w-xs sm:max-w-sm mx-auto">
                <img 
                  src={assertiveTrainingHero} 
                  alt="Professional woman in assertive expression training" 
                  className="w-full h-auto rounded-xl shadow-lg"
                />
              </div>

              {/* Value Props - Compact for mobile */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6 max-w-2xl mx-auto px-2">
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-muted/50 rounded-lg">
                  <CheckCircle size={14} className="sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-center sm:text-left">Instant Access</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-muted/50 rounded-lg">
                  <Play size={14} className="sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-center sm:text-left">Video Training</span>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 p-2 sm:p-3 bg-muted/50 rounded-lg">
                  <Star size={14} className="sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-medium text-center sm:text-left">Exclusive</span>
                </div>
              </div>

              {/* Animated arrows pointing to CTA */}
              <div className="flex justify-center items-center mb-3 space-x-2">
                <div className="animate-bounce">
                  <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div className="animate-bounce" style={{ animationDelay: '0.2s' }}>
                  <ChevronDown className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
                <div className="animate-bounce" style={{ animationDelay: '0.4s' }}>
                  <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
              </div>

              {/* Main CTA Button */}
              <Button 
                onClick={() => setShowModal(true)}
                className="w-full max-w-sm bg-primary hover:bg-primary/90 text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                size="lg"
              >
                <ArrowRight size={18} className="sm:w-5 sm:h-5 mr-2" />
                Get Instant Access
              </Button>
            </div>

            {/* Benefits Section - Compact */}
            <div className="bg-muted/30 rounded-xl p-4 sm:p-6 mb-4 sm:mb-6">
              <h3 className="font-display text-lg sm:text-xl font-bold mb-4 text-center">
                What You'll Learn:
              </h3>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <span>Express yourself with confidence</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <span>Navigate cultural differences</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <span>Build assertive communication</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle size={16} className="text-primary mt-0.5 flex-shrink-0" />
                  <span>Overcome self-doubt</span>
                </div>
              </div>
            </div>

            {/* Social Proof - Compact */}
            <div className="text-center">
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                Trusted by immigrant women worldwide
              </p>
              <div className="flex items-center justify-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} className="text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm font-medium">
                "This training changed how I communicate at work"
              </p>
            </div>
          </div>
        </main>

        {/* Registration Modal */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-md bg-background border-2 border-primary/20 shadow-luxury">
            <DialogHeader className="text-center">
              <DialogTitle className="text-xl sm:text-2xl font-bold mb-2">
                🎉 Get Your Access
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Just a few details to unlock your training
              </p>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="modal-name" className="text-left block font-medium">
                  Your Name *
                </Label>
                <Input
                  id="modal-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  className="h-12 border-2 focus:border-primary"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modal-email" className="text-left block font-medium">
                  Email Address *
                </Label>
                <Input
                  id="modal-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  required
                  className="h-12 border-2 focus:border-primary"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modal-city" className="text-left block font-medium">
                  Your City *
                </Label>
                <Input
                  id="modal-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter your city"
                  required
                  className="h-12 border-2 focus:border-primary"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="modal-preference" className="text-left block font-medium">
                  Preferred Contact Method *
                </Label>
                <Select value={preference} onValueChange={setPreference} disabled={isSubmitting} required>
                  <SelectTrigger className="h-12 border-2 focus:border-primary">
                    <SelectValue placeholder="How should we contact you?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">
                      <div className="flex items-center gap-2">
                        <Mail size={16} />
                        Email
                      </div>
                    </SelectItem>
                    <SelectItem value="whatsapp">
                      <div className="flex items-center gap-2">
                        <MessageCircle size={16} />
                        WhatsApp
                      </div>
                    </SelectItem>
                    <SelectItem value="telegram">
                      <div className="flex items-center gap-2">
                        <Send size={16} />
                        Telegram
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-white transition-all duration-300 transform hover:scale-105"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  'Processing...'
                ) : (
                  <>
                    <ArrowRight size={18} className="mr-2" />
                    Unlock Video Now
                  </>
                )}
              </Button>
            </form>

            <div className="mt-4 text-center text-xs text-muted-foreground">
              <p>🔒 Your information is completely secure</p>
              <p className="mt-1">💌 You'll only receive valuable content</p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Sticky Bottom CTA - Mobile */}
        <div className="fixed bottom-0 left-0 right-0 z-50 p-3 bg-primary/95 backdrop-blur-sm border-t border-primary/10 sm:hidden">
          <Button
            onClick={() => setShowModal(true)}
            className="w-full h-12 text-base font-bold bg-background hover:bg-muted text-primary transition-colors duration-200 rounded-lg"
          >
            🚀 Get Instant Access
          </Button>
        </div>
      </div>
    </>
  );
};

export default AssertLanding;