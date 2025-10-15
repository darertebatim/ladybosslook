import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, Star, Clock, Users } from 'lucide-react';
import { usePrograms } from '@/hooks/usePrograms';
import { Link } from 'react-router-dom';

const Programs = () => {
  const { programs } = usePrograms();
  
  // Get only popular programs
  const popularPrograms = programs.filter(p => p.popular);

  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-4">
            <Star size={16} className="mr-2 text-primary" />
            <span className="text-sm font-medium text-primary">Most Popular Programs</span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Featured Programs
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Join thousands of successful women who transformed their lives with our most popular programs
          </p>
        </div>

        {/* Popular Programs Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {popularPrograms.map((program, index) => (
            <Card 
              key={index}
              className="group relative overflow-hidden bg-gradient-card border-border hover:shadow-medium transition-all duration-300 hover:-translate-y-2 ring-2 ring-primary shadow-glow"
            >
              <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold z-10">
                Most Popular
              </div>

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
                  
                  <p className="text-muted-foreground leading-relaxed line-clamp-3">
                    {program.description}
                  </p>
                </div>

                {/* Features List */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">What's Included:</h4>
                  <ul className="space-y-2">
                    {program.features.slice(0, 3).map((feature, featureIndex) => (
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
          ))}
        </div>

        {/* See All Programs Button */}
        <div className="text-center">
          <Link to="/programs">
            <Button 
              size="lg"
              variant="outline"
              className="bg-gradient-subtle hover:bg-gradient-card border-2"
            >
              View All Programs
              <ArrowRight size={20} className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Programs;