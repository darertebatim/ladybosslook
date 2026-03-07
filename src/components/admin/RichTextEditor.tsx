import { useEffect, useRef, useMemo, useCallback } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Supabase storage bucket for image uploads. Defaults to 'routine-images' */
  imageBucket?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className, imageBucket = 'routine-images' }: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill>(null);

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be under 5MB');
        return;
      }

      const quill = quillRef.current?.getEditor();
      if (!quill) return;

      // Show loading placeholder
      const range = quill.getSelection(true);
      quill.insertText(range.index, 'Uploading image...', { italic: true, color: '#999' });
      quill.setSelection(range.index + 'Uploading image...'.length, 0);

      try {
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = `editor/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(imageBucket)
          .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from(imageBucket)
          .getPublicUrl(filePath);

        // Remove placeholder and insert image
        quill.deleteText(range.index, 'Uploading image...'.length);
        quill.insertEmbed(range.index, 'image', urlData.publicUrl);
        quill.setSelection(range.index + 1);
        
        toast.success('Image added');
      } catch (err: any) {
        // Remove placeholder on error
        const currentText = quill.getText();
        const placeholderIndex = currentText.indexOf('Uploading image...');
        if (placeholderIndex !== -1) {
          quill.deleteText(placeholderIndex, 'Uploading image...'.length);
        }
        toast.error('Failed to upload image');
        console.error('Image upload error:', err);
      }
    };
  }, [imageBucket]);

  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: imageHandler,
      },
    },
  }), [imageHandler]);

  const formats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'link',
    'image'
  ];

  return (
    <div className={className}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-background"
      />
      <style>{`
        .ql-toolbar {
          border-color: hsl(var(--border)) !important;
          border-radius: 0.5rem 0.5rem 0 0;
          background: hsl(var(--background));
        }
        .ql-container {
          border-color: hsl(var(--border)) !important;
          border-radius: 0 0 0.5rem 0.5rem;
          font-family: inherit;
          min-height: 150px;
        }
        .ql-editor {
          min-height: 150px;
          color: hsl(var(--foreground));
        }
        .ql-editor img {
          max-width: 100%;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
        }
        .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
          font-style: normal;
        }
        .ql-snow .ql-stroke {
          stroke: hsl(var(--foreground));
        }
        .ql-snow .ql-fill {
          fill: hsl(var(--foreground));
        }
        .ql-snow .ql-picker-label {
          color: hsl(var(--foreground));
        }
        .ql-toolbar button:hover,
        .ql-toolbar button:focus,
        .ql-toolbar button.ql-active {
          color: hsl(var(--primary));
        }
        .ql-toolbar button:hover .ql-stroke,
        .ql-toolbar button:focus .ql-stroke,
        .ql-toolbar button.ql-active .ql-stroke {
          stroke: hsl(var(--primary));
        }
        .ql-toolbar button:hover .ql-fill,
        .ql-toolbar button:focus .ql-fill,
        .ql-toolbar button.ql-active .ql-fill {
          fill: hsl(var(--primary));
        }
      `}</style>
    </div>
  );
}
