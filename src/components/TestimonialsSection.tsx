import { Star } from 'lucide-react';

const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "سارا محمدی",
      location: "تورنتو، کانادا",
      text: "این کلاس برای من یک تحول واقعی بود. حالا می‌تونم با اعتماد به نفس کامل در محیط کار حرف بزنم.",
      rating: 5,
      result: "ارتقای شغلی پس از 3 ماه"
    },
    {
      name: "Maryam K.",
      location: "Los Angeles, USA",
      text: "I finally understood how to use both languages powerfully. My networking improved dramatically!",
      rating: 5,
      result: "Started her own business"
    },
    {
      name: "نگار رحمانی",
      location: "لندن، انگلستان",
      text: "خیلی کاربردی بود. الان دیگه احساس نمی‌کنم بین دو فرهنگ گم شدم. هر دو رو به نفع خودم استفاده می‌کنم.",
      rating: 5,
      result: "بهبود روابط خانوادگی و کاری"
    }
  ];

  return (
    <div className="bg-gradient-to-br from-luxury-black via-luxury-charcoal to-luxury-accent py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-luxury-white mb-4 font-farsi">
            ⭐ نظرات شرکت‌کنندگان قبلی
          </h2>
          <p className="text-luxury-silver/90 text-lg font-farsi">
            ببینید دیگران چه تحولی را تجربه کردند
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-luxury-white/10 backdrop-blur-sm border border-secondary/20 rounded-2xl p-6 hover:transform hover:scale-105 transition-all duration-300"
            >
              {/* Rating Stars */}
              <div className="flex gap-1 mb-4 justify-center">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-secondary text-secondary" />
                ))}
              </div>

              {/* Testimonial Text */}
              <p className="text-luxury-white/90 mb-4 italic font-farsi text-center leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Result Badge */}
              <div className="bg-secondary/20 border border-secondary/40 rounded-lg py-2 px-3 mb-4">
                <p className="text-secondary font-bold text-sm text-center font-farsi">
                  ✅ {testimonial.result}
                </p>
              </div>

              {/* Name & Location */}
              <div className="text-center">
                <p className="font-bold text-luxury-white font-farsi">{testimonial.name}</p>
                <p className="text-luxury-silver/70 text-sm font-farsi">{testimonial.location}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Badge */}
        <div className="text-center mt-12">
          <p className="text-secondary font-bold text-xl font-farsi">
            ⭐ رتبه 4.9 از 5 - بیش از 500+ زن توانمند
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestimonialsSection;
