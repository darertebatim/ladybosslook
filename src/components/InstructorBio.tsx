import { Award, Users, BookOpen, TrendingUp } from 'lucide-react';

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
                  رزیه مرادی - بنیانگذار LadyBoss Academy
                </h3>
                <p className="text-luxury-silver/90 leading-relaxed font-farsi">
                  رزیه خودش یک زن مهاجر ایرانی است که مسیر شما را طی کرده. او با تجربه بیش از 10 سال در حوزه توسعه فردی و کسب‌وکار، به صدها زن کمک کرده تا با اعتماد به نفس در زندگی جدیدشان موفق شوند.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-bold text-luxury-white font-farsi">بیش از 500+ زن توانمند شده</p>
                    <p className="text-luxury-silver/70 text-sm font-farsi">در کانادا، آمریکا، و اروپا</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-bold text-luxury-white font-farsi">مدارک معتبر بین‌المللی</p>
                    <p className="text-luxury-silver/70 text-sm font-farsi">در حوزه کوچینگ و توسعه فردی</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-bold text-luxury-white font-farsi">نویسنده و سخنران</p>
                    <p className="text-luxury-silver/70 text-sm font-farsi">در زمینه توانمندسازی زنان مهاجر</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-bold text-luxury-white font-farsi">نرخ موفقیت بالا</p>
                    <p className="text-luxury-silver/70 text-sm font-farsi">4.9/5 رضایت شرکت‌کنندگان</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Image/Quote Section */}
            <div className="bg-luxury-white/10 backdrop-blur-sm border border-secondary/20 rounded-2xl p-8">
              <div className="mb-6">
                <div className="w-32 h-32 bg-secondary rounded-full mx-auto flex items-center justify-center mb-4">
                  <span className="text-6xl">👩‍💼</span>
                </div>
              </div>

              <blockquote className="text-luxury-white/90 italic text-center font-farsi leading-relaxed">
                "من می‌دونم که احساس می‌کنید بین دو دنیا معلقید. من هم همین احساس رو داشتم. ولی یاد گرفتم که این یک ضعف نیست، بلکه یک قدرت فوق‌العاده است. بیایید با هم این قدرت رو کشف کنیم."
              </blockquote>

              <p className="text-secondary font-bold text-center mt-6 font-farsi">
                - رزیه مرادی
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorBio;
