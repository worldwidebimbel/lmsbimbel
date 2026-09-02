"use client";

import React, { useEffect, useRef } from "react";

const ARABIC_REGEX = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const JAVANESE_REGEX = /[\uA980-\uA9DF]/;

function isArabic(text: string) { return ARABIC_REGEX.test(text); }
function isJavanese(text: string) { return JAVANESE_REGEX.test(text); }

interface Segment {
  type: "text" | "inline-math" | "display-math";
  value: string;
}

function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  const displayRegex = /\$\$([^$]+)\$\$/g;
  const inlineRegex = /\$([^$\n]+)\$/g;

  let lastIndex = 0;

  const allMatches: { index: number; end: number; type: "inline-math" | "display-math"; value: string }[] = [];

  let m: RegExpExecArray | null;
  const tempText = text;

  displayRegex.lastIndex = 0;
  while ((m = displayRegex.exec(tempText)) !== null) {
    allMatches.push({ index: m.index, end: m.index + m[0].length, type: "display-math", value: m[1] });
  }

  inlineRegex.lastIndex = 0;
  while ((m = inlineRegex.exec(tempText)) !== null) {
    const alreadyCovered = allMatches.some((am) => m!.index >= am.index && m!.index < am.end);
    if (!alreadyCovered) {
      allMatches.push({ index: m.index, end: m.index + m[0].length, type: "inline-math", value: m[1] });
    }
  }

  allMatches.sort((a, b) => a.index - b.index);

  for (const match of allMatches) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }
    segments.push({ type: match.type, value: match.value });
    lastIndex = match.end;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: "text", value: text }];
}

function TextSegment({ value }: { value: string }) {
  if (isArabic(value)) {
    return <span className="font-arabic">{value}</span>;
  }
  if (isJavanese(value)) {
    return <span className="font-javanese">{value}</span>;
  }
  if (value.includes("<img")) {
    return <span dangerouslySetInnerHTML={{ __html: value }} />;
  }
  return <span>{value}</span>;
}

function KatexSpan({ latex, displayMode }: { latex: string; displayMode: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    import("katex").then((katex) => {
      try {
        katex.default.render(latex, ref.current!, {
          throwOnError: false,
          displayMode,
          trust: false,
          output: "html",
        });
      } catch {
        if (ref.current) ref.current.textContent = `$${latex}$`;
      }
    });
  }, [latex, displayMode]);

  return (
    <span
      ref={ref}
      className={displayMode ? "block my-2 text-center overflow-x-auto" : "inline"}
    />
  );
}

export default function MathRenderer({ content, className }: { content: string; className?: string }) {
  if (!content) return null;

  const hasMath = content.includes("$");
  const hasHtml = content.includes("<");

  if (!hasMath && !hasHtml && !isArabic(content) && !isJavanese(content)) {
    return <span className={className}>{content}</span>;
  }

  const segments = parseSegments(content);

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.type === "inline-math") return <KatexSpan key={i} latex={seg.value} displayMode={false} />;
        if (seg.type === "display-math") return <KatexSpan key={i} latex={seg.value} displayMode={true} />;
        return <TextSegment key={i} value={seg.value} />;
      })}
    </span>
  );
}
