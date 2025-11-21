'use client';

import React, { useRef, useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Bold, 
  Italic, 
  Heading, 
  Code, 
  Eye, 
  EyeOff,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import MarkdownPreview from './MarkdownPreview';
import { useFullscreen } from '@/hooks/use-fullscreen';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

export default function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your content in Markdown...',
  className,
  minHeight = 400,
}: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(true);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);

  // Constants
  const HEADING_REGEX = /^(#{1,6})\s/;
  const HELP_TEXT = 'Supports GitHub Flavored Markdown. Use Cmd/Ctrl+B for bold, Cmd/Ctrl+I for italic, Cmd/Ctrl+H for headings, Cmd/Ctrl+Shift+C for code blocks, Cmd/Ctrl+P to toggle preview.';

  // Sync scroll positions between editor and preview
  const handleEditorScroll = () => {
    if (!editorRef.current || !previewRef.current || !showPreview) return;
    
    const editor = editorRef.current;
    const preview = previewRef.current;
    
    const maxScroll = editor.scrollHeight - editor.clientHeight;
    if (maxScroll <= 0) return; // Prevent division by zero
    
    const scrollPercentage = editor.scrollTop / maxScroll;
    const previewMaxScroll = preview.scrollHeight - preview.clientHeight;
    preview.scrollTop = scrollPercentage * previewMaxScroll;
  };

  const handlePreviewScroll = () => {
    if (!editorRef.current || !previewRef.current || !showPreview) return;
    
    const editor = editorRef.current;
    const preview = previewRef.current;
    
    const maxScroll = preview.scrollHeight - preview.clientHeight;
    if (maxScroll <= 0) return; // Prevent division by zero
    
    const scrollPercentage = preview.scrollTop / maxScroll;
    const editorMaxScroll = editor.scrollHeight - editor.clientHeight;
    editor.scrollTop = scrollPercentage * editorMaxScroll;
  };

  // Insert text at cursor position
  const insertText = (before: string, after: string = '', placeholder: string = '') => {
    const textarea = editorRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newText = 
      value.substring(0, start) +
      before +
      textToInsert +
      after +
      value.substring(end);
    
    onChange(newText);
    
    // Set cursor position after insert
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Keyboard shortcuts
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Bold: Cmd/Ctrl + B
    if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
      e.preventDefault();
      insertText('**', '**', 'bold text');
    }
    // Italic: Cmd/Ctrl + I
    else if ((e.metaKey || e.ctrlKey) && e.key === 'i') {
      e.preventDefault();
      insertText('_', '_', 'italic text');
    }
    // Heading: Cmd/Ctrl + H
    else if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
      e.preventDefault();
      const textarea = editorRef.current;
      if (!textarea) return;
      
      const start = textarea.selectionStart;
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = value.indexOf('\n', start);
      const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;
      
      const currentLine = value.substring(lineStart, actualLineEnd);
      const headingMatch = currentLine.match(HEADING_REGEX);
      
      let newLine;
      if (headingMatch) {
        // Cycle through heading levels
        const level = headingMatch[1].length;
        if (level < 6) {
          newLine = '#' + currentLine;
        } else {
          // Remove the heading prefix (e.g., "###### ")
          newLine = currentLine.substring(headingMatch[0].length);
        }
      } else {
        newLine = '# ' + currentLine;
      }
      
      const newText = 
        value.substring(0, lineStart) +
        newLine +
        value.substring(actualLineEnd);
      
      onChange(newText);
    }
    // Code block: Cmd/Ctrl + Shift + C
    else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      insertText('\n```\n', '\n```\n', 'code here');
    }
    // Toggle preview: Cmd/Ctrl + P
    else if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
      e.preventDefault();
      setShowPreview(!showPreview);
    }
  };

  const toolbarButtons = [
    { 
      icon: Bold, 
      label: 'Bold (Cmd/Ctrl+B)', 
      action: () => insertText('**', '**', 'bold text') 
    },
    { 
      icon: Italic, 
      label: 'Italic (Cmd/Ctrl+I)', 
      action: () => insertText('_', '_', 'italic text') 
    },
    { 
      icon: Heading, 
      label: 'Heading (Cmd/Ctrl+H)', 
      action: () => {
        const textarea = editorRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = value.indexOf('\n', start);
        const actualLineEnd = lineEnd === -1 ? value.length : lineEnd;
        
        const currentLine = value.substring(lineStart, actualLineEnd);
        const headingMatch = currentLine.match(HEADING_REGEX);
        
        let newLine;
        if (headingMatch) {
          // Cycle through heading levels
          const level = headingMatch[1].length;
          if (level < 6) {
            newLine = '#' + currentLine;
          } else {
            // Remove the heading prefix (e.g., "###### ")
            newLine = currentLine.substring(headingMatch[0].length);
          }
        } else {
          newLine = '# ' + currentLine;
        }
        
        const newText = 
          value.substring(0, lineStart) +
          newLine +
          value.substring(actualLineEnd);
        
        onChange(newText);
        
        // Set cursor at end of heading prefix
        setTimeout(() => {
          textarea.focus();
          const newHeadingMatch = newLine.match(HEADING_REGEX);
          const cursorPos = lineStart + (newHeadingMatch ? newHeadingMatch[0].length : 0);
          textarea.setSelectionRange(cursorPos, cursorPos);
        }, 0);
      }
    },
    { 
      icon: Code, 
      label: 'Code Block (Cmd/Ctrl+Shift+C)', 
      action: () => insertText('\n```\n', '\n```\n', 'code here') 
    },
  ];

  return (
    <div 
      ref={containerRef}
      className={cn(
        'flex flex-col gap-2',
        isFullscreen && 'fixed inset-0 z-50 bg-background p-4',
        className
      )}
    >
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b pb-2">
        <div className="flex items-center gap-1">
          {toolbarButtons.map((btn, idx) => (
            <Button
              key={idx}
              type="button"
              variant="ghost"
              size="sm"
              onClick={btn.action}
              title={btn.label}
            >
              <btn.icon className="h-4 w-4" />
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            title={showPreview ? 'Hide Preview (Cmd/Ctrl+P)' : 'Show Preview (Cmd/Ctrl+P)'}
          >
            {showPreview ? (
              <>
                <EyeOff className="h-4 w-4 mr-1" />
                <span className="text-xs">Hide Preview</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-1" />
                <span className="text-xs">Show Preview</span>
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Editor and Preview */}
      <div className={cn(showPreview ? 'grid grid-cols-2 gap-4' : 'flex')}>
        {/* Editor */}
        <div className="flex-1">
          <Textarea
            ref={editorRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onScroll={handleEditorScroll}
            placeholder={placeholder}
            className="font-mono text-sm resize-none"
            style={{ 
              minHeight: isFullscreen ? 'calc(100vh - 120px)' : `${minHeight}px`,
              height: isFullscreen ? 'calc(100vh - 120px)' : `${minHeight}px`,
            }}
          />
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="flex-1">
            <div
              ref={previewRef}
              onScroll={handlePreviewScroll}
              className="border rounded-md p-4 overflow-y-auto bg-muted/50"
              style={{ 
                minHeight: isFullscreen ? 'calc(100vh - 120px)' : `${minHeight}px`,
                height: isFullscreen ? 'calc(100vh - 120px)' : `${minHeight}px`,
              }}
            >
              <MarkdownPreview content={value} />
            </div>
          </div>
        )}
      </div>

      {/* Helper text */}
      <div className="text-xs text-muted-foreground">
        {HELP_TEXT}
      </div>
    </div>
  );
}
