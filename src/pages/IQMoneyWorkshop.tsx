import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSign, 
  TrendingUp, 
  Target, 
  Users, 
  Clock, 
  CheckCircle, 
  Star,
  Shield,
  Calendar,
  BookOpen,
  Heart,
  Lightbulb,
  PlayCircle,
  Download,
  Award,
  Infinity,
  Globe,
  Lock,
  MessageCircle,
  BarChart3,
  PieChart,
  Wallet,
  CreditCard,
  Building2,
  TrendingDown,
  ArrowUp,
  Phone
} from 'lucide-react';
import { SEOHead } from "@/components/SEOHead";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import moneyLiteracyHero from "@/assets/money-literacy-workshop-hero.jpg";

export default function IQMoneyWorkshop() {
  const { toast } = useToast();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Facebook Pixel tracking
  useEffect(() => {
    // Track page view
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
      window.fbq('trackCustom', 'MoneyCourseLanding', {
        source: 'iqmoney_course_page',
        course_type: 'money_literacy',
        price: 600
      });
    }

    // Track scroll depth
    const handleScroll = () => {
      const scrolled = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      
      if (scrolled > 25 && typeof window.fbq === 'function') {
        window.fbq('trackCustom', 'ScrollDepth25', {
          source: 'iqmoney_course_page'
        });
      }
      if (scrolled > 50 && typeof window.fbq === 'function') {
        window.fbq('trackCustom', 'ScrollDepth50', {
          source: 'iqmoney_course_page'
        });
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleEnrollClick = () => {
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'InitiateCheckout', {
        value: 600,
        currency: 'USD',
        content_name: 'IQMoney Mastery Course',
        content_category: 'course'
      });
      window.fbq('trackCustom', 'CourseEnrollment', {
        source: 'iqmoney_course_page',
        course_name: 'money_literacy'
      });
    }
    handleDirectPayment();
  };

  const handleDirectPayment = async () => {
    setIsProcessingPayment(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: { program: 'money-literacy' }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Error",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const courseModules = [
    {
      module: "Module 1",
      title: "U.S. Financial System & Money Mindset for Immigrants",
      lessons: 8,
      duration: "2.5 hours",
      icon: <BookOpen className="h-6 w-6" />,
      topics: [
        "How the U.S. Financial System Works",
        "Banking, Credit & Debt Management Explained",
        "Understanding Your Money Story as an Immigrant",
        "Breaking Limiting Financial Beliefs", 
        "The Psychology of Money Decisions in a New Country",
        "Creating Your Financial Vision in America",
        "Overcoming Financial Fears & Cultural Barriers",
        "Building Confidence with U.S. Money Systems"
      ]
    },
    {
      module: "Module 2", 
      title: "Budgeting & Saving Strategies to Stop Paycheck-to-Paycheck Living",
      lessons: 10,
      duration: "3.2 hours",
      icon: <PieChart className="h-6 w-6" />,
      topics: [
        "Budgeting Strategies for Immigrant Families",
        "How to Grow Your Savings Effectively",
        "Breaking the Paycheck-to-Paycheck Cycle",
        "Emergency Fund Planning for Security",
        "Managing Money While Supporting Family Abroad",
        "Variable Income Budgeting for Immigrants",
        "Smart Expense Tracking Systems",
        "Budget Review & Adjustment Process",
        "Digital Tools & Apps for Money Management",
        "Creating Multiple Income Streams"
      ]
    },
    {
      module: "Module 3",
      title: "Credit Building & Avoiding Common Financial Pitfalls", 
      lessons: 9,
      duration: "2.8 hours",
      icon: <TrendingDown className="h-6 w-6" />,
      topics: [
        "Build & Repair Your Credit Score as an Immigrant",
        "Qualify for Better Financial Opportunities",
        "Spot Financial Traps & Scams Targeting Immigrants",
        "Strategic Debt Elimination Methods",
        "Building Financial Confidence While Paying Off Debt",
        "Credit Building Without Overwhelming Paperwork",
        "Simple Credit Optimization Strategies",
        "Emergency Fund Building for Stability",
        "Overcoming Money Shame and Cultural Barriers"
      ]
    },
    {
      module: "Module 4",
      title: "Smart Investing for Beginners - Grow Wealth with Little Money",
      lessons: 12,
      duration: "4.1 hours", 
      icon: <TrendingUp className="h-6 w-6" />,
      topics: [
        "Investment Psychology for New Americans",
        "How to Grow Your Wealth Through Investments",
        "Start Investing Even with Little Money",
        "Understanding Your Risk Personality",
        "Simple Investment Strategies for Beginners",
        "Building Investment Confidence Step by Step",
        "Dollar-Cost Averaging Made Simple",
        "Retirement Planning in the U.S. System",
        "Real Estate Investment Basics for Immigrants",
        "Diversification for Peace of Mind",
        "Market Psychology & Emotions",
        "Long-term Wealth Building in America"
      ]
    },
    {
      module: "Module 5",
      title: "Business & Side Hustle Finances for Immigrant Entrepreneurs",
      lessons: 7,
      duration: "2.3 hours",
      icon: <Building2 className="h-6 w-6" />,
      topics: [
        "Manage Money Effectively as Entrepreneur or Freelancer",
        "Business Banking & Structure in the U.S.",
        "Investment Psychology for Business Owners",
        "Understanding Market Emotions as Immigrant Business Owner", 
        "Building Multiple Revenue Streams for Security",
        "Scaling Your Business Income in America",
        "Long-term Wealth Psychology for Entrepreneurs"
      ]
    },
    {
      module: "Module 6",
      title: "Advanced Wealth Strategies & Financial Confidence",
      lessons: 6,
      duration: "2.0 hours",
      icon: <ArrowUp className="h-6 w-6" />,
      topics: [
        "Building Unshakeable Financial Confidence",
        "Advanced Wealth Psychology",
        "Passive Income Development",
        "Long-term Financial Planning",
        "Risk Management Strategies",
        "Legacy Wealth Building"
      ]
    }
  ];

  const courseFeatures = [
    {
      icon: <PlayCircle className="h-6 w-6" />,
      title: "52 Video Lessons",
      description: "High-quality, professionally produced video content with actionable strategies"
    },
    {
      icon: <Download className="h-6 w-6" />,
      title: "Downloadable Resources",
      description: "Workbooks, templates, calculators, and checklists to implement immediately"
    },
    {
      icon: <Infinity className="h-6 w-6" />,
      title: "Lifetime Access",
      description: "Learn at your own pace with unlimited access to all course materials"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Private Community",
      description: "Connect with like-minded women on the same financial journey"
    },
    {
      icon: <MessageCircle className="h-6 w-6" />,
      title: "Q&A Support",
      description: "Monthly live Q&A sessions with financial experts"
    },
            {
              icon: <Award className="h-6 w-6" />,
              title: "Financial Confidence Builder",
              description: "Complete program focused on building unshakeable financial confidence and empowerment"
            }
  ];

  const faqItems = [
    {
      question: "How long do I have access to the course?",
      answer: "You have lifetime access to all course materials, including any future updates and bonus content."
    },
    {
      question: "Is this suitable for complete beginners?",
      answer: "Absolutely! The course is designed to take you from wherever you are financially to complete money mastery, regardless of your starting point."
    },
    {
      question: "What if I'm already investing or have some financial knowledge?",
      answer: "The course includes advanced modules that will take your knowledge to the next level, plus you can always refresh fundamentals and fill any gaps."
    },
    {
      question: "Do you offer payment plans?",
      answer: "Currently, we offer one-time payment only, but the course pays for itself many times over through the money you'll save and earn."
    },
    {
      question: "Is there a money-back guarantee?",
      answer: "Yes! We offer a 30-day money-back guarantee. If you're not completely satisfied, we'll refund your investment."
    },
    {
      question: "How much time should I dedicate to the course weekly?",
      answer: "The course is self-paced, but we recommend 2-3 hours per week to complete it within 6-8 weeks and see maximum results."
    }
  ];

  return (
    <>
      <SEOHead 
        title="IQMoney Online Course: Money Literacy for Ladyboss - Complete Financial Education"
        description="Master your money with our comprehensive online course. 52 lessons covering budgeting, investing, debt elimination, and wealth building. Lifetime access, expert instruction, and proven strategies for financial independence."
        image={moneyLiteracyHero}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        {/* Hero Section */}
        <section className="relative pt-16 pb-12 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5"></div>
          <div className="container mx-auto relative">
            <div className="text-center mb-8">
              <Badge variant="secondary" className="mb-4 text-xs sm:text-sm font-semibold px-4 py-2 bg-blue-100 text-blue-800 border-blue-200">
                🎓 PREMIUM ONLINE COURSE
              </Badge>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-6 bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent leading-tight px-1 sm:px-2">
                IQMoney Online Course: Money Literacy for Ladyboss
              </h1>
              <p className="text-lg sm:text-xl md:text-2xl font-medium text-slate-700 mb-6 leading-relaxed px-2 sm:px-4">
                The Complete Financial Education System for Ambitious Immigrant Women Who Demand Excellence
              </p>
              <p className="text-base sm:text-lg text-slate-600 mb-8 px-2 sm:px-4 leading-relaxed max-w-4xl mx-auto">
                Learn how to manage, grow & protect your money in the U.S. financial system. 52 expert-led lessons, 
                lifetime access, and proven strategies designed specifically for immigrant women seeking financial independence.
              </p>
            </div>

            {/* Hero Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 max-w-5xl mx-auto mb-8">
              <div className="text-center bg-white/80 backdrop-blur-sm p-3 sm:p-6 rounded-2xl shadow-lg border border-slate-200">
                <PlayCircle className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mx-auto mb-2 sm:mb-3" />
                <div className="text-lg sm:text-2xl font-bold text-slate-900">52</div>
                <div className="text-xs sm:text-sm text-slate-600">Video Lessons</div>
              </div>
              <div className="text-center bg-white/80 backdrop-blur-sm p-3 sm:p-6 rounded-2xl shadow-lg border border-slate-200">
                <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mx-auto mb-2 sm:mb-3" />
                <div className="text-lg sm:text-2xl font-bold text-slate-900">16.9</div>
                <div className="text-xs sm:text-sm text-slate-600">Hours of Content</div>
              </div>
              <div className="text-center bg-white/80 backdrop-blur-sm p-3 sm:p-6 rounded-2xl shadow-lg border border-slate-200">
                <Infinity className="h-6 w-6 sm:h-8 sm:w-8 text-pink-600 mx-auto mb-2 sm:mb-3" />
                <div className="text-lg sm:text-2xl font-bold text-slate-900">Lifetime</div>
                <div className="text-xs sm:text-sm text-slate-600">Access</div>
              </div>
              <div className="text-center bg-white/80 backdrop-blur-sm p-3 sm:p-6 rounded-2xl shadow-lg border border-slate-200">
                <Award className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mx-auto mb-2 sm:mb-3" />
                <div className="text-lg sm:text-2xl font-bold text-slate-900">Mastery</div>
                <div className="text-xs sm:text-sm text-slate-600">Financial Confidence</div>
              </div>
            </div>

            {/* Price & CTA */}
            <div className="text-center px-4">
              <div className="bg-white/90 backdrop-blur-sm p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-200 max-w-sm mx-auto mb-6">
                <div className="text-sm text-slate-600 mb-2">One-time investment</div>
                <div className="text-4xl sm:text-5xl font-black text-slate-900 mb-4">$600</div>
                <div className="text-sm text-slate-600 mb-6">Lifetime access • No monthly fees</div>
                <Button 
                  onClick={handleEnrollClick}
                  disabled={isProcessingPayment}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-4 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-h-[3rem]"
                >
                  {isProcessingPayment ? "Processing..." : "Get Instant Access"}
                </Button>
              </div>
              <p className="text-sm text-slate-500 px-4">
                <Shield className="inline h-4 w-4 mr-1" />
                Secure payment • 30-day money-back guarantee
              </p>
            </div>
          </div>
        </section>

        {/* Why Immigrant Women Need This */}
        <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12 sm:mb-16">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-6 px-2 leading-tight">
                  Why Immigrant Women Need Financial Independence More Than Ever
                </h2>
                <p className="text-lg sm:text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed px-4">
                  As an immigrant woman, you face unique financial challenges that others may not understand. 
                  This course addresses the specific needs and barriers that immigrant women encounter on their path to financial freedom.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center mb-12 sm:mb-16">
                <div className="px-4">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">The Immigrant Woman's Financial Reality</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                      <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                        <strong>Limited Family Safety Net:</strong> Unlike others who may have generational wealth or family support, you're building from ground zero
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                      <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                        <strong>Supporting Multiple Households:</strong> You may be sending money home while building your own future, requiring advanced financial planning
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                      <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                        <strong>Credit and Banking Barriers:</strong> Building credit history and navigating financial systems that weren't designed with immigrants in mind
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                      <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                        <strong>Cultural Financial Differences:</strong> Learning new financial systems, investment strategies, and wealth-building approaches
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="px-4">
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">Why This Course Is Your Solution</h3>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Star className="h-5 w-5 text-gold-500 mt-1 flex-shrink-0" />
                      <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                        <strong>Culturally Aware Strategies:</strong> Razie understands the immigrant experience and provides strategies that work for our unique situation
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Star className="h-5 w-5 text-gold-500 mt-1 flex-shrink-0" />
                      <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                        <strong>No Prerequisites Required:</strong> Start wherever you are - no existing credit, savings, or investment knowledge needed
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Star className="h-5 w-5 text-gold-500 mt-1 flex-shrink-0" />
                      <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                        <strong>Multiple Income Stream Focus:</strong> Learn to build diverse income sources for security and growth
                      </p>
                    </div>
                    <div className="flex items-start space-x-3">
                      <Star className="h-5 w-5 text-gold-500 mt-1 flex-shrink-0" />
                      <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                        <strong>Community of Like-Minded Women:</strong> Connect with other immigrant women on the same journey to financial independence
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 sm:p-8 rounded-3xl text-white text-center mx-4">
                <h3 className="text-xl sm:text-2xl font-bold mb-4">Your Financial Independence Is Not Just a Dream - It's Your Right</h3>
                <p className="text-base sm:text-lg opacity-90 mb-6 max-w-3xl mx-auto leading-relaxed">
                  You didn't come this far to only come this far. It's time to build the financial security and wealth that will not only 
                  transform your life but create a legacy for generations to come.
                </p>
                <Button 
                  onClick={handleEnrollClick}
                  disabled={isProcessingPayment}
                  className="bg-white text-purple-600 hover:bg-gray-100 px-6 sm:px-8 py-3 text-base sm:text-lg font-bold rounded-xl shadow-lg transition-all duration-300 transform hover:scale-105 min-h-[3rem]"
                >
                  {isProcessingPayment ? "Processing..." : "Start Your Financial Independence Journey"}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Meet Your Instructor */}
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12 sm:mb-16">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-6 px-2 leading-tight">Meet Your Instructor</h2>
                <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto px-4">
                  Learn from a proven business coach and best-selling author who has empowered over 60,000 women to achieve financial success.
                </p>
              </div>
              
              <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
                <div className="order-2 lg:order-1 px-4">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 sm:p-8 rounded-3xl">
                    <img 
                      src={moneyLiteracyHero} 
                      alt="Razie Ladyboss - Best-selling Author & Business Coach"
                      className="w-full h-auto rounded-2xl shadow-xl"
                    />
                  </div>
                </div>
                
                <div className="order-1 lg:order-2 px-4">
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 sm:mb-4">Razie Ladyboss</h3>
                  <p className="text-lg sm:text-xl text-blue-600 font-semibold mb-4 sm:mb-6">Best-selling Author & Business Coach</p>
                  
                  <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                    <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                      Razie Ladyboss is a best-selling author and business coach with a passion for empowering women to achieve financial independence. 
                      She has helped over 60,000 women transform their financial lives and build sustainable wealth through her proven strategies.
                    </p>
                    <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
                      As a successful entrepreneur who built her own empire from the ground up, Razie understands exactly what it takes to create lasting financial success. 
                      With 2.7 million Instagram followers, she's become one of the most trusted voices in women's financial empowerment and business building.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    <div className="flex items-center space-x-3">
                      <Award className="h-5 w-5 sm:h-6 sm:w-6 text-gold-500" />
                      <div>
                        <div className="font-semibold text-sm sm:text-base text-slate-900">Best-selling</div>
                        <div className="text-xs sm:text-sm text-slate-600">Author</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
                      <div>
                        <div className="font-semibold text-sm sm:text-base text-slate-900">60,000+</div>
                        <div className="text-xs sm:text-sm text-slate-600">Students Taught</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                      <div>
                        <div className="font-semibold text-sm sm:text-base text-slate-900">2.7M</div>
                        <div className="text-xs sm:text-sm text-slate-600">Instagram Followers</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Star className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
                      <div>
                        <div className="font-semibold text-sm sm:text-base text-slate-900">4.9/5</div>
                        <div className="text-xs sm:text-sm text-slate-600">Student Rating</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Course Curriculum */}
        <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-slate-50 to-blue-50/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-6 px-2 leading-tight">Complete Course Curriculum</h2>
              <p className="text-lg sm:text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed px-4">
                6 comprehensive modules with 52 video lessons covering everything from basic budgeting to advanced wealth-building strategies. 
                Each module builds upon the previous one to create a complete financial education system.
              </p>
            </div>

            <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
              {courseModules.map((module, index) => (
                <Card key={index} className="border-2 border-slate-200 hover:border-blue-300 transition-all duration-300 bg-white/80 backdrop-blur-sm mx-4">
                  <CardHeader className="pb-3 sm:pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 sm:p-3 rounded-xl text-white">
                          {module.icon}
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-semibold text-blue-600 mb-1">{module.module}</div>
                          <CardTitle className="text-base sm:text-lg md:text-xl text-slate-900 leading-tight">{module.title}</CardTitle>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="text-sm text-slate-600">{module.lessons} Lessons</div>
                        <div className="text-sm font-semibold text-slate-900">{module.duration}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid sm:grid-cols-2 gap-2 sm:gap-3">
                      {module.topics.map((topic, topicIndex) => (
                        <div key={topicIndex} className="flex items-start space-x-2">
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0 mt-1" />
                          <span className="text-slate-700 text-sm leading-relaxed">{topic}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* What's Included */}
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-6 px-2 leading-tight">What's Included</h2>
              <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto px-4">
                Everything you need to master your finances and build lasting wealth
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              {courseFeatures.map((feature, index) => (
                <Card key={index} className="text-center border-2 border-slate-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-white to-blue-50/30 mx-4 sm:mx-0">
                  <CardContent className="p-6 sm:p-8">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 sm:p-4 rounded-2xl text-white w-fit mx-auto mb-4 sm:mb-6">
                      {feature.icon}
                    </div>
                    <h3 className="font-bold text-lg sm:text-xl text-slate-900 mb-3 sm:mb-4 leading-tight">{feature.title}</h3>
                    <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
              
              {/* Additional Features for Immigrants */}
              <Card className="text-center border-2 border-slate-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-white to-green-50/30 mx-4 sm:mx-0">
                <CardContent className="p-6 sm:p-8">
                  <div className="bg-gradient-to-br from-green-500 to-blue-600 p-3 sm:p-4 rounded-2xl text-white w-fit mx-auto mb-4 sm:mb-6">
                    <Globe className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <h3 className="font-bold text-lg sm:text-xl text-slate-900 mb-3 sm:mb-4 leading-tight">No Financial Background Needed</h3>
                  <p className="text-slate-600 leading-relaxed text-sm sm:text-base">Step-by-step lessons designed specifically for immigrants new to the U.S. financial system</p>
                </CardContent>
              </Card>
              
              <Card className="text-center border-2 border-slate-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-white to-purple-50/30 mx-4 sm:mx-0">
                <CardContent className="p-6 sm:p-8">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 sm:p-4 rounded-2xl text-white w-fit mx-auto mb-4 sm:mb-6">
                    <BarChart3 className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <h3 className="font-bold text-lg sm:text-xl text-slate-900 mb-3 sm:mb-4 leading-tight">Budget Templates & Investment Guides</h3>
                  <p className="text-slate-600 leading-relaxed text-sm sm:text-base">Practical tools including budget templates, investment guides, and financial checklists</p>
                </CardContent>
              </Card>
              
              <Card className="text-center border-2 border-slate-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-white to-yellow-50/30 mx-4 sm:mx-0">
                <CardContent className="p-6 sm:p-8">
                  <div className="bg-gradient-to-br from-yellow-500 to-orange-600 p-3 sm:p-4 rounded-2xl text-white w-fit mx-auto mb-4 sm:mb-6">
                    <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <h3 className="font-bold text-lg sm:text-xl text-slate-900 mb-3 sm:mb-4 leading-tight">Expert Insights & Success Stories</h3>
                  <p className="text-slate-600 leading-relaxed text-sm sm:text-base">Learn from financial professionals and real success stories from immigrant women</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Who This Is For Section */}
        <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-6 px-2 leading-tight">Perfect For Ambitious Women Who...</h2>
              <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto px-4">
                Whether you're just starting your financial journey or ready to take it to the next level
              </p>
            </div>

            <div className="max-w-6xl mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              <Card className="border-2 border-slate-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 mx-4 sm:mx-0">
                <CardContent className="p-6 sm:p-8">
                  <Target className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mb-3 sm:mb-4" />
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 mb-2 sm:mb-3 leading-tight">Want Financial Independence</h3>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">Dream of being financially free but don't know where to start or how to create a concrete plan</p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-slate-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 mx-4 sm:mx-0">
                <CardContent className="p-6 sm:p-8">
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mb-3 sm:mb-4" />
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 mb-2 sm:mb-3 leading-tight">Are Serious About Investing</h3>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">Ready to grow your wealth through smart investing but want expert guidance and proven strategies</p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-slate-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 mx-4 sm:mx-0">
                <CardContent className="p-6 sm:p-8">
                  <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-pink-600 mb-3 sm:mb-4" />
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 mb-2 sm:mb-3 leading-tight">Run Their Own Business</h3>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">Entrepreneurs and freelancers who need to master both personal and business financial management</p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-slate-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 mx-4 sm:mx-0">
                <CardContent className="p-6 sm:p-8">
                  <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mb-3 sm:mb-4" />
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 mb-2 sm:mb-3 leading-tight">Struggle with Debt</h3>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">Feel overwhelmed by debt and want a clear, actionable plan to eliminate it once and for all</p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-slate-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 mx-4 sm:mx-0">
                <CardContent className="p-6 sm:p-8">
                  <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-600 mb-3 sm:mb-4" />
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 mb-2 sm:mb-3 leading-tight">Want to Break Money Patterns</h3>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">Ready to overcome limiting beliefs and emotional spending habits that keep you stuck financially</p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-slate-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 mx-4 sm:mx-0">
                <CardContent className="p-6 sm:p-8">
                  <Lightbulb className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600 mb-3 sm:mb-4" />
                  <h3 className="font-bold text-base sm:text-lg text-slate-900 mb-2 sm:mb-3 leading-tight">Demand Excellence</h3>
                  <p className="text-slate-600 text-sm sm:text-base leading-relaxed">High-achievers who want comprehensive, professional-grade financial education, not basic tips</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 sm:py-16 lg:py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-6 px-2 leading-tight">Frequently Asked Questions</h2>
              <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto px-4">
                Everything you need to know about the IQMoney Mastery Course
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
              {faqItems.map((faq, index) => (
                <Card key={index} className="border-2 border-slate-200 hover:border-blue-300 transition-all duration-300 mx-4 sm:mx-0">
                  <CardContent className="p-6 sm:p-8">
                    <h3 className="font-bold text-base sm:text-lg text-slate-900 mb-3 sm:mb-4 leading-tight">{faq.question}</h3>
                    <p className="text-slate-600 leading-relaxed text-sm sm:text-base">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 sm:mb-8 px-2 leading-tight">
                Your Financial Transformation Starts Today
              </h2>
              <p className="text-lg sm:text-xl mb-6 sm:mb-8 opacity-90 leading-relaxed px-4">
                Stop letting money stress control your life. Join thousands of women who've already transformed their finances with proven strategies that actually work.
              </p>
              
              <div className="bg-white/10 backdrop-blur-sm p-6 sm:p-8 rounded-2xl border border-white/20 mb-8 sm:mb-10 mx-4">
                <div className="grid sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-green-400">$47,000</div>
                    <div className="text-xs sm:text-sm opacity-80">Average debt eliminated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-blue-400">89%</div>
                    <div className="text-xs sm:text-sm opacity-80">Increased their net worth</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-purple-400">6 months</div>
                    <div className="text-xs sm:text-sm opacity-80">Average time to see results</div>
                  </div>
                </div>
                
                <div className="space-y-4 sm:space-y-6">
                  <div className="bg-white/95 p-4 sm:p-6 rounded-xl text-slate-900">
                    <div className="text-xl sm:text-2xl font-bold mb-2">$600</div>
                    <div className="text-sm text-slate-600 mb-4">One-time payment • Lifetime access</div>
                    <Button 
                      onClick={handleEnrollClick}
                      disabled={isProcessingPayment}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 sm:px-8 py-4 text-base sm:text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 min-h-[3rem]"
                    >
                      {isProcessingPayment ? "Processing..." : "Get Instant Access Now"}
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm opacity-80">
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-2" />
                      30-Day Guarantee
                    </div>
                    <div className="flex items-center">
                      <Lock className="h-4 w-4 mr-2" />
                      Secure Payment
                    </div>
                    <div className="flex items-center">
                      <Infinity className="h-4 w-4 mr-2" />
                      Lifetime Access
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-base sm:text-lg opacity-80 px-4">
                Questions? Contact us at{" "}
                <a href="mailto:support@ladybosslook.com" className="text-blue-300 hover:text-blue-200 transition-colors">
                  support@ladybosslook.com
                </a>
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}