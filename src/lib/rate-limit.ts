import { NextRequest, NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

export function rateLimit(opts: RateLimitOptions) {
  return (req: NextRequest): NextResponse | null => {
    cleanup();
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const key = `${ip}:${req.nextUrl.pathname}`;
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + opts.windowMs });
      return null;
    }

    entry.count++;
    if (entry.count > opts.max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return NextResponse.json(
        { error: opts.message ?? "Terlalu banyak permintaan. Coba lagi nanti." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(opts.max),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
          },
        }
      );
    }

    return null;
  };
}

export const RATE_LIMITS = {
  login: rateLimit({ windowMs: 15 * 60_000, max: 10, message: "Terlalu banyak percobaan login. Coba lagi dalam 15 menit." }),
  register: rateLimit({ windowMs: 60 * 60_000, max: 5, message: "Terlalu banyak registrasi. Coba lagi dalam 1 jam." }),
  publicForm: rateLimit({ windowMs: 10 * 60_000, max: 10, message: "Terlalu banyak pengiriman form. Coba lagi nanti." }),
  upload: rateLimit({ windowMs: 60_000, max: 20, message: "Terlalu banyak upload. Coba lagi nanti." }),
  ai: rateLimit({ windowMs: 60_000, max: 10, message: "Terlalu banyak permintaan AI. Coba lagi nanti." }),
  // AI Builder — per kapabilitas (future-commit.md §5.3)
  aiText: rateLimit({ windowMs: 60_000, max: 10, message: "Terlalu banyak permintaan AI teks. Coba lagi nanti." }),
  aiImage: rateLimit({ windowMs: 60_000, max: 5, message: "Terlalu banyak permintaan AI gambar. Coba lagi nanti." }),
  aiDesign: rateLimit({ windowMs: 60_000, max: 5, message: "Terlalu banyak permintaan AI desain. Coba lagi nanti." }),
  aiAudio: rateLimit({ windowMs: 60_000, max: 5, message: "Terlalu banyak permintaan AI audio. Coba lagi nanti." }),
  aiVideo: rateLimit({ windowMs: 60 * 60_000, max: 2, message: "Terlalu banyak permintaan AI video. Maksimal 2 per jam." }),
};
