"use client";
import { useEffect, useRef } from "react";

// Toolbar config — Color, size, bold/italic, alignment
const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  [{ size: ["small", false, "large", "huge"] }],
  ["bold", "italic", "underline", "strike"],
  [{ color: [] }, { background: [] }],
  [{ align: [] }],
  ["blockquote", "code-block"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["link", "image"],
  ["clean"],
];

interface QuillEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function QuillEditor({ value, onChange, placeholder = "Type here...", minHeight = 200 }: QuillEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (initialized.current) return;

    // Dynamic import of Quill
    async function init() {
      const Quill = (await import("quill")).default;
      // Import CSS
      await import("quill/dist/quill.snow.css?inline" as any);

      if (!editorRef.current || quillRef.current) return;

      const quill = new Quill(editorRef.current, {
        theme: "snow",
        modules: { toolbar: TOOLBAR_OPTIONS },
        placeholder,
      });

      // Set initial content
      if (value) {
        quill.root.innerHTML = value;
      }

      quill.on("text-change", () => {
        const html = quill.root.innerHTML;
        if (html !== value) {
          onChange(html);
        }
      });

      quillRef.current = quill;
      initialized.current = true;
    }

    init();

    return () => {
      quillRef.current = null;
      initialized.current = false;
    };
  }, []);

  // Update content if value changes externally
  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      quillRef.current.root.innerHTML = value;
    }
  }, [value]);

  return (
    <div className="quill-wrapper" style={{ minHeight }}>
      <style>{`
        .quill-wrapper .ql-toolbar {
          background: #1A1A2E;
          border: 1px solid rgba(192,192,192,0.1);
          border-radius: 8px 8px 0 0;
          border-bottom: none;
        }
        .quill-wrapper .ql-container {
          background: #0A0A0F;
          border: 1px solid rgba(192,192,192,0.1);
          border-radius: 0 0 8px 8px;
          font-family: 'Inter', sans-serif;
          font-size: 15px;
          color: rgba(255,255,255,0.85);
          min-height: ${minHeight}px;
        }
        .quill-wrapper .ql-editor {
          min-height: ${minHeight}px;
          color: rgba(255,255,255,0.85);
        }
        .quill-wrapper .ql-editor.ql-blank::before {
          color: rgba(192,192,192,0.3);
          font-style: normal;
        }
        .ql-picker-label, .ql-picker-item {
          color: rgba(192,192,192,0.7) !important;
        }
        .ql-stroke { stroke: rgba(192,192,192,0.7) !important; }
        .ql-fill { fill: rgba(192,192,192,0.7) !important; }
        .ql-active .ql-stroke { stroke: #8BC8A0 !important; }
        .ql-picker-options {
          background: #1A1A2E !important;
          border-color: rgba(192,192,192,0.1) !important;
        }
      `}</style>
      <div ref={editorRef} />
    </div>
  );
}
