import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Play, Share2, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const Video = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-muted-foreground hover:text-primary transition-smooth"
            >
              <ArrowLeft size={20} />
              <span>Back to Home</span>
            </Link>
            
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LB</span>
              </div>
              <span className="font-display text-lg font-bold gradient-text">
                LadyBoss Academy
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 rounded-full mb-6">
            <Play size={16} className="mr-2 text-primary" />
            <span className="text-sm font-medium text-primary">
              Featured Content
            </span>
          </div>
          
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Transform Your{' '}
            <span className="gradient-text">Entrepreneurial Journey</span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Watch this exclusive video to discover the strategies that have helped thousands of women 
            build successful businesses and achieve financial independence.
          </p>
        </div>

        {/* Video Container */}
        <div className="max-w-5xl mx-auto">
          <Card className="overflow-hidden bg-gradient-card border-border shadow-medium">
            <div className="aspect-video relative">
              <iframe
                width="100%"
                height="100%"
                src="https://www.youtube.com/embed/FYn1vYW1tP8?rel=0&modestbranding=1"
                title="LadyBoss Academy Training Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              ></iframe>
            </div>
          </Card>
        </div>

        {/* Video Info & Actions */}
        <div className="max-w-5xl mx-auto mt-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Video Details */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold mb-4">
                  About This Training
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  This comprehensive training video covers the essential strategies and mindsets 
                  that successful women entrepreneurs use to build thriving businesses. You'll learn 
                  actionable techniques for overcoming common challenges, scaling your operations, 
                  and creating sustainable income streams.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-3">What You'll Discover:</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    The #1 mindset shift that separates successful entrepreneurs from struggling ones
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    Proven strategies for building multiple income streams
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    How to network effectively and build meaningful business relationships
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    Financial planning techniques for long-term wealth building
                  </li>
                </ul>
              </div>
            </div>

            {/* Action Sidebar */}
            <div className="space-y-6">
              <Card className="p-6 bg-gradient-accent">
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                    <BookOpen size={24} className="text-accent-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-accent-foreground">
                    Ready to Start?
                  </h3>
                  <p className="text-accent-foreground/80 text-sm">
                    Join our community and get access to exclusive resources and coaching.
                  </p>
                  <Button 
                    className="w-full bg-primary hover:bg-primary-dark"
                    asChild
                  >
                    <Link to="/#community">
                      Join LadyBoss Academy
                    </Link>
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Share This Video</h3>
                  <p className="text-sm text-muted-foreground">
                    Help other women discover these powerful strategies
                  </p>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      navigator.share?.({
                        title: 'LadyBoss Academy Training Video',
                        url: window.location.href
                      }) || navigator.clipboard.writeText(window.location.href);
                    }}
                  >
                    <Share2 size={16} className="mr-2" />
                    Share Video
                  </Button>
                </div>
              </Card>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold gradient-text mb-1">264K+</div>
                  <div className="text-xs text-muted-foreground">Community</div>
                </Card>
                <Card className="p-4 text-center">
                  <div className="text-2xl font-bold gradient-text mb-1">98%</div>
                  <div className="text-xs text-muted-foreground">Success Rate</div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Related Content */}
        <div className="max-w-5xl mx-auto mt-16">
          <h3 className="font-display text-2xl font-bold text-center mb-8">
            Continue Your Journey
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="p-6 group hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-primary/20 transition-colors">
                  <BookOpen size={24} className="text-primary" />
                </div>
                <h4 className="font-semibold">Explore Programs</h4>
                <p className="text-sm text-muted-foreground">
                  Discover our comprehensive business growth programs
                </p>
                <Button variant="ghost" asChild className="w-full">
                  <Link to="/#programs">View Programs</Link>
                </Button>
              </div>
            </Card>

            <Card className="p-6 group hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-success/20 transition-colors">
                  <Play size={24} className="text-success" />
                </div>
                <h4 className="font-semibold">Success Stories</h4>
                <p className="text-sm text-muted-foreground">
                  Read inspiring transformations from our community
                </p>
                <Button variant="ghost" asChild className="w-full">
                  <Link to="/#stories">Read Stories</Link>
                </Button>
              </div>
            </Card>

            <Card className="p-6 group hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto group-hover:bg-secondary/20 transition-colors">
                  <Share2 size={24} className="text-secondary-foreground" />
                </div>
                <h4 className="font-semibold">Join Community</h4>
                <p className="text-sm text-muted-foreground">
                  Connect with like-minded women entrepreneurs
                </p>
                <Button variant="ghost" asChild className="w-full">
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