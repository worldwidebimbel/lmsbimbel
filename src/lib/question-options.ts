// Helpers for question options that may be stored as plain strings (legacy)
// or as objects { text: string, imageUrl?: string }.

export interface OptionItem {
  text: string;
  imageUrl?: string;
}

export type OptionValue = string | OptionItem;

export function normalizeOption(opt: unknown): OptionItem {
  if (typeof opt === "string") return { text: opt };
  if (opt && typeof opt === "object" && "text" in opt) {
    return { text: String((opt as OptionItem).text), imageUrl: (opt as OptionItem).imageUrl };
  }
  return { text: String(opt ?? "") };
}

export function normalizeOptions(opts: unknown[] | null | undefined): OptionItem[] {
  if (!Array.isArray(opts)) return [];
  return opts.map(normalizeOption);
}

export function optionText(opt: unknown): string {
  return normalizeOption(opt).text;
}

export function optionImageUrl(opt: unknown): string | undefined {
  return normalizeOption(opt).imageUrl;
}

export function optionEqual(opt: unknown, text: string): boolean {
  return optionText(opt) === text;
}

export function toOptionPayload(text: string, imageUrl?: string): OptionValue {
  if (imageUrl) return { text, imageUrl };
  return text;
}

export function renderContentHtml(content: string): string {
  // Allow plain text with newlines + already embedded HTML tags.
  // If no block tag, wrap paragraphs from blank lines.
  if (/<(img|p|div|h[1-6]|ul|ol|li|br)[\s>]/i.test(content)) return content;
  return content
    .split(/\n\s*\n/)
    .map((p) => `<p class="mb-2">${p.replace(/\n/g, "<br/>")}</p>`)
    .join("");
}
