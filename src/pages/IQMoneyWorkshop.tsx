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
      title: "Financial Foundation & Money Mindset",
      lessons: 8,
      duration: "2.5 hours",
      icon: <BookOpen className="h-6 w-6" />,
      topics: [
        "Understanding Your Money Story",
        "Breaking Limiting Financial Beliefs", 
        "The Psychology of Money Decisions",
        "Creating Your Financial Vision",
        "Money Values Assessment",
        "Overcoming Financial Fears",
        "Building Confidence with Money",
        "Setting Powerful Financial Intentions"
      ]
    },
    {
      module: "Module 2", 
      title: "Budgeting & Cash Flow Management",
      lessons: 10,
      duration: "3.2 hours",
      icon: <PieChart className="h-6 w-6" />,
      topics: [
        "The 50/30/20 Rule & Beyond",
        "Zero-Based Budgeting Mastery",
        "Cash Flow Optimization Strategies",
        "Emergency Fund Planning",
        "Expense Tracking Systems",
        "Variable Income Budgeting",
        "Family Budget Coordination",
        "Budget Review & Adjustment Process",
        "Digital Tools & Apps for Budgeting",
        "Creating Multiple Income Streams"
      ]
    },
    {
      module: "Module 3",
      title: "Debt Elimination & Credit Optimization", 
      lessons: 9,
      duration: "2.8 hours",
      icon: <TrendingDown className="h-6 w-6" />,
      topics: [
        "Debt Avalanche vs Snowball Method",
        "Credit Score Improvement Strategies",
        "Negotiating with Creditors",
        "Consolidation vs Refinancing",
        "Credit Card Optimization",
        "Student Loan Management",
        "Mortgage Strategies",
        "Building Credit from Scratch",
        "Credit Monitoring & Protection"
      ]
    },
    {
      module: "Module 4",
      title: "Investment Fundamentals & Wealth Building",
      lessons: 12,
      duration: "4.1 hours", 
      icon: <TrendingUp className="h-6 w-6" />,
      topics: [
        "Investment Basics & Risk Assessment",
        "Stock Market Fundamentals",
        "ETFs vs Mutual Funds",
        "Dollar-Cost Averaging Strategy",
        "Retirement Account Optimization (401k, IRA)",
        "Real Estate Investment Basics",
        "Diversification Strategies",
        "Tax-Efficient Investing",
        "Robo-Advisors vs DIY Investing",
        "Creating Investment Goals",
        "Rebalancing Your Portfolio",
        "Long-term Wealth Building Plan"
      ]
    },
    {
      module: "Module 5",
      title: "Investing Psychology & Business Building",
      lessons: 7,
      duration: "2.3 hours",
      icon: <Building2 className="h-6 w-6" />,
      topics: [
        "Investment Psychology & Mindset",
        "Understanding Market Emotions",
        "Business Building Fundamentals", 
        "Scaling Your Business Income",
        "Investment Strategies for Entrepreneurs",
        "Building Multiple Revenue Streams",
        "Long-term Wealth Psychology"
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
        title="IQMoney Mastery Course: Complete Financial Education for Ambitious Women"
        description="Master your money with our comprehensive online course. 52 lessons covering budgeting, investing, debt elimination, and wealth building. Lifetime access, expert instruction, and proven strategies for financial independence."
        image={moneyLiteracyHero}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        {/* Hero Section */}
        <section className="relative pt-20 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5"></div>
          <div className="container mx-auto px-4 relative">
            <div className="text-center mb-12">
              <Badge variant="secondary" className="mb-6 text-sm font-semibold px-6 py-2 bg-blue-100 text-blue-800 border-blue-200">
                🎓 PREMIUM ONLINE COURSE
              </Badge>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-8 bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent leading-tight">
                IQMoney Mastery Course
              </h1>
              <p className="text-xl md:text-2xl font-medium text-slate-700 mb-8 max-w-4xl mx-auto leading-relaxed">
                The Complete Financial Education System for Ambitious Women Who Demand Excellence
              </p>
              <p className="text-lg text-slate-600 mb-12 max-w-3xl mx-auto">
                Transform from financial confusion to complete money mastery with our comprehensive course. 
                52 expert-led lessons, lifetime access, and proven strategies used by thousands of successful women.
              </p>
            </div>

            {/* Hero Stats */}
            <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto mb-16">
              <div className="text-center bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200">
                <PlayCircle className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-slate-900">52</div>
                <div className="text-sm text-slate-600">Video Lessons</div>
              </div>
              <div className="text-center bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200">
                <Clock className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-slate-900">16.9</div>
                <div className="text-sm text-slate-600">Hours of Content</div>
              </div>
              <div className="text-center bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200">
                <Infinity className="h-8 w-8 text-pink-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-slate-900">Lifetime</div>
                <div className="text-sm text-slate-600">Access</div>
              </div>
              <div className="text-center bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-slate-200">
                <Award className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-slate-900">Mastery</div>
                <div className="text-sm text-slate-600">Financial Confidence</div>
              </div>
            </div>

            {/* Price & CTA */}
            <div className="text-center">
              <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-2xl border border-slate-200 max-w-md mx-auto mb-8">
                <div className="text-sm text-slate-600 mb-2">One-time investment</div>
                <div className="text-5xl font-black text-slate-900 mb-4">$600</div>
                <div className="text-sm text-slate-600 mb-6">Lifetime access • No monthly fees</div>
                <Button 
                  onClick={handleEnrollClick}
                  disabled={isProcessingPayment}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  {isProcessingPayment ? "Processing..." : "Get Instant Access"}
                </Button>
              </div>
              <p className="text-sm text-slate-500">
                <Shield className="inline h-4 w-4 mr-1" />
                Secure payment • 30-day money-back guarantee
              </p>
            </div>
          </div>
        </section>

        {/* Meet Your Instructor */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Meet Your Instructor</h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Learn from a proven business coach and best-selling author who has empowered over 60,000 women to achieve financial success.
              </p>
            </div>
              
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="order-2 lg:order-1">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-8 rounded-3xl">
                      <img 
                        src={moneyLiteracyHero} 
                        alt="Razie Ladyboss - Best-selling Author & Business Coach"
                        className="w-full h-auto rounded-2xl shadow-xl"
                      />
                  </div>
                </div>
                
                <div className="order-1 lg:order-2">
                  <h3 className="text-3xl font-bold text-slate-900 mb-4">Razie Ladyboss</h3>
                  <p className="text-xl text-blue-600 font-semibold mb-6">Best-selling Author & Business Coach</p>
                  
                  <div className="space-y-4 mb-8">
                    <p className="text-lg text-slate-700 leading-relaxed">
                      Razie Ladyboss is a best-selling author and business coach with a passion for empowering women to achieve financial independence. 
                      She has helped over 60,000 women transform their financial lives and build sustainable wealth through her proven strategies.
                    </p>
                    <p className="text-lg text-slate-700 leading-relaxed">
                      As a successful entrepreneur who built her own empire from the ground up, Razie understands exactly what it takes to create lasting financial success. 
                      With 2.7 million Instagram followers, she's become one of the most trusted voices in women's financial empowerment and business building.
                    </p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3">
                      <Award className="h-6 w-6 text-gold-500" />
                      <div>
                        <div className="font-semibold text-slate-900">Best-selling</div>
                        <div className="text-sm text-slate-600">Author</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Users className="h-6 w-6 text-blue-500" />
                      <div>
                        <div className="font-semibold text-slate-900">60,000+</div>
                        <div className="text-sm text-slate-600">Students Taught</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Building2 className="h-6 w-6 text-purple-500" />
                      <div>
                        <div className="font-semibold text-slate-900">2.7M</div>
                        <div className="text-sm text-slate-600">Instagram Followers</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Star className="h-6 w-6 text-yellow-500" />
                      <div>
                        <div className="font-semibold text-slate-900">4.9/5</div>
                        <div className="text-sm text-slate-600">Student Rating</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Course Curriculum */}
        <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Complete Course Curriculum</h2>
              <p className="text-xl text-slate-600 max-w-4xl mx-auto leading-relaxed">
                6 comprehensive modules with 52 video lessons covering everything from basic budgeting to advanced wealth-building strategies. 
                Each module builds upon the previous one to create a complete financial education system.
              </p>
            </div>

            <div className="max-w-6xl mx-auto space-y-6">
              {courseModules.map((module, index) => (
                <Card key={index} className="border-2 border-slate-200 hover:border-blue-300 transition-all duration-300 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-xl text-white">
                          {module.icon}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-blue-600 mb-1">{module.module}</div>
                          <CardTitle className="text-xl text-slate-900">{module.title}</CardTitle>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-600">{module.lessons} Lessons</div>
                        <div className="text-sm font-semibold text-slate-900">{module.duration}</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid md:grid-cols-2 gap-3">
                      {module.topics.map((topic, topicIndex) => (
                        <div key={topicIndex} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <span className="text-slate-700 text-sm">{topic}</span>
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
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">What's Included</h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Everything you need to master your finances and build lasting wealth
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {courseFeatures.map((feature, index) => (
                <Card key={index} className="text-center border-2 border-slate-200 hover:border-blue-300 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-white to-blue-50/30">
                  <CardContent className="p-8">
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-4 rounded-2xl text-white w-fit mx-auto mb-6">
                      {feature.icon}
                    </div>
                    <h3 className="font-bold text-xl text-slate-900 mb-4">{feature.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Who This Is For Section */}
        <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Perfect For Ambitious Women Who...</h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Whether you're just starting your financial journey or ready to take it to the next level
              </p>
            </div>

            <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="border-2 border-slate-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <Target className="h-8 w-8 text-blue-600 mb-4" />
                  <h3 className="font-bold text-lg text-slate-900 mb-3">Want Financial Independence</h3>
                  <p className="text-slate-600">Dream of being financially free but don't know where to start or how to create a concrete plan</p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-slate-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <TrendingUp className="h-8 w-8 text-purple-600 mb-4" />
                  <h3 className="font-bold text-lg text-slate-900 mb-3">Are Serious About Investing</h3>
                  <p className="text-slate-600">Ready to grow your wealth through smart investing but want expert guidance and proven strategies</p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-slate-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <Building2 className="h-8 w-8 text-pink-600 mb-4" />
                  <h3 className="font-bold text-lg text-slate-900 mb-3">Run Their Own Business</h3>
                  <p className="text-slate-600">Entrepreneurs and freelancers who need to master both personal and business financial management</p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-slate-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <CreditCard className="h-8 w-8 text-green-600 mb-4" />
                  <h3 className="font-bold text-lg text-slate-900 mb-3">Struggle with Debt</h3>
                  <p className="text-slate-600">Feel overwhelmed by debt and want a clear, actionable plan to eliminate it once and for all</p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-slate-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <Heart className="h-8 w-8 text-red-600 mb-4" />
                  <h3 className="font-bold text-lg text-slate-900 mb-3">Want to Break Money Patterns</h3>
                  <p className="text-slate-600">Ready to overcome limiting beliefs and emotional spending habits that keep you stuck financially</p>
                </CardContent>
              </Card>
              
              <Card className="border-2 border-slate-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardContent className="p-8">
                  <Lightbulb className="h-8 w-8 text-yellow-600 mb-4" />
                  <h3 className="font-bold text-lg text-slate-900 mb-3">Demand Excellence</h3>
                  <p className="text-slate-600">High-achievers who want comprehensive, professional-grade financial education, not basic tips</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
              <p className="text-xl text-slate-600 max-w-3xl mx-auto">
                Everything you need to know about the IQMoney Mastery Course
              </p>
            </div>

            <div className="max-w-4xl mx-auto space-y-6">
              {faqItems.map((faq, index) => (
                <Card key={index} className="border-2 border-slate-200 hover:border-blue-300 transition-all duration-300">
                  <CardContent className="p-8">
                    <h3 className="font-bold text-lg text-slate-900 mb-4">{faq.question}</h3>
                    <p className="text-slate-600 leading-relaxed">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-8">
                Your Financial Transformation Starts Today
              </h2>
              <p className="text-xl mb-8 opacity-90 leading-relaxed">
                Stop letting money stress control your life. Join thousands of women who've already transformed their finances with proven strategies that actually work.
              </p>
              
              <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20 mb-10">
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400">$47,000</div>
                    <div className="text-sm opacity-80">Average debt eliminated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-400">89%</div>
                    <div className="text-sm opacity-80">Increased their net worth</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-400">6 months</div>
                    <div className="text-sm opacity-80">Average time to see results</div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-white/95 p-6 rounded-xl text-slate-900">
                    <div className="text-2xl font-bold mb-2">$600</div>
                    <div className="text-sm text-slate-600 mb-4">One-time payment • Lifetime access</div>
                    <Button 
                      onClick={handleEnrollClick}
                      disabled={isProcessingPayment}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      {isProcessingPayment ? "Processing..." : "Get Instant Access Now"}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-center space-x-8 text-sm opacity-80">
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
              
              <p className="text-lg opacity-80">
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