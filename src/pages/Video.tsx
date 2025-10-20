import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Play, Share2, BookOpen, ChevronDown, Mail, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { SEOHead } from '@/components/SEOHead';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Declare Facebook Pixel function
declare global {
  interface Window {
    fbq?: (command: string, event: string, parameters?: Record<string, any>) => void;
  }
}

const Video = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Meta Pixel tracking
  useEffect(() => {
    // Track PageView
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
      
      // Track ViewContent with video-specific parameters
      window.fbq('track', 'ViewContent', {
        content_type: 'video',
        content_name: 'Courageous Character Course',
        content_category: 'Training Video',
        value: 0,
        currency: 'USD'
      });
      
      // Custom event for video page visit
      window.fbq('trackCustom', 'VideoPageVisit', {
        video_title: 'Build Your Courageous Character',
        course_step: 'Step 1: Rights & Boundaries',
        user_type: 'video_viewer'
      });
    }

    // Track scroll depth for engagement
    let maxScroll = 0;
    const trackScrollDepth = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent;
        
        // Track engagement milestones
        if (scrollPercent >= 25 && maxScroll < 25) {
          window.fbq && window.fbq('trackCustom', 'VideoEngagement', {
            engagement_level: '25_percent_scroll',
            content_name: 'Courageous Character Course'
          });
        } else if (scrollPercent >= 50 && maxScroll < 50) {
          window.fbq && window.fbq('trackCustom', 'VideoEngagement', {
            engagement_level: '50_percent_scroll',
            content_name: 'Courageous Character Course'
          });
        } else if (scrollPercent >= 75 && maxScroll < 75) {
          window.fbq && window.fbq('trackCustom', 'VideoEngagement', {
            engagement_level: '75_percent_scroll',
            content_name: 'Courageous Character Course'
          });
        }
      }
    };

    window.addEventListener('scroll', trackScrollDepth);
    return () => window.removeEventListener('scroll', trackScrollDepth);
  }, []);

  const handleEmailSubmit = async () => {
    if (!email) {
      toast({
        title: "Email Required",
        description: "Please enter your email to receive the bonus.",
        variant: "destructive",
      });
      return;
    }

    if (!city) {
      toast({
        title: "City Required",
        description: "Please enter your city to receive the bonus.",
        variant: "destructive",
      });
      return;
    }

    if (!password || password.toLowerCase() !== 'jorat') {
      toast({
        title: "Wrong Password", 
        description: "Please enter the correct video password: jorat",
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
      // Track email submission as Lead event
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Lead', {
          content_name: 'First Step Bonus Email',
          content_category: 'Video CTA',
          value: 1,
          currency: 'USD'
        });
        
        // Custom event for email subscription
        window.fbq('trackCustom', 'EmailBonusSubscription', {
          source: 'video_page',
          bonus_type: 'firststepbonus',
          user_intent: 'high_interest'
        });
      }

      // Extract name from email if not provided
      const emailName = email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').trim() || 'Ladyboss Member';
      
      // Add to Mailchimp with city information and firststepbonus tag
      const { error } = await supabase.functions.invoke('mailchimp-subscribe', {
        body: {
          email,
          name: emailName,
          city: city,
          phone: '',
          source: 'video_page',
          tags: ['firststepbonus']
        }
      });

      if (error) {
        console.error('Mailchimp error:', error);
        // Don't throw error, just log it - we still want to show WhatsApp
      }

      // Create WhatsApp message
      const whatsappNumber = '16265028538'; // +1 (626) 502-8538
      const message = `Hello! I want to get the bonus from the First Step video.%0A%0AEmail: ${email}%0ACity: ${city}`;
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
      
      // Open WhatsApp
      window.open(whatsappUrl, '_blank');

      toast({
        title: "Success! 🎉",
        description: "Added to our system and redirecting to WhatsApp for your bonus!",
      });

      setEmail('');
      setPassword('');
      setCity('');
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

  const handleJoinAcademyClick = () => {
    // Track course interest
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_name: 'LadyBoss Academy Membership',
        content_category: 'Course Enrollment',
        value: 0,
        currency: 'USD'
      });
      
      // Custom event for course interest
      window.fbq('trackCustom', 'CourseInterest', {
        source: 'video_page',
        course_name: 'LadyBoss Academy',
        user_intent: 'conversion_ready'
      });
    }
  };

  return (
    <>
      <SEOHead />
      <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              className="flex items-center space-x-1 sm:space-x-2 text-muted-foreground hover:text-primary transition-smooth"
            >
              <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Back</span>
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

      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Page Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-primary/10 rounded-full mb-4 sm:mb-6">
            <Play size={14} className="sm:w-4 sm:h-4 mr-2 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-primary">
              Step 1: Rights & Boundaries
            </span>
          </div>
          
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 px-2">
            Build Your{' '}
            <span className="gradient-text">Courageous Character</span>
          </h1>
          
          <p className="text-base sm:text-lg text-foreground max-w-xl mx-auto px-4 text-justify leading-relaxed font-medium">
            Learn your rights and set healthy boundaries as the first step to courageous leadership.
          </p>
        </div>

        {/* Multiple Bouncing Arrows */}
        <div className="flex justify-center items-center space-x-2 mb-2 sm:mb-3">
          <div className="animate-bounce" style={{ animationDelay: '0s' }}>
            <ChevronDown size={28} className="text-primary" />
          </div>
          <div className="animate-bounce" style={{ animationDelay: '0.2s' }}>
            <ChevronDown size={32} className="text-primary" />
          </div>
          <div className="animate-bounce" style={{ animationDelay: '0.4s' }}>
            <ChevronDown size={28} className="text-primary" />
          </div>
        </div>

        {/* Video Container */}
        <div className="max-w-5xl mx-auto px-2 sm:px-0">
          <Card className="overflow-hidden bg-gradient-card border-border shadow-medium">
            <div className="aspect-video relative">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/qQalgp5Sg0w?rel=0&modestbranding=1"
                title="Courageous Character Course - LadyBoss Academy"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="absolute inset-0 w-full h-full rounded-lg"
              ></iframe>
            </div>
          </Card>
        </div>

        {/* Email Bonus Section */}
        <div className="max-w-4xl mx-auto mt-6 sm:mt-8 px-4 sm:px-6">
          <Card className="p-4 sm:p-6 bg-gradient-accent border-2 border-primary/20">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Gift size={24} className="text-primary" />
                <h3 className="font-display text-lg sm:text-xl font-bold text-foreground">
                  Get Your First Step Bonus
                </h3>
              </div>
              
              <p className="text-sm text-foreground/80 max-w-md mx-auto" dir="rtl">
                برای گرفتن هدیه ، اسم رمز و ایمیل خودت رو وارد کن
              </p>
              
              <div className="flex flex-col gap-3 max-w-md mx-auto">
                <Input
                  type="text"
                  placeholder="Enter Video's Pass word 'jorat'"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                />
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
                <Input
                  type="text"
                  placeholder="Enter your city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={isSubmitting}
                />
                <Button 
                  onClick={handleEmailSubmit}
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-white px-6 py-3 text-sm font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Mail size={16} className="mr-2" />
                  {isSubmitting ? 'Sending...' : 'Get Bonus'}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Video Info & Actions */}
        <div className="max-w-5xl mx-auto mt-6 sm:mt-8 px-2 sm:px-0">
          <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Video Details */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-foreground">
                  About This 20-Minute Course
                </h2>
                <p className="text-sm sm:text-base text-foreground leading-relaxed text-justify bg-muted/30 p-4 rounded-lg">
                  The foundational step to building courageous character as a Persian immigrant woman. 
                  This powerful session focuses on understanding your fundamental rights and establishing 
                  healthy boundaries in your relationships, communications, and professional life in your new homeland.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-sm sm:text-base text-foreground">What You'll Learn in 20 Minutes:</h3>
                <ul className="space-y-2 sm:space-y-3 text-foreground text-sm sm:text-base">
                  <li className="flex items-start text-justify bg-muted/20 p-3 rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span>Recognize your fundamental rights as an immigrant woman in personal and professional settings</span>
                  </li>
                  <li className="flex items-start text-justify bg-muted/20 p-3 rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span>Master the art of saying "no" respectfully while maintaining your dignity and relationships</span>
                  </li>
                  <li className="flex items-start text-justify bg-muted/20 p-3 rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span>Establish clear boundaries in your workplace communications and career advancement</span>
                  </li>
                  <li className="flex items-start text-justify bg-muted/20 p-3 rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span>Communicate assertively while honoring your Persian heritage and cultural values</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Action Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              <Card className="p-4 sm:p-6 bg-gradient-accent border-2 border-primary/20">
                <div className="text-center space-y-3 sm:space-y-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                    <BookOpen size={20} className="sm:w-6 sm:h-6 text-accent-foreground" />
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-accent-foreground">
                    Build Your Courage
                  </h3>
                  <p className="text-accent-foreground/90 text-xs sm:text-sm leading-relaxed text-justify">
                    Join our sisterhood of courageous Persian ladybosses and unlock your full potential.
                  </p>
                  <Button 
                    className="w-full bg-primary hover:bg-primary-dark text-sm sm:text-base font-bold"
                    asChild
                    onClick={handleJoinAcademyClick}
                  >
                    <Link to="/ccw">
                      Join Courageous Character Course
                    </Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
    </>
  );
};

export default Video;