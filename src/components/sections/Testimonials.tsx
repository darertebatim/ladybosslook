import { Card } from '@/components/ui/card';
import { Star, Quote } from 'lucide-react';
import testimonialAvatar from '@/assets/testimonial-avatar.jpg';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Dr. Tina Ghaboulian',
      title: 'Dentist and Owner of a Dental Clinic',
      image: testimonialAvatar,
      quote: 'I joined the Academy in Spring 2024 and participated in the financial literacy course. In the past 15-20 years, I\'ve attended various courses, but none addressed financial literacy in the practical way that Mrs. Mirzaei teaches. The mindset shift I achieved has had a positive impact on various aspects of my life.',
      revenue: 'Business Growth',
      rating: 5
    },
    {
      name: 'Maliheh Shafiei',
      title: 'Founder of a Kids\' Products Online Shop',
      image: testimonialAvatar,
      quote: 'When you enter this Academy, you truly feel like you\'ve joined a new family that supports you. The weekly online programs are genuinely beyond what you offer as services, and your sense of responsibility in helping us achieve our goals is invaluable.',
      revenue: 'Family Support',
      rating: 5
    },
    {
      name: 'Niloufar',
      title: 'Accounting and Taxation Instructor',
      image: testimonialAvatar,
      quote: 'Since I started your lessons, I\'ve been able to deliver my services more professionally, help more clients, and even achieve the income level I always dreamed of. These changes weren\'t just in my business; they positively influenced my personality and life too.',
      revenue: 'Dream Income Achieved',
      rating: 5
    },
    {
      name: 'Nadia Ghaemi',
      title: 'Specialist in Bulk Imports',
      image: testimonialAvatar,
      quote: 'Your valuable guidance enabled me to advance in my business and pursue the path to success with more motivation. You helped me recognize my strengths better and approach challenges with greater confidence.',
      revenue: 'Business Advancement',
      rating: 5
    },
    {
      name: 'Leila',
      title: 'Hair Color Specialist, Setting Up a Beauty Salon',
      image: testimonialAvatar,
      quote: 'Both of them are remarkable instructors with keen attention to detail. These two great individuals are guides for every season of life, helping in all aspects of life, especially the financial side.',
      revenue: 'Life Transformation',
      rating: 5
    },
    {
      name: 'Laleh',
      title: 'Massage Therapist, Setting Up a Massage and Spa Salon',
      image: testimonialAvatar,
      quote: 'This course was truly helpful. Your guidance on reflecting on our attitudes toward money, learning how to build up our business step by step, and where to invest wisely was incredibly valuable. It has greatly boosted my motivation and confidence.',
      revenue: 'Confidence Boost',
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
        <div className="grid lg:grid-cols-3 xl:grid-cols-3 gap-8 max-h-[800px] overflow-hidden">
          {testimonials.slice(0, 6).map((testimonial, index) => (
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