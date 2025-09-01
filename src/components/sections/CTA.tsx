import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, CheckCircle, Users, Clock } from 'lucide-react';

const CTA = () => {
  const benefits = [
    'Complete self-confidence transformation program',
    'Step-by-step confidence building exercises',
    'Personal empowerment tools and techniques',
    'Lifetime access to course materials',
    '30-day money-back guarantee'
  ];

  return (
    <section id="community" className="py-16 lg:py-24 bg-gradient-hero text-white overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-dark to-secondary opacity-90"></div>
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Header */}
          <div className="mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-white/20 rounded-full mb-6">
              <Users size={16} className="mr-2" />
              <span className="text-sm font-medium">
                Join 264,000+ Successful Women
              </span>
            </div>
            
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
              Ready to Unlock Your Courageous Character?
            </h2>
            
            <p className="text-xl text-white/90 leading-relaxed max-w-3xl mx-auto">
              Transform your self-doubt into unshakeable confidence. Join the Courageous Character Course 
              and discover the fearless leader within you.
            </p>
          </div>

          {/* Main CTA Card */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 p-8 md:p-12 mb-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Left: Benefits */}
              <div className="text-left">
                <h3 className="font-display text-2xl font-bold mb-6 text-white">
                  What You Get When You Join:
                </h3>
                <ul className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle size={20} className="text-secondary mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-white/90">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right: CTA */}
              <div className="text-center md:text-left space-y-6">
                <div className="space-y-2">
                  <div className="text-4xl font-bold font-display text-secondary">
                    $197
                  </div>
                  <div className="text-white/70 line-through text-lg">
                    Regular Price: $497
                  </div>
                  <div className="text-secondary font-semibold">
                    Limited Time: 60% OFF
                  </div>
                </div>

                <Button 
                  size="lg"
                  className="w-full bg-secondary hover:bg-secondary-dark text-secondary-foreground font-semibold shadow-bold hover:shadow-glow transition-all duration-300 group"
                  onClick={() => window.location.href = '/courageous-workshop'}
                >
                  Join Courageous Character Course
                  <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>

                <div className="flex items-center justify-center space-x-4 text-sm text-white/70">
                  <div className="flex items-center">
                    <Clock size={16} className="mr-1" />
                    Instant Access
                  </div>
                  <div>•</div>
                  <div>30-Day Guarantee</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Urgency Elements */}
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="text-2xl font-bold font-display text-secondary mb-2">
                48 Hours
              </div>
              <div className="text-white/80 text-sm">
                Limited Time Offer Ends
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="text-2xl font-bold font-display text-secondary mb-2">
                50 Spots
              </div>
              <div className="text-white/80 text-sm">
                Remaining This Month
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="text-2xl font-bold font-display text-secondary mb-2">
                100%
              </div>
              <div className="text-white/80 text-sm">
                Money-Back Guarantee
              </div>
            </div>
          </div>

          {/* Final Message */}
          <div className="mt-12 text-center">
            <p className="text-white/90 text-lg max-w-2xl mx-auto">
              <span className="font-semibold">Remember:</span> The best investment you can make 
              is in yourself. Your future self will thank you for taking action today.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;