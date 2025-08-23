import { useState } from 'react';
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
  const [city, setCity] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !name || !city) {
      toast({
        title: "Required Fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // TODO: Replace with your Mailchimp API endpoint or form action
      // For now, simulate successful submission
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitted(true);
      toast({
        title: "Success!",
        description: "Please check your email for the training video link!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center">
      <div className="container mx-auto px-4 py-4">
        <div className="grid lg:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
          {/* Left Column - Content */}
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="inline-flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                <Star className="w-4 h-4 mr-2" />
                Exclusive Free Training
              </div>
              
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
                Unlock Your
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"> Courageous Character</span>
              </h1>
              
              <p className="text-base md:text-lg text-muted-foreground">
                A 30-minute masterclass for Persian women ready to build confidence and success in their new homeland.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">You'll discover:</h3>
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
            <div className="grid grid-cols-3 gap-3 py-3">
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
                <div className="text-lg font-bold">30 Min</div>
                <div className="text-xs text-muted-foreground">Training</div>
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div>
            <Card className="border-2 border-primary/20 shadow-xl">
              <CardHeader className="text-center pb-3">
                <CardTitle className="text-xl md:text-2xl">
                  Get Instant Access
                </CardTitle>
                <CardDescription>
                  Join thousands of empowered Persian women
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
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