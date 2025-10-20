import { FileText, Video, Headphones, BookOpen } from 'lucide-react';

const BonusMaterialsSection = () => {
  const bonuses = [
    {
      icon: <FileText className="w-8 h-8" />,
      title: "راهنمای جامع دوزبانگی",
      value: "$27",
      description: "یک کتاب الکترونیکی ۵۰ صفحه‌ای با تمرینات عملی"
    },
    {
      icon: <Video className="w-8 h-8" />,
      title: "دسترسی مادام‌العمر به ضبط",
      value: "$47",
      description: "تماشای نامحدود کلاس و بازبینی مطالب"
    },
    {
      icon: <Headphones className="w-8 h-8" />,
      title: "پادکست‌های انگیزشی",
      value: "$17",
      description: "۵ اپیزود ویژه برای زنان مهاجر"
    },
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: "چک‌لیست موفقیت روزانه",
      value: "$12",
      description: "برنامه‌ریزی ۳۰ روزه برای تحول"
    }
  ];

  const totalValue = 27 + 47 + 17 + 12;

  return (
    <div className="bg-gradient-to-br from-secondary/10 to-luxury-white/95 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-luxury-black mb-4 font-farsi">
              🎁 بونوس‌های ویژه شما
            </h2>
            <p className="text-luxury-accent/80 text-lg font-farsi">
              به ارزش <span className="text-secondary font-bold text-2xl">${totalValue}</span> - کاملاً رایگان با ثبت نام
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            {bonuses.map((bonus, index) => (
              <div 
                key={index}
                className="bg-luxury-white border-2 border-secondary/30 rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:transform hover:scale-105"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center text-luxury-black flex-shrink-0">
                    {bonus.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-luxury-black font-farsi">{bonus.title}</h3>
                      <span className="bg-secondary text-luxury-black font-bold px-3 py-1 rounded-full text-sm">
                        {bonus.value}
                      </span>
                    </div>
                    <p className="text-luxury-accent/70 text-sm font-farsi">{bonus.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total Value Box */}
          <div className="bg-gradient-luxury border-4 border-secondary rounded-2xl p-8 text-center">
            <p className="text-luxury-silver/90 text-lg mb-2 font-farsi">
              ارزش کل پکیج کامل:
            </p>
            <p className="text-luxury-white text-5xl font-bold mb-2 line-through decoration-red-500">
              ${totalValue + 100}
            </p>
            <p className="text-secondary text-6xl font-bold mb-4 animate-pulse">
              $1
            </p>
            <p className="text-luxury-white text-xl font-farsi">
              برای ۱۰۰ نفر اول - <span className="text-secondary font-bold">۹۹% تخفیف!</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BonusMaterialsSection;
