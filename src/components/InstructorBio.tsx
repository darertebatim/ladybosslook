import { Award, Users, BookOpen, TrendingUp } from 'lucide-react';
import razieImage from '@/assets/razie-6.jpg';

const InstructorBio = () => {
  return (
    <div className="bg-gradient-to-br from-luxury-charcoal to-luxury-black py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-luxury-white mb-4 font-farsi">
              👩‍🏫 درباره مدرس
            </h2>
            <p className="text-luxury-silver/90 text-lg font-farsi">
              با راهنمایی که خودش این مسیر را طی کرده
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Bio Text */}
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-secondary mb-3 font-farsi">
                  راضیه میرزایی - بنیانگذار LadyBoss Academy
                </h3>
                <p className="text-luxury-silver/90 leading-relaxed font-farsi">
                  راضیه خودش یک زن مهاجر ایرانی است که از یک آژانس مشاوره کوچک تا توانمندسازی بیش از 264,000 زن در سراسر جهان را تجربه کرده. او با بیش از 2.7 میلیون فالوور در اینستاگرام و سال‌ها تجربه در حوزه توسعه فردی، به هزاران زن کمک کرده تا با اعتماد به نفس کامل در زندگی جدیدشان موفق شوند.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-bold text-luxury-white font-farsi">بیش از 264,000 زن توانمند شده</p>
                    <p className="text-luxury-silver/70 text-sm font-farsi">در کانادا، آمریکا، اروپا و سراسر جهان</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-bold text-luxury-white font-farsi">2.7 میلیون فالوور اینستاگرام</p>
                    <p className="text-luxury-silver/70 text-sm font-farsi">یکی از تاثیرگذارترین مربیان زنان</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-bold text-luxury-white font-farsi">120,000+ زن آموزش دیده</p>
                    <p className="text-luxury-silver/70 text-sm font-farsi">در برنامه‌های موفقیت کسب‌وکار</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-bold text-luxury-white font-farsi">نرخ موفقیت بالا</p>
                    <p className="text-luxury-silver/70 text-sm font-farsi">5,000+ داستان موفقیت</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Image/Quote Section */}
            <div className="bg-luxury-white/10 backdrop-blur-sm border border-secondary/20 rounded-2xl p-8">
              <div className="mb-6">
                <div className="w-48 h-48 mx-auto rounded-2xl overflow-hidden mb-4 border-4 border-secondary/30">
                  <img 
                    src={razieImage} 
                    alt="راضیه میرزایی - Razieh Mirzaei"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <blockquote className="text-luxury-white/90 italic text-center font-farsi leading-relaxed">
                "من می‌دونم که احساس می‌کنید بین دو دنیا معلقید. من هم همین احساس رو داشتم. ولی یاد گرفتم که این یک ضعف نیست، بلکه یک قدرت فوق‌العاده است. بیایید با هم این قدرت رو کشف کنیم."
              </blockquote>

              <p className="text-secondary font-bold text-center mt-6 font-farsi">
                - راضیه میرزایی
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorBio;
