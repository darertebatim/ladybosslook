import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Lock, CreditCard, CheckCircle2, Clock, Users, Star, Sparkles, Gift, Award, TrendingUp, Zap, Heart, MessageCircle, Brain, Mic, Globe } from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import SpotCounter from "@/components/SpotCounter";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import InstructorBio from "@/components/InstructorBio";
import ExitIntentPopup from "@/components/ExitIntentPopup";
import BonusMaterialsSection from "@/components/BonusMaterialsSection";
import RecentRegistrations from "@/components/RecentRegistrations";
import { SEOHead } from "@/components/SEOHead";
import { simpleSubscriptionSchema } from '@/lib/validation';
import { z } from 'zod';

const One = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  // Meta Pixel tracking
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('track', 'PageView');
      (window as any).fbq('track', 'ViewContent', {
        content_type: 'paid_class',
        content_name: 'Bilingual Power Class',
        content_category: 'online_class',
        value: 100,
        currency: 'USD'
      });
      (window as any).fbq('trackCustom', 'BilingualClassPageVisit', {
        page_type: 'paid_class_landing',
        offer_price: 1,
        original_price: 100
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setValidationErrors({});
    try {
      simpleSubscriptionSchema.parse({ name, email });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
        toast({
          title: "خطا",
          description: "لطفا فرم را با دقت کامل کنید",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const { error: mailchimpError } = await supabase.functions.invoke('mailchimp-subscribe', {
        body: {
          email: email.trim().toLowerCase(),
          name: name.trim(),
          city: '',
          phone: '',
          source: 'one_bilingual',
          tags: ['one_bilingual', 'paid_class']
        }
      });

      if (mailchimpError) throw mailchimpError;

      const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
        body: {
          email: email.trim().toLowerCase(),
          name: name.trim(),
          amount: 100,
          programTitle: 'قدرت دوزبانه - Bilingual Power Class',
          successUrl: `${window.location.origin}/thankone`,
          cancelUrl: `${window.location.origin}/one`
        }
      });

      if (paymentError) throw paymentError;

      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('trackCustom', 'BilingualClassRegistration', {
          content_name: 'Bilingual Power Class',
          value: 1,
          currency: 'USD'
        });
      }

      if (paymentData?.url) {
        window.location.href = paymentData.url;
      } else {
        throw new Error('Payment URL not received');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast({
        title: "خطا",
        description: "مشکلی پیش آمد، لطفا دوباره تلاش کنید",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOHead 
        title="قدرت دو زبانه - کلاس آنلاین تنها $1 | LadyBoss Academy"
        description="یاد بگیرید چطور در هر زبانی با قدرت و اعتماد به نفس حرف بزنید. کلاس ویژه زنان ایرانی مهاجر - فقط $1 برای 100 نفر اول"
        type="website"
      />
      <RecentRegistrations />
      <ExitIntentPopup onRegisterClick={() => setShowRegistrationForm(true)} />
      
      <div className="min-h-screen bg-gradient-to-br from-luxury-black via-luxury-charcoal to-luxury-accent font-farsi">
        {/* Hero Section - Above the Fold */}
        <div className="relative overflow-hidden">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-20 left-10 w-72 h-72 bg-secondary rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/50 rounded-full blur-3xl animate-pulse delay-1000"></div>
          </div>

          <div className="container mx-auto px-4 py-8 relative z-10">
            {/* Urgency Banner */}
            <div className="bg-secondary/20 border-2 border-secondary rounded-2xl p-4 mb-6 text-center backdrop-blur-sm animate-fade-in">
              <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-secondary animate-pulse" />
                  <span className="text-luxury-white font-bold">⏰ پیشنهاد محدود تمام می‌شود:</span>
                </div>
                <CountdownTimer targetDate={new Date('2025-12-31T23:59:59')} />
              </div>
              <SpotCounter />
            </div>

            {/* Main Hero Content */}
            <div className="max-w-5xl mx-auto text-center py-12">
              {/* Pre-headline */}
              <div className="inline-block bg-secondary/20 border border-secondary rounded-full px-6 py-2 mb-6 animate-fade-in">
                <span className="text-secondary font-bold">💎 ویژه زنان ایرانی مهاجر</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-luxury-white mb-6 leading-tight animate-fade-in">
                قدرت دو زبانه
                <br />
                <span className="text-secondary">زبان تو، پل قدرتت است</span>
                <br />
                <span className="text-2xl md:text-3xl text-luxury-silver/90">نه دیوار ترسش</span>
              </h1>

              {/* Subheadline */}
              <p className="text-xl md:text-2xl text-luxury-white/90 mb-8 max-w-3xl mx-auto leading-relaxed animate-fade-in">
                یاد بگیر در <span className="text-secondary font-bold">هر زبانی خودت باشی</span>،
                <br className="hidden md:block" />
                محترمانه ولی <span className="text-secondary font-bold">محکم صحبت کنی</span>،
                <br className="hidden md:block" />
                و با اعتماد‌به‌نفس در جامعه‌ی جدید <span className="text-secondary font-bold">بدرخشی</span>
              </p>

              {/* Price & Offer */}
              <div className="bg-luxury-white/10 backdrop-blur-md border-2 border-secondary rounded-3xl p-8 mb-8 max-w-2xl mx-auto animate-scale-in">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <span className="text-5xl md:text-7xl font-bold text-secondary">$1</span>
                  <div className="text-right">
                    <div className="text-luxury-silver/60 line-through text-2xl">$100</div>
                    <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold inline-block">
                      99% تخفیف
                    </div>
                  </div>
                </div>
                <p className="text-luxury-white/80 text-lg mb-4">
                  ✨ فقط برای <span className="text-secondary font-bold">100 نفر اول</span>
                </p>
                <p className="text-red-400 font-bold text-sm">
                  ⚠️ بعد از تکمیل ظرفیت، قیمت به $100 برمی‌گردد
                </p>
              </div>

              {/* Primary CTA */}
              <Button
                onClick={() => setShowRegistrationForm(true)}
                className="w-full md:w-auto px-12 py-8 text-2xl font-bold bg-secondary hover:bg-secondary-dark text-luxury-black rounded-2xl shadow-glow transform hover:scale-105 transition-all duration-300 mb-6 animate-pulse"
              >
                🚀 همین الان با $1 ثبت نام کن
              </Button>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-6 text-luxury-silver/80 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-secondary" />
                  <span>پرداخت 100% امن</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-secondary" />
                  <span>ضمانت بازگشت وجه</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-secondary" />
                  <span>بیش از 500+ زن توانمند</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-secondary fill-secondary" />
                  <span>4.9/5 امتیاز</span>
                </div>
              </div>
            </div>

            {/* Video/Image Section */}
            <div className="max-w-4xl mx-auto mb-12">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-secondary/30">
                <div className="aspect-video bg-luxury-charcoal flex items-center justify-center">
                  <div className="text-center p-8">
                    <Sparkles className="w-16 h-16 text-secondary mx-auto mb-4" />
                    <p className="text-luxury-white text-xl">🎥 ویدیوی معرفی کلاس</p>
                    <p className="text-luxury-silver/70 text-sm mt-2">(به زودی اضافه می‌شود)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Problem-Agitate Section */}
        <div className="bg-luxury-white/5 backdrop-blur-sm py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-luxury-white mb-6">
                آیا این چالش‌ها را تجربه کردی؟
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6 text-right">
                {[
                  "😔 وقتی صحبت می‌کنی، احساس می‌کنی شنیده نمی‌شوی",
                  "😰 از لهجه‌ات خجالت می‌کشی و ترجیح می‌دهی ساکت باشی",
                  "🤐 نمی‌دانی چطور «نه» بگویی بدون احساس گناه",
                  "😞 در محیط کاری احساس می‌کنی دیده نمی‌شوی",
                  "🤔 بین دو فرهنگ احساس گم‌شدگی می‌کنی",
                  "😣 می‌خواهی قاطع باشی اما نمی‌دانی چطور"
                ].map((problem, index) => (
                  <div 
                    key={index}
                    className="bg-luxury-white/10 border border-luxury-accent/20 rounded-2xl p-6 hover:border-secondary/50 transition-all"
                  >
                    <p className="text-luxury-white/90 text-lg">{problem}</p>
                  </div>
                ))}
              </div>

              <div className="mt-12 bg-secondary/20 border-2 border-secondary rounded-2xl p-8">
                <p className="text-2xl md:text-3xl font-bold text-secondary mb-4">
                  ✨ خبر خوب: همه اینها قابل تغییر است!
                </p>
                <p className="text-luxury-white/90 text-lg">
                  با کلاس «قدرت دو زبانه»، یاد می‌گیری چطور زبان را از مانع به <span className="text-secondary font-bold">ابزار قدرت</span> تبدیل کنی
                </p>
              </div>

              <Button
                onClick={() => setShowRegistrationForm(true)}
                className="mt-8 px-10 py-6 text-xl font-bold bg-secondary hover:bg-secondary-dark text-luxury-black rounded-xl shadow-glow transform hover:scale-105 transition-all"
              >
                ✅ می‌خواهم این تغییر را تجربه کنم
              </Button>
            </div>
          </div>
        </div>

        {/* What You'll Learn - 5 Modules */}
        <div className="py-16 bg-gradient-to-b from-transparent to-luxury-white/5">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-luxury-white mb-4">
                  🌿 در قدرت دو زبانه، چه یاد می‌گیری؟
                </h2>
                <p className="text-luxury-silver/80 text-xl">
                  5 زبان قدرت که زندگی‌ات را متحول می‌کند
                </p>
              </div>

              <div className="space-y-6">
                {/* Module 1 */}
                <div className="bg-luxury-white/10 backdrop-blur-sm border-2 border-secondary/30 rounded-3xl p-8 hover:border-secondary transition-all group">
                  <div className="flex items-start gap-6">
                    <div className="bg-secondary rounded-2xl p-4 group-hover:scale-110 transition-transform">
                      <Brain className="w-8 h-8 text-luxury-black" />
                    </div>
                    <div className="flex-1 text-right">
                      <h3 className="text-2xl md:text-3xl font-bold text-secondary mb-3">
                        ۱. زبان درونی قدرت
                      </h3>
                      <p className="text-luxury-white/80 text-lg mb-4 leading-relaxed">
                        زبان درونی تو یعنی طرز فکر، گفت‌وگو با خودت و روایت‌هایی که از خودت داری.
                      </p>
                      <div className="space-y-2 mb-4">
                        <p className="text-luxury-white/90">🔹 یاد می‌گیری:</p>
                        <ul className="space-y-2 text-luxury-silver/80">
                          <li>✓ چطور حرف‌های ذهنی منفی را خاموش و بازنویسی کنی</li>
                          <li>✓ واژه‌هایی که قدرت را می‌برند (مثل «نمی‌تونم») بشناسی و جایگزینشان کنی</li>
                          <li>✓ با خودت به زبان احترام حرف بزنی، نه به زبان ترس</li>
                        </ul>
                      </div>
                      <div className="bg-luxury-black/50 rounded-xl p-4 border border-secondary/20">
                        <p className="text-secondary font-bold mb-2">🧠 تمرین‌ها:</p>
                        <p className="text-luxury-silver/70 text-sm">
                          بازنویسی صدای درونی • کلمات ممنوعه در گفت‌وگوی ذهنی • چطور به خودم انرژی زبانی بدهم
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Module 2 */}
                <div className="bg-luxury-white/10 backdrop-blur-sm border-2 border-secondary/30 rounded-3xl p-8 hover:border-secondary transition-all group">
                  <div className="flex items-start gap-6">
                    <div className="bg-secondary rounded-2xl p-4 group-hover:scale-110 transition-transform">
                      <MessageCircle className="w-8 h-8 text-luxury-black" />
                    </div>
                    <div className="flex-1 text-right">
                      <h3 className="text-2xl md:text-3xl font-bold text-secondary mb-3">
                        ۲. زبان بیرونی قدرت (Communication Skills)
                      </h3>
                      <p className="text-luxury-white/80 text-lg mb-4 leading-relaxed">
                        چطور صحبت می‌کنی = چطور دیده می‌شوی.
                      </p>
                      <div className="space-y-2 mb-4">
                        <p className="text-luxury-white/90">🔹 در این بخش یاد می‌گیری:</p>
                        <ul className="space-y-2 text-luxury-silver/80">
                          <li>✓ ساختار جملات قاطع ولی محترمانه</li>
                          <li>✓ تکنیک‌های «نه گفتن» بدون احساس گناه</li>
                          <li>✓ نحوه‌ی شروع، ادامه و پایان گفت‌وگوهای سخت</li>
                          <li>✓ چطور در محیط کاری و اجتماعی با اعتماد به نفس حرف بزنی</li>
                          <li>✓ چطور لهجه‌ات را ابزار اصالت بدانی، نه ضعف</li>
                        </ul>
                      </div>
                      <div className="bg-luxury-black/50 rounded-xl p-4 border border-secondary/20">
                        <p className="text-secondary font-bold mb-2">💬 تمرین‌ها:</p>
                        <p className="text-luxury-silver/70 text-sm">
                          "I feel / I need / I propose" (فارسی و انگلیسی) • چطور درخواست کنم بدون عذرخواهی • معرفی مؤثر
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Module 3 */}
                <div className="bg-luxury-white/10 backdrop-blur-sm border-2 border-secondary/30 rounded-3xl p-8 hover:border-secondary transition-all group">
                  <div className="flex items-start gap-6">
                    <div className="bg-secondary rounded-2xl p-4 group-hover:scale-110 transition-transform">
                      <Globe className="w-8 h-8 text-luxury-black" />
                    </div>
                    <div className="flex-1 text-right">
                      <h3 className="text-2xl md:text-3xl font-bold text-secondary mb-3">
                        ۳. زبان فرهنگی (Cultural Language)
                      </h3>
                      <p className="text-luxury-white/80 text-lg mb-4 leading-relaxed">
                        وقتی مهاجرت می‌کنی، فقط کلمات عوض نمی‌شوند — قوانین ناگفته هم تغییر می‌کنند.
                      </p>
                      <div className="space-y-2 mb-4">
                        <p className="text-luxury-white/90">🔹 در این بخش یاد می‌گیری:</p>
                        <ul className="space-y-2 text-luxury-silver/80">
                          <li>✓ تفاوت سبک گفت‌وگو در فرهنگ میزبان (مثلاً آمریکایی) و فرهنگ خودت</li>
                          <li>✓ چطور بدون سوءتفاهم، احساساتت را بیان کنی</li>
                          <li>✓ آداب گفت‌وگو، مرزبندی، و assertiveness در محیط چندفرهنگی</li>
                        </ul>
                      </div>
                      <div className="bg-luxury-black/50 rounded-xl p-4 border border-secondary/20">
                        <p className="text-secondary font-bold mb-2">🌎 تمرین‌ها:</p>
                        <p className="text-luxury-silver/70 text-sm">
                          چطور در آمریکا 'نه' بگوییم • حضور محترمانه ولی فعال در جلسات • عبارات طلایی بین‌فرهنگی
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Module 4 */}
                <div className="bg-luxury-white/10 backdrop-blur-sm border-2 border-secondary/30 rounded-3xl p-8 hover:border-secondary transition-all group">
                  <div className="flex items-start gap-6">
                    <div className="bg-secondary rounded-2xl p-4 group-hover:scale-110 transition-transform">
                      <Mic className="w-8 h-8 text-luxury-black" />
                    </div>
                    <div className="flex-1 text-right">
                      <h3 className="text-2xl md:text-3xl font-bold text-secondary mb-3">
                        ۴. زبان حضور (Body Language & Voice)
                      </h3>
                      <p className="text-luxury-white/80 text-lg mb-4 leading-relaxed">
                        قدرت فقط در کلمات نیست — در لحن و بدن توست.
                      </p>
                      <div className="space-y-2 mb-4">
                        <p className="text-luxury-white/90">🔹 یاد می‌گیری:</p>
                        <ul className="space-y-2 text-luxury-silver/80">
                          <li>✓ تن صدای محکم، آرام، و مطمئن بسازی</li>
                          <li>✓ با زبان بدن اعتمادبه‌نفس را منتقل کنی</li>
                          <li>✓ حضور فیزیکی و ذهنی داشته باشی وقتی صحبت می‌کنی</li>
                        </ul>
                      </div>
                      <div className="bg-luxury-black/50 rounded-xl p-4 border border-secondary/20">
                        <p className="text-secondary font-bold mb-2">🎤 تمرین‌ها:</p>
                        <p className="text-luxury-silver/70 text-sm">
                          چطور بایستم تا قاطع به‌نظر برسم • تمرین صدای آرام ولی مقتدر • میکروحرکات قدرت
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Module 5 */}
                <div className="bg-luxury-white/10 backdrop-blur-sm border-2 border-secondary/30 rounded-3xl p-8 hover:border-secondary transition-all group">
                  <div className="flex items-start gap-6">
                    <div className="bg-secondary rounded-2xl p-4 group-hover:scale-110 transition-transform">
                      <Zap className="w-8 h-8 text-luxury-black" />
                    </div>
                    <div className="flex-1 text-right">
                      <h3 className="text-2xl md:text-3xl font-bold text-secondary mb-3">
                        ۵. زبان تأثیر (Influence & Storytelling)
                      </h3>
                      <p className="text-luxury-white/80 text-lg mb-4 leading-relaxed">
                        در آخر، یاد می‌گیری چطور از زبانت برای الهام دادن، متقاعد کردن، و ساختن جایگاه شخصی استفاده کنی.
                      </p>
                      <div className="space-y-2 mb-4">
                        <p className="text-luxury-white/90">🔹 تمرکز روی:</p>
                        <ul className="space-y-2 text-luxury-silver/80">
                          <li>✓ روایت شخصی و storytelling</li>
                          <li>✓ گفت‌وگوهایی که اعتماد می‌سازند، نه فقط اطلاعات</li>
                          <li>✓ چطور با زبان، رابطه و فرصت بسازی</li>
                        </ul>
                      </div>
                      <div className="bg-luxury-black/50 rounded-xl p-4 border border-secondary/20">
                        <p className="text-secondary font-bold mb-2">🪶 تمرین‌ها:</p>
                        <p className="text-luxury-silver/70 text-sm">
                          داستان مهاجرت من • سه جمله‌ای که برند شخصی مرا می‌سازد • چطور حرفم اثر بگذارد
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 text-center">
                <Button
                  onClick={() => setShowRegistrationForm(true)}
                  className="px-12 py-7 text-2xl font-bold bg-secondary hover:bg-secondary-dark text-luxury-black rounded-2xl shadow-glow transform hover:scale-105 transition-all animate-pulse"
                >
                  🎯 می‌خواهم این 5 زبان قدرت را یاد بگیرم - فقط $1
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Transformation/Results Section */}
        <div className="bg-luxury-white/5 backdrop-blur-sm py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-bold text-luxury-white mb-4">
                  💫 نتیجه‌ای که تجربه می‌کنی
                </h2>
                <p className="text-luxury-silver/80 text-xl">
                  بعد از این کلاس، زندگی‌ات اینطور می‌شود:
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    icon: <Heart className="w-12 h-12 text-secondary" />,
                    title: "لهجه‌ات، امضای توست",
                    desc: "دیگر محدودیت نیست، امضای اوست"
                  },
                  {
                    icon: <TrendingUp className="w-12 h-12 text-secondary" />,
                    title: "حضور با قدرت",
                    desc: "می‌تواند در هر گفت‌وگویی با احترام و قاطعیت حضور داشته باشد"
                  },
                  {
                    icon: <Sparkles className="w-12 h-12 text-secondary" />,
                    title: "بدون ترس از قضاوت",
                    desc: "دیگر از قضاوت، سکوت، یا اشتباه در زبان دوم نمی‌ترسد"
                  }
                ].map((result, index) => (
                  <div 
                    key={index}
                    className="bg-luxury-white/10 backdrop-blur-sm border-2 border-secondary/30 rounded-3xl p-8 text-center hover:border-secondary hover:transform hover:scale-105 transition-all"
                  >
                    <div className="mb-6 flex justify-center">
                      {result.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-secondary mb-3">
                      {result.title}
                    </h3>
                    <p className="text-luxury-white/80 leading-relaxed">
                      {result.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-12 bg-gradient-to-r from-secondary/20 via-secondary/30 to-secondary/20 border-2 border-secondary rounded-3xl p-10 text-center">
                <h3 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
                  زبانت، پل قدرتت می‌شود
                </h3>
                <p className="text-2xl text-luxury-white/90 mb-6">
                  نه دیوار ترسش ✨
                </p>
                <Button
                  onClick={() => setShowRegistrationForm(true)}
                  className="px-10 py-6 text-xl font-bold bg-secondary hover:bg-secondary-dark text-luxury-black rounded-xl shadow-glow transform hover:scale-105 transition-all"
                >
                  🚀 من آماده‌ی این تحول هستم
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Instructor Bio */}
        <InstructorBio />

        {/* Testimonials */}
        <TestimonialsSection />

        {/* FAQ Section */}
        <FAQSection />

        {/* Bonus Materials */}
        <BonusMaterialsSection />

        {/* Final CTA Section - Stronger Close */}
        <div className="bg-gradient-to-br from-secondary/20 via-secondary/10 to-transparent py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-luxury-white mb-6">
                ⏰ زمان تصمیم‌گیری رسیده
              </h2>
              
              <p className="text-2xl text-luxury-silver/90 mb-8">
                دو راه پیش روت هست...
              </p>

              <div className="grid md:grid-cols-2 gap-8 mb-12">
                {/* Option 1 - Take Action */}
                <div className="bg-secondary/20 border-4 border-secondary rounded-3xl p-8 transform hover:scale-105 transition-all">
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-2xl font-bold text-secondary mb-4">همین الان عمل کن</h3>
                  <ul className="space-y-3 text-right text-luxury-white/90 mb-6">
                    <li>✨ 5 زبان قدرت را یاد بگیر</li>
                    <li>💪 با اعتماد‌به‌نفس صحبت کن</li>
                    <li>🚀 در محیط کار بدرخش</li>
                    <li>🎁 بونوس $20 رایگان</li>
                    <li>💰 فقط $1 (به‌جای $100)</li>
                  </ul>
                  <p className="text-secondary font-bold text-lg">
                    = زندگی بهتر، قدرتمندتر، موفق‌تر
                  </p>
                </div>

                {/* Option 2 - Do Nothing */}
                <div className="bg-luxury-white/5 border-2 border-luxury-accent/20 rounded-3xl p-8 opacity-70">
                  <div className="text-6xl mb-4">❌</div>
                  <h3 className="text-2xl font-bold text-luxury-white/70 mb-4">هیچ کاری نکن</h3>
                  <ul className="space-y-3 text-right text-luxury-white/60 mb-6">
                    <li>😔 همچنان شنیده نشوی</li>
                    <li>😰 از لهجه‌ات خجالت بکشی</li>
                    <li>🤐 نتوانی «نه» بگویی</li>
                    <li>😞 در محیط کار نادیده بمانی</li>
                    <li>💸 بعداً $100 بپردازی</li>
                  </ul>
                  <p className="text-luxury-white/50 font-bold text-lg">
                    = همان مشکلات، همان ترس‌ها
                  </p>
                </div>
              </div>

              <div className="bg-red-500/20 border-2 border-red-500 rounded-2xl p-6 mb-8 animate-pulse">
                <p className="text-red-400 font-bold text-2xl mb-3">
                  ⚠️ هشدار: فقط چند جای خالی باقی مانده!
                </p>
                <SpotCounter />
                <div className="mt-4">
                  <CountdownTimer targetDate={new Date('2025-12-31T23:59:59')} />
                </div>
              </div>

              <Button
                onClick={() => setShowRegistrationForm(true)}
                className="w-full md:w-auto px-16 py-10 text-3xl font-bold bg-secondary hover:bg-secondary-dark text-luxury-black rounded-2xl shadow-glow transform hover:scale-110 transition-all animate-pulse mb-6"
              >
                🚀 بله! انتخاب من تحول است - ثبت نام با $1
              </Button>

              <p className="text-luxury-silver/60 text-sm mb-8">
                ✓ پرداخت 100% امن | ✓ ضمانت 7 روزه بازگشت وجه | ✓ دسترسی فوری
              </p>

              <div className="bg-luxury-white/10 backdrop-blur-sm rounded-2xl p-8 border border-secondary/30">
                <p className="text-luxury-white/90 text-lg italic leading-relaxed">
                  "بهترین سرمایه‌گذاری، سرمایه‌گذاری روی خودت است.
                  <br />
                  <span className="text-secondary font-bold">فقط $1 می‌تواند آینده‌ات را تغییر دهد.</span>"
                </p>
              </div>

              <div className="flex items-center justify-center gap-8 text-luxury-silver/70 mt-8">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-secondary" />
                  <span>SSL Encrypted</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-secondary" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-secondary" />
                  <span>Stripe Powered</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom CTA for Mobile - Enhanced */}
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-luxury-black via-luxury-charcoal to-luxury-black border-t-4 border-secondary p-3 z-50 md:hidden shadow-2xl">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="text-right flex-1">
              <p className="text-secondary font-bold text-sm">فقط $1 • 73 جا باقی</p>
              <p className="text-luxury-white/70 text-xs">قیمت به زودی $100 می‌شود</p>
            </div>
            <div className="bg-red-500/20 rounded-full px-3 py-1 animate-pulse">
              <Clock className="w-4 h-4 text-red-400 inline" />
              <span className="text-red-400 text-xs font-bold ml-1">محدود</span>
            </div>
          </div>
          <Button
            onClick={() => setShowRegistrationForm(true)}
            className="w-full py-6 text-lg font-bold bg-secondary hover:bg-secondary-dark text-luxury-black rounded-xl shadow-glow transform active:scale-95 transition-all"
          >
            🚀 ثبت نام فوری
          </Button>
        </div>
      </div>

      {/* Registration Modal */}
      <Dialog open={showRegistrationForm} onOpenChange={setShowRegistrationForm}>
        <DialogContent className="sm:max-w-md bg-luxury-white border-4 border-secondary shadow-2xl">
          <DialogHeader className="text-center">
            <DialogTitle className="text-3xl font-bold text-luxury-black mb-3 font-farsi">
              💎 ثبت نام در کلاس قدرت دوزبانه
            </DialogTitle>
            <div className="bg-secondary/10 border-2 border-secondary rounded-xl p-4 mb-3">
              <p className="text-secondary font-bold text-2xl mb-1">
                فقط $1
              </p>
              <p className="text-luxury-accent/70 font-farsi text-sm">
                برای 100 نفر اول • قیمت اصلی: $100
              </p>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            <div className="space-y-2">
              <Label htmlFor="modal-name" className="text-left block text-luxury-black font-medium">
                Your Name
              </Label>
              <Input
                id="modal-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your Name"
                required
                className="text-left h-12 border-2 border-luxury-accent/20 focus:border-secondary bg-luxury-white"
                dir="ltr"
              />
              {validationErrors.name && (
                <p className="text-red-500 text-sm">{validationErrors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="modal-email" className="text-left block text-luxury-black font-medium">
                Your Email
              </Label>
              <Input
                id="modal-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                className="text-left h-12 border-2 border-luxury-accent/20 focus:border-secondary bg-luxury-white"
                dir="ltr"
              />
              {validationErrors.email && (
                <p className="text-red-500 text-sm">{validationErrors.email}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-lg font-bold bg-secondary hover:bg-secondary-dark text-luxury-black font-farsi transition-all duration-300 transform hover:scale-105 shadow-glow"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'در حال ارسال...' : '✅ ادامه به پرداخت $1'}
            </Button>
          </form>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-center gap-6 text-luxury-accent/70 text-xs">
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-secondary" />
                <span>پرداخت امن</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-secondary" />
                <span>SSL Protected</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-secondary" />
                <span>ضمانت بازگشت وجه</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default One;
