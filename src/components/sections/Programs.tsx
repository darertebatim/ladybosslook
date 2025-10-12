import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Star, Clock, Users } from 'lucide-react';
import moneyLiteracyImage from '@/assets/money-literacy-program.jpg';
import businessCoachingImage from '@/assets/business-coaching-program.jpg';
import networkingImage from '@/assets/networking-program.jpg';
import courageousCharacterImage from '@/assets/courageous-character-course.jpg';
import iqmoneyImage from '@/assets/iqmoney-program.jpg';
import empoweredLadybossImage from '@/assets/empowered-ladyboss-coaching.jpg';
import ladybossVipImage from '@/assets/ladyboss-vip-club.jpg';
import connectionLiteracyImage from '@/assets/connection-literacy-program.jpg';
import instagramGrowthImage from '@/assets/instagram-growth-course.jpg';
import privateCoachingImage from '@/assets/private-coaching-session.jpg';

const Programs = () => {
  const programs = [
    {
      title: 'IQMoney - Income Growth Program',
      description: 'Advanced strategies to dramatically increase your income. Learn multiple income streams, negotiation mastery, and proven tactics to maximize your earning potential as an ambitious entrepreneur.',
      image: iqmoneyImage,
      duration: 'Self-paced',
      participants: '12,000+',
      rating: 5.0,
      features: [
        'Multiple Income Stream Strategies',
        'Advanced Negotiation Mastery',
        'Premium Pricing Psychology',
        'High-Ticket Sales Training',
        'Income Multiplication Framework'
      ],
      price: '$1,997',
      popular: true,
      link: '/iqmoney-income'
    },
    {
      title: 'Money Literacy for LadyBoss',
      description: 'Complete financial education system with 52 video lessons covering budgeting, investing, debt elimination, and wealth building. Designed specifically for ambitious women seeking financial independence.',
      image: moneyLiteracyImage,
      duration: 'Self-paced',
      participants: '60,000+',
      rating: 4.9,
      features: [
        '52 Expert-Led Video Lessons',
        'Financial Confidence Building',
        'Investment Psychology Mastery',
        'Business Building Strategies',
        'Lifetime Access & Community'
      ],
      price: '$997',
      popular: false,
      link: '/iqmoney'
    },
    {
      title: 'Ladyboss VIP Club',
      description: 'Join our most exclusive 12-month VIP coaching program. Weekly group sessions with premium access, advanced strategies, and an elite community of successful women entrepreneurs.',
      image: ladybossVipImage,
      duration: '12 months',
      participants: '500+',
      rating: 5.0,
      features: [
        'Weekly VIP Group Coaching',
        'Exclusive Elite Community Access',
        'Advanced Business Strategies',
        'Priority Support & Resources',
        'Year-Long Transformation Program'
      ],
      price: '$4,997',
      popular: true,
      link: '/ladyboss-vip'
    },
    {
      title: 'Empowered Ladyboss Group Coaching',
      description: 'Join our exclusive 3-month group coaching program for ambitious women entrepreneurs. Weekly sessions focused on leadership, business growth, and building your empire with a supportive community.',
      image: empoweredLadybossImage,
      duration: '3 months',
      participants: '2,500+',
      rating: 4.9,
      features: [
        'Weekly Live Group Coaching',
        'Empowered Leadership Training',
        'Business Strategy & Growth',
        'Supportive Community Network',
        'Accountability & Support System'
      ],
      price: '$997',
      popular: false,
      link: '/empowered-ladyboss'
    },
    {
      title: 'Business Growth Accelerator',
      description: 'Transform your existing business into a profitable empire with our comprehensive coaching program and proven growth frameworks. 3-month semi-private weekly sessions.',
      image: businessCoachingImage,
      duration: '3 months',
      participants: '3,200+',
      rating: 5.0,
      features: [
        'Advanced Business Strategy',
        'Revenue Optimization',
        'Marketing & Sales Mastery',
        'Leadership Development',
        'Semi-Private Weekly Sessions'
      ],
      price: '$4,997',
      popular: false,
      link: '/business-growth-accelerator'
    },
    {
      title: 'Business Startup Accelerator',
      description: 'Launch your business from idea to profit in 3 months. Complete startup program with step-by-step guidance, legal setup, and launch strategy. Semi-private weekly sessions.',
      image: networkingImage,
      duration: '3 months',
      participants: '1,800+',
      rating: 4.9,
      features: [
        'Business Idea Validation',
        'Complete Legal Setup',
        'Brand & Website Creation',
        'Launch Strategy & Marketing',
        'Semi-Private Weekly Sessions'
      ],
      price: '$4,997',
      popular: false,
      link: '/business-startup-accelerator'
    },
    {
      title: 'Instagram Fast Growth Course',
      description: 'Rapidly grow your Instagram following and engagement with proven strategies. 3-month semi-private coaching program teaching content creation, algorithm mastery, monetization tactics, and building an engaged community.',
      image: instagramGrowthImage,
      duration: '3 months',
      participants: '2,800+',
      rating: 5.0,
      features: [
        'Content Strategy & Creation',
        'Algorithm Mastery & Growth Hacks',
        'Engagement & Community Building',
        'Monetization Strategies',
        'Semi-Private Weekly Sessions'
      ],
      price: '$2,997',
      popular: true,
      link: '/instagram-growth'
    },
    {
      title: '1-Hour Private Session with Razie',
      description: 'Get personalized guidance and breakthrough strategies in an exclusive one-on-one coaching session with Razie Ladyboss. Perfect for tackling specific challenges and accelerating your success.',
      image: privateCoachingImage,
      duration: '1 hour',
      participants: '500+',
      rating: 5.0,
      features: [
        'Personalized One-on-One Coaching',
        'Breakthrough Strategy Session',
        'Customized Action Plan',
        'Direct Access to Razie',
        'Follow-up Resources Included'
      ],
      price: '$597',
      popular: false,
      link: '/private-coaching'
    },
    {
      title: 'Connection Literacy for Ladyboss',
      description: 'Master the art of building meaningful relationships and expanding your professional network. Learn proven strategies for networking, making lasting connections, and leveraging relationships to grow your influence and business.',
      image: connectionLiteracyImage,
      duration: '8 weeks',
      participants: '3,500+',
      rating: 4.9,
      features: [
        'Strategic Networking Techniques',
        'Relationship Building Mastery',
        'Social Influence & Persuasion',
        'Professional Connection Strategies',
        'Community Building Skills'
      ],
      price: '$497',
      popular: false,
      link: '/connection-literacy'
    },
    {
      title: 'Courageous Character Course',
      description: 'Master assertiveness & confidence as an immigrant. Build the mindset & communication skills you need to succeed in the U.S.',
      image: courageousCharacterImage,
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
      price: '$97',
      originalPrice: '$497',
      limitedSpots: 'Limited to 100',
      popular: false,
      link: '/ccw'
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
                    <div className="flex flex-col">
                      {program.originalPrice ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lg text-muted-foreground line-through">
                            {program.originalPrice}
                          </span>
                          <span className="text-2xl font-bold gradient-text">
                            {program.price}
                          </span>
                        </div>
                      ) : (
                        <span className="text-2xl font-bold gradient-text">
                          {program.price}
                        </span>
                      )}
                      {program.limitedSpots && (
                        <span className="text-xs text-primary font-semibold">
                          {program.limitedSpots}
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      One-time payment
                    </span>
                  </div>
                  
                  <Button 
                    className="w-full bg-primary hover:bg-primary-dark group-hover:shadow-glow transition-all duration-300"
                    onClick={() => window.location.href = program.link}
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
              onClick={() => window.open('https://wa.me/16265028589', '_blank')}
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