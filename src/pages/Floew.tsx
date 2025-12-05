import { Button } from "@/components/ui/button";
import { CreditCard, MessageCircle } from "lucide-react";
import fiveLanguagePoster from "@/assets/five-language-poster.png";

const Floew = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4" dir="rtl">
      <div className="max-w-lg w-full space-y-6">
        {/* Poster */}
        <img 
          src={fiveLanguagePoster} 
          alt="چالش ۱۰ شب - ۵ زبان قدرت" 
          className="w-full rounded-lg shadow-lg"
        />
        
        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-center text-foreground">
          ۵ زبان زن توانمند
        </h1>
        
        {/* Buttons */}
        <div className="space-y-4">
          <a href="/Five-Languagepay" className="block w-full">
            <Button 
              size="lg" 
              className="w-full text-lg py-6 bg-primary hover:bg-primary/90"
            >
              <CreditCard className="ml-2 h-5 w-5" />
              پرداخت دلاری (خارج از ایران)
            </Button>
          </a>
          
          <a 
            href="https://t.me/lbpool_admin" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block w-full"
          >
            <Button 
              size="lg" 
              variant="secondary"
              className="w-full text-lg py-6"
            >
              <MessageCircle className="ml-2 h-5 w-5" />
              پرداخت تومانی (داخل ایران)
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default Floew;
