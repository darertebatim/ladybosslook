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
              Step 1: Rights & Boundaries
            </span>
          </div>
          
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 px-2">
            Build Your{' '}
            <span className="gradient-text">Courageous Character</span>
          </h1>
          
          <p className="text-base sm:text-lg text-foreground max-w-xl mx-auto px-4 text-justify leading-relaxed font-medium">
            Learn your rights and set healthy boundaries as the first step to courageous leadership.
          </p>
        </div>

        {/* Multiple Bouncing Arrows */}
        <div className="flex justify-center items-center space-x-2 mb-4 sm:mb-6">
          <div className="animate-bounce" style={{ animationDelay: '0s' }}>
            <ChevronDown size={28} className="text-primary" />
          </div>
          <div className="animate-bounce" style={{ animationDelay: '0.2s' }}>
            <ChevronDown size={32} className="text-primary" />
          </div>
          <div className="animate-bounce" style={{ animationDelay: '0.4s' }}>
            <ChevronDown size={28} className="text-primary" />
          </div>
        </div>

        {/* Video Container */}
        <div className="max-w-5xl mx-auto px-2 sm:px-0">
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

        {/* WhatsApp Gift Section */}
        <div className="max-w-4xl mx-auto mt-6 sm:mt-8 px-4 sm:px-6 text-center">
          <p className="text-xs sm:text-sm text-foreground mb-3 sm:mb-4 font-bold bg-primary/10 p-3 rounded-lg whitespace-nowrap overflow-hidden">
            برای گرفتن هدیه، اسم رمز را به واتسپ پایین بفرستید
          </p>
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
            onClick={() => {
              const message = encodeURIComponent('jorat');
              const url = `https://wa.me/19495723730?text=${message}`;
              window.open(url, '_blank', 'noopener,noreferrer');
            }}
          >
            <MessageCircle size={18} className="sm:w-5 sm:h-5 mr-2" />
            Send to WhatsApp
          </Button>
        </div>

        {/* Video Info & Actions */}
        <div className="max-w-5xl mx-auto mt-6 sm:mt-8 px-2 sm:px-0">
          <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Video Details */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <div>
                <h2 className="font-display text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-foreground">
                  About This 20-Minute Course
                </h2>
                <p className="text-sm sm:text-base text-foreground leading-relaxed text-justify bg-muted/30 p-4 rounded-lg">
                  The foundational step to building courageous character as a Persian immigrant woman. 
                  This powerful session focuses on understanding your fundamental rights and establishing 
                  healthy boundaries in your relationships, communications, and professional life in your new homeland.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-3 text-sm sm:text-base text-foreground">What You'll Learn in 20 Minutes:</h3>
                <ul className="space-y-2 sm:space-y-3 text-foreground text-sm sm:text-base">
                  <li className="flex items-start text-justify bg-muted/20 p-3 rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span>Recognize your fundamental rights as an immigrant woman in personal and professional settings</span>
                  </li>
                  <li className="flex items-start text-justify bg-muted/20 p-3 rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span>Master the art of saying "no" respectfully while maintaining your dignity and relationships</span>
                  </li>
                  <li className="flex items-start text-justify bg-muted/20 p-3 rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span>Establish clear boundaries in your workplace communications and career advancement</span>
                  </li>
                  <li className="flex items-start text-justify bg-muted/20 p-3 rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full mr-3 mt-2 flex-shrink-0"></div>
                    <span>Communicate assertively while honoring your Persian heritage and cultural values</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Action Sidebar */}
            <div className="space-y-4 sm:space-y-6">
              <Card className="p-4 sm:p-6 bg-gradient-accent border-2 border-primary/20">
                <div className="text-center space-y-3 sm:space-y-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                    <BookOpen size={20} className="sm:w-6 sm:h-6 text-accent-foreground" />
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-accent-foreground">
                    Build Your Courage
                  </h3>
                  <p className="text-accent-foreground/90 text-xs sm:text-sm leading-relaxed text-justify">
                    Join our sisterhood of courageous Persian ladybosses and unlock your full potential.
                  </p>
                  <Button 
                    className="w-full bg-primary hover:bg-primary-dark text-sm sm:text-base font-bold"
                    asChild
                  >
                    <Link to="/#community">
                      Join LadyBoss Academy
                    </Link>
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Video;