import { Card } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';
import testimonial1 from '@/assets/testimonial-1.jpg';
import testimonial2 from '@/assets/testimonial-2.jpg';
import testimonial3 from '@/assets/testimonial-3.jpg';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Sarah Martinez',
      title: 'CEO, TechFlow Solutions',
      image: testimonial1,
      quote: 'The Business Growth Accelerator completely transformed my approach to entrepreneurship. I went from struggling freelancer to running a 7-figure agency in just 18 months. The support and strategies are unmatched.',
      revenue: '+420% Revenue Growth',
      rating: 5
    },
    {
      name: 'Jessica Chen',
      title: 'Founder, Bloom Wellness Co.',
      image: testimonial2,
      quote: 'LadyBoss Academy gave me the confidence and financial literacy I needed to scale my wellness business. The networking opportunities alone have been worth the investment - I\'ve formed partnerships that changed my life.',
      revenue: '+280% Client Base',
      rating: 5
    },
    {
      name: 'Maria Rodriguez',
      title: 'Investment Strategist & Author',
      image: testimonial3,
      quote: 'The Money Literacy program opened my eyes to investment strategies I never knew existed. I\'ve built multiple passive income streams and achieved financial independence faster than I ever imagined possible.',
      revenue: '$500K+ Portfolio',
      rating: 5
    }
  ];

  return (
    <section id="stories" className="py-16 lg:py-24">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-success/10 rounded-full mb-6">
            <Star size={16} className="mr-2 text-success" />
            <span className="text-sm font-medium text-success">
              Success Stories
            </span>
          </div>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Real Women,{' '}
            <span className="gradient-text">Real Results</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Don't just take our word for it. Here's what some of our incredible LadyBoss 
            community members have to say about their transformational journeys.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index}
              className="group p-8 bg-gradient-card border-border hover:shadow-medium transition-all duration-300 hover:-translate-y-2 relative"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
                <Quote size={48} className="text-primary" />
              </div>

              <div className="space-y-6">
                {/* Rating */}
                <div className="flex items-center space-x-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} className="text-secondary fill-secondary" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-foreground leading-relaxed relative z-10">
                  "{testimonial.quote}"
                </blockquote>

                {/* Revenue Highlight */}
                <div className="inline-flex items-center px-3 py-1 bg-success/10 rounded-full">
                  <span className="text-sm font-semibold text-success">
                    {testimonial.revenue}
                  </span>
                </div>

                {/* Author */}
                <div className="flex items-center space-x-4 pt-4 border-t border-border">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-foreground">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.title}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Overall Stats */}
        <div className="mt-16 bg-gradient-accent p-8 rounded-2xl">
          <div className="text-center mb-8">
            <h3 className="font-display text-2xl md:text-3xl font-bold text-accent-foreground mb-4">
              Join Thousands of Successful Women
            </h3>
            <p className="text-accent-foreground/80">
              Our community results speak for themselves
            </p>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold font-display text-accent-foreground mb-2">
                98%
              </div>
              <div className="text-sm text-accent-foreground/70">
                Report Increased Confidence
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold font-display text-accent-foreground mb-2">
                347%
              </div>
              <div className="text-sm text-accent-foreground/70">
                Average Revenue Growth
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold font-display text-accent-foreground mb-2">
                $2.3M
              </div>
              <div className="text-sm text-accent-foreground/70">
                Combined Wealth Created
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold font-display text-accent-foreground mb-2">
                5,000+
              </div>
              <div className="text-sm text-accent-foreground/70">
                Lives Transformed
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;