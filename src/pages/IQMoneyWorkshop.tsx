import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSign, 
  TrendingUp, 
  Target, 
  Users, 
  Clock, 
  CheckCircle, 
  Star,
  Shield,
  Calendar,
  BookOpen,
  Heart,
  Lightbulb
} from 'lucide-react';
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import moneyLiteracyHero from "@/assets/money-literacy-workshop-hero.jpg";

export default function IQMoneyWorkshop() {
  const { toast } = useToast();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Facebook Pixel tracking
  useEffect(() => {
    // Track page view
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
      window.fbq('trackCustom', 'MoneyWorkshopLanding', {
        source: 'iqmoney_workshop_page',
        workshop_type: 'money_literacy',
        price: 600
      });
    }

    // Track scroll depth
    const handleScroll = () => {
      const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      
      if (scrolled > 25 && typeof window.fbq === 'function') {
        window.fbq('trackCustom', 'ScrollDepth25', {
          source: 'iqmoney_workshop_page'
        });
      }
      if (scrolled > 50 && typeof window.fbq === 'function') {
        window.fbq('trackCustom', 'ScrollDepth50', {
          source: 'iqmoney_workshop_page'
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleEnrollClick = () => {
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'InitiateCheckout', {
        value: 600,
        currency: 'USD',
        content_name: 'IQMoney Workshop',
        content_category: 'workshop'
      });
      window.fbq('trackCustom', 'WorkshopEnrollment', {
        source: 'iqmoney_workshop_page',
        workshop_name: 'money_literacy'
      });
    }
    handleDirectPayment();
  };

  const handleDirectPayment = async () => {
    setIsProcessingPayment(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { program: 'money-literacy' }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const features = [
    {
      icon: <DollarSign className="h-6 w-6" />,
      title: "Money Management Basics",
      description: "Discover how to create a budget, track expenses, and save for the future."
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Debt & Credit Essentials", 
      description: "Learn to manage, reduce, and eliminate debt, while boosting your credit score."
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Investing Made Simple",
      description: "Gain the confidence to start investing in stocks, bonds, and other financial assets."
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Goal Setting for Financial Success",
      description: "Set achievable financial goals and craft a clear plan to reach them."
    },
    {
      icon: <Heart className="h-6 w-6" />,
      title: "Mindset & Emotional Spending",
      description: "Break the cycle of emotional spending and develop a strong money mindset."
    },
    {
      icon: <Lightbulb className="h-6 w-6" />,
      title: "Wealth Building for the Long-Term",
      description: "Explore strategies for passive income, savings growth, and smart financial decisions."
    }
  ];

  const benefits = [
    {
      icon: <Star className="h-5 w-5" />,
      title: "Expert Advice",
      description: "Gain valuable insights from experienced financial coaches passionate about women's financial empowerment."
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Hands-On Learning", 
      description: "Participate in real-world exercises, case studies, and live discussions to enhance your money literacy."
    },
    {
      icon: <Target className="h-5 w-5" />,
      title: "Personalized Action Plan",
      description: "Leave with a tailored financial roadmap and tools to implement immediately."
    },
    {
      icon: <Heart className="h-5 w-5" />,
      title: "Community Connection",
      description: "Join a network of like-minded women on the same path to financial mastery."
    }
  ];

  return (
    <>
      <SEOHead 
        title="IQMoney Online Workshop: Money Literacy for Ladyboss - Master Your Finances"
        description="Transform your financial future with our comprehensive 6-week Money Literacy workshop. Learn budgeting, investing, debt management, and wealth building strategies designed specifically for ambitious women. Start your journey to financial independence today."
        image={moneyLiteracyHero}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
        {/* Hero Section */}
        <section className="pt-8 pb-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <Badge variant="secondary" className="mb-4 text-sm font-semibold px-4 py-2">
                💰 ONLINE WORKSHOP
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                IQMoney Online Workshop:<br />
                Money Literacy for Ladyboss
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
                Take charge of your financial journey with our empowering online workshop. This workshop is specifically designed for women who are ready to master their money, grow their wealth, and confidently navigate financial decisions.
              </p>
            </div>

            {/* Hero Image */}
            <div className="mb-8 max-w-3xl mx-auto">
              <img 
                src={moneyLiteracyHero} 
                alt="Money Literacy Workshop for Ladyboss"
                className="w-full h-auto rounded-xl shadow-2xl"
              />
            </div>

            {/* Key Details */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              <Card className="text-center border-primary/20 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <Calendar className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-lg mb-2">Duration</h3>
                  <p className="text-muted-foreground">6 Weeks Intensive</p>
                </CardContent>
              </Card>
              
              <Card className="text-center border-primary/20 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <DollarSign className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-lg mb-2">Investment</h3>
                  <p className="text-2xl font-bold text-primary">$600</p>
                </CardContent>
              </Card>
              
              <Card className="text-center border-primary/20 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
                  <h3 className="font-semibold text-lg mb-2">Format</h3>
                  <p className="text-muted-foreground">Online Workshop</p>
                </CardContent>
              </Card>
            </div>

            {/* CTA Button */}
            <div className="text-center">
              <Button 
                onClick={handleEnrollClick}
                disabled={isProcessingPayment}
                className="bg-primary hover:bg-primary/90 text-white px-12 py-6 text-xl font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {isProcessingPayment ? "Processing..." : "Enroll Now - $600"}
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                <Shield className="inline h-4 w-4 mr-1" />
                Secure payment powered by Stripe
              </p>
            </div>
          </div>
        </section>

        <Separator className="my-16" />

        {/* What You'll Learn Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">What You'll Learn</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Master every aspect of your financial journey with our comprehensive curriculum
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {features.map((feature, index) => (
                <Card key={index} className="border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className="text-primary mb-4">{feature.icon}</div>
                    <h3 className="font-semibold text-lg mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <Separator className="my-16" />

        {/* Who This Is For Section */}
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Who Is This Workshop For?</h2>
            </div>

            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <p className="text-lg">Aspiring entrepreneurs, freelancers, and businesswomen who want to take control of their finances</p>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <p className="text-lg">Women interested in learning practical, easy-to-apply money management techniques</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <p className="text-lg">Individuals seeking a clearer path to financial independence and wealth creation</p>
                </div>
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                  <p className="text-lg">Ladybosses who want to strengthen their financial mindset and eliminate emotional spending</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Separator className="my-16" />

        {/* Why Attend Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Why Attend This Workshop?</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Join hundreds of women who have transformed their financial lives
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {benefits.map((benefit, index) => (
                <Card key={index} className="border-primary/20 hover:border-primary/40 transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="text-primary">{benefit.icon}</div>
                      <h3 className="font-semibold text-xl">{benefit.title}</h3>
                    </div>
                    <p className="text-muted-foreground text-lg">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Financial Future?
            </h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
              Don't let another day pass feeling uncertain about your finances. Join the IQMoney workshop today and start building the wealth and confidence you deserve. Seats are limited - secure your spot now!
            </p>
            
            <div className="space-y-6">
              <Button 
                onClick={handleEnrollClick}
                disabled={isProcessingPayment}
                className="bg-primary hover:bg-primary/90 text-white px-12 py-6 text-xl font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {isProcessingPayment ? "Processing..." : "Enroll Now - $600"}
              </Button>
              
              <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Secure Payment
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Limited Spots
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-2" />
                  Expert Instructors
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}