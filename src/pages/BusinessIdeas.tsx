import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CheckCircle, Shield, Users, Lightbulb } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';

const BusinessIdeas = () => {
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    console.log('Phone:', phone);
  };

  return (
    <>
      <SEOHead />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Badge */}
        <div className="text-center mb-8">
          <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
            رایگان و فوری
          </span>
        </div>

        {/* Main Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-purple-600">۱۰۱</span> ایده
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              راه‌اندازی کسب‌وکار
            </span>
            <br />
            <span className="text-gray-700 dark:text-gray-300">
              برای مهاجران ایرانی در آمریکا و کانادا
            </span>
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
            آیا تا حالا فکر کرده‌اید که چطور می‌تونید در آمریکا یا کانادا کسب‌وکار راه‌اندازی کنید؟ 
            این بوکلت ۱۰۱ ایده عملی و آسان برای شروع زندگی جدیدتون داره 💡
          </p>
        </div>

        {/* Main Form Card */}
        <Card className="max-w-md mx-auto p-8 shadow-xl bg-white dark:bg-gray-800 mb-12">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold mb-2 flex items-center justify-center">
              📱 همین الان بوکلت رو دریافت کنید!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              فقط شماره تلفنتون رو وارد کنید تا بوکلت رایگان براتون بفرستیم
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="tel"
              placeholder="شماره تلفن (مثال: +1 800 567 234)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="text-center"
              dir="ltr"
            />
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              📥 همین الان بوکلت رو برام بفرست!
            </Button>
          </form>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
            با ارسال شماره تلفن، شما موافقت می‌کنید که پیامک‌های مفید دریافت کنید. 
            هر زمان که بخواهید می‌تونید لغو کنید.
          </p>
        </Card>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="bg-blue-100 dark:bg-blue-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-bold text-lg mb-2">ایده‌های آسان و عملی</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              هر ایده با راهنمای گام‌به‌گام و بدون نیاز به سرمایه زیاد
            </p>
          </div>

          <div className="text-center">
            <div className="bg-yellow-100 dark:bg-yellow-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="font-bold text-lg mb-2">مخصوص مهاجران</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              تمام ایده‌ها برای شرایط خاص مهاجران ایرانی طراحی شده
            </p>
          </div>

          <div className="text-center">
            <div className="bg-purple-100 dark:bg-purple-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-bold text-lg mb-2">تست شده و موثر</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              همه این ایده‌ها توسط مهاجران موفق امتحان شده
            </p>
          </div>
        </div>

        {/* What You'll Find Section */}
        <Card className="p-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 mb-12">
          <h2 className="text-2xl font-bold text-center mb-8">در این بوکلت چی پیدا می‌کنید؟</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3 space-x-reverse">
                <Lightbulb className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
                <p className="text-gray-700 dark:text-gray-300">
                  ۱۰۱ ایده کسب‌وکار که با کمترین سرمایه شروع می‌شن
                </p>
              </div>
              
              <div className="flex items-start space-x-3 space-x-reverse">
                <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <p className="text-gray-700 dark:text-gray-300">
                  راهنمای گام‌به‌گام برای هر کسب‌وکار
                </p>
              </div>
              
              <div className="flex items-start space-x-3 space-x-reverse">
                <Users className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
                <p className="text-gray-700 dark:text-gray-300">
                  نکات مخصوص مهاجران فارسی زبان
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3 space-x-reverse">
                <Shield className="w-6 h-6 text-purple-600 mt-1 flex-shrink-0" />
                <p className="text-gray-700 dark:text-gray-300">
                  داستان‌های موفقیت مهاجران ایرانی
                </p>
              </div>
              
              <div className="flex items-start space-x-3 space-x-reverse">
                <Lightbulb className="w-6 h-6 text-orange-600 mt-1 flex-shrink-0" />
                <p className="text-gray-700 dark:text-gray-300">
                  لیست منابع و ابزارهای رایگان برای شروع
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Bottom CTA */}
        <div className="text-center">
          <h3 className="text-xl font-bold mb-4">📱 همین الان بوکلت رو دریافت کنید!</h3>
          <Button 
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            onClick={() => document.querySelector('input[type="tel"]')?.scrollIntoView({ behavior: 'smooth' })}
          >
            دریافت رایگان بوکلت
          </Button>
        </div>
      </div>
    </div>
    </>
  );
};

export default BusinessIdeas;