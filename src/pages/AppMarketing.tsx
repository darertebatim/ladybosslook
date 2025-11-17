import { BookOpen, Headphones, Users, Award, Heart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/SEOHead";

const AppMarketing = () => {
  const features = [
    {
      icon: BookOpen,
      title: "Free Courses",
      description: "Enroll in transformative courses at no cost—personal and professional development content for women"
    },
    {
      icon: Headphones,
      title: "Audio Content",
      description: "Listen to empowering audiobooks and podcasts anywhere with background playback support"
    },
    {
      icon: Users,
      title: "Instant Access",
      description: "Sign up and start learning immediately—no payment required, no subscriptions"
    },
    {
      icon: Award,
      title: "Proven Results",
      description: "Join thousands of women who have transformed their lives through our programs"
    },
    {
      icon: Heart,
      title: "Self-Care Focus",
      description: "Prioritize your growth with content that nurtures your mind and spirit"
    },
    {
      icon: Sparkles,
      title: "Continuous Growth",
      description: "New content added regularly to support your ongoing development"
    }
  ];

  return (
    <>
      <SEOHead 
        title="Ladybosslook Academy - Empower Your Journey"
        description="Transform your life with expert-led courses in personal development, leadership, and confidence building designed for women."
      />
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="bg-gradient-to-b from-primary/10 to-background">
          <div className="container mx-auto px-4 py-16 md:py-24">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
                Free Educational Courses for Women
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8">
                Access free empowerment courses, audiobooks, and personal development content designed for your growth
              </p>
              <Button size="lg" asChild>
                <a href="https://ladybosslook.com">
                  Get Started Today
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
              Everything You Need to Thrive
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <feature.icon className="w-12 h-12 text-primary mb-4" />
                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* What You'll Learn */}
        <div className="bg-muted/50 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-12">
                What You'll Learn
              </h2>
              
              <div className="space-y-6">
                <div className="bg-background p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Personal Development</h3>
                  <p className="text-muted-foreground">
                    Build confidence, develop leadership skills, and discover your authentic voice
                  </p>
                </div>

                <div className="bg-background p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Communication Mastery</h3>
                  <p className="text-muted-foreground">
                    Learn assertive communication techniques and build meaningful connections
                  </p>
                </div>

                <div className="bg-background p-6 rounded-lg">
                  <h3 className="text-xl font-semibold mb-2">Empowerment & Growth</h3>
                  <p className="text-muted-foreground">
                    Transform limiting beliefs and unlock your full potential
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Start Your Free Learning Journey Today
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join women worldwide accessing free educational content for personal growth and empowerment
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <a href="https://ladybosslook.com">
                  Download the App
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="https://ladybosslook.com/about">
                  Learn More
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border py-8">
          <div className="container mx-auto px-4 text-center text-muted-foreground">
            <p>&copy; 2025 Ladybosslook Academy. All rights reserved.</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AppMarketing;
