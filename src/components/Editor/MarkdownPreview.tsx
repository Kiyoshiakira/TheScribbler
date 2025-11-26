'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DOMPurify from 'isomorphic-dompurify';
import { cn } from '@/lib/utils';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export default function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  // Sanitize the content before rendering
  const sanitizedContent = DOMPurify.sanitize(content);

  return (
    <div className={cn('prose prose-sm dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Custom rendering for code blocks with syntax highlighting placeholder
          code({ className, children, ...props }) {
            const inline = !className?.includes('language-');
            return !inline ? (
              <pre className="bg-muted p-4 rounded-md overflow-x-auto">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm" {...props}>
                {children}
              </code>
            );
          },
          // Custom rendering for links to open in new tab
          a({ children, href, ...props }) {
            return (
              <a 
                href={href} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
                {...props}
              >
                {children}
              </a>
            );
          },
          // Custom rendering for images with responsive sizing
          img({ src, alt, ...props }) {
            return (
              <img 
                src={src} 
                alt={alt || ''} 
                className="max-w-full h-auto rounded-md"
                loading="lazy"
                {...props}
              />
            );
          },
          // Custom rendering for tables
          table({ children, ...props }) {
            return (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          // Custom rendering for blockquotes
          blockquote({ children, ...props }) {
            return (
              <blockquote 
                className="border-l-4 border-primary pl-4 italic text-muted-foreground"
                {...props}
              >
                {children}
              </blockquote>
            );
          },
        }}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
}
