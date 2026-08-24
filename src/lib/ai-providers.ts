/**
 * AI provider registry shared between the generator UI and the API route.
 *
 * Only non-secret metadata lives here (ids, labels, model slugs) so this module
 * is safe to import from client components. API keys and base URLs are resolved
 * server-side in `resolveProviderConfig`, which must only run on the server.
 */

export type AIProviderId = "apiclaude" | "openrouter";

export interface AIModelOption {
  value: string;
  label: string;
}

export interface AIProviderMeta {
  id: AIProviderId;
  label: string;
  /** Docs / dashboard link shown as a hint in the UI. */
  site: string;
  models: AIModelOption[];
}

export const AI_PROVIDERS: AIProviderMeta[] = [
  {
    id: "apiclaude",
    label: "APIClaude.net",
    site: "https://apiclaude.net",
    models: [
      { value: "langgananku/claude-sonnet-4-20250514", label: "Claude Sonnet 4 (Recommended)" },
      { value: "langgananku/claude-opus-5", label: "Claude Opus 5" },
      { value: "cbcn/glm-5.2", label: "GLM 5.2" },
      { value: "cbcn/deepseek-v3", label: "DeepSeek V3" },
      { value: "gcli/grok-3", label: "Grok 3" },
    ],
  },
  {
    id: "openrouter",
    label: "OpenRouter.ai",
    site: "https://openrouter.ai/models",
    models: [
      { value: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4 (Recommended)" },
      { value: "openai/gpt-4o", label: "GPT-4o" },
      { value: "openai/gpt-4o-mini", label: "GPT-4o mini (murah)" },
      { value: "google/gemini-2.0-flash-001", label: "Gemini 2.0 Flash (cepat)" },
      { value: "deepseek/deepseek-chat", label: "DeepSeek V3" },
      { value: "meta-llama/llama-3.3-70b-instruct", label: "Llama 3.3 70B" },
      { value: "qwen/qwen-2.5-72b-instruct", label: "Qwen 2.5 72B" },
      { value: "deepseek/deepseek-r1:free", label: "DeepSeek R1 (gratis)" },
    ],
  },
];

export const DEFAULT_PROVIDER_ID: AIProviderId = "apiclaude";

export function getProvider(id?: string): AIProviderMeta {
  return AI_PROVIDERS.find((p) => p.id === id) ?? AI_PROVIDERS[0];
}

export interface ResolvedProviderConfig {
  baseUrl: string;
  apiKey?: string;
  headers: Record<string, string>;
  defaultModel: string;
  /** Env var name to mention in the error message when the key is missing. */
  keyEnvName: string;
}

/**
 * Resolve the runtime configuration for a provider. Server-only: reads
 * environment variables that hold API keys.
 */
export function resolveProviderConfig(id: AIProviderId): ResolvedProviderConfig {
  if (id === "openrouter") {
    const headers: Record<string, string> = {};
    // OpenRouter uses these for attribution / rankings; both are optional.
    const referer = process.env.OPENROUTER_SITE_URL || process.env.NEXT_PUBLIC_APP_URL;
    const title = process.env.OPENROUTER_SITE_NAME || process.env.NEXT_PUBLIC_APP_NAME;
    if (referer) headers["HTTP-Referer"] = referer;
    if (title) headers["X-Title"] = title;

    return {
      baseUrl: process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      headers,
      defaultModel: process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4",
      keyEnvName: "OPENROUTER_API_KEY",
    };
  }

  return {
    baseUrl: process.env.AI_BASE_URL || "https://apiclaude.net/v1",
    apiKey: process.env.APICLAUDE_API_KEY || process.env.OPENAI_API_KEY || process.env.AI_API_KEY,
    headers: {},
    defaultModel: process.env.AI_MODEL || "langgananku/claude-sonnet-4-20250514",
    keyEnvName: "APICLAUDE_API_KEY (atau OPENAI_API_KEY)",
  };
}
