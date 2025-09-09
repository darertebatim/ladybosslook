import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Crown, Users, Calendar, Star, Sparkles } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';

const LadybossCoaching = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const { toast } = useToast();

  const validateForm = () => {
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
    
    if (!city.trim()) {
      errors.city = 'City is required';
    } else if (city.trim().length < 2) {
      errors.city = 'City must be at least 2 characters';
    }

    if (!phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[\d\s\-\(\)]{10,}$/.test(phone.trim())) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Please fix the errors",
        description: "Check the highlighted fields and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const submissionData = {
        email: email.trim(),
        name: name.trim(),
        city: city.trim(),
        smsPhone: phone.trim(),
        source: 'ladyboss_coaching_page',
        tags: ['ladyboss_coaching_program']
      };

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
      
      setSubmitted(true);
      
      toast({
        title: "Welcome to Ladyboss Coaching!",
        description: "You'll receive program details and next steps via email and SMS.",
      });
      
      // Clear form data
      setEmail('');
      setName('');
      setCity('');
      setPhone('');
      
    } catch (error: any) {
      console.error('Submission error:', error);
      
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const coachingBenefits = [
    "1-on-1 personalized coaching sessions",
    "Business strategy development",  
    "Confidence building techniques",
    "Leadership skills training",
    "Goal setting and accountability",
    "Network building opportunities"
  ];

  if (submitted) {
    return (
      <>
        <SEOHead 
          title="Welcome to Ladyboss Coaching Program"
          description="You've successfully joined the Ladyboss Coaching Program. Get ready to transform your business and life."
        />
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center py-8">
          <div className="container mx-auto px-4 max-w-2xl">
            <Card className="text-center shadow-lg">
              <CardHeader>
                <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-700">Welcome to Ladyboss Coaching!</CardTitle>
                <CardDescription className="text-lg">
                  You're officially part of our exclusive coaching program.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>You'll receive:</p>
                <ul className="text-left space-y-2 max-w-md mx-auto">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Program welcome email within 24 hours
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    SMS updates about coaching sessions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Access to exclusive resources
                  </li>
                </ul>
                <Button 
                  onClick={() => window.location.href = '/'}
                  className="mt-6"
                >
                  Return to Homepage
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead 
        title="Ladyboss Coaching Program - Transform Your Business & Life"
        description="Join our exclusive coaching program designed for ambitious women entrepreneurs. Get personalized guidance, build confidence, and scale your business."
      />
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-8">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 items-start max-w-6xl mx-auto">
            
            {/* Left Column - Content */}
            <div className="space-y-6 order-2 lg:order-1">
              <div className="space-y-4">
                <div className="inline-flex items-center bg-gradient-to-r from-primary to-secondary text-white px-4 py-2 rounded-full text-sm font-medium">
                  <Crown className="w-4 h-4 mr-2" />
                  Exclusive Ladyboss Coaching Program
                </div>
                
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                  Transform Your Business &
                  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"> Unlock Your Potential</span>
                </h1>
                
                <p className="text-lg text-muted-foreground">
                  Join our exclusive coaching program designed for ambitious women entrepreneurs ready to scale their business and build lasting success.
                </p>
              </div>

              {/* Program Benefits */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  What You'll Get:
                </h3>
                <ul className="space-y-3">
                  {coachingBenefits.map((benefit, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Program Stats */}
              <div className="grid grid-cols-3 gap-4 py-6">
                <div className="text-center">
                  <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">500+</div>
                  <div className="text-sm text-muted-foreground">Women Coached</div>
                </div>
                <div className="text-center">
                  <Star className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">4.9/5</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </div>
                <div className="text-center">
                  <Calendar className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">12 Week</div>
                  <div className="text-sm text-muted-foreground">Program</div>
                </div>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="order-1 lg:order-2">
              <Card className="shadow-xl border-2 border-primary/20">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Join the Program</CardTitle>
                  <CardDescription>
                    Secure your spot in our exclusive coaching program
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Enter your full name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={validationErrors.name ? 'border-red-500' : ''}
                      />
                      {validationErrors.name && (
                        <p className="text-red-500 text-sm">{validationErrors.name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={validationErrors.email ? 'border-red-500' : ''}
                      />
                      {validationErrors.email && (
                        <p className="text-red-500 text-sm">{validationErrors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number (SMS) *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className={validationErrors.phone ? 'border-red-500' : ''}
                      />
                      {validationErrors.phone && (
                        <p className="text-red-500 text-sm">{validationErrors.phone}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        We'll send program updates and session reminders via SMS
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        type="text"
                        placeholder="Enter your city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className={validationErrors.city ? 'border-red-500' : ''}
                      />
                      {validationErrors.city && (
                        <p className="text-red-500 text-sm">{validationErrors.city}</p>
                      )}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Joining Program...' : 'Join Ladyboss Coaching Program'}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                      By joining, you agree to receive program updates via email and SMS. 
                      You can unsubscribe at any time.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LadybossCoaching;