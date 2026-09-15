'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { normalizeEventDescriptionMarkdown } from '@/lib/markdown/event-description';

interface EventMarkdownProps {
  content: string;
  className?: string;
}

export function EventMarkdown({ content, className = '' }: EventMarkdownProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        skipHtml
        components={{
          h1: ({ children, ...props }) => <h2 {...props} className="text-2xl font-bold text-white mt-8 mb-4">{children}</h2>,
          h2: ({ children, ...props }) => <h2 {...props} className="text-2xl font-bold text-white mt-8 mb-4">{children}</h2>,
          h3: ({ children, ...props }) => <h3 {...props} className="text-xl font-bold text-white mt-6 mb-3">{children}</h3>,
          h4: ({ children, ...props }) => <h4 {...props} className="text-lg font-semibold text-white mt-4 mb-2">{children}</h4>,
          h5: ({ children, ...props }) => <h5 {...props} className="text-base font-semibold text-white mt-3 mb-2">{children}</h5>,
          h6: ({ children, ...props }) => <h6 {...props} className="text-sm font-semibold text-white mt-2 mb-1">{children}</h6>,
          p: ({ children, ...props }) => <p {...props} className="text-gray-300 leading-relaxed my-4">{children}</p>,
          ul: ({ children, ...props }) => <ul {...props} className="list-disc pl-6 my-4 text-gray-300 space-y-2">{children}</ul>,
          ol: ({ children, ...props }) => <ol {...props} className="list-decimal pl-6 my-4 text-gray-300 space-y-2">{children}</ol>,
          li: ({ children, ...props }) => <li {...props} className="leading-relaxed">{children}</li>,
          blockquote: ({ children, ...props }) => <blockquote {...props} className="border-l-4 border-primary pl-4 italic text-gray-400 my-6">{children}</blockquote>,
          code: ({ inline, children, ...props }: any) => {
            return inline ? (
              <code {...props} className="text-primary bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
            ) : (
              <code {...props} className="block bg-black/30 border border-white/10 rounded-lg p-4 overflow-x-auto text-sm font-mono text-gray-300">{children}</code>
            );
          },
          pre: ({ children, ...props }) => <pre {...props} className="my-6">{children}</pre>,
          table: ({ children, ...props }) => (
            <div className="overflow-x-auto my-6">
              <table {...props} className="w-full border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children, ...props }) => <thead {...props} className="border-b-2 border-white/20">{children}</thead>,
          tbody: ({ children, ...props }) => <tbody {...props}>{children}</tbody>,
          tr: ({ children, ...props }) => <tr {...props}>{children}</tr>,
          th: ({ children, ...props }) => <th {...props} className="px-4 py-3 text-left font-semibold text-white">{children}</th>,
          td: ({ children, ...props }) => <td {...props} className="px-4 py-3 text-gray-300 border-t border-white/10">{children}</td>,
          hr: ({ ...props }) => <hr {...props} className="border-white/20 my-8" />,
          a: ({ href, children, ...props }) => {
            const isSafeExternalLink = href?.startsWith('https://') || href?.startsWith('http://');
            return (
              <a
                {...props}
                href={href}
                className="text-primary no-underline hover:underline"
                target={isSafeExternalLink ? '_blank' : undefined}
                rel={isSafeExternalLink ? 'noreferrer noopener' : undefined}
              >
                {children}
              </a>
            );
          },
          strong: ({ children, ...props }) => <strong {...props} className="font-semibold text-white">{children}</strong>,
          em: ({ children, ...props }) => <em {...props} className="italic text-gray-300">{children}</em>,
          img: () => null,
        }}
      >
        {normalizeEventDescriptionMarkdown(content)}
      </ReactMarkdown>
    </div>
  );
}
