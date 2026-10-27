type StepTone = 'brand' | 'orange' | 'violet' | 'green';

const TONE_BG: Record<StepTone, string> = {
  brand: 'bg-gradient-to-br from-[#F08A3E] via-[#EC4899] to-[#8A5CF0]',
  orange: 'bg-[#F08A3E]',
  violet: 'bg-[#8A5CF0]',
  green: 'bg-[#25D366]',
};

/** Big numbered chip shown at the start of a payment-success step card. */
export function StepNumber({ n, tone = 'brand' }: { n: number; tone?: StepTone }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] text-white text-[17px] font-bold leading-none shadow-ios ${TONE_BG[tone]}`}
    >
      {n}
    </span>
  );
}

/** Header pill above the step cards: "Now you have N steps". */
export function StepCountBadge({ count }: { count: number }) {
  if (count < 1) return null;
  return (
    <div className="mt-8 flex justify-center">
      <div className="inline-flex items-center gap-3 rounded-[24px] bg-[#1a1f3d] pl-3 pr-6 py-3 shadow-[0_22px_50px_-18px_rgba(26,31,61,0.75)]">
        <span className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-gradient-to-br from-[#F08A3E] via-[#EC4899] to-[#8A5CF0] text-white text-[24px] font-bold leading-none shadow-ios">
          {count}
        </span>
        <span className="text-left">
          <span className="block text-[16px] font-bold leading-tight text-white">
            {count === 1 ? 'Now you have 1 step' : `Now you have ${count} steps`}
          </span>
          <span className="block text-[12px] leading-tight text-white/60 mt-0.5">
            {count === 1 ? 'Do it in one tap' : 'Do them in order to get started'}
          </span>
        </span>
      </div>
    </div>
  );
}
