import Navigation from '@/components/ui/navigation';
import Footer from '@/components/sections/Footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Star, Clock, Users, BookOpen, GraduationCap, Video, Calendar } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import { usePrograms } from '@/hooks/usePrograms';
import type { Program } from '@/data/programs';

const Programs = () => {
  const { programs, getProgramsByType } = usePrograms();

  const courses = getProgramsByType('course');
  const groupCoaching = getProgramsByType('group-coaching');
  const oneOnOneSessions = getProgramsByType('1o1-session');
  const events = getProgramsByType('event');

  const renderProgramCard = (program: Program) => (
    <Card 
      key={program.slug}
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
            <span className="text-sm text-muted-foreground capitalize">
              {program.paymentType === 'one-time' ? 'One-time' : program.paymentType}
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
  );

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Programs & Courses - Transform Your Business & Life"
        description="Discover our comprehensive programs designed to accelerate your success. From business coaching to personal development, find the perfect program for your goals."
      />
      <Navigation />
      
      <main>
        {/* Hero Section */}
        <section className="py-16 lg:py-24 bg-gradient-hero text-white">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full mb-6">
                <Star size={16} className="mr-2" />
                <span className="text-sm font-medium">
                  Transform Your Life & Business
                </span>
              </div>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Our Programs & Courses
              </h1>
              <p className="text-lg text-white/90 max-w-3xl mx-auto">
                Comprehensive training programs designed to fast-track your success with proven methodologies, 
                expert coaching, and a supportive community of like-minded women.
              </p>
            </div>
          </div>
        </section>

        {/* Courses Section */}
        {courses.length > 0 && (
          <section className="py-16 lg:py-24 bg-background">
            <div className="container mx-auto px-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-3xl md:text-4xl font-bold">
                    Self-Paced Courses
                  </h2>
                  <p className="text-muted-foreground">Learn at your own pace with lifetime access</p>
                </div>
              </div>
              <div className="grid lg:grid-cols-3 gap-8">
                {courses.map(renderProgramCard)}
              </div>
            </div>
          </section>
        )}

        {/* Group Coaching Section */}
        {groupCoaching.length > 0 && (
          <section className="py-16 lg:py-24 bg-muted/30">
            <div className="container mx-auto px-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-3xl md:text-4xl font-bold">
                    Group Coaching Programs
                  </h2>
                  <p className="text-muted-foreground">Join a community of ambitious women with live group sessions</p>
                </div>
              </div>
              <div className="grid lg:grid-cols-3 gap-8">
                {groupCoaching.map(renderProgramCard)}
              </div>
            </div>
          </section>
        )}

        {/* 1-on-1 Sessions Section */}
        {oneOnOneSessions.length > 0 && (
          <section className="py-16 lg:py-24 bg-background">
            <div className="container mx-auto px-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-3xl md:text-4xl font-bold">
                    1-on-1 Coaching Sessions
                  </h2>
                  <p className="text-muted-foreground">Personalized coaching tailored to your specific needs</p>
                </div>
              </div>
              <div className="grid lg:grid-cols-3 gap-8">
                {oneOnOneSessions.map(renderProgramCard)}
              </div>
            </div>
          </section>
        )}

        {/* Events Section */}
        {events.length > 0 && (
          <section className="py-16 lg:py-24 bg-muted/30">
            <div className="container mx-auto px-6">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Calendar className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-3xl md:text-4xl font-bold">
                    Live Events & Workshops
                  </h2>
                  <p className="text-muted-foreground">In-person and virtual events for networking and learning</p>
                </div>
              </div>
              <div className="grid lg:grid-cols-3 gap-8">
                {events.map(renderProgramCard)}
              </div>
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-6">
            <div className="bg-gradient-hero p-8 rounded-2xl text-white text-center">
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
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Programs;
