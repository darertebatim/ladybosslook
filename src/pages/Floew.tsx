import { Button } from "@/components/ui/button";
import { CreditCard, Banknote } from "lucide-react";
import fiveLanguagePoster from "@/assets/five-language-poster.png";

const Floew = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4" dir="rtl" style={{ fontFamily: "'Vazirmatn', sans-serif" }}>
      <div className="max-w-lg w-full space-y-6">
        {/* Poster */}
        <img 
          src={fiveLanguagePoster} 
          alt="چالش ۱۰ شب - ۵ زبان قدرت" 
          className="w-full rounded-lg shadow-lg"
        />
        
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            چالش ۵ زبان قدرت لیدی‌باس
          </h1>
          <p className="text-lg text-muted-foreground">
            به جای ۱۰۰ دلار فقط با ۱ دلار
          </p>
        </div>
        
        {/* Buttons */}
        <div className="space-y-4">
          <a href="/Five-Languagepay" className="block w-full">
            <Button 
              size="lg" 
              className="w-full text-lg py-6 bg-green-600 hover:bg-green-700 text-white"
            >
              <CreditCard className="ml-2 h-5 w-5" />
              پرداخت ۱ دلار (خارج ایران)
            </Button>
          </a>
          
          <a 
            href="https://ladybossnew.com/pziran" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full"
          >
            <Button 
              size="lg" 
              className="w-full text-lg py-6 bg-green-600 hover:bg-green-700 text-white"
            >
              <Banknote className="ml-2 h-5 w-5" />
              پرداخت ۹۹.۰۰۰ تومان (داخل ایران)
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Floew;
