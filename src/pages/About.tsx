import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Users, TrendingUp, Award, Instagram, Quote } from 'lucide-react';
import razie1 from "@/assets/razie-1.jpg";
import razie2 from "@/assets/razie-2.jpg";
import razie3 from "@/assets/razie-3.jpg";
import razie4 from "@/assets/razie-4.jpg";
import razie5 from "@/assets/razie-5.jpg";
import razie6 from "@/assets/razie-6.jpg";
import testimonialAvatar from "@/assets/testimonial-avatar.jpg";

export default function About() {
  const achievements = [
    {
      icon: <Instagram className="h-8 w-8" />,
      number: "2.7M",
      label: "Instagram Followers",
      color: "text-pink-600"
    },
    {
      icon: <Users className="h-8 w-8" />,
      number: "264K+",
      label: "Community Members",
      color: "text-blue-600"
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      number: "120K+",
      label: "Women Trained",
      color: "text-green-600"
    },
    {
      icon: <Award className="h-8 w-8" />,
      number: "5K+",
      label: "Success Stories",
      color: "text-purple-600"
    }
  ];

  const testimonials = [
    {
      name: "Dr. Tina Ghaboulian",
      role: "Dentist and Owner of a Dental Clinic",
      content: "I joined the Academy in Spring 2024 and participated in the financial literacy course. Interestingly, in the past 15-20 years, I've attended various courses and classes in Canada, mostly related to business management, but none of them addressed financial literacy in the practical way that Mrs. Mirzaei teaches. After that, I attended the IQBusiness classes, and although I still have a long way to go, I can clearly see the impact of changing my mindset and learning practical strategies on my business. Another valuable takeaway from these classes was the change in my perspective on the business world. I used to think that focusing on the business aspect of my work might diminish its quality. But now, I am confident that I can expand my work and still remain a good dentist without compromising the quality of treatments I offer. The mindset shift I achieved, thanks to Mr. Lotfi's teachings, has had a positive impact on various aspects of my life."
    },
    {
      name: "Maliheh Shafiei", 
      role: "Founder of a Kids' Products Online Shop",
      content: "I am so happy to have met you on this journey. What fascinates me is that when you enter this Academy, you truly feel like you've joined a new family that supports you. The weekly online programs are genuinely beyond what you offer as services, and your sense of responsibility in not letting us go and helping us achieve our goals is invaluable to me. I deeply appreciate it and hope this continues."
    },
    {
      name: "Nadia Ghaemi",
      role: "Specialist in Bulk Imports", 
      content: "I am Nadia, and I've been familiar with Ladyboss since 2020. I want to thank you for all your efforts and hard work in educating and helping me grow. You helped me recognize my strengths better and approach professional and personal challenges with greater confidence through your wisdom and attention to detail. Your valuable guidance enabled me to advance in my business and pursue the path to success with more motivation."
    },
    {
      name: "Niloufar",
      role: "Accounting and Taxation Instructor",
      content: "I wanted to thank you for all your valuable teachings and guidance and let you know about the profound impact these teachings have had on my life and business. My business is in the field of accounting and tax services. Before meeting you and Mrs. Mirzaei, I always wished for an active and stable business, but I often lost my way halfway and felt the path I had chosen was too complicated and challenging. But you were like a light in the darkness for me. Your education and support gave me hope and motivation to continue with greater determination and clarity. One of the aspects that distinguishes your courses from others I've taken is how you teach with the simplest and most fundamental words, so much so that they never leave my mind. Your teachings are more than just knowledge; their impact is clearly evident in my personality and business. Since I started your lessons, I've been able to deliver my services more professionally, help more clients, and even achieve the income level I always dreamed of. These changes weren't just in my business; they positively influenced my personality and life too. Now, I can manage challenges with more confidence and pursue my goals with greater resolve."
    },
    {
      name: "Leila", 
      role: "Hair Color Specialist, Setting Up a Beauty Salon",
      content: "I'm Leila, and I've known Mrs. Mirzaei through Instagram for several years, having participated in her school and classes, as well as those of her husband, Mr. Lotfi. Both of them are remarkable and valuable instructors with keen attention to detail. Whenever they talk about or analyze a topic, I realize it's something I've experienced before. These seemingly small issues have always been obstacles to achieving my goals. These two great individuals are guides for every season of life, helping in all aspects of life, especially the financial side."
    },
    {
      name: "Laleh",
      role: "Massage Therapist, Setting Up a Massage and Spa Salon",
      content: "I just wanted to take a moment to thank you both for your amazing courses! You truly transformed my perspective. I have often struggled with training courses that emphasize a money-making mindset, as they tended to feel like mere fancy speeches. However, this course was truly helpful. Your guidance on reflecting on our attitudes toward money, learning how to build up our business step by step, and where to invest wisely was incredibly valuable. I really appreciate how you emphasized the importance of mindset alongside actions; it has greatly boosted my motivation and confidence."
    }
  ];

  return (
    <>
      <SEOHead 
        title="About Us - LadyBoss Academy | Empowering Women to Success"
        description="Learn about LadyBoss Academy's journey from a small consulting agency to empowering 264,000+ women worldwide. Discover our mission to help women achieve financial independence and business success."
        image={razie1}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
        {/* Hero Section */}
        <section className="relative pt-20 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-pink-600/5 to-blue-600/5"></div>
          <div className="container mx-auto px-4 relative">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-6 text-sm font-semibold px-6 py-2 bg-purple-100 text-purple-800 border-purple-200">
                💪 OUR STORY
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-8 bg-gradient-to-r from-slate-900 via-purple-900 to-pink-900 bg-clip-text text-transparent leading-tight">
                LadyBoss Means Being Independent,<br />
                Powerful, and Successful
              </h1>
              <p className="text-xl md:text-2xl font-medium text-slate-700 mb-8 max-w-4xl mx-auto leading-relaxed">
                A Ladyboss owns her identity, takes charge of her life, and holds the reins of her destiny.
              </p>
            </div>

            {/* Hero Images Grid */}
            <div className="grid md:grid-cols-6 gap-4 max-w-7xl mx-auto mb-16">
              <div className="md:col-span-2 aspect-[3/4] overflow-hidden rounded-2xl shadow-xl">
                <img 
                  src={razie1} 
                  alt="Razie - LadyBoss Academy Founder"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="md:col-span-2 aspect-[3/4] overflow-hidden rounded-2xl shadow-xl">
                <img 
                  src={razie2} 
                  alt="Razie - Empowering Women Entrepreneurs"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="md:col-span-2 aspect-[3/4] overflow-hidden rounded-2xl shadow-xl">
                <img 
                  src={razie3} 
                  alt="Razie - LadyBoss Academy Leader"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="md:col-span-3 aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
                <img 
                  src={razie4} 
                  alt="Razie - Business Coach and Mentor"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="md:col-span-3 aspect-[4/3] overflow-hidden rounded-2xl shadow-xl">
                <img 
                  src={razie5} 
                  alt="Razie - Women's Empowerment Leader"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            </div>

            {/* Additional Founder Spotlight */}
            <div className="max-w-4xl mx-auto mb-16">
              <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-8 lg:p-12">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-4">
                      Meet Razie - Your Success Mentor
                    </h3>
                    <p className="text-lg text-slate-700 leading-relaxed mb-6">
                      From a small consulting agency to empowering over 264,000 women worldwide, 
                      Razie's journey is a testament to the power of determination, vision, and 
                      the LadyBoss mindset.
                    </p>
                    <p className="text-md text-slate-600 leading-relaxed">
                      "Every woman has the potential to be a LadyBoss. My mission is to unlock 
                      that potential and guide you toward financial independence and success."
                    </p>
                  </div>
                  <div className="aspect-[3/4] overflow-hidden rounded-2xl shadow-xl">
                    <img 
                      src={razie6} 
                      alt="Razie - Inspiring Success Stories"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Achievement Stats */}
            <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
              {achievements.map((achievement, index) => (
                <Card key={index} className="text-center border-2 border-slate-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-6">
                    <div className={`${achievement.color} mx-auto mb-3`}>
                      {achievement.icon}
                    </div>
                    <div className="text-2xl font-bold text-slate-900 mb-1">{achievement.number}</div>
                    <div className="text-sm text-slate-600">{achievement.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* About LadyBoss Academy */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-8">LadyBoss Academy</h2>
              <p className="text-lg text-slate-700 leading-relaxed mb-12">
                At <strong>Ladyboss Academy</strong>, we've dedicated our energy and resources to helping more women embrace the Ladyboss lifestyle. 
                We're thrilled that you've joined our community of 264,000 strong and growing.
              </p>
            </div>
          </div>
        </section>

        {/* Our Journey */}
        <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12 text-center">Our Journey to Success</h2>
              
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <Card className="border-l-4 border-purple-600 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg text-slate-900 mb-3">Early 2021 - The Launch</h3>
                      <p className="text-slate-700 leading-relaxed">
                        We launched Ladyboss Academy at the start of 2021. Within the first year, our Instagram page grew to 1.5 million followers, 
                        our Ladyboss app attracted 250,000 active users, and over 120,000 women participated in our training courses.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-pink-600 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg text-slate-900 mb-3">The Foundation Years</h3>
                      <p className="text-slate-700 leading-relaxed">
                        We started as a small marketing consulting agency focused on bridal businesses. Gradually, we expanded our services to include 
                        digital marketing, web design, and advertising, while also expanding our client base to serve women-run businesses.
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-blue-600 bg-white/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg text-slate-900 mb-3">Evolution & Growth</h3>
                      <p className="text-slate-700 leading-relaxed">
                        We hosted seminars to teach women the latest business growth techniques, and with the onset of the pandemic, 
                        we transitioned to online training. We introduced various educational programs designed for Ladybosses.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-8 rounded-3xl text-white">
                  <h3 className="text-2xl font-bold mb-6">Today's Impact</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <span>120,000+ women trained successfully</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <span>264,000+ community members worldwide</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <span>Proven training programs for every level</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      <span>Global community of successful women</span>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <Button 
                      variant="secondary"
                      size="lg"
                      className="bg-white text-purple-600 hover:bg-gray-100"
                      onClick={() => window.open('http://instagram.com/razie.ladyboss', '_blank')}
                    >
                      <Instagram className="mr-2 h-5 w-5" />
                      Follow Our Journey
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Success Stories from Our Community</h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Real women, real transformations. Here's what our LadyBoss community members have to say about their journeys.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border-2 border-slate-200 hover:border-purple-300 transition-all duration-300 bg-gradient-to-br from-white to-purple-50/30">
                  <CardContent className="p-8">
                    <div className="flex items-start space-x-4 mb-6">
                      <img 
                        src={testimonialAvatar} 
                        alt={`${testimonial.name} testimonial`}
                        className="w-16 h-16 rounded-full object-cover border-2 border-purple-200"
                      />
                      <div>
                        <h3 className="font-bold text-lg text-slate-900">{testimonial.name}</h3>
                        <p className="text-sm text-purple-600 font-medium">{testimonial.role}</p>
                      </div>
                      <Quote className="h-6 w-6 text-purple-400 ml-auto flex-shrink-0" />
                    </div>
                    <p className="text-slate-700 leading-relaxed italic">
                      "{testimonial.content}"
                    </p>
                    <div className="flex items-center mt-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Join Our Community of Successful Women?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto">
              Don't just dream about success – make it happen. Join 264,000+ women who are already transforming their lives 
              and building their financial independence with LadyBoss Academy.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button 
                size="lg"
                className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 text-lg font-bold"
                onClick={() => window.location.href = '/iqmoney'}
              >
                Start Your Journey
              </Button>
              <Button 
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white hover:text-purple-600 px-8 py-4 text-lg font-bold"
                onClick={() => window.open('http://instagram.com/razie.ladyboss', '_blank')}
              >
                <Instagram className="mr-2 h-5 w-5" />
                Follow Us
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}