import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Star, Users, Clock, Shield } from 'lucide-react';

const Landing = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formStarted, setFormStarted] = useState(false);
  const [benefitsViewed, setBenefitsViewed] = useState(false);
  const [statsViewed, setStatsViewed] = useState(false);
  const { toast } = useToast();
  const pageStartTime = useRef(Date.now());
  const benefitsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  // Meta Pixel tracking helper
  const trackPixelEvent = (eventName: string, customData: any = {}) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', eventName, customData);
    }
  };

  const trackCustomPixelEvent = (eventName: string, customData: any = {}) => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('trackCustom', eventName, customData);
    }
  };

  // Track page engagement time
  const getEngagementTime = () => {
    return Math.round((Date.now() - pageStartTime.current) / 1000);
  };

  // Track form interaction start
  const handleFormStart = () => {
    if (!formStarted) {
      setFormStarted(true);
      trackPixelEvent('InitiateCheckout', {
        content_name: 'Courageous Character Training',
        content_category: 'Free Training',
        num_items: 1,
        engagement_time: getEngagementTime()
      });
      trackCustomPixelEvent('FormInteractionStart', {
        page: 'landing',
        timestamp: Date.now()
      });
    }
  };

  // Scroll tracking for content engagement
  useEffect(() => {
    const handleScroll = () => {
      // Track benefits section view
      if (benefitsRef.current && !benefitsViewed) {
        const rect = benefitsRef.current.getBoundingClientRect();
        if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
          setBenefitsViewed(true);
          trackPixelEvent('ViewContent', {
            content_name: 'Training Benefits',
            content_type: 'benefits_section',
            engagement_time: getEngagementTime()
          });
        }
      }

      // Track stats section view
      if (statsRef.current && !statsViewed) {
        const rect = statsRef.current.getBoundingClientRect();
        if (rect.top >= 0 && rect.bottom <= window.innerHeight) {
          setStatsViewed(true);
          trackPixelEvent('ViewContent', {
            content_name: 'Training Statistics',
            content_type: 'stats_section',
            engagement_time: getEngagementTime()
          });
          trackPixelEvent('AddToCart', {
            content_name: 'Free Training Interest',
            content_type: 'training',
            value: 0,
            currency: 'USD'
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [benefitsViewed, statsViewed]);

  // Track page exit intent
  useEffect(() => {
    const handleBeforeUnload = () => {
      trackCustomPixelEvent('PageExit', {
        engagement_time: getEngagementTime(),
        form_started: formStarted,
        benefits_viewed: benefitsViewed,
        stats_viewed: statsViewed
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [formStarted, benefitsViewed, statsViewed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Track form submission attempt
    trackCustomPixelEvent('FormSubmissionAttempt', {
      engagement_time: getEngagementTime(),
      fields_filled: {
        name: !!name,
        email: !!email,
        phone: !!phone,
        city: !!city
      }
    });
    
    if (!email || !name || !city || !phone) {
      // Track validation error
      trackCustomPixelEvent('FormValidationError', {
        error_type: 'missing_fields',
        page: 'landing',
        engagement_time: getEngagementTime()
      });
      
      toast({
        title: "Required Fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('https://mnukhzjcvbwpvktxqlej.supabase.co/functions/v1/mailchimp-subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name,
          city,
          phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe');
      }

      setSubmitted(true);
      
      // Enhanced Lead tracking with engagement data
      trackPixelEvent('Lead', {
        content_name: 'Courageous Character Training',
        content_category: 'Free Training',
        value: 0,
        currency: 'USD',
        engagement_time: getEngagementTime(),
        user_data: {
          email_hash: btoa(email).substring(0, 8), // Simple hash for privacy
          city: city
        }
      });

      // Track successful form completion
      trackCustomPixelEvent('FormCompletionSuccess', {
        engagement_time: getEngagementTime(),
        page: 'landing',
        user_journey: {
          benefits_viewed: benefitsViewed,
          stats_viewed: statsViewed,
          form_started: formStarted
        }
      });

      // Track success message view
      trackCustomPixelEvent('SuccessMessageViewed', {
        training_type: 'courageous_character'
      });
      
      toast({
        title: "Success!",
        description: "Please check your email for the training video link!",
      });
    } catch (error: any) {
      console.error('Subscription error:', error);
      
      // Track submission error
      trackCustomPixelEvent('FormSubmissionError', {
        error_message: error.message,
        engagement_time: getEngagementTime(),
        page: 'landing'
      });
      
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const benefits = [
    "Build unshakeable confidence",
    "Overcome cultural barriers",
    "Transform self-doubt into power",
    "Navigate challenges like a leader"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center py-2 md:py-8">
      <div className="container mx-auto px-4">
        {/* Title Section - Above everything on mobile */}
        <div className="text-center mb-4 lg:hidden">
          <div className="inline-flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium mb-2">
            <Star className="w-4 h-4 mr-2" />
            Exclusive Free Training By LADYBOSS
          </div>
          
          <h1 className="text-xl font-bold leading-tight mb-2">
            Unlock Your
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"> Courageous Character</span>
          </h1>
          
          <p className="text-sm text-muted-foreground/70 leading-tight">
            20-minute training for Persian women<br className="sm:hidden" />
            to build confidence and success.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 md:gap-8 items-start max-w-6xl mx-auto">
          {/* Left Column - Content */}
          <div className="space-y-3 md:space-y-4 order-2 lg:order-1">
            {/* Title for desktop only */}
            <div className="space-y-2 md:space-y-3 hidden lg:block">
              <div className="inline-flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                <Star className="w-4 h-4 mr-2" />
                Exclusive Free Training By LADYBOSS
              </div>
              
              <h1 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold leading-tight">
                Unlock Your
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"> Courageous Character</span>
              </h1>
              
              <p className="text-sm md:text-base lg:text-lg text-muted-foreground/70">
                20-minute training for Persian women to build confidence and success.
              </p>
            </div>

            {/* Benefits */}
            <div ref={benefitsRef} className="space-y-1 md:space-y-2">
              <h3 className="text-base md:text-lg font-semibold">You'll discover:</h3>
              <ul className="space-y-1">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Stats */}
            <div ref={statsRef} className="grid grid-cols-3 gap-2 md:gap-3 py-2 md:py-3">
              <div className="text-center">
                <Users className="w-5 h-5 text-primary mx-auto mb-1" />
                <div className="text-lg font-bold">2,500+</div>
                <div className="text-xs text-muted-foreground">Women Empowered</div>
              </div>
              <div className="text-center">
                <Star className="w-5 h-5 text-primary mx-auto mb-1" />
                <div className="text-lg font-bold">4.9/5</div>
                <div className="text-xs text-muted-foreground">Success Rating</div>
              </div>
              <div className="text-center">
                <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                <div className="text-lg font-bold">20 Min</div>
                <div className="text-xs text-muted-foreground">Training</div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="order-1 lg:order-2">
            <Card className="border-2 border-primary/20 shadow-xl">
              <CardHeader className="text-center pb-3">
                <CardTitle className="text-xl md:text-2xl">
                  Get Instant Access
                </CardTitle>
                <CardDescription>
                  Join thousands of empowered Persian women
                </CardDescription>
              </CardHeader>
              
                <CardContent className="space-y-3 md:space-y-4">
                {submitted ? (
                  <div className="text-center space-y-4 py-8">
                    <CheckCircle className="w-16 h-16 text-primary mx-auto" />
                    <h3 className="text-xl font-semibold">Check Your Email!</h3>
                    <p className="text-muted-foreground">
                      We've sent you the exclusive training video link. 
                      Check your inbox (and spam folder) for immediate access.
                    </p>
                    <div className="bg-primary/10 p-4 rounded-lg">
                      <p className="text-sm font-medium text-primary">
                        Can't find the email? Check your promotions or spam folder.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="name">Your First Name</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="Enter your first name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          onFocus={handleFormStart}
                          className="h-10"
                          required
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor="city">Your City, State</Label>
                        <Input
                          id="city"
                          type="text"
                          placeholder="e.g., Los Angeles, CA"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="h-10"
                          required
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor="phone">Your Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Enter your phone number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="h-10"
                          required
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor="email">Your Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-10"
                          required
                        />
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full h-11 text-base font-semibold"
                        disabled={isLoading}
                      >
                        {isLoading ? "Getting Access..." : "Watch Free Training Now →"}
                      </Button>
                    </form>

                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Shield className="w-3 h-3" />
                      <span>100% Free • No Spam • Unsubscribe Anytime</span>
                    </div>

                    <div className="text-center pt-2">
                      <p className="text-sm text-muted-foreground italic">
                        "This training changed everything for me."
                      </p>
                      <p className="text-xs font-medium text-primary">
                        - Shirin K., Marketing Director
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;