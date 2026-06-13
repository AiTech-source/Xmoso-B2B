"use client";
import { useEffect, useRef, useState } from "react";

// Brand + extended palette
const COLORS = [
  "#ffffff", "#C0C0C0", "#8BC8A0", "#7EC8E3", "#e8c87e", "#ffc107", "#f44336",
  "#000000", "#333333", "#666666", "#999999", "#cccccc",
  "#f44336", "#e91e63", "#9c27b0", "#3f51b5", "#2196f3", "#009688",
  "#4caf50", "#8bc34a", "#cddc39", "#ffeb3b", "#ff9800",
  "#ff5722", "#795548", "#607d8b",
];

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  [{ size: ["small", false, "large", "huge"] }],
  ["bold", "italic", "underline", "strike"],
  [{ color: COLORS }, { background: COLORS }],
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
  const [customColor, setCustomColor] = useState("#2a7d4e");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (initialized.current) return;

    async function init() {
      const Quill = (await import("quill")).default;
      await import("quill/dist/quill.snow.css?inline" as any);

      if (!editorRef.current || quillRef.current) return;

      const quill = new Quill(editorRef.current, {
        theme: "snow",
        modules: { toolbar: TOOLBAR_OPTIONS },
        placeholder,
      });

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

  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      quillRef.current.root.innerHTML = value;
    }
  }, [value]);

  function applyColor(color: string, isBg = false) {
    const quill = quillRef.current;
    if (!quill) return;
    const range = quill.getSelection();
    if (!range || range.length === 0) {
      quill.format(isBg ? "background" : "color", color);
      return;
    }
    quill.formatText(range.index, range.length, isBg ? "background" : "color", color);
    quill.setSelection(range.index + range.length, 0);
  }

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
        /* Color swatch items in Quill picker */
        .ql-picker-item[data-value] {
          width: 18px !important;
          height: 18px !important;
          margin: 1px !important;
          border-radius: 3px !important;
        }
      `}</style>
      <div ref={editorRef} />

      {/* ── Custom color bar (always visible below toolbar) ── */}
      <div className="flex items-center gap-2 px-3 py-2 bg-[#14142a] border border-t-0 border-silver/10 rounded-b-lg flex-wrap">
        {/* Quick brand colors */}
        <span className="text-[10px] text-silver/40 uppercase tracking-wider mr-1">Color:</span>
        {["#8BC8A0", "#7EC8E3", "#e8c87e", "#ffc107", "#ffffff", "#C0C0C0", "#333333", "#000000"].map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => applyColor(c)}
            className="w-6 h-6 rounded-md border border-silver/20 hover:scale-110 transition-transform cursor-pointer"
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}

        {/* Hex input */}
        <div className="flex items-center gap-1 ml-2">
          <span className="text-[10px] text-silver/40">Hex:</span>
          <input
            type="text"
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            className="w-20 bg-deep-dark border border-silver/10 rounded px-2 py-1 text-xs text-white font-mono"
            placeholder="#8BC8A0"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyColor(customColor); } }}
          />
          <button type="button" onClick={() => {
            const hex = customColor.trim();
            if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex)) {
              applyColor(hex);
            }
          }} className="text-[10px] text-forest hover:text-forest/80 px-1">Apply</button>
        </div>

        {/* RGB input */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-silver/40">RGB:</span>
          <input
            name="rgb"
            type="text"
            className="w-28 bg-deep-dark border border-silver/10 rounded px-2 py-1 text-xs text-white font-mono"
            placeholder="rgb(139,200,160)"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const val = (e.target as HTMLInputElement).value.trim();
                if (/^rgb\(/.test(val) || /^\d+/.test(val)) {
                  applyColor(val.startsWith("rgb") ? val : `rgb(${val})`);
                }
              }
            }}
          />
          <button type="button" onClick={(e) => {
            const input = (e.currentTarget.parentElement?.querySelector<HTMLInputElement>('[name="rgb"]'));
            if (!input) return;
            const val = input.value.trim();
            if (/^rgb\(/.test(val) || /^\d+/.test(val)) {
              applyColor(val.startsWith("rgb") ? val : `rgb(${val})`);
            }
          }} className="text-[10px] text-ice hover:text-ice/80 px-1">Apply</button>
        </div>
      </div>
    </div>
  );
}
