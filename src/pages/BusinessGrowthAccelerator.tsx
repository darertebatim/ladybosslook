import Navigation from '@/components/ui/navigation';
import Footer from '@/components/sections/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SEOHead } from '@/components/SEOHead';
import { CheckCircle, ArrowRight, Star, Users, Clock, TrendingUp } from 'lucide-react';
import businessGrowthHero from '@/assets/business-coaching-program.jpg';

const BusinessGrowthAccelerator = () => {
  const features = [
    "Advanced Business Strategy Development",
    "Revenue Optimization Techniques", 
    "Marketing & Sales Mastery",
    "Team Building & Leadership Skills",
    "Operations & Systems Optimization",
    "Financial Planning & Investment Strategy",
    "Weekly Live Group Coaching Calls",
    "Private Community Access",
    "1-on-1 Strategy Sessions",
    "Lifetime Access to All Materials"
  ];

  const modules = [
    {
      title: "Strategic Business Planning",
      description: "Develop a comprehensive business plan with clear goals, milestones, and growth strategies."
    },
    {
      title: "Revenue & Sales Optimization", 
      description: "Master advanced sales techniques and revenue optimization strategies to maximize profits."
    },
    {
      title: "Marketing & Brand Building",
      description: "Build a powerful brand presence and implement effective marketing campaigns."
    },
    {
      title: "Leadership & Team Development",
      description: "Develop leadership skills and build high-performing teams that drive results."
    },
    {
      title: "Operations & Systems",
      description: "Create efficient systems and processes that scale with your business growth."
    },
    {
      title: "Financial Mastery",
      description: "Master business finances, investment strategies, and wealth building techniques."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Business Growth Accelerator - Transform Your Business | LadyBoss Academy"
        description="Transform your business with our comprehensive Business Growth Accelerator program. Expert coaching, proven strategies, and community support for ambitious women entrepreneurs."
      />
      
      <Navigation />
      
      <main>
        {/* Hero Section */}
        <section className="pt-24 pb-16 bg-gradient-hero text-white">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full mb-6">
                  <TrendingUp size={16} className="mr-2" />
                  <span className="text-sm font-medium">Business Growth Program</span>
                </div>
                
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                  Business Growth
                  <span className="block text-secondary">Accelerator</span>
                </h1>
                
                <p className="text-xl mb-8 text-white/90">
                  Transform your existing business into a profitable empire with our comprehensive 
                  coaching program, proven growth frameworks, and expert guidance designed specifically 
                  for ambitious women entrepreneurs.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <div className="flex items-center">
                    <Clock size={20} className="mr-2 text-secondary" />
                    <span>12 weeks intensive</span>
                  </div>
                  <div className="flex items-center">
                    <Users size={20} className="mr-2 text-secondary" />
                    <span>3,200+ graduates</span>
                  </div>
                  <div className="flex items-center">
                    <Star size={20} className="mr-2 text-secondary" />
                    <span>5.0 rating</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                    Enroll Now - $1,200
                    <ArrowRight size={20} className="ml-2" />
                  </Button>
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    Learn More
                  </Button>
                </div>
              </div>

              <div className="relative">
                <img
                  src={businessGrowthHero}
                  alt="Business Growth Accelerator Program"
                  className="rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* What's Included Section */}
        <section className="py-16 lg:py-24">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                What's Included in Your
                <span className="gradient-text block">Growth Journey</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Everything you need to scale your business to the next level with proven strategies and expert support.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center p-4 bg-muted/50 rounded-lg">
                  <CheckCircle size={20} className="text-primary mr-3 flex-shrink-0" />
                  <span className="font-medium">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Course Modules Section */}
        <section className="py-16 lg:py-24 bg-muted/50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
                Program Modules
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Six comprehensive modules designed to transform every aspect of your business.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {modules.map((module, index) => (
                <Card key={index} className="p-6 bg-background border-border hover:shadow-medium transition-all duration-300">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {index + 1}
                    </div>
                    <h3 className="font-display font-bold text-lg">{module.title}</h3>
                  </div>
                  <p className="text-muted-foreground">{module.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24 bg-gradient-hero text-white">
          <div className="container mx-auto px-6 text-center">
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">
              Ready to Scale Your Business?
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto text-white/90">
              Join thousands of successful women who have transformed their businesses with our proven growth strategies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                Enroll Now - $1,200
                <ArrowRight size={20} className="ml-2" />
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Book Free Consultation
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default BusinessGrowthAccelerator;