import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { cn } from '@/lib/utils';

interface RichTextProps {
  content: string;
  className?: string;
  dir?: 'ltr' | 'rtl' | 'auto';
}

/**
 * Renders channel post content as Markdown.
 * - Bold, italic, links, lists, blockquotes, inline code, headings
 * - Single line breaks render as <br> (chat-friendly)
 * - Blank lines create true paragraphs with spacing
 * Backwards compatible with plain text.
 */
export function RichText({ content, className, dir }: RichTextProps) {
  return (
    <div
      dir={dir}
      className={cn(
        'text-[15px] leading-relaxed break-words',
        // paragraph spacing
        '[&_p]:my-0 [&_p+p]:mt-3',
        // headings
        '[&_h1]:text-lg [&_h1]:font-semibold [&_h1]:mt-3 [&_h1]:mb-1',
        '[&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-3 [&_h2]:mb-1',
        '[&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1',
        // lists
        '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_ul]:space-y-1',
        '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2 [&_ol]:space-y-1',
        '[&_li]:leading-snug',
        // blockquote
        '[&_blockquote]:border-l-[3px] [&_blockquote]:border-[hsl(var(--brand-primary))] [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-fg-warm-muted [&_blockquote]:my-2',
        // code
        '[&_code]:bg-[hsl(var(--tint-peach))] [&_code]:text-fg-warm [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px] [&_code]:font-mono',
        '[&_pre]:bg-[hsl(var(--tint-peach))] [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-2 [&_pre_code]:bg-transparent [&_pre_code]:p-0',
        // links
        '[&_a]:text-[hsl(var(--brand-primary))] [&_a]:underline [&_a]:underline-offset-2 [&_a]:font-medium',
        // hr
        '[&_hr]:my-3 [&_hr]:border-fg-warm-muted/20',
        // strong / em
        '[&_strong]:font-semibold [&_em]:italic',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}