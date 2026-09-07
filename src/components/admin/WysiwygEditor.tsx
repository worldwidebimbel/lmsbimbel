"use client";

import { useRef, useEffect, useCallback } from "react";
import { Bold, Italic, List, ListOrdered, Quote, Link as LinkIcon, Heading2, Undo2, Redo2 } from "lucide-react";

interface WysiwygEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export default function WysiwygEditor({ value, onChange, placeholder, minHeight = 200 }: WysiwygEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const lastValue = useRef(value);

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value && value !== lastValue.current) {
      ref.current.innerHTML = value || "";
      lastValue.current = value;
    }
  }, [value]);

  const exec = useCallback((command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    ref.current?.focus();
    if (ref.current) {
      lastValue.current = ref.current.innerHTML;
      onChange(ref.current.innerHTML);
    }
  }, [onChange]);

  const handleInput = useCallback(() => {
    if (ref.current) {
      lastValue.current = ref.current.innerHTML;
      onChange(ref.current.innerHTML);
    }
  }, [onChange]);

  const addLink = useCallback(() => {
    const url = window.prompt("Masukkan URL link:");
    if (url) exec("createLink", url);
  }, [exec]);

  const toolbarBtns = [
    { icon: Bold, cmd: () => exec("bold"), title: "Bold" },
    { icon: Italic, cmd: () => exec("italic"), title: "Italic" },
    { icon: Heading2, cmd: () => exec("formatBlock", "<h2>"), title: "Heading" },
    { icon: Quote, cmd: () => exec("formatBlock", "<blockquote>"), title: "Quote" },
    { icon: List, cmd: () => exec("insertUnorderedList"), title: "Bullet List" },
    { icon: ListOrdered, cmd: () => exec("insertOrderedList"), title: "Numbered List" },
    { icon: LinkIcon, cmd: addLink, title: "Link" },
    { icon: Undo2, cmd: () => exec("undo"), title: "Undo" },
    { icon: Redo2, cmd: () => exec("redo"), title: "Redo" },
  ];

  return (
    <div className="rounded-lg border border-gray-300 overflow-hidden">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1">
        {toolbarBtns.map((btn, i) => {
          const Icon = btn.icon;
          return (
            <button
              key={i}
              type="button"
              title={btn.title}
              onMouseDown={(e) => {
                e.preventDefault();
                btn.cmd();
              }}
              className="rounded p-1.5 text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors"
            >
              <Icon className="h-4 w-4" />
            </button>
          );
        })}
        <span className="ml-auto text-[10px] text-gray-400 pr-1">WYSIWYG</span>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        data-placeholder={placeholder ?? "Tulis konten di sini..."}
        style={{ minHeight }}
        className="prose prose-sm max-w-none px-4 py-3 focus:outline-none [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_a]:text-blue-600 [&_a]:underline empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
      />
    </div>
  );
}
