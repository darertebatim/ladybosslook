import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface BilingualTextProps {
  children: string;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Detects if text contains Persian/Arabic characters
 */
function containsPersian(text: string): boolean {
  // Persian/Arabic Unicode range: \u0600-\u06FF (Arabic) and \u0750-\u077F (Arabic Supplement)
  // Also includes Persian-specific characters
  const persianRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return persianRegex.test(text);
}

/**
 * Calculates the dominant language direction based on character count
 */
function getDominantDirection(text: string): 'rtl' | 'ltr' {
  const persianChars = (text.match(/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/g) || []).length;
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  
  // If more Persian characters than Latin, use RTL
  return persianChars > latinChars ? 'rtl' : 'ltr';
}

/**
 * BilingualText component that automatically detects Persian/Farsi content
 * and applies the correct font (Vazirmatn) and text direction (RTL).
 * 
 * @example
 * <BilingualText>Hello World</BilingualText> // LTR, Inter font
 * <BilingualText>سلام دنیا</BilingualText> // RTL, Vazirmatn font
 * <BilingualText>Hello سلام</BilingualText> // Direction based on dominant language
 */
export function BilingualText({ 
  children, 
  className,
  as: Component = 'span' 
}: BilingualTextProps) {
  const { isPersian, direction } = useMemo(() => {
    const hasPersian = containsPersian(children);
    return {
      isPersian: hasPersian,
      direction: hasPersian ? getDominantDirection(children) : 'ltr',
    };
  }, [children]);

  return (
    <Component
      className={cn(
        isPersian && 'font-farsi',
        className
      )}
      dir={direction}
    >
      {children}
    </Component>
  );
}

/**
 * Utility hook for detecting Persian text and getting appropriate styles
 */
export function useBilingualText(text: string) {
  return useMemo(() => {
    const isPersian = containsPersian(text);
    const direction = isPersian ? getDominantDirection(text) : 'ltr';
    
    return {
      isPersian,
      direction,
      className: isPersian ? 'font-farsi' : '',
      style: { direction } as React.CSSProperties,
    };
  }, [text]);
}

/**
 * Simple utility function to check if text is Persian
 */
export { containsPersian, getDominantDirection };
