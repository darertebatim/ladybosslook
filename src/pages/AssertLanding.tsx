import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Play, Gift, Star, CheckCircle, Mail, MessageCircle, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Declare Facebook Pixel function
declare global {
  interface Window {
    fbq?: (command: string, event: string, parameters?: Record<string, any>) => void;
  }
}

const AssertLanding = () => {
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [preference, setPreference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    
    if (!email || !city || !preference) {
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
          source: 'assert_landing_page',
          communication_preference: preference,
          user_intent: 'video_access'
        });
      }

      // Add to Mailchimp
      const { error } = await supabase.functions.invoke('mailchimp-subscribe', {
        body: {
          email,
          name: '',
          city: city,
          phone: '',
          source: 'assert_landing_page',
          communication_preference: preference,
          tags: ['express_assert_access']
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
        {/* Navigation Header */}
        <div className="border-b border-border bg-background/95 backdrop-blur-md">
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <Link 
                to="/" 
                className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-smooth"
              >
                <span className="text-sm sm:text-base">← Home</span>
              </Link>
              
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xs sm:text-sm">LB</span>
                </div>
                <span className="font-display text-base sm:text-lg font-bold gradient-text hidden xs:block">
                  LadyBoss Academy
                </span>
              </div>
            </div>
          </div>
        </div>

        <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-8 sm:mb-12">
              <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6">
                <Gift size={16} className="mr-2 text-primary" />
                <span className="text-sm font-medium text-primary">
                  Exclusive Video Training
                </span>
              </div>
              
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 px-2 leading-tight">
                Unlock Your{' '}
                <span className="gradient-text">Assertive Voice</span>
              </h1>
              
              <p className="text-lg sm:text-xl text-foreground/80 max-w-2xl mx-auto mb-8 leading-relaxed">
                Get exclusive access to our powerful assertive expression training designed specifically for immigrant women ready to transform their communication style.
              </p>

              {/* Value Props */}
              <div className="grid sm:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <CheckCircle size={16} className="text-primary flex-shrink-0" />
                  <span className="text-sm font-medium">Instant Access</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Play size={16} className="text-primary flex-shrink-0" />
                  <span className="text-sm font-medium">Video Training</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <Star size={16} className="text-primary flex-shrink-0" />
                  <span className="text-sm font-medium">Exclusive Content</span>
                </div>
              </div>
            </div>

            {/* Main Form Card */}
            <Card className="max-w-lg mx-auto p-6 sm:p-8 bg-gradient-card border-2 border-primary/20 shadow-luxury">
              <div className="text-center mb-6">
                <h2 className="font-display text-2xl sm:text-3xl font-bold mb-2">
                  Get Instant Access
                </h2>
                <p className="text-muted-foreground">
                  Just 3 quick details to unlock your training
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium mb-2">
                    Your City *
                  </label>
                  <Input
                    id="city"
                    type="text"
                    placeholder="Enter your city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="preference" className="block text-sm font-medium mb-2">
                    How would you like us to contact you? *
                  </label>
                  <Select value={preference} onValueChange={setPreference} disabled={isSubmitting} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your preference" />
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
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg font-bold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                  size="lg"
                >
                  {isSubmitting ? (
                    'Processing...'
                  ) : (
                    <>
                      <ArrowRight size={20} className="mr-2" />
                      Unlock Video Training
                    </>
                  )}
                </Button>
              </form>

              <p className="text-xs text-muted-foreground text-center mt-4">
                By submitting, you agree to receive valuable content and updates. 
                You can unsubscribe anytime.
              </p>
            </Card>

            {/* Social Proof */}
            <div className="text-center mt-8 sm:mt-12">
              <p className="text-sm text-muted-foreground mb-4">
                Trusted by immigrant women worldwide
              </p>
              <div className="flex items-center justify-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className="text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-sm font-medium">
                "This training changed how I communicate at work and in my community"
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default AssertLanding;