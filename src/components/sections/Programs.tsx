import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Star, Clock, Users } from 'lucide-react';
import moneyLiteracyImage from '@/assets/money-literacy-program.jpg';
import businessCoachingImage from '@/assets/business-coaching-program.jpg';
import networkingImage from '@/assets/networking-program.jpg';

const Programs = () => {
  const programs = [
    {
      title: 'Money Literacy for LadyBoss',
      description: 'Master financial intelligence, investment strategies, and wealth-building techniques designed specifically for ambitious women entrepreneurs.',
      image: moneyLiteracyImage,
      duration: '8 weeks',
      participants: '2,500+',
      rating: 4.9,
      features: [
        'Personal Financial Assessment',
        'Investment Strategy Development',
        'Tax Optimization Techniques',
        'Wealth Building Roadmap',
        '1-on-1 Financial Coaching'
      ],
      price: '$497',
      popular: false
    },
    {
      title: 'Business Growth Accelerator',
      description: 'Transform your business idea into a profitable empire with our comprehensive coaching program and proven growth frameworks.',
      image: businessCoachingImage,
      duration: '12 weeks',
      participants: '3,200+',
      rating: 5.0,
      features: [
        'Business Strategy Development',
        'Marketing & Sales Mastery',
        'Operations Optimization',
        'Leadership Development',
        'Weekly Group Coaching Calls'
      ],
      price: '$997',
      popular: true
    },
    {
      title: 'Courageous Character Course',
      description: 'Master assertiveness & confidence as an immigrant. Build the mindset & communication skills you need to succeed in the U.S.',
      image: networkingImage,
      duration: '6 weeks',
      participants: '1,800+',
      rating: 4.9,
      features: [
        'Overcome Fear & Self-Doubt',
        'Master Assertive Communication',
        'Negotiate for What You Deserve',
        'Build Powerful Connections',
        'Lead with Confidence'
      ],
      price: '$497',
      popular: false
    }
  ];

  return (
    <section id="programs" className="py-16 lg:py-24 bg-muted/50">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6">
            <Star size={16} className="mr-2 text-primary" />
            <span className="text-sm font-medium text-primary">
              Featured Programs
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Accelerate Your{' '}
            <span className="gradient-text">Success Journey</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Our core programs are designed to fast-track your success with proven methodologies, 
            expert coaching, and a supportive community of like-minded women.
          </p>
        </div>

        {/* Programs Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {programs.map((program, index) => (
            <Card 
              key={index}
              className={`group relative overflow-hidden bg-gradient-card border-border hover:shadow-medium transition-all duration-300 hover:-translate-y-2 ${
                program.popular ? 'ring-2 ring-primary shadow-glow' : ''
              }`}
            >
              {program.popular && (
                <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold z-10">
                  Most Popular
                </div>
              )}

              {/* Program Image */}
              <div className="aspect-video overflow-hidden">
                <img
                  src={program.image}
                  alt={program.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="p-8">
                {/* Program Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock size={16} className="mr-1" />
                        {program.duration}
                      </div>
                      <div className="flex items-center">
                        <Users size={16} className="mr-1" />
                        {program.participants}
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Star size={16} className="text-secondary fill-secondary mr-1" />
                      <span className="text-sm font-semibold">{program.rating}</span>
                    </div>
                  </div>
                  
                  <h3 className="font-display text-xl font-bold mb-3">
                    {program.title}
                  </h3>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {program.description}
                  </p>
                </div>

                {/* Features List */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">What's Included:</h4>
                  <ul className="space-y-2">
                    {program.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0"></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Price & CTA */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold gradient-text">
                      {program.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      One-time payment
                    </span>
                  </div>
                  
                  <Button 
                    className="w-full bg-primary hover:bg-primary-dark group-hover:shadow-glow transition-all duration-300"
                    onClick={() => window.location.href = '/ccw'}
                  >
                    Enroll Now
                    <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-hero p-8 rounded-2xl text-white">
            <h3 className="font-display text-2xl md:text-3xl font-bold mb-4">
              Not Sure Which Program is Right for You?
            </h3>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Book a free 30-minute consultation with our success coaches to find the perfect 
              program that matches your goals and current business stage.
            </p>
            <Button 
              variant="secondary"
              size="lg"
              className="bg-white text-primary hover:bg-white/90"
              onClick={() => window.open('https://wa.me/16265028538', '_blank')}
            >
              Book Free Consultation
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Programs;