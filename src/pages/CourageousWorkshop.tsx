import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SEOHead } from '@/components/SEOHead';
import { ArrowLeft, Calendar, Clock, Users, Award, CheckCircle, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

// Declare Facebook Pixel function
declare global {
  interface Window {
    fbq?: (command: string, event: string, parameters?: Record<string, any>) => void;
  }
}

const CourageousWorkshop = () => {
  // Meta Pixel tracking
  useEffect(() => {
    // Track PageView
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
      
      // Track ViewContent with workshop-specific parameters
      window.fbq('track', 'ViewContent', {
        content_type: 'workshop',
        content_name: 'Courageous Character Online Workshop',
        content_category: 'Live Training',
        value: 97,
        currency: 'USD'
      });
      
      // Custom event for workshop page visit
      window.fbq('trackCustom', 'WorkshopPageVisit', {
        workshop_title: 'Courageous Character Online Workshop',
        workshop_type: 'live_online',
        user_type: 'workshop_prospect'
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
        if (scrollPercent >= 50 && maxScroll < 50) {
          window.fbq && window.fbq('trackCustom', 'WorkshopEngagement', {
            engagement_level: '50_percent_scroll',
            content_name: 'Courageous Character Workshop'
          });
        } else if (scrollPercent >= 75 && maxScroll < 75) {
          window.fbq && window.fbq('trackCustom', 'WorkshopEngagement', {
            engagement_level: '75_percent_scroll',
            content_name: 'Courageous Character Workshop'
          });
        }
      }
    };

    window.addEventListener('scroll', trackScrollDepth);
    return () => window.removeEventListener('scroll', trackScrollDepth);
  }, []);

  const handleRegisterClick = () => {
    // Track workshop registration interest
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'InitiateCheckout', {
        content_name: 'Courageous Character Workshop',
        content_category: 'Workshop Registration',
        value: 97,
        currency: 'USD'
      });
      
      // Custom event for workshop registration
      window.fbq('trackCustom', 'WorkshopRegistration', {
        source: 'workshop_page',
        workshop_name: 'Courageous Character',
        user_intent: 'high_conversion'
      });
    }
  };

  const handleWhatsAppClick = () => {
    // Track WhatsApp contact
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'Contact', {
        content_name: 'Workshop Inquiry',
        content_category: 'WhatsApp Contact',
        value: 1,
        currency: 'USD'
      });
      
      // Custom event for WhatsApp interaction
      window.fbq('trackCustom', 'WorkshopInquiry', {
        source: 'workshop_page',
        contact_method: 'whatsapp',
        user_intent: 'needs_info'
      });
    }

    const message = encodeURIComponent('Hi! I\'m interested in the Courageous Character Online Workshop. Can you tell me more?');
    const url = `https://wa.me/19495723730?text=${message}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <SEOHead 
        title="Courageous Character Online Workshop - Build Confidence & Set Boundaries"
        description="Join our live online workshop to build courage, set healthy boundaries, and develop unshakeable confidence. Transform your mindset in just 3 hours."
        image="/assets/hero-businesswoman.jpg"
      />
      <div className="min-h-screen bg-background">
        {/* Navigation Header */}
        <header className="border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                  <ArrowLeft size={16} />
                  <span className="hidden sm:inline">Back to Home</span>
                  <span className="sm:hidden">Back</span>
                </Link>
              </Button>
              <h1 className="text-lg sm:text-xl font-bold text-primary">LadyBoss Academy</h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <section className="text-center mb-12">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Calendar className="w-4 h-4 mr-2" />
              Live Online Workshop
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Courageous Character
              <span className="block text-2xl sm:text-3xl lg:text-4xl mt-2">Online Workshop</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Transform your confidence, set healthy boundaries, and build the courage to pursue your dreams in this intensive 3-hour live workshop.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={handleRegisterClick}
              >
                Register Now - $97
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleWhatsAppClick}
                className="px-8 py-4 text-lg font-semibold"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Ask Questions
              </Button>
            </div>
          </section>

          {/* Workshop Details */}
          <section className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Workshop Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">3 Hours Live</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Format:</span>
                  <span className="font-medium">Online via Zoom</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Participants:</span>
                  <span className="font-medium">25 Women</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Replay Access:</span>
                  <span className="font-medium">7 Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bonus Materials:</span>
                  <span className="font-medium">Included</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  What's Included
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>3-hour live interactive workshop</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Courage-building exercises & tools</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Boundary-setting framework</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Q&A with Joanna</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Digital workbook & templates</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span>Private community access</span>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* What You'll Learn */}
          <section className="mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8">What You'll Learn</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-6">
                  <Award className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Build Unshakeable Confidence</h3>
                  <p className="text-muted-foreground">Overcome self-doubt and develop the confidence to pursue your biggest goals.</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
                <CardContent className="p-6">
                  <CheckCircle className="w-10 h-10 text-secondary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Set Healthy Boundaries</h3>
                  <p className="text-muted-foreground">Learn to say no without guilt and protect your energy and time.</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
                <CardContent className="p-6">
                  <Users className="w-10 h-10 text-accent mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Courage in Action</h3>
                  <p className="text-muted-foreground">Transform fear into fuel and take bold action toward your dreams.</p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* CTA Section */}
          <section className="bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 rounded-2xl p-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Ready to Build Your Courage?</h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join 25 ambitious women in this transformative workshop. Limited seats available.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold"
                onClick={handleRegisterClick}
              >
                Secure Your Spot - $97
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={handleWhatsAppClick}
                className="px-8 py-4 text-lg font-semibold"
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                Have Questions?
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              💰 30-day money-back guarantee • 🎁 Bonus materials included
            </p>
          </section>
        </main>
      </div>
    </>
  );
};

export default CourageousWorkshop;