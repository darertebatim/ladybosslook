import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const RefundPolicy = () => {
  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <SEOHead 
        title="سیاست بازگشت وجه | LadyBoss Academy"
        description="سیاست بازگشت وجه و ضمانت نامه دوره‌های آموزشی لیدی باس آکادمی"
      />
      
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        {/* Back to Home Link */}
        <Link 
          to="/" 
          className="inline-flex items-center text-primary hover:text-primary/80 mb-8 transition-colors"
        >
          <ArrowRight className="ml-2" size={20} />
          بازگشت به صفحه اصلی
        </Link>

        <header className="mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4 font-farsi">
            سیاست بازگشت وجه
          </h1>
          <p className="text-muted-foreground text-lg font-farsi">
            <strong>تاریخ به‌روزرسانی:</strong> دی ۱۴۰۳
          </p>
        </header>

        <main className="prose prose-lg max-w-none font-farsi">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4 font-farsi">
              گارانتی بازگشت وجه
            </h2>
            <p className="text-foreground/80 mb-6 leading-relaxed">
              در لیدی باس آکادمی، ما به کیفیت دوره‌های آموزشی خود اطمینان کامل داریم. به همین دلیل، برای تمامی دوره‌های پولی خود، گارانتی بازگشت وجه بدون سوال ارائه می‌دهیم.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4 font-farsi">
              شرایط بازگشت وجه
            </h2>
            
            <div className="space-y-6 mb-6">
              <div className="bg-muted p-6 rounded-lg">
                <h3 className="text-xl font-medium text-foreground mb-3 font-farsi">
                  دوره‌های یک ماهه
                </h3>
                <p className="text-foreground/80 leading-relaxed">
                  برای دوره‌های یک ماهه، می‌توانید تا پایان دوره (۳۰ روز از تاریخ خرید)، درخواست بازگشت وجه خود را بدون هیچ سوال و توضیحی ارسال کنید. در صورت درخواست، کل مبلغ پرداختی به حساب شما بازگردانده خواهد شد.
                </p>
              </div>

              <div className="bg-muted p-6 rounded-lg">
                <h3 className="text-xl font-medium text-foreground mb-3 font-farsi">
                  دوره‌های سه ماهه و بلندمدت‌تر
                </h3>
                <p className="text-foreground/80 leading-relaxed">
                  برای دوره‌های سه ماهه و بلندمدت‌تر، می‌توانید تا ۳۰ روز از تاریخ خرید، درخواست بازگشت وجه خود را ارسال کنید. این فرصت به شما امکان می‌دهد تا دوره را امتحان کرده و مطمئن شوید که با نیازهای شما مطابقت دارد.
                </p>
              </div>

              <div className="bg-muted p-6 rounded-lg">
                <h3 className="text-xl font-medium text-foreground mb-3 font-farsi">
                  جلسات کوچینگ خصوصی
                </h3>
                <p className="text-foreground/80 leading-relaxed">
                  برای جلسات کوچینگ خصوصی، در صورت عدم رضایت از جلسه اول، می‌توانید تا ۷۲ ساعت پس از برگزاری جلسه، درخواست بازگشت وجه کنید. برای جلسات بعدی، امکان بازگشت وجه وجود ندارد.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4 font-farsi">
              نحوه درخواست بازگشت وجه
            </h2>
            <p className="text-foreground/80 mb-4 leading-relaxed">
              برای درخواست بازگشت وجه، کافی است به یکی از روش‌های زیر اقدام کنید:
            </p>
            <ul className="list-disc pr-6 space-y-3 text-foreground/80 mb-6">
              <li className="leading-relaxed">
                ارسال ایمیل به آدرس:{" "}
                <a href="mailto:support@ladybosslook.com" className="text-primary hover:underline">
                  support@ladybosslook.com
                </a>
              </li>
              <li className="leading-relaxed">
                تماس با شماره:{" "}
                <a href="tel:+16265028538" className="text-primary hover:underline" dir="ltr">
                  +1 (626) 502-8538
                </a>
              </li>
              <li className="leading-relaxed">
                ارسال پیام از طریق واتساپ به شماره فوق
              </li>
            </ul>
            <p className="text-foreground/80 mb-6 leading-relaxed">
              لطفاً در درخواست خود، نام و ایمیل ثبت‌نامی و نام دوره‌ای که خریداری کرده‌اید را ذکر کنید.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4 font-farsi">
              زمان بازگشت وجه
            </h2>
            <p className="text-foreground/80 mb-4 leading-relaxed">
              پس از دریافت درخواست شما:
            </p>
            <ul className="list-disc pr-6 space-y-2 text-foreground/80 mb-6">
              <li className="leading-relaxed">
                درخواست شما ظرف ۲۴ تا ۴۸ ساعت بررسی و تأیید می‌شود
              </li>
              <li className="leading-relaxed">
                وجه به حساب شما ظرف ۵ تا ۱۰ روز کاری بازگردانده می‌شود
              </li>
              <li className="leading-relaxed">
                زمان دقیق بازگشت وجه به روش پرداخت اولیه شما بستگی دارد
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4 font-farsi">
              استثنائات
            </h2>
            <p className="text-foreground/80 mb-4 leading-relaxed">
              موارد زیر مشمول گارانتی بازگشت وجه نمی‌شوند:
            </p>
            <ul className="list-disc pr-6 space-y-2 text-foreground/80 mb-6">
              <li className="leading-relaxed">
                دوره‌های رایگان و وبینارهای مجانی
              </li>
              <li className="leading-relaxed">
                محصولات دیجیتال دانلودی که بیش از ۵۰٪ آن‌ها دانلود شده باشد
              </li>
              <li className="leading-relaxed">
                درخواست‌های خارج از بازه زمانی مشخص شده
              </li>
              <li className="leading-relaxed">
                تخلفات در شرایط استفاده یا نقض قوانین آکادمی
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4 font-farsi">
              تعهد ما به شما
            </h2>
            <p className="text-foreground/80 mb-6 leading-relaxed">
              ما در لیدی باس آکادمی به ارائه بهترین تجربه آموزشی متعهدیم. هدف ما موفقیت شماست، نه فقط فروش دوره. اگر احساس می‌کنید که دوره ما با نیازها و انتظارات شما مطابقت ندارد، به راحتی می‌توانید درخواست بازگشت وجه کنید.
            </p>
            <p className="text-foreground/80 mb-6 leading-relaxed">
              البته، قبل از تصمیم‌گیری برای بازگشت وجه، توصیه می‌کنیم با تیم پشتیبانی ما در تماس باشید. ما همیشه آماده‌ایم تا به سؤالات شما پاسخ دهیم و راهنمایی‌های لازم را برای بهره‌برداری بهتر از دوره ارائه کنیم.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4 font-farsi">
              تغییرات در سیاست
            </h2>
            <p className="text-foreground/80 mb-6 leading-relaxed">
              ما حق داریم این سیاست بازگشت وجه را در هر زمان تغییر دهیم. تغییرات از تاریخ انتشار در این صفحه اعمال می‌شود. خریدهای قبلی مشمول سیاست زمان خرید خواهند بود.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground mb-4 font-farsi">
              تماس با ما
            </h2>
            <p className="text-foreground/80 mb-4 leading-relaxed">
              اگر سؤال یا ابهامی در مورد سیاست بازگشت وجه دارید، لطفاً با ما تماس بگیرید:
            </p>
            <div className="bg-muted p-6 rounded-lg">
              <p className="text-foreground font-medium mb-2 font-farsi">لیدی باس آکادمی</p>
              <p className="text-foreground/80 mb-1" dir="ltr">2403 Elements Way # 2403</p>
              <p className="text-foreground/80 mb-1" dir="ltr">Irvine CA US 92612-1536</p>
              <p className="text-foreground/80 mb-2">
                ایمیل:{" "}
                <a href="mailto:support@ladybosslook.com" className="text-primary hover:underline">
                  support@ladybosslook.com
                </a>
              </p>
              <p className="text-foreground/80">
                تلفن:{" "}
                <a href="tel:+16265028538" className="text-primary hover:underline" dir="ltr">
                  +1 (626) 502-8538
                </a>
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default RefundPolicy;
