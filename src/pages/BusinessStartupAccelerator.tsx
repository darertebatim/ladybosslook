import Navigation from '@/components/ui/navigation';
import Footer from '@/components/sections/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SEOHead } from '@/components/SEOHead';
import { CheckCircle, ArrowRight, Star, Users, Clock, Rocket } from 'lucide-react';
import businessStartupHero from '@/assets/networking-program.jpg';

const BusinessStartupAccelerator = () => {
  const features = [
    "Business Idea Validation & Market Research",
    "Complete Business Plan Development", 
    "Legal Structure & Registration Guidance",
    "Brand Development & Logo Design",
    "Website & Online Presence Setup",
    "Marketing Strategy & Launch Plan",
    "Financial Planning & Funding Options",
    "Weekly Live Mentorship Calls",
    "Private Startup Community Access",
    "90-Day Launch Roadmap"
  ];

  const modules = [
    {
      title: "Idea to Business Concept",
      description: "Transform your business idea into a viable concept with market validation and competitive analysis."
    },
    {
      title: "Business Foundation", 
      description: "Set up your business legally, choose the right structure, and handle all registration requirements."
    },
    {
      title: "Brand & Identity Creation",
      description: "Develop a compelling brand identity, logo, and messaging that resonates with your target audience."
    },
    {
      title: "Digital Presence Setup",
      description: "Create your website, social media presence, and online marketing foundations."
    },
    {
      title: "Launch Strategy",
      description: "Develop and execute a comprehensive launch strategy to get your first customers."
    },
    {
      title: "Growth & Scaling",
      description: "Learn the fundamentals of growing and scaling your new business for long-term success."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Business Startup Accelerator - Launch Your Business | LadyBoss Academy"
        description="Launch your business with confidence using our comprehensive Business Startup Accelerator. From idea to launch in 90 days with expert guidance and support."
      />
      
      <Navigation />
      
      <main>
        {/* Hero Section */}
        <section className="pt-24 pb-16 bg-gradient-hero text-white">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full mb-6">
                  <Rocket size={16} className="mr-2" />
                  <span className="text-sm font-medium">Business Startup Program</span>
                </div>
                
                <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                  Business Startup
                  <span className="block text-secondary">Accelerator</span>
                </h1>
                
                <p className="text-xl mb-8 text-white/90">
                  Turn your business idea into reality with our comprehensive startup accelerator program. 
                  Get expert guidance, proven frameworks, and step-by-step support to launch your business 
                  successfully in just 90 days.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                  <div className="flex items-center">
                    <Clock size={20} className="mr-2 text-secondary" />
                    <span>90-day program</span>
                  </div>
                  <div className="flex items-center">
                    <Users size={20} className="mr-2 text-secondary" />
                    <span>1,800+ launched</span>
                  </div>
                  <div className="flex items-center">
                    <Star size={20} className="mr-2 text-secondary" />
                    <span>4.9 rating</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                    Start Your Business - $4,990
                    <ArrowRight size={20} className="ml-2" />
                  </Button>
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    Learn More
                  </Button>
                </div>
              </div>

              <div className="relative">
                <img
                  src={businessStartupHero}
                  alt="Business Startup Accelerator Program"
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
                Everything You Need to
                <span className="gradient-text block">Launch Successfully</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                From idea validation to your first sale, we provide all the tools, guidance, and support you need.
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
                Your 90-Day Launch Journey
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Six carefully designed modules that take you from idea to profitable business.
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
              Ready to Launch Your Business?
            </h2>
            <p className="text-xl mb-8 max-w-3xl mx-auto text-white/90">
              Join hundreds of successful women entrepreneurs who started their journey with our proven startup system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
                Start Your Business - $4,990
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

export default BusinessStartupAccelerator;