import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import {
  extractStandaloneInternalUrls,
  resolveInternalEntity,
} from '@/lib/internalEntityResolver';
import { smartOpenUrl } from '@/lib/navigation-utils';
import { EntityCard } from './EntityCard';

interface RichTextProps {
  content: string;
  className?: string;
  dir?: 'ltr' | 'rtl' | 'auto';
}

/**
 * Renders channel post content as Markdown with rich extensions:
 * - Bold, italic, links, lists, blockquotes, inline code, headings
 * - Single line breaks render as <br> (chat-friendly)
 * - Blank lines create true paragraphs with spacing
 * - Internal app URLs on their own line render as rich entity cards
 * - `[btn:Label](url)` renders as a branded action button
 * Backwards compatible with plain text.
 */
export function RichText({ content, className, dir }: RichTextProps) {
  const navigate = useNavigate();
  const { urls, stripped } = extractStandaloneInternalUrls(content);

  return (
    <div
      dir={dir}
      className={cn(
        'text-[15px] leading-relaxed break-words',
        // paragraph spacing — must be visibly larger than line-height
        // (leading-relaxed ≈ 24px, so paragraph gap needs to clearly exceed that)
        '[&_p]:my-0 [&_p+p]:mt-8',
        // soft line breaks (single newline → <br>) get a small extra nudge
        // so they don't look identical to paragraph breaks
        '[&_br]:block [&_br]:content-[""]',
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
      {stripped && (
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={{
            a: ({ node, children, href, ...props }) => {
              const text = typeof children?.[0] === 'string' ? (children[0] as string) : '';
              const btnMatch = text.match(/^btn:(.+)$/i);

              // [btn:Label](url) → branded action button
              if (btnMatch && href) {
                const label = btnMatch[1].trim();
                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      smartOpenUrl(href, navigate);
                    }}
                    className="not-prose inline-flex items-center gap-1.5 mt-2 mr-2 px-4 py-2 rounded-full bg-[hsl(var(--brand-primary))] text-white text-[13px] font-semibold no-underline active:scale-[0.97] transition-transform"
                  >
                    {label}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                );
              }

              // Internal app link → navigate in-app
              const internal = href ? resolveInternalEntity(href) : null;
              if (internal) {
                return (
                  <a
                    {...props}
                    href={href}
                    onClick={(e) => {
                      e.preventDefault();
                      smartOpenUrl(href!, navigate);
                    }}
                  >
                    {children}
                  </a>
                );
              }

              return (
                <a {...props} href={href} target="_blank" rel="noopener noreferrer">
                  {children}
                </a>
              );
            },
          }}
        >
          {stripped}
        </ReactMarkdown>
      )}

      {/* Auto-render rich entity cards for standalone internal URLs */}
      {urls.map((url, i) => (
        <EntityCard key={`${url}-${i}`} href={url} />
      ))}
    </div>
  );
}