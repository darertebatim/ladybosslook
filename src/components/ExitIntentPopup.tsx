import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Gift } from 'lucide-react';

interface ExitIntentPopupProps {
  onRegisterClick: () => void;
}

const ExitIntentPopup = ({ onRegisterClick }: ExitIntentPopupProps) => {
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger if mouse leaves from top of page and hasn't been shown yet
      if (e.clientY <= 10 && !hasShown) {
        setShowExitPopup(true);
        setHasShown(true);
        
        // Track exit intent
        if (typeof window !== 'undefined' && (window as any).fbq) {
          (window as any).fbq('trackCustom', 'ExitIntentTriggered', {
            page: 'one_bilingual'
          });
        }
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [hasShown]);

  const handleContinue = () => {
    setShowExitPopup(false);
    onRegisterClick();
    
    // Track exit popup conversion
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('trackCustom', 'ExitPopupConversion', {
        action: 'register_clicked'
      });
    }
  };

  return (
    <Dialog open={showExitPopup} onOpenChange={setShowExitPopup}>
      <DialogContent className="sm:max-w-lg bg-luxury-white border-4 border-secondary shadow-2xl">
        <button
          onClick={() => setShowExitPopup(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center py-6">
          {/* Gift Icon */}
          <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <Gift className="w-12 h-12 text-luxury-black" />
          </div>

          {/* Headline */}
          <h2 className="text-3xl font-bold text-luxury-black mb-4 font-farsi">
            ⏰ صبر کنید!
          </h2>

          <p className="text-xl text-luxury-accent mb-6 font-farsi leading-relaxed">
            فقط <span className="text-secondary font-bold">۱ دلار</span> فاصله دارید<br/>
            تا قدرت دوزبانه خود را کشف کنید
          </p>

          {/* Bonus Offer */}
          <div className="bg-secondary/10 border-2 border-secondary rounded-xl p-6 mb-6">
            <p className="font-bold text-luxury-black mb-2 font-farsi">
              🎁 هدیه ویژه
            </p>
            <p className="text-luxury-accent font-farsi">
              راهنمای دوزبانگی موفق (ارزش ۲۰ دلار)<br/>
              <span className="text-sm">به رایگان با ثبت نام</span>
            </p>
          </div>

          {/* Urgency */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600 font-bold font-farsi">
              ⚠️ تنها چند جای خالی باقی مانده!
            </p>
            <p className="text-red-500 text-sm font-farsi mt-1">
              بعد از تکمیل ظرفیت، قیمت ۱۰۰ دلار می‌شود
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleContinue}
              className="w-full h-14 text-lg font-bold bg-secondary hover:bg-secondary-dark text-luxury-black font-farsi transition-all duration-300 transform hover:scale-105 shadow-glow"
            >
              ✅ بله! می‌خواهم با ۱ دلار ثبت نام کنم
            </Button>
            
            <button
              onClick={() => setShowExitPopup(false)}
              className="w-full text-sm text-luxury-accent/60 hover:text-luxury-accent font-farsi underline"
            >
              نه، متشکرم (این فرصت را از دست می‌دهم)
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExitIntentPopup;
