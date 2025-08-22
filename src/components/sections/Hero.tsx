import { Button } from '@/components/ui/button';
import { ArrowRight, Users, TrendingUp, Award } from 'lucide-react';
import heroImage from '@/assets/hero-businesswoman.jpg';

const Hero = () => {
  return (
    <section id="home" className="pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 bg-accent rounded-full">
                <Users size={16} className="mr-2 text-primary" />
                <span className="text-sm font-medium text-accent-foreground">
                  264,000+ Empowered Women
                </span>
              </div>
              
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Empowering Women to{' '}
                <span className="gradient-text">Build, Grow & Succeed</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                Join our thriving community of ambitious women entrepreneurs and start your 
                journey toward financial independence, business mastery, and unlimited potential.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold gradient-text">5,000+</div>
                <div className="text-sm text-muted-foreground">Success Stories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold gradient-text">264K+</div>
                <div className="text-sm text-muted-foreground">Community Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold gradient-text">98%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary-dark shadow-medium hover:shadow-glow transition-all duration-300 group"
              >
                Start Your Journey
                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                Explore Programs
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative z-10">
              <img
                src={heroImage}
                alt="Confident businesswoman representing empowered female entrepreneurs"
                className="w-full h-auto rounded-2xl shadow-bold animate-float"
              />
              
              {/* Floating Stats Cards */}
              <div className="absolute -top-6 -left-6 bg-card-elevated p-4 rounded-xl shadow-medium backdrop-blur-sm border border-border">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-success rounded-lg flex items-center justify-center">
                    <TrendingUp size={20} className="text-success-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Revenue Growth</div>
                    <div className="text-xs text-muted-foreground">+347% Average</div>
                  </div>
                </div>
              </div>
              
              <div className="absolute -bottom-6 -right-6 bg-card-elevated p-4 rounded-xl shadow-medium backdrop-blur-sm border border-border">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                    <Award size={20} className="text-secondary-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Award Winning</div>
                    <div className="text-xs text-muted-foreground">Top Program 2024</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Background Elements */}
            <div className="absolute -inset-4 bg-gradient-hero rounded-3xl blur-3xl opacity-20 -z-10"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-20"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;