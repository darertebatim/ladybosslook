import { RefObject } from 'react';
import { Bold, Italic, Link as LinkIcon, List, ListOrdered, Quote, Heading2, Code } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarkdownToolbarProps {
  textareaRef: RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (next: string) => void;
  className?: string;
}

type Action =
  | { type: 'wrap'; before: string; after: string; placeholder: string; icon: any; label: string }
  | { type: 'linePrefix'; prefix: string; placeholder: string; icon: any; label: string }
  | { type: 'link'; icon: any; label: string };

const ACTIONS: Action[] = [
  { type: 'wrap', before: '**', after: '**', placeholder: 'bold', icon: Bold, label: 'Bold' },
  { type: 'wrap', before: '_', after: '_', placeholder: 'italic', icon: Italic, label: 'Italic' },
  { type: 'link', icon: LinkIcon, label: 'Link' },
  { type: 'linePrefix', prefix: '## ', placeholder: 'Heading', icon: Heading2, label: 'Heading' },
  { type: 'linePrefix', prefix: '- ', placeholder: 'Item', icon: List, label: 'Bulleted list' },
  { type: 'linePrefix', prefix: '1. ', placeholder: 'Item', icon: ListOrdered, label: 'Numbered list' },
  { type: 'linePrefix', prefix: '> ', placeholder: 'Quote', icon: Quote, label: 'Quote' },
  { type: 'wrap', before: '`', after: '`', placeholder: 'code', icon: Code, label: 'Inline code' },
];

export function MarkdownToolbar({ textareaRef, value, onChange, className }: MarkdownToolbarProps) {
  const apply = (action: Action) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);

    let next = value;
    let cursorStart = start;
    let cursorEnd = end;

    if (action.type === 'wrap') {
      const text = selected || action.placeholder;
      const insert = `${action.before}${text}${action.after}`;
      next = value.slice(0, start) + insert + value.slice(end);
      cursorStart = start + action.before.length;
      cursorEnd = cursorStart + text.length;
    } else if (action.type === 'linePrefix') {
      // Expand selection to full lines
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const lineEndIdx = value.indexOf('\n', end);
      const lineEnd = lineEndIdx === -1 ? value.length : lineEndIdx;
      const block = value.slice(lineStart, lineEnd) || action.placeholder;
      const prefixed = block
        .split('\n')
        .map(l => (l.startsWith(action.prefix) ? l : `${action.prefix}${l}`))
        .join('\n');
      next = value.slice(0, lineStart) + prefixed + value.slice(lineEnd);
      cursorStart = lineStart;
      cursorEnd = lineStart + prefixed.length;
    } else if (action.type === 'link') {
      const url = window.prompt('Enter URL', 'https://');
      if (!url) return;
      const text = selected || 'link text';
      const insert = `[${text}](${url})`;
      next = value.slice(0, start) + insert + value.slice(end);
      cursorStart = start + 1;
      cursorEnd = cursorStart + text.length;
    }

    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(cursorStart, cursorEnd);
    });
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-0.5 px-1', className)}>
      {ACTIONS.map((a, i) => {
        const Icon = a.icon;
        return (
          <button
            key={i}
            type="button"
            onMouseDown={(e) => e.preventDefault()} // keep selection
            onClick={() => apply(a)}
            title={a.label}
            aria-label={a.label}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted active:scale-95 transition"
          >
            <Icon className="h-4 w-4" />
          </button>
        );
      })}
    </div>
  );
}