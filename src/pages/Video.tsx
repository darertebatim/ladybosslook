import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Play, Share2, BookOpen, ChevronDown, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Video = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              className="flex items-center space-x-1 sm:space-x-2 text-muted-foreground hover:text-primary transition-smooth"
            >
              <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base">Back</span>
            </Link>
            
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm">LB</span>
              </div>
              <span className="font-display text-base sm:text-lg font-bold gradient-text hidden xs:block">
                LadyBoss Academy
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Page Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center px-3 sm:px-4 py-2 bg-primary/10 rounded-full mb-4 sm:mb-6">
            <Play size={14} className="sm:w-4 sm:h-4 mr-2 text-primary" />
            <span className="text-xs sm:text-sm font-medium text-primary">
              Featured Content
            </span>
          </div>
          
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 px-2">
            Build Your{' '}
            <span className="gradient-text">Courageous Character</span>
          </h1>
          
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto px-4">
            A powerful 30-minute course designed specifically for Persian immigrant women ready to 
            embrace their inner strength and become confident ladyboss leaders in their new homeland.
          </p>
        </div>

        {/* Arrow pointing to video */}
        <div className="flex justify-center mb-4">
          <div className="animate-bounce">
            <ChevronDown size={32} className="text-primary" />
          </div>
        </div>

        {/* Video Container */}
        <div className="max-w-5xl mx-auto px-2 sm:px-0" id="video-focus">
          <Card className="overflow-hidden bg-gradient-card border-border shadow-medium">
            <div className="aspect-video relative">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/0wT0D8dJin8?rel=0&modestbranding=1"
                title="Courageous Character Course - LadyBoss Academy"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="absolute inset-0 w-full h-full rounded-lg"
              ></iframe>
            </div>
          </Card>
        </div>

        {/* WhatsApp Section */}
        <div className="max-w-5xl mx-auto mt-6 px-2 sm:px-0">
          <div className="text-center">
            <p className="text-lg font-medium text-foreground mb-4" dir="rtl">
              برای گرفتن هدیه، اسم رمز را به واتسپ پایین بفرستید
            </p>
            <Button 
              onClick={() => window.open('https://wa.me/19495723730?text=orat', '_blank')}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
              size="lg"
            >
              <MessageCircle size={20} className="mr-2" />
              Send "orat" to WhatsApp
            </Button>
          </div>
        </div>

        {/* Video Info & Actions */}
        <div className="max-w-5xl mx-auto mt-6 sm:mt-8 px-2 sm:px-0">
          <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Video Details */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                  About This 30-Minute Course
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  This transformative course is specially crafted for Persian women who have courageously 
                  immigrated and are ready to step into their power. Learn how to overcome cultural barriers, 
                  build unshakeable confidence, and develop the courageous character needed to thrive as 
                  a successful ladyboss in your new environment.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-sm sm:text-base">What You'll Master in 30 Minutes:</h3>
                <ul className="space-y-2 sm:space-y-3 text-muted-foreground text-sm sm:text-base">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span>How to transform immigrant challenges into your greatest strengths as a leader</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span>The Persian resilience framework for building unshakeable confidence</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span>Navigating cultural bridges while staying true to your authentic self</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span>Courageous communication techniques for commanding respect in any room</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Action Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              <Card className="p-4 sm:p-6 bg-gradient-accent">
                <div className="text-center space-y-3 sm:space-y-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                    <BookOpen size={20} className="sm:w-6 sm:h-6 text-accent-foreground" />
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-accent-foreground">
                    Build Your Courage
                  </h3>
                  <p className="text-accent-foreground/80 text-xs sm:text-sm leading-relaxed">
                    Join our sisterhood of courageous Persian ladybosses and unlock your full potential.
                  </p>
                  <Button 
                    className="w-full bg-primary hover:bg-primary-dark text-sm sm:text-base"
                    asChild
                  >
                    <Link to="/#community">
                      Join LadyBoss Academy
                    </Link>
                  </Button>
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="font-semibold text-sm sm:text-base">Share This Video</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Help other women discover these powerful strategies
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full text-sm sm:text-base"
                    onClick={() => {
                      navigator.share?.({
                        title: 'Courageous Character Course - LadyBoss Academy',
                        url: window.location.href
                      }) || navigator.clipboard.writeText(window.location.href);
                    }}
                  >
                    <Share2 size={14} className="sm:w-4 sm:h-4 mr-2" />
                    Share Video
                  </Button>
                </div>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <Card className="p-3 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold gradient-text mb-1">264K+</div>
                  <div className="text-xs text-muted-foreground">Community</div>
                </Card>
                <Card className="p-3 sm:p-4 text-center">
                  <div className="text-xl sm:text-2xl font-bold gradient-text mb-1">98%</div>
                  <div className="text-xs text-muted-foreground">Success Rate</div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Related Content */}
        <div className="max-w-5xl mx-auto mt-12 sm:mt-16 px-2 sm:px-0">
          <h3 className="font-display text-xl sm:text-2xl font-bold text-center mb-6 sm:mb-8">
            Continue Your Journey
          </h3>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            <Card className="p-4 sm:p-6 group hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
              <div className="text-center space-y-3 sm:space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                  <BookOpen size={20} className="sm:w-6 sm:h-6 text-primary" />
                </div>
                <h4 className="font-semibold text-sm sm:text-base">Explore Programs</h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Discover our comprehensive business growth programs
                </p>
                <Button variant="ghost" asChild className="w-full text-sm">
                  <Link to="/#programs">View Programs</Link>
                </Button>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 group hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
              <div className="text-center space-y-3 sm:space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-success/20 transition-colors">
                  <Play size={20} className="sm:w-6 sm:h-6 text-success" />
                </div>
                <h4 className="font-semibold text-sm sm:text-base">Success Stories</h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Read inspiring transformations from our community
                </p>
                <Button variant="ghost" asChild className="w-full text-sm">
                  <Link to="/#stories">Read Stories</Link>
                </Button>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 group hover:shadow-medium transition-all duration-300 hover:-translate-y-1 sm:col-span-2 lg:col-span-1">
              <div className="text-center space-y-3 sm:space-y-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-secondary/20 transition-colors">
                  <Share2 size={20} className="sm:w-6 sm:h-6 text-secondary-foreground" />
                </div>
                <h4 className="font-semibold text-sm sm:text-base">Join Community</h4>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Connect with like-minded women entrepreneurs
                </p>
                <Button variant="ghost" asChild className="w-full text-sm">
                  <Link to="/#community">Join Now</Link>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Video;