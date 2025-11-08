'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQuill } from 'react-quilljs';
import 'quill/dist/quill.snow.css';

/**
 * RichTextEditor
 * - Uses react-quilljs (Quill) and avoids ReactDOM.findDOMNode.
 * - Debounces onChange to avoid parent re-renders on each keystroke.
 * - Falls back to a plain <textarea> when content exceeds `LARGE_CONTENT_THRESHOLD`
 *   to keep editing responsive for huge notes (configurable).
 *
 * Props:
 * - value: HTML string
 * - onChange: (html: string) => void
 * - className?: string
 * - uploadImage?: (file: File) => Promise<string>  // optional handler to upload images and return URL
 *
 * Notes:
 * - By default Quill will inline images as data URIs. Provide uploadImage to avoid
 *   large data URIs in Firestore (recommended).
 * - This component intentionally keeps Quill as an uncontrolled/editor-managed instance
 *   and bridges to parent with debounced onChange.
 */

export type RichTextValue = string;

interface Props {
  value: RichTextValue;
  onChange: (value: RichTextValue) => void;
  className?: string;
  // optional image uploader to store images and return a URL to insert instead of data URI
  uploadImage?: (file: File) => Promise<string>;
  // threshold in characters where we switch to a plain textarea for performance
  largeContentThreshold?: number; // defaults to 500_000 (500k)
  // debounce ms for onChange
  debounceMs?: number;
}

function useDebouncedCallback<T extends (...args: any[]) => void>(cb: T, delay = 300) {
  const cbRef = useRef(cb);
  useEffect(() => {
    cbRef.current = cb;
  }, [cb]);

  const timeoutRef = useRef<number | undefined>(undefined);
  return useRef((...args: any[]) => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => {
      cbRef.current(...args);
    }, delay);
  }).current as (...args: Parameters<T>) => void;
}

export default function RichTextEditor({
  value,
  onChange,
  className,
  uploadImage,
  largeContentThreshold = 500_000,
  debounceMs = 400,
}: Props) {
  // If content is extremely large, use a plain textarea fallback to keep editing snappy.
  const isHuge = (value?.length || 0) > largeContentThreshold;
  const [usePlain, setUsePlain] = useState<boolean>(isHuge);

  // react-quilljs hook
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ font: [] }],
          [{ header: [1, 2, 3, 4, 5, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ align: [] }],
          ['blockquote', 'code-block'],
          ['link', 'image', 'clean'],
        ],
        handlers: {
          // placeholder - we'll wire image handler after quill init
        },
      },
      // minimize history stack growth for extremely large docs (optional)
      history: {
        userOnly: true,
      },
    }),
    []
  );

  const formats = useMemo(
    () => [
      'header',
      'font',
      'bold',
      'italic',
      'underline',
      'strike',
      'color',
      'background',
      'list',
      'align',
      'blockquote',
      'code-block',
      'link',
      'image',
    ],
    []
  );

  const { quill, quillRef } = useQuill({ modules, formats, theme: 'snow' });

  // Debounced parent callback so parent state isn't updated on every keystroke.
  const debouncedOnChange = useDebouncedCallback<(html: string) => void>(onChange, debounceMs);

  // Track whether we initialized quill content
  const initializedRef = useRef(false);

  // Initialize content when quill is ready
  useEffect(() => {
    if (!quill) return;
    if (!initializedRef.current) {
      // set initial HTML (preserve existing formatting)
      try {
        quill.clipboard.dangerouslyPasteHTML(value || '');
      } catch (e) {
        // Fall back: insert plain text if HTML is malformed
        quill.setText(value || '');
      }
      initializedRef.current = true;
    }

    const handleTextChange = () => {
      // Use innerHTML — Quill's root contains the HTML
      const html = quill.root.innerHTML;
      // If the content is only <p><br></p> treat as empty string
      const normalized = html === '<p><br></p>' ? '' : html;
      debouncedOnChange(normalized);
    };

    quill.on('text-change', handleTextChange);

    // Setup image handler (uploads image via uploadImage callback if provided)
    const toolbar = quill.getModule('toolbar');
    if (toolbar) {
      toolbar.addHandler('image', async () => {
        // open file picker
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) return;
          try {
            if (uploadImage) {
              // uploadImage should return a publicly accessible URL
              const url = await uploadImage(file);
              const range = quill.getSelection(true);
              quill.insertEmbed(range.index, 'image', url, 'user');
              quill.setSelection(range.index + 1);
            } else {
              // fallback: embed data URI (not recommended for large images)
              const reader = new FileReader();
              reader.onload = () => {
                const range = quill.getSelection(true);
                quill.insertEmbed(range.index, 'image', reader.result as string, 'user');
                quill.setSelection(range.index + 1);
              };
              reader.readAsDataURL(file);
            }
          } catch (err) {
            console.error('Image upload/insert failed', err);
          }
        };
      });
    }

    return () => {
      quill.off('text-change', handleTextChange);
    };
    // we intentionally do not include debouncedOnChange in deps to avoid re-binding
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quill, uploadImage]);

  // Keep quill content in sync if parent updates the value externally
  useEffect(() => {
    if (!quill) return;
    const current = quill.root.innerHTML;
    const incoming = value || '';
    if (incoming !== current) {
      // try to preserve selection
      const sel = quill.getSelection();
      quill.clipboard.dangerouslyPasteHTML(incoming);
      if (sel) quill.setSelection(sel);
    }
  }, [value, quill]);

  // Watch for size crossing threshold => toggle fallback
  useEffect(() => {
    const large = (value?.length || 0) > largeContentThreshold;
    if (large && !usePlain) setUsePlain(true);
    if (!large && usePlain) setUsePlain(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, largeContentThreshold]);

  // Plain textarea fallback handlers
  const handlePlainChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={className}>
      {usePlain ? (
        <textarea
          value={value}
          onChange={handlePlainChange}
          className="w-full min-h-[30rem] p-3 border rounded resize-vertical"
          placeholder="Plain note (rich editor disabled for very large content)"
        />
      ) : (
        // quillRef is attached to a div and Quill mounts into it
        <div ref={quillRef} />
      )}
    </div>
  );
}
