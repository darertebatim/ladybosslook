import { type CSSProperties, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check } from "lucide-react";

/**
 * Renders AI-generated markdown in a way that matches the Aperture
 * visual language. Used by:
 *  - assistant chat bubbles
 *  - the Full Brief card on Memory
 *  - any other surface where the model writes text
 *
 * Inline elements (bold, italic, links, inline code) render compactly.
 * Fenced code blocks render with a Copy button and horizontal scroll.
 */
export function AperturePrompt({
  text,
  style,
  size = 14.5,
}: {
  text: string;
  style?: CSSProperties;
  size?: number;
}) {
  return (
    <div
      className="ap-md"
      style={{
        color: "var(--ap-ink-1)",
        fontSize: size,
        lineHeight: 1.6,
        wordBreak: "break-word",
        ...style,
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p style={{ margin: "0 0 10px" }}>{children}</p>
          ),
          h1: ({ children }) => (
            <h3 style={{ margin: "12px 0 6px", fontSize: size + 2, fontWeight: 600 }}>{children}</h3>
          ),
          h2: ({ children }) => (
            <h4 style={{ margin: "12px 0 6px", fontSize: size + 1, fontWeight: 600 }}>{children}</h4>
          ),
          h3: ({ children }) => (
            <h4 style={{ margin: "10px 0 4px", fontSize: size, fontWeight: 600 }}>{children}</h4>
          ),
          ul: ({ children }) => (
            <ul style={{ margin: "4px 0 10px", paddingLeft: 20 }}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol style={{ margin: "4px 0 10px", paddingLeft: 22 }}>{children}</ol>
          ),
          li: ({ children }) => (
            <li style={{ margin: "2px 0" }}>{children}</li>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              style={{ color: "var(--ap-signal)", textDecoration: "underline", textUnderlineOffset: 2 }}
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong style={{ fontWeight: 600, color: "var(--ap-ink-1)" }}>{children}</strong>
          ),
          em: ({ children }) => <em>{children}</em>,
          blockquote: ({ children }) => (
            <blockquote
              style={{
                margin: "8px 0",
                padding: "4px 12px",
                borderLeft: "2px solid var(--ap-signal)",
                color: "var(--ap-ink-2)",
              }}
            >
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr style={{ border: "none", borderTop: "1px solid var(--ap-hairline)", margin: "12px 0" }} />
          ),
          code({ inline, className, children, ...props }: any) {
            const text = String(children ?? "").replace(/\n$/, "");
            if (inline) {
              return (
                <code
                  style={{
                    fontFamily: "var(--ap-font-mono)",
                    fontSize: size - 1.5,
                    background: "var(--ap-surface-2)",
                    padding: "1px 5px",
                    borderRadius: 4,
                  }}
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return <CodeBlock text={text} />;
          },
          pre: ({ children }) => <>{children}</>,
          table: ({ children }) => (
            <div style={{ overflowX: "auto", margin: "8px 0" }}>
              <table style={{ borderCollapse: "collapse", fontSize: size - 1 }}>{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--ap-hairline)", fontWeight: 600 }}>{children}</th>
          ),
          td: ({ children }) => (
            <td style={{ padding: "6px 10px", borderBottom: "1px solid var(--ap-hairline)" }}>{children}</td>
          ),
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {/* ignore */}
  }
  return (
    <div style={{ position: "relative", margin: "8px 0" }}>
      <button
        type="button"
        onClick={copy}
        aria-label="Copy code"
        style={{
          position: "absolute", top: 6, right: 6,
          appearance: "none", cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "4px 8px", fontSize: 11,
          fontFamily: "var(--ap-font-mono)", textTransform: "uppercase",
          letterSpacing: "0.1em",
          background: "var(--ap-surface-1)",
          color: "var(--ap-ink-2)",
          border: "1px solid var(--ap-hairline)",
          borderRadius: 6,
        }}
      >
        {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? "Copied" : "Copy"}
      </button>
      <pre style={{
        margin: 0, padding: "12px 14px",
        background: "var(--ap-surface-2)",
        border: "1px solid var(--ap-hairline)",
        borderRadius: 8,
        overflowX: "auto",
        fontFamily: "var(--ap-font-mono)",
        fontSize: 12.5,
        lineHeight: 1.55,
      }}>
        <code style={{ whiteSpace: "pre" }}>{text}</code>
      </pre>
    </div>
  );
}