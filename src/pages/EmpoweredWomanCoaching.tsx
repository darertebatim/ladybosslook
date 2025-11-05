import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Users, Calendar, Star, Sparkles, TrendingUp, Heart, DollarSign, Video, MessageCircle, Target, Award, Zap } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import Navigation from '@/components/ui/navigation';
import Footer from '@/components/sections/Footer';
import { Badge } from '@/components/ui/badge';

const EmpoweredWomanCoaching = () => {
  const handlePaymentClick = () => {
    // Redirect to payment page with $100 deposit
    window.location.href = '/checkout?program=empowered-woman-coaching&amount=100';
  };

  return (
    <>
      <SEOHead 
        title="10X Empowered Woman Coaching - Transform Your Life in 3 Months"
        description="Join Razie Ladyboss's exclusive 3-month group coaching program for immigrant women. Get 10X more power in work, relationships, and income. Only $997 (was $1200)."
      />
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative bg-gradient-hero text-white py-16 md:py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHptMCAwIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
            <div className="inline-flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm md:text-base font-medium mb-4">
              <Heart className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              3-Month Transformation Program for Immigrant Women
            </div>
            
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Become a <span className="text-secondary">10X Empowered Woman</span> in Just 3 Months
            </h1>
            
            <p className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
              Face-to-face weekly group coaching with <span className="font-semibold">Razie Ladyboss</span> to gain 10X more power 
              in your work, relationships, and income
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button 
                size="lg"
                onClick={handlePaymentClick}
                className="bg-secondary hover:bg-secondary/90 text-white px-8 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 w-full sm:w-auto"
              >
                <DollarSign className="w-5 h-5 mr-2" />
                Reserve Your Spot - $100 Deposit
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="bg-white/10 hover:bg-white/20 border-white/30 text-white px-8 py-6 text-lg backdrop-blur-sm w-full sm:w-auto"
                onClick={() => document.getElementById('details')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-8 md:pt-12">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 md:p-6">
                <Calendar className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-secondary" />
                <div className="text-2xl md:text-3xl font-bold">3</div>
                <div className="text-xs md:text-sm text-white/80">Months</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 md:p-6">
                <Users className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-secondary" />
                <div className="text-2xl md:text-3xl font-bold">12</div>
                <div className="text-xs md:text-sm text-white/80">Weekly Sessions</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 md:p-6">
                <Video className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-secondary" />
                <div className="text-2xl md:text-3xl font-bold">Live</div>
                <div className="text-xs md:text-sm text-white/80">Face-to-Face</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 md:p-6">
                <TrendingUp className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 text-secondary" />
                <div className="text-2xl md:text-3xl font-bold">10X</div>
                <div className="text-xs md:text-sm text-white/80">Empowerment</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Special Offer Banner */}
      <div className="bg-secondary py-3 md:py-4">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 md:gap-4 text-white text-center">
            <Badge variant="secondary" className="bg-white text-secondary font-bold px-3 py-1">
              LIMITED TIME OFFER
            </Badge>
            <p className="text-sm md:text-base font-medium">
              <span className="line-through opacity-75">$1,200</span> 
              <span className="text-2xl md:text-3xl font-bold mx-2">$997</span>
              <span className="text-xs md:text-sm">Save $203!</span>
            </p>
          </div>
        </div>
      </div>

      {/* What You'll Achieve Section */}
      <section id="details" className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-10 md:mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
              What You'll <span className="gradient-text">Achieve</span>
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-3xl mx-auto">
              This program is specifically designed for immigrant women ready to break through barriers 
              and create extraordinary success in all areas of life
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-6xl mx-auto">
            <Card className="bg-gradient-card border-2 border-primary/20 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 md:p-8 text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <Target className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Career & Work</h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  Get 10X more confidence and power to advance in your career, negotiate better, 
                  and achieve the professional success you deserve
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-2 border-primary/20 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 md:p-8 text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <Heart className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Relationships</h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  Build stronger, healthier relationships with family, friends, and partners. 
                  Learn to set boundaries and communicate with power
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-card border-2 border-primary/20 hover:shadow-lg transition-all duration-300">
              <CardContent className="p-6 md:p-8 text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                  <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Income Growth</h3>
                <p className="text-sm md:text-base text-muted-foreground">
                  Develop the mindset and strategies to increase your income, create new opportunities, 
                  and build lasting financial security
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Program Details Section */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10 md:mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
                Program <span className="gradient-text">Details</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              <Card className="bg-background">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold mb-2">Duration & Format</h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        3-month intensive program with 12 weekly face-to-face group coaching sessions
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold mb-2">Your Coach</h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        Direct coaching with Razie Ladyboss, empowerment expert for immigrant women
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MessageCircle className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold mb-2">Group Coaching</h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        Small, intimate group setting for personalized attention and community support
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-background">
                <CardContent className="p-6 md:p-8">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Award className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold mb-2">For Immigrant Women</h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        Specifically designed to address unique challenges faced by immigrant women
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6 md:mt-8 bg-gradient-card border-2 border-primary/30">
              <CardContent className="p-6 md:p-8">
                <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  What's Included
                </h3>
                <div className="grid sm:grid-cols-2 gap-3 md:gap-4">
                  {[
                    'Weekly live group coaching sessions',
                    'Face-to-face interaction with Razie',
                    'Personalized action plans',
                    'Accountability and progress tracking',
                    'Community support network',
                    'Bonus resources and materials',
                    'Lifetime access to recordings',
                    'Certificate of completion'
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2 md:gap-3">
                      <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                      <span className="text-sm md:text-base">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10 md:mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
                Investment in Your <span className="gradient-text">Future</span>
              </h2>
            </div>

            <Card className="bg-gradient-card border-4 border-primary shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-secondary text-white px-4 md:px-6 py-2 md:py-3 rounded-bl-2xl font-bold text-sm md:text-base">
                SAVE $203
              </div>
              
              <CardContent className="p-6 md:p-12">
                <div className="text-center space-y-4 md:space-y-6">
                  <div>
                    <div className="text-base md:text-lg text-muted-foreground mb-2">Regular Price</div>
                    <div className="text-3xl md:text-4xl font-bold text-muted-foreground line-through">$1,200</div>
                  </div>

                  <div>
                    <div className="text-xl md:text-2xl text-primary font-semibold mb-2">Special Limited Offer</div>
                    <div className="text-5xl md:text-7xl font-bold gradient-text mb-4">$997</div>
                    <p className="text-sm md:text-base text-muted-foreground">Full program investment</p>
                  </div>

                  <div className="bg-primary/5 rounded-lg p-4 md:p-6 my-6 md:my-8">
                    <div className="flex items-center justify-center gap-2 mb-3 md:mb-4">
                      <Zap className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                      <h3 className="text-lg md:text-xl font-bold">How It Works</h3>
                    </div>
                    <div className="space-y-3 md:space-y-4 text-left max-w-2xl mx-auto">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 md:w-8 md:h-8 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm md:text-base">
                          1
                        </div>
                        <p className="text-sm md:text-base pt-1">
                          <span className="font-semibold">Pay $100 deposit</span> to reserve your spot
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 md:w-8 md:h-8 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm md:text-base">
                          2
                        </div>
                        <p className="text-sm md:text-base pt-1">
                          <span className="font-semibold">Get interviewed by Razie Ladyboss</span> to ensure the program is the right fit for you
                        </p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 md:w-8 md:h-8 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm md:text-base">
                          3
                        </div>
                        <p className="text-sm md:text-base pt-1">
                          <span className="font-semibold">If accepted</span>, pay the remaining $897 and start your transformation journey
                        </p>
                      </div>
                    </div>
                  </div>

                  <Button 
                    size="lg"
                    onClick={handlePaymentClick}
                    className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white px-8 md:px-12 py-6 md:py-8 text-base md:text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 w-full sm:w-auto"
                  >
                    <DollarSign className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                    Pay $100 Deposit & Get Interview
                  </Button>

                  <p className="text-xs md:text-sm text-muted-foreground mt-4">
                    Secure payment processing • Money-back guarantee if not accepted
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why This Program Section */}
      <section className="py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10 md:mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
                Why Choose <span className="gradient-text">This Program?</span>
              </h2>
            </div>

            <div className="grid gap-6 md:gap-8">
              {[
                {
                  icon: Star,
                  title: 'Designed for Immigrant Women',
                  description: 'Understand and overcome the unique challenges you face as an immigrant woman in a new country'
                },
                {
                  icon: Users,
                  title: 'Small Group, Big Impact',
                  description: 'Intimate group setting ensures you get personalized attention while building a supportive community'
                },
                {
                  icon: Video,
                  title: 'Face-to-Face with Razie',
                  description: 'Direct, personal interaction with an expert coach who truly understands your journey'
                },
                {
                  icon: TrendingUp,
                  title: '10X Transformation',
                  description: 'Not just improvement - experience a complete 10X transformation in work, relationships, and income'
                },
                {
                  icon: CheckCircle,
                  title: 'Proven Results',
                  description: 'Join hundreds of immigrant women who have already transformed their lives through this program'
                }
              ].map((item, index) => (
                <Card key={index} className="bg-background hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6 md:p-8 flex items-start gap-4 md:gap-6">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg md:text-xl font-bold mb-2">{item.title}</h3>
                      <p className="text-sm md:text-base text-muted-foreground">{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-12 md:py-20 bg-gradient-hero text-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold">
              Ready to Become 10X More Empowered?
            </h2>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto">
              Take the first step today. Reserve your spot with a $100 deposit and get your personal interview with Razie Ladyboss.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button 
                size="lg"
                onClick={handlePaymentClick}
                className="bg-secondary hover:bg-secondary/90 text-white px-8 md:px-12 py-6 md:py-8 text-base md:text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 w-full sm:w-auto"
              >
                <DollarSign className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                Reserve Your Spot Now
              </Button>
            </div>
            <p className="text-sm md:text-base text-white/70">
              Limited spots available • Next cohort starts soon
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default EmpoweredWomanCoaching;
