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
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !name) {
      toast({
        title: "Required Fields",
        description: "Please fill in both your name and email.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Success!",
        description: "Welcome! Redirecting you to your exclusive training...",
      });
      navigate('/video');
      setIsLoading(false);
    }, 1000);
  };

  const benefits = [
    "Build unshakeable confidence in any situation",
    "Overcome cultural barriers with grace and strength",
    "Transform self-doubt into powerful self-belief",
    "Navigate professional challenges like a true leader",
    "Embrace your heritage while conquering new territories"
  ];

  const testimonialStats = [
    { icon: Users, number: "2,500+", text: "Persian Women Empowered" },
    { icon: Star, number: "4.9/5", text: "Success Rating" },
    { icon: Clock, number: "30 Min", text: "Life-Changing Training" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                <Star className="w-4 h-4 mr-2" />
                Exclusive Free Training
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight">
                Unlock Your
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"> Courageous Character</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                A powerful 30-minute masterclass designed specifically for Persian women who are ready to step into their confidence and build an empire in their new homeland.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-3">
              <h3 className="text-xl font-semibold">In this exclusive training, you'll discover:</h3>
              <ul className="space-y-2">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 py-6">
              {testimonialStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <div className="text-xl md:text-2xl font-bold">{stat.number}</div>
                  <div className="text-xs md:text-sm text-muted-foreground">{stat.text}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="lg:pl-8">
            <Card className="border-2 border-primary/20 shadow-xl">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl md:text-3xl">
                  Get Instant Access
                </CardTitle>
                <CardDescription className="text-base">
                  Join thousands of Persian women who have transformed their lives
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Your First Name</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your first name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Your Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12"
                      required
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 text-lg font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? "Getting Your Access..." : "Watch Free Training Now →"}
                  </Button>
                </form>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>100% Free • No Spam • Unsubscribe Anytime</span>
                </div>
              </CardContent>
            </Card>

            {/* Trust Indicators */}
            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                "This training changed everything for me. I finally feel confident in my own skin."
              </p>
              <p className="text-xs font-medium">
                - Shirin K., Marketing Director
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-primary/5 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-lg font-medium text-primary mb-2">
            Ready to step into your power?
          </p>
          <p className="text-muted-foreground">
            Your journey to becoming an unstoppable LadyBoss starts with one decision.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;