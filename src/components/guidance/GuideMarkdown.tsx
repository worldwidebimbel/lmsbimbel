import type { ReactNode } from "react";

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderInline(raw: string): string {
  let html = escapeHtml(raw);
  html = html.replace(/`([^`]+)`/g, '<code class="rounded bg-gray-100 px-1.5 py-0.5 text-[0.85em] font-mono text-blue-700">$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-800">$1</strong>');
  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" class="text-blue-600 underline hover:text-blue-700" target="_blank" rel="noopener noreferrer">$1</a>');
  html = html.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em class="italic">$2</em>');
  return html;
}

function splitTableRow(line: string): string[] {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function Heading({ level, children }: { level: number; children: ReactNode }) {
  const cls =
    level === 1
      ? "text-2xl font-bold text-gray-900"
      : level === 2
        ? "flex items-center gap-2 text-lg font-semibold text-gray-800"
        : level === 3
          ? "text-base font-semibold text-gray-800"
          : "text-sm font-semibold text-gray-700 uppercase tracking-wide";
  const Tag = `h${Math.min(level + 1, 6)}` as "h2";
  if (level === 2) {
    return (
      <Tag className={cls}>
        <span className="h-5 w-1 rounded-full bg-blue-500" />
        {children}
      </Tag>
    );
  }
  return <Tag className={cls}>{children}</Tag>;
}

function Table({ header, rows }: { header: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {header.map((cell, i) => (
              <th key={i} className="border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">
                <span dangerouslySetInnerHTML={{ __html: renderInline(cell) }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className={r % 2 === 1 ? "bg-gray-50/50" : ""}>
              {row.map((cell, c) => (
                <td key={c} className="border-b border-gray-100 px-3 py-2 align-top text-gray-600">
                  <span dangerouslySetInnerHTML={{ __html: renderInline(cell) }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-700 bg-gray-900">
      {lang && (
        <div className="border-b border-gray-700 px-4 py-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
          {lang}
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-xs leading-relaxed text-gray-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

interface ListItem {
  text: string[];
  children: string[];
}

function renderList(lines: string[], ordered: boolean, keyPrefix: string): ReactNode[] {
  const items: ReactNode[] = [];
  let current: ListItem | null = null;

  const flush = () => {
    if (!current) return;
    const idx = items.length;
    const inner = current.text.map((t, i) => (
      <span key={i} className="block" dangerouslySetInnerHTML={{ __html: renderInline(t) }} />
    ));
    const nested =
      current.children.length > 0 ? (
        <ul className="mt-1 ml-4 list-disc space-y-0.5">
          {current.children.map((child, ci) => (
            <li key={ci} className="text-sm text-gray-500">
              <span dangerouslySetInnerHTML={{ __html: renderInline(child) }} />
            </li>
          ))}
        </ul>
      ) : null;
    items.push(
      <li key={`${keyPrefix}-${idx}`} className="flex items-start gap-2 text-sm text-gray-600">
        {ordered ? (
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">
            {idx + 1}
          </span>
        ) : (
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-300" />
        )}
        <div className="min-w-0 flex-1">
          {inner}
          {nested}
        </div>
      </li>,
    );
    current = null;
  };

  for (const line of lines) {
    const checkbox = line.match(/^\s*- \[[ xX]\] (.*)$/);
    const bullet = line.match(/^(\s*)[-*] (.*)$/);
    const numbered = line.match(/^(\s*)\d+[.)] (.*)$/);

    const match = checkbox ?? bullet ?? numbered;
    if (!match) {
      if (line.trim() === "") {
        flush();
      } else if (current) {
        current.text[current.text.length - 1] += ` ${line.trim()}`;
      }
      continue;
    }

    const indent = match[1] ? match[1].length : 0;
    const text = checkbox ? checkbox[1] : (match[2] ?? "");

    if (indent >= 2 && current) {
      current.children.push(text);
    } else {
      flush();
      current = { text: [text], children: [] };
    }
  }
  flush();

  return items;
}

export default function GuideMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;
  let skippedFirstH1 = false;

  const push = (node: ReactNode) => {
    blocks.push(<div key={key++}>{node}</div>);
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") {
      i++;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      push(<CodeBlock code={codeLines.join("\n")} lang={lang} />);
      continue;
    }

    if (/^(-{3,}|_{3,}|\*{3,})$/.test(trimmed)) {
      push(<hr className="border-gray-200" />);
      i++;
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      if (level === 1 && !skippedFirstH1) {
        skippedFirstH1 = true;
        i++;
        continue;
      }
      push(
        <Heading level={Math.min(level, 4)}>
          <span dangerouslySetInnerHTML={{ __html: renderInline(heading[2]) }} />
        </Heading>,
      );
      i++;
      continue;
    }

    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      push(
        <blockquote className="rounded-xl border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-gray-600">
          {quoteLines.map((q, qi) => (
            <p key={qi} className={qi > 0 ? "mt-1" : ""} dangerouslySetInnerHTML={{ __html: renderInline(q) }} />
          ))}
        </blockquote>,
      );
      continue;
    }

    if (trimmed.startsWith("|") && i + 1 < lines.length && /^\|[\s:|-]+\|?$/.test(lines[i + 1].trim())) {
      const header = splitTableRow(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(splitTableRow(lines[i].trim()));
        i++;
      }
      push(<Table header={header} rows={rows} />);
      continue;
    }

    const isBullet = /^(\s*)[-*] /.test(line) || /^\s*- \[[ xX]\] /.test(line);
    const isNumbered = /^(\s*)\d+[.)] /.test(line);
    if (isBullet || isNumbered) {
      const listLines: string[] = [];
      while (
        i < lines.length &&
        lines[i].trim() !== "" &&
        !lines[i].trim().startsWith("```") &&
        !lines[i].trim().startsWith("#")
      ) {
        listLines.push(lines[i]);
        i++;
      }
      const items = renderList(listLines, isNumbered, `list-${key}`);
      if (isNumbered) {
        push(<ol className="space-y-1.5">{items}</ol>);
      } else {
        push(<ul className="space-y-1.5">{items}</ul>);
      }
      continue;
    }

    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("|") &&
      !/^(\s*)[-*] /.test(lines[i]) &&
      !/^(\s*)\d+[.)] /.test(lines[i])
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    push(
      <p
        className="text-sm leading-relaxed text-gray-600"
        dangerouslySetInnerHTML={{ __html: renderInline(paraLines.join(" ")) }}
      />,
    );
  }

  return <div className="space-y-5">{blocks}</div>;
}
