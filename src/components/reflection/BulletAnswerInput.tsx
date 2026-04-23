import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useBilingualText } from '@/components/ui/BilingualText';

const BULLET_COLORS = [
  'hsl(142, 50%, 78%)',
  'hsl(20, 70%, 78%)',
  'hsl(262, 60%, 68%)',
  'hsl(200, 60%, 72%)',
  'hsl(45, 70%, 72%)',
  'hsl(340, 55%, 75%)',
];

function getBulletColor(index: number) {
  return BULLET_COLORS[index % BULLET_COLORS.length];
}

function BulletLine({
  inputRef,
  value,
  onChange,
  onKeyDown,
  placeholder,
  color,
}: {
  inputRef: (el: HTMLTextAreaElement | null) => void;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder: string;
  color: string;
}) {
  const { className: biClass, direction: dir } = useBilingualText(value);
  const isRtl = dir === 'rtl';
  const localRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize on mount and when value changes externally
  useEffect(() => {
    const t = localRef.current;
    if (t) {
      t.style.height = 'auto';
      t.style.height = t.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <div className={cn('flex items-start gap-3 w-full', isRtl && 'flex-row-reverse')}>
      <div
        className="w-3 h-3 rounded-sm mt-[7px] shrink-0 transition-colors"
        style={{ backgroundColor: value.trim() ? color : 'hsl(var(--muted-foreground) / 0.25)' }}
      />
      <textarea
        ref={(el) => {
          localRef.current = el;
          inputRef(el);
        }}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        dir={dir}
        rows={1}
        className={cn(
          'flex-1 bg-transparent border-0 outline-none text-base placeholder:text-muted-foreground/40 resize-none overflow-hidden',
          biClass,
        )}
        onInput={(e) => {
          const t = e.currentTarget;
          t.style.height = 'auto';
          t.style.height = t.scrollHeight + 'px';
        }}
      />
    </div>
  );
}

interface BulletAnswerInputProps {
  lines: string[];
  onLinesChange: (lines: string[]) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * Bullet-point answer input shared by free-form, single-page, and multi-page reflections.
 * Enter splits the current line at cursor; Backspace on an empty line removes it.
 */
export function BulletAnswerInput({
  lines,
  onLinesChange,
  placeholder = 'Write your thoughts…',
  autoFocus = false,
}: BulletAnswerInputProps) {
  const lineRefs = useRef<(HTMLTextAreaElement | null)[]>([]);
  const justAddedLine = useRef(false);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => lineRefs.current[0]?.focus(), 200);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus]);

  useEffect(() => {
    if (justAddedLine.current) {
      const lastIdx = lines.length - 1;
      lineRefs.current[lastIdx]?.focus();
      justAddedLine.current = false;
    }
  }, [lines.length]);

  const handleChange = (index: number, value: string) => {
    const next = [...lines];
    next[index] = value;
    onLinesChange(next);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const target = e.currentTarget;
      const cursorPos = target.selectionStart || 0;
      const currentValue = lines[index];
      const before = currentValue.slice(0, cursorPos);
      const after = currentValue.slice(cursorPos);
      const next = [...lines];
      next[index] = before;
      next.splice(index + 1, 0, after);
      onLinesChange(next);
      justAddedLine.current = true;
    } else if (e.key === 'Backspace' && lines[index] === '' && index > 0) {
      e.preventDefault();
      const next = [...lines];
      next.splice(index, 1);
      onLinesChange(next);
      setTimeout(() => lineRefs.current[index - 1]?.focus(), 0);
    }
  };

  return (
    <div className="space-y-1.5">
      {lines.map((line, idx) => (
        <BulletLine
          key={idx}
          inputRef={(el) => {
            lineRefs.current[idx] = el;
          }}
          value={line}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          placeholder={idx === 0 ? placeholder : ''}
          color={getBulletColor(idx)}
        />
      ))}
    </div>
  );
}

export { getBulletColor };