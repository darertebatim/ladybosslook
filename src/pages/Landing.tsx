import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Star, Users, Clock, Shield, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';

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
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [submitAttempts, setSubmitAttempts] = useState(0);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const { toast } = useToast();
  const pageStartTime = useRef(Date.now());
  const benefitsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pixelEventQueue = useRef<Array<{ type: 'track' | 'trackCustom', event: string, data: any }>>([]);
  const isSubmittingRef = useRef(false);

  const SUBMIT_THROTTLE_MS = 3000; // 3 seconds between attempts
  const MAX_SUBMIT_ATTEMPTS = 3;

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Batched Meta Pixel tracking to prevent rate limiting
  const flushPixelEvents = useCallback(() => {
    if (pixelEventQueue.current.length === 0) return;
    
    const events = [...pixelEventQueue.current];
    pixelEventQueue.current = [];
    
    events.forEach(({ type, event, data }) => {
      if (typeof window !== 'undefined' && (window as any).fbq) {
        if (type === 'track') {
          (window as any).fbq('track', event, data);
        } else {
          (window as any).fbq('trackCustom', event, data);
        }
      }
    });
  }, []);

  // Queue pixel events for batching
  const queuePixelEvent = useCallback((type: 'track' | 'trackCustom', eventName: string, customData: any = {}) => {
    pixelEventQueue.current.push({ type, event: eventName, data: customData });
    
    // Flush events after a short delay
    clearTimeout(submitTimeoutRef.current || undefined);
    submitTimeoutRef.current = setTimeout(flushPixelEvents, 100);
  }, [flushPixelEvents]);

  // Meta Pixel tracking helper (now uses queue)
  const trackPixelEvent = useCallback((eventName: string, customData: any = {}) => {
    queuePixelEvent('track', eventName, customData);
  }, [queuePixelEvent]);

  const trackCustomPixelEvent = useCallback((eventName: string, customData: any = {}) => {
    queuePixelEvent('trackCustom', eventName, customData);
  }, [queuePixelEvent]);

  // Enhanced form validation
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {};
    
    if (!name.trim()) {
      errors.name = 'Name is required';
    } else if (name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (phone.trim() && !/^\+?[\d\s\-\(\)]{10,}$/.test(phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    if (!city.trim()) {
      errors.city = 'City is required';
    } else if (city.trim().length < 2) {
      errors.city = 'City must be at least 2 characters';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [name, email, phone, city]);

  // Retry mechanism with exponential backoff
  const retryWithBackoff = useCallback(async (
    operation: () => Promise<any>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<any> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }, []);

  // Track page engagement time
  const getEngagementTime = () => {
    return Math.round((Date.now() - pageStartTime.current) / 1000);
  };

  // Track form interaction start
  const handleFormStart = useCallback(() => {
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
  }, [formStarted, trackPixelEvent, trackCustomPixelEvent]);

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
    
    // Prevent double submission
    if (isSubmittingRef.current) {
      return;
    }
    
    // Check throttling
    const now = Date.now();
    if (now - lastSubmitTime < SUBMIT_THROTTLE_MS) {
      toast({
        title: "Please wait",
        description: `Please wait ${Math.ceil((SUBMIT_THROTTLE_MS - (now - lastSubmitTime)) / 1000)} seconds before submitting again.`,
        variant: "destructive",
      });
      return;
    }
    
    // Check max attempts
    if (submitAttempts >= MAX_SUBMIT_ATTEMPTS) {
      toast({
        title: "Too many attempts",
        description: "Please refresh the page and try again.",
        variant: "destructive",
      });
      return;
    }
    
    // Track form submission attempt
    trackCustomPixelEvent('FormSubmissionAttempt', {
      engagement_time: getEngagementTime(),
      attempt_number: submitAttempts + 1,
      fields_filled: {
        name: !!name,
        email: !!email,
        phone: !!phone,
        city: !!city
      }
    });
    
    // Validate form
    if (!validateForm()) {
      trackCustomPixelEvent('FormValidationError', {
        error_type: 'validation_failed',
        errors: Object.keys(validationErrors),
        page: 'landing',
        engagement_time: getEngagementTime()
      });
      
      toast({
        title: "Please fix the errors",
        description: "Check the highlighted fields and try again.",
        variant: "destructive",
      });
      return;
    }

    // Check online status
    if (!isOnline) {
      toast({
        title: "No internet connection",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setLastSubmitTime(now);
    setSubmitAttempts(prev => prev + 1);
    isSubmittingRef.current = true;
    
    try {
      const submissionData = {
        email: email.trim(),
        name: name.trim(),
        city: city.trim(),
        phone: phone.trim(),
      };

      const response = await retryWithBackoff(async () => {
        const response = await fetch('https://mnukhzjcvbwpvktxqlej.supabase.co/functions/v1/mailchimp-subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(submissionData),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to subscribe');
        }
        
        return { response, data };
      }, 3, 2000);

      const { data } = response;
      setSubmitted(true);
      
      // Enhanced Lead tracking with engagement data
      trackPixelEvent('Lead', {
        content_name: 'Courageous Character Training',
        content_category: 'Free Training',
        value: 0,
        currency: 'USD',
        engagement_time: getEngagementTime(),
        processing_time: data.processingTime || 0,
        backup_saved: data.backup_saved || false,
        user_data: {
          email_hash: btoa(email).substring(0, 8),
          city: city
        }
      });

      // Track successful form completion
      trackCustomPixelEvent('FormCompletionSuccess', {
        engagement_time: getEngagementTime(),
        page: 'landing',
        attempt_number: submitAttempts,
        processing_time: data.processingTime || 0,
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
        description: "Redirecting to your training video...",
      });
      
      // Clear form data for security
      setEmail('');
      setName('');
      setPhone('');
      setCity('');
      
      // Redirect to video page after successful submission
      setTimeout(() => {
        window.location.href = '/video';
      }, 1500);
      
    } catch (error: any) {
      console.error('Submission error:', error);
      
      // Track submission error
      trackCustomPixelEvent('FormSubmissionError', {
        error_message: error.message,
        engagement_time: getEngagementTime(),
        attempt_number: submitAttempts,
        page: 'landing'
      });
      
      let errorMessage = "Something went wrong. Please try again.";
      
      if (error.message.includes('Too many requests')) {
        errorMessage = "Too many requests. Please wait a minute and try again.";
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = "Network error. Please check your connection and try again.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const benefits = [
    "Build unshakeable confidence",
    "Overcome cultural barriers",
    "Transform self-doubt into power",
    "Navigate challenges like a leader"
  ];

  return (
    <>
      <SEOHead
        title="Exclusive Free Training By LADYBOSS"
        description="20-minute exclusive training by LADYBOSS. Build unshakeable confidence and overcome cultural barriers. Join 2,500+ empowered Persian women."
        image={`${window.location.origin}/lovable-uploads/cc26e040-a2f3-48d8-83ae-02a973799ac3.png`}
        url={`${window.location.origin}/landing`}
        type="website"
        locale="fa_IR"
      />
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
                  Get Instant Email Access
                </CardTitle>
                <CardDescription>
                  🎁 آموزش 20 دقیقه‌ای رایگان 🎁
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-3 md:space-y-4">
                {/* Connection Status Indicator */}
                {!isOnline && (
                  <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
                    <WifiOff className="w-4 h-4" />
                    <span>No internet connection. Please check your connection.</span>
                  </div>
                )}
                
                {submitAttempts > 0 && submitAttempts < MAX_SUBMIT_ATTEMPTS && !submitted && (
                  <div className="flex items-center gap-2 p-3 bg-primary/10 text-primary rounded-lg text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Attempt {submitAttempts} of {MAX_SUBMIT_ATTEMPTS}. If issues persist, try refreshing the page.</span>
                  </div>
                )}
                
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
                          className={`h-10 ${validationErrors.name ? 'border-destructive' : ''}`}
                          required
                          disabled={isLoading}
                        />
                        {validationErrors.name && (
                          <p className="text-sm text-destructive">{validationErrors.name}</p>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor="city">Your City, State</Label>
                        <Input
                          id="city"
                          type="text"
                          placeholder="e.g., Los Angeles, CA"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className={`h-10 ${validationErrors.city ? 'border-destructive' : ''}`}
                          required
                          disabled={isLoading}
                        />
                        {validationErrors.city && (
                          <p className="text-sm text-destructive">{validationErrors.city}</p>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor="phone">Your Phone Number (Optional)</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Enter your phone number"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className={`h-10 ${validationErrors.phone ? 'border-destructive' : ''}`}
                           disabled={isLoading}
                        />
                        {validationErrors.phone && (
                          <p className="text-sm text-destructive">{validationErrors.phone}</p>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <Label htmlFor="email">Your Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`h-10 ${validationErrors.email ? 'border-destructive' : ''}`}
                          required
                          disabled={isLoading}
                        />
                        {validationErrors.email && (
                          <p className="text-sm text-destructive">{validationErrors.email}</p>
                        )}
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full h-11 text-base font-semibold"
                        disabled={isLoading || !isOnline || submitAttempts >= MAX_SUBMIT_ATTEMPTS}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Submitting... ({submitAttempts}/{MAX_SUBMIT_ATTEMPTS})</span>
                          </div>
                        ) : !isOnline ? (
                          <div className="flex items-center gap-2">
                            <WifiOff className="w-4 h-4" />
                            <span>No Connection</span>
                          </div>
                        ) : submitAttempts >= MAX_SUBMIT_ATTEMPTS ? (
                          <span>Too Many Attempts - Refresh Page</span>
                        ) : (
                          "Watch Free Training Now →"
                        )}
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
    </>
  );
};

export default Landing;