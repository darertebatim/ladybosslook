import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQSection = () => {
  const faqs = [
    {
      question: "این کلاس دقیقاً چه چیزی یاد می‌دهد؟",
      answer: "این کلاس به شما کمک می‌کند تا با اعتماد به نفس در دو فرهنگ حضور داشته باشید، مهارت‌های ارتباطی قدرتمند در محیط کار و اجتماع بسازید، و از قدرت دوزبانه بودن به عنوان یک مزیت استراتژیک استفاده کنید."
    },
    {
      question: "آیا این کلاس فقط درباره زبان انگلیسی است؟",
      answer: "خیر! این کلاس درباره قدرت استفاده از دو زبان و دو فرهنگ است. یاد می‌گیرید چگونه هویت فرهنگی خود را حفظ کنید و در عین حال در جامعه جدید موفق باشید."
    },
    {
      question: "چرا قیمت فقط ۱ دلار است؟",
      answer: "ما می‌خواهیم این آموزش را برای ۱۰۰ زن اول در دسترس قرار دهیم. بعد از تکمیل ظرفیت، قیمت به ۱۰۰ دلار افزایش پیدا می‌کند. این یک پیشنهاد محدود برای کسانی است که سریع عمل می‌کنند."
    },
    {
      question: "How long is the class?",
      answer: "The online class is approximately 90 minutes of intensive, practical training. You'll also receive lifetime access to the recording and bonus materials."
    },
    {
      question: "آیا برای کسی که سال‌ها در خارج زندگی کرده هم مفید است؟",
      answer: "بله، حتماً! بسیاری از زنان مهاجر حتی بعد از سال‌ها هنوز با چالش‌های هویتی و ارتباطی دست و پنجه نرم می‌کنند. این کلاس به شما کمک می‌کند این چالش‌ها را حل کنید."
    },
    {
      question: "Can I get a refund if I'm not satisfied?",
      answer: "Yes! We offer a 100% money-back guarantee within 7 days if you're not completely satisfied with the class content."
    },
    {
      question: "آیا این کلاس فقط برای زنان است؟",
      answer: "بله، این کلاس مخصوص زنان ایرانی مهاجر طراحی شده است تا بتوانند در یک محیط امن و راحت چالش‌های خاص خود را بررسی کنند."
    },
    {
      question: "کی می‌توانم به کلاس دسترسی داشته باشم؟",
      answer: "بعد از ثبت نام، لینک دسترسی و جزئیات کلاس برای شما ایمیل می‌شود. همچنین به ضبط کلاس دسترسی مادام‌العمر خواهید داشت."
    }
  ];

  return (
    <div className="bg-luxury-white/95 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-luxury-black mb-4 font-farsi">
              ❓ سوالات متداول
            </h2>
            <p className="text-luxury-accent/80 text-lg font-farsi">
              پاسخ سوالاتی که ممکن است داشته باشید
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="bg-luxury-white border border-luxury-accent/20 rounded-xl px-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left font-bold text-luxury-black hover:text-secondary font-farsi py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-luxury-accent/80 leading-relaxed font-farsi pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-8 text-center">
            <p className="text-luxury-accent/70 font-farsi">
              سوال دیگری دارید؟ بعد از ثبت نام می‌توانید مستقیماً با ما در تماس باشید.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQSection;
