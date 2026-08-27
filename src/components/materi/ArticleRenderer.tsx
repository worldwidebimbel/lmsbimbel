// Lightweight markdown-lite renderer for material article content.
// Supports: # / ## headings, **bold**, numbered list items ("1. text") rendered as
// colored circle badges, and simple pipe tables ("| Col | Col |").
// No external dependency — keeps bundle small for a fairly narrow feature set.

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

interface Block {
  type: "h2" | "h3" | "numbered" | "table" | "p";
  lines: string[];
}

function parseBlocks(content: string): Block[] {
  const rawLines = content.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];
    const trimmed = line.trim();

    if (!trimmed) { i++; continue; }

    if (trimmed.startsWith("## ")) {
      blocks.push({ type: "h3", lines: [trimmed.slice(3)] });
      i++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      blocks.push({ type: "h2", lines: [trimmed.slice(2)] });
      i++;
      continue;
    }
    if (trimmed.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < rawLines.length && rawLines[i].trim().startsWith("|")) {
        tableLines.push(rawLines[i].trim());
        i++;
      }
      blocks.push({ type: "table", lines: tableLines });
      continue;
    }
    if (/^\d+\.\s/.test(trimmed)) {
      const numberedLines: string[] = [];
      while (i < rawLines.length && /^\d+\.\s/.test(rawLines[i].trim())) {
        numberedLines.push(rawLines[i].trim());
        i++;
      }
      blocks.push({ type: "numbered", lines: numberedLines });
      continue;
    }

    const paraLines: string[] = [];
    while (i < rawLines.length && rawLines[i].trim() && !rawLines[i].trim().startsWith("#") && !rawLines[i].trim().startsWith("|") && !/^\d+\.\s/.test(rawLines[i].trim())) {
      paraLines.push(rawLines[i].trim());
      i++;
    }
    blocks.push({ type: "p", lines: paraLines });
  }

  return blocks;
}

const NUMBER_COLORS = ["bg-blue-500", "bg-amber-500", "bg-green-500", "bg-purple-500", "bg-pink-500"];

export function ArticleRenderer({ content }: { content: string }) {
  const blocks = parseBlocks(content);

  return (
    <div className="space-y-5">
      {blocks.map((block, idx) => {
        if (block.type === "h2") {
          return (
            <div key={idx} className="pt-1">
              <h2 className="text-lg font-bold text-gray-900">{renderInline(block.lines[0])}</h2>
              <div className="mt-1.5 h-1 w-14 rounded-full bg-blue-600" />
            </div>
          );
        }
        if (block.type === "h3") {
          return (
            <h3 key={idx} className="text-base font-bold text-gray-800 pt-1">{renderInline(block.lines[0])}</h3>
          );
        }
        if (block.type === "numbered") {
          return (
            <div key={idx} className="space-y-3">
              {block.lines.map((line, i) => {
                const match = line.match(/^(\d+)\.\s(.+)$/);
                const num = match?.[1] ?? String(i + 1);
                const text = match?.[2] ?? line;
                const [title, ...rest] = text.split(/:\s(.+)/);
                return (
                  <div key={i} className="flex items-start gap-3">
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${NUMBER_COLORS[i % NUMBER_COLORS.length]}`}>
                      {num}
                    </span>
                    <div className="text-sm text-gray-700">
                      <p className="font-semibold text-gray-900">{renderInline(title)}</p>
                      {rest.length > 0 && <p className="mt-0.5 text-gray-600">{renderInline(rest.join(": "))}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }
        if (block.type === "table") {
          const rows = block.lines
            .filter((l) => !/^\|[\s-:|]+\|$/.test(l))
            .map((l) => l.split("|").slice(1, -1).map((c) => c.trim()));
          if (rows.length === 0) return null;
          const [header, ...body] = rows;
          return (
            <div key={idx} className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <tbody>
                  {body.map((row, ri) => (
                    <tr key={ri} className={ri % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                      {row.map((cell, ci) => (
                        <td key={ci} className={`px-4 py-3 align-top ${ci === 0 ? "font-semibold text-gray-900 whitespace-nowrap" : "text-gray-600"}`}>
                          {renderInline(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return (
          <p key={idx} className="text-sm leading-relaxed text-gray-700">
            {block.lines.map((l, i) => (
              <span key={i}>
                {renderInline(l)}
                {i < block.lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
