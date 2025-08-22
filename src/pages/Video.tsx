import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Play, Share2, BookOpen } from 'lucide-react';
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
            Master{' '}
            <span className="gradient-text">Assertiveness & Confidence</span>
            {' '}as an Immigrant
          </h1>
          
          <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto px-4">
            Build the mindset & communication skills you need to succeed in the U.S. A comprehensive 
            mastermind program specifically designed for immigrant women ready to lead with confidence.
          </p>
        </div>

        {/* Video Container */}
        <div className="max-w-5xl mx-auto px-2 sm:px-0">
          <Card className="overflow-hidden bg-gradient-card border-border shadow-medium">
            <div className="aspect-video relative">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/FYn1vYW1tP8?rel=0&modestbranding=1"
                title="Assertiveness & Confidence Mastermind - LadyBoss Academy"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="absolute inset-0 w-full h-full rounded-lg"
              ></iframe>
            </div>
          </Card>
        </div>

        {/* Video Info & Actions */}
        <div className="max-w-5xl mx-auto mt-6 sm:mt-8 px-2 sm:px-0">
          <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Video Details */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                  About This Mastermind Program
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Moving to a new country comes with challenges, from language barriers to cultural differences. 
                  If you've ever felt hesitant to speak up, struggled with self-doubt, or found it difficult to 
                  negotiate in business and life, this comprehensive 8-week mastermind program is designed for you.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-sm sm:text-base">What You'll Master in This Program:</h3>
                <ul className="space-y-2 sm:space-y-3 text-muted-foreground text-sm sm:text-base">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span><strong>Overcome Fear & Self-Doubt:</strong> Develop a strong, confident mindset to succeed in any situation</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span><strong>Master Assertive Communication:</strong> Express yourself clearly and persuasively in personal and professional settings</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span><strong>Negotiate for What You Deserve:</strong> Gain the skills to ask for a raise, close deals, and establish boundaries</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span><strong>Build Powerful Connections:</strong> Network and establish authority, even if English isn't your first language</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span><strong>Lead with Confidence:</strong> Step into leadership roles in your business and community</span>
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
                    Join the Mastermind
                  </h3>
                  <div className="text-2xl font-bold text-primary mb-2">$497</div>
                  <p className="text-accent-foreground/80 text-xs sm:text-sm leading-relaxed">
                    Transform your confidence & communication skills with our comprehensive 8-week program.
                  </p>
                  <Button 
                    className="w-full bg-primary hover:bg-primary-dark text-sm sm:text-base"
                    asChild
                  >
                    <Link to="/landing">
                      Join Mastermind Program
                    </Link>
                  </Button>
                </div>
              </Card>

              <Card className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="font-semibold text-sm sm:text-base">Share This Video</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Help other immigrant women discover these powerful strategies
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full text-sm sm:text-base"
                    onClick={() => {
                      navigator.share?.({
                        title: 'Assertiveness & Confidence Mastermind - LadyBoss Academy',
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