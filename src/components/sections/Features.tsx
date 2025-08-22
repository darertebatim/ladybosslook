import { Card } from '@/components/ui/card';
import { DollarSign, TrendingUp, Users, Trophy } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: DollarSign,
      title: 'Financial Independence & Money Literacy',
      description: 'Master the art of wealth creation, learn smart money management, and build multiple income streams that work for you.',
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    {
      icon: TrendingUp,
      title: 'Business Growth & Coaching',
      description: 'Get expert guidance for launching, scaling, and optimizing your business with proven strategies and personalized coaching.',
      color: 'text-primary',
      bgColor: 'bg-primary/10'
    },
    {
      icon: Users,
      title: 'Powerful Networking Community',
      description: 'Connect with like-minded ambitious women, find mentors, and build lasting partnerships in our supportive ecosystem.',
      color: 'text-secondary',
      bgColor: 'bg-secondary/10'
    },
    {
      icon: Trophy,
      title: 'Proven Success Stories',
      description: 'Join 5,000+ women who have transformed their businesses and lives using our battle-tested methodologies and frameworks.',
      color: 'text-accent-foreground',
      bgColor: 'bg-accent'
    }
  ];

  return (
    <section id="about" className="py-16 lg:py-24">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-accent rounded-full mb-6">
            <span className="text-sm font-medium text-accent-foreground">
              Why Choose LadyBoss Academy?
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Your Success is Our{' '}
            <span className="gradient-text">Mission</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            At LadyBoss Academy, we've dedicated our energy and resources to helping more women 
            embrace the Ladyboss lifestyle. We're thrilled that you've joined our community of 
            264,000+ strong and growing ambitious women.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="group p-8 bg-gradient-card border-border hover:shadow-medium transition-all duration-300 hover:-translate-y-2"
            >
              <div className="space-y-6">
                {/* Icon */}
                <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon size={32} className={feature.color} />
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h3 className="font-display text-xl font-semibold leading-tight">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Hover Effect */}
                <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                  <div className={`h-full ${feature.color.replace('text-', 'bg-')} w-0 group-hover:w-full transition-all duration-500`}></div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom Stats */}
        <div className="mt-16 p-8 bg-gradient-accent rounded-2xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold font-display text-accent-foreground mb-2">
                264,000+
              </div>
              <div className="text-accent-foreground/70">
                Empowered Women Worldwide
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold font-display text-accent-foreground mb-2">
                5,000+
              </div>
              <div className="text-accent-foreground/70">
                Business Transformations
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold font-display text-accent-foreground mb-2">
                98%
              </div>
              <div className="text-accent-foreground/70">
                Success Rate Achieved
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;