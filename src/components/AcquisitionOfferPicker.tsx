import { Check, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { acquisitionOffer, type AcquisitionOfferKey } from '../../supabase/functions/_shared/acquisition-offers';

interface Props {
  presets: unknown;
  selected: AcquisitionOfferKey;
  early: boolean;
  onSelect: (key: AcquisitionOfferKey) => void;
}

export function AcquisitionOfferPicker({ presets, selected, early, onSelect }: Props) {
  const keys: AcquisitionOfferKey[] = early ? ['early'] : ['standard', 'vip'];
  return (
    <div className="space-y-3 font-farsi" dir="rtl">
      <h2 className="text-lg font-bold">{early ? 'پیشنهاد ویژه ثبت‌نام زودهنگام' : 'انتخاب بسته دوره'}</h2>
      {keys.map((key) => {
        const offer = acquisitionOffer('casigads', presets, key);
        const active = selected === key;
        return (
          <Button key={key} type="button" variant="outline" aria-pressed={active}
            disabled={!offer} onClick={() => onSelect(key)}
            className={cn('h-auto min-h-24 w-full whitespace-normal rounded-lg p-4 text-right', active && 'border-primary bg-primary/5')}>
            <span className="flex w-full items-start gap-3">
              {early ? <Lock className="mt-1 h-5 w-5 shrink-0 text-primary" /> : key === 'vip' ? <Sparkles className="mt-1 h-5 w-5 shrink-0 text-primary" /> : <Check className="mt-1 h-5 w-5 shrink-0 text-primary" />}
              <span className="min-w-0 flex-1 space-y-1">
                <span className="block font-bold">{key === 'vip' ? 'VIP' : 'Standard'}</span>
                <span className="block text-sm font-normal text-foreground">{key === 'vip' ? 'دوره جذب مشتری + تحلیل پروفایل اینستاگرام' : 'دوره جذب مشتری'}</span>
                {early && <span className="block text-xs text-foreground">قیمت ویژه ثبت‌نام زودهنگام</span>}
              </span>
              <span className="shrink-0 text-xl font-bold" dir="ltr">{offer ? `$${(offer.amount / 100).toFixed(0)}` : '—'}</span>
            </span>
          </Button>
        );
      })}
    </div>
  );
}