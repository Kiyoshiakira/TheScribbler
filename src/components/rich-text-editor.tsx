'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

// react-quill relies on window, so dynamically import it to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export type RichTextValue = string;

interface RichTextEditorProps {
  value: RichTextValue;
  onChange: (value: RichTextValue) => void;
  className?: string;
}

/**
 * Simple Quill-based rich text editor with a standard toolbar.
 * The component is intentionally compact: it exposes an HTML string via onChange.
 */
export default function RichTextEditor({ value, onChange, className }: RichTextEditorProps) {
  const modules = {
    toolbar: [
      [{ font: [] }],
      [{ header: [1, 2, 3, 4, 5, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ color: [] }, { background: [] }],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'clean'],
    ],
  };

  const formats = [
    'header',
    'font',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'list',
    'bullet',
    'align',
    'blockquote',
    'code-block',
    'link',
    'image',
  ];

  return (
    <div className={className}>
      {/* ReactQuill renders only client-side (dynamic import above) */}
      {/* value is HTML string */}
      <ReactQuill value={value} onChange={onChange} modules={modules} formats={formats} theme="snow" />
    </div>
  );
}
