"use client";

import Link from "next/link";
import { CheckCircle, ArrowRight, Star, HelpCircle, Phone, MessageCircle } from "lucide-react";
import { readableTextColor } from "@/lib/readable-text";

interface Section {
  type: string;
  [key: string]: unknown;
}

interface LandingPageData {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sections: Section[];
  ctaType: string;
  ctaUrl: string | null;
}

function HeaderSection({ data, pageTitle }: { data: Record<string, unknown>; pageTitle: string }) {
  const logoUrl = String(data.logoUrl ?? "").trim();
  const ctaLabel = String(data.ctaLabel ?? "Hubungi Kami");
  const ctaUrl = String(data.ctaUrl ?? "#").trim();
  const model = String(data.model ?? "RIGHT_LEFT");
  const bgColor = String(data.bgColor ?? "#ffffff");
  const ctaColor = String(data.ctaColor ?? "#16a34a");
  const ctaTextColor = readableTextColor(ctaColor);
  const logoTextColor = readableTextColor(bgColor);
  const isTopBottom = model === "TOP_BOTTOM";
  const external = /^https?:\/\//i.test(ctaUrl);

  return (
    <header className="px-4 py-4 sm:px-6" style={{ backgroundColor: bgColor }}>
      <div
        className={`mx-auto max-w-5xl gap-4 ${
          isTopBottom ? "flex flex-col items-center text-center" : "flex items-center justify-between"
        }`}
      >
        {logoUrl ? (
          <img src={logoUrl} alt={pageTitle} className="h-10 w-auto max-w-[200px] object-contain sm:h-12" />
        ) : (
          <span className="text-lg font-extrabold sm:text-xl" style={{ color: logoTextColor }}>
            {pageTitle}
          </span>
        )}
        <a
          href={ctaUrl || "#"}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ backgroundColor: ctaColor, color: ctaTextColor }}
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          {ctaLabel}
        </a>
      </div>
    </header>
  );
}

function HeroSection({ data }: { data: Record<string, unknown> }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 text-white py-20">
      {String(data.bgImage ?? "") && (
        <div className="absolute inset-0 opacity-20">
          <img src={String(data.bgImage)} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="relative max-w-4xl mx-auto px-4 text-center">
        {String(data.badge ?? "") && (
          <span className="inline-block mb-4 px-4 py-1.5 rounded-full bg-white/20 text-sm font-medium">
            {String(data.badge)}
          </span>
        )}
        <h1 className="text-4xl md:text-5xl font-bold mb-4">{String(data.title ?? "")}</h1>
        {String(data.subtitle ?? "") && <p className="text-lg md:text-xl text-white/90 mb-8">{String(data.subtitle)}</p>}
        {String(data.ctaLabel ?? "") && (
          <Link
            href={String(data.ctaUrl ?? "#")}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-indigo-700 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
          >
            {String(data.ctaLabel)}
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </section>
  );
}

function FeaturesSection({ data }: { data: Record<string, unknown> }) {
  const features = (data.items as Array<{ icon?: string; title: string; desc?: string }>) || [];
  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4">
        {String(data.title ?? "") && <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">{String(data.title)}</h2>}
        {String(data.subtitle ?? "") && <p className="text-center text-gray-500 mb-10">{String(data.subtitle)}</p>}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              {f.desc && <p className="text-sm text-gray-500">{f.desc}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialSection({ data }: { data: Record<string, unknown> }) {
  const items = (data.items as Array<{ name: string; role?: string; text: string; avatar?: string }>) || [];
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4">
        {String(data.title ?? "") && <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">{String(data.title)}</h2>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {items.map((t, i) => (
            <div key={i} className="rounded-xl bg-white border border-gray-200 p-6">
              <div className="flex gap-1 mb-3">
                {[...Array(5)].map((_, j) => <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-gray-700 mb-4 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                {t.avatar && <img src={t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover" />}
                <div>
                  <p className="font-medium text-gray-900">{t.name}</p>
                  {t.role && <p className="text-xs text-gray-500">{t.role}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqSection({ data }: { data: Record<string, unknown> }) {
  const items = (data.items as Array<{ q: string; a: string }>) || [];
  return (
    <section className="py-16 bg-white">
      <div className="max-w-3xl mx-auto px-4">
        {String(data.title ?? "") && <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">{String(data.title)}</h2>}
        <div className="space-y-3">
          {items.map((f, i) => (
            <details key={i} className="group rounded-xl border border-gray-200 p-4">
              <summary className="flex items-center gap-3 cursor-pointer font-medium text-gray-900">
                <HelpCircle className="h-5 w-5 text-indigo-600 shrink-0" />
                {f.q}
              </summary>
              <p className="mt-3 text-sm text-gray-600 pl-8">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection({ data }: { data: Record<string, unknown> }) {
  return (
    <section className="py-16 bg-indigo-600 text-white">
      <div className="max-w-3xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-4">{String(data.title ?? "Siap memulai?")}</h2>
        {String(data.subtitle ?? "") && <p className="text-white/90 mb-8">{String(data.subtitle)}</p>}
        <Link
          href={String(data.ctaUrl ?? "/ppdb")}
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-indigo-700 rounded-xl font-semibold hover:bg-indigo-50 transition-colors"
        >
          {String(data.ctaLabel ?? "Daftar Sekarang")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function FormSection({ data }: { data: Record<string, unknown> }) {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-lg mx-auto px-4">
        {String(data.title ?? "") && <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">{String(data.title)}</h2>}
        {String(data.subtitle ?? "") && <p className="text-center text-gray-500 mb-6">{String(data.subtitle)}</p>}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            const form = e.currentTarget;
            const fd = new FormData(form);
            await fetch("/api/site/inquiry", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: fd.get("name"),
                phone: fd.get("phone"),
                email: fd.get("email"),
                program: fd.get("program"),
                message: fd.get("message"),
              }),
            });
            form.reset();
            alert("Pesan terkirim! Kami akan menghubungi Anda segera.");
          }}
          className="space-y-4 bg-white rounded-xl border border-gray-200 p-6"
        >
          <input name="name" required placeholder="Nama lengkap" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm" />
          <input name="phone" required placeholder="No. WhatsApp" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm" />
          <input name="email" type="email" placeholder="Email (opsional)" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm" />
          <input name="program" placeholder="Program yang diminati" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm" />
          <textarea name="message" rows={3} placeholder="Pesan" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm" />
          <button type="submit" className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700">
            Kirim
          </button>
        </form>
      </div>
    </section>
  );
}

function ContentSection({ data }: { data: Record<string, unknown> }) {
  const bgColor = String(data.bgColor ?? "#ffffff");
  const textColor = String(data.textColor ?? "#1f2937");
  const maxWidth = String(data.maxWidth ?? "3xl");
  const maxWClass =
    maxWidth === "2xl" ? "max-w-2xl" :
    maxWidth === "4xl" ? "max-w-4xl" :
    maxWidth === "5xl" ? "max-w-5xl" :
    "max-w-3xl";
  const content = String(data.content ?? "");
  const title = String(data.title ?? "");

  return (
    <section className="py-16" style={{ backgroundColor: bgColor, color: textColor }}>
      <div className={`mx-auto px-4 ${maxWClass}`}>
        {title && <h2 className="text-3xl font-bold text-center mb-8">{title}</h2>}
        {content && (
          <div
            className="prose prose-sm sm:prose-base max-w-none [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_a]:text-blue-600 [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </div>
    </section>
  );
}

const SECTION_RENDERERS: Record<string, React.FC<{ data: Record<string, unknown> }>> = {
  HERO: HeroSection,
  FEATURES: FeaturesSection,
  TESTIMONIAL: TestimonialSection,
  FAQ: FaqSection,
  CTA: CtaSection,
  CONTENT: ContentSection,
  FORM: FormSection,
};

export default function LandingPageView({
  page,
  showHeader,
  showFooter,
}: {
  page: LandingPageData;
  showHeader?: boolean;
  showFooter?: boolean;
}) {
  // Saat dipanggil dalam PublicShell (showHeader/showFooter dari DB), skip header/footer bawaan
  const skipOwnHeader = showHeader === true;
  const skipOwnFooter = showFooter === true;

  return (
    <div className="min-h-screen">
      {(page.sections || []).map((section, i) => {
        if (section.type === "HEADER" && skipOwnHeader) return null;
        if (section.type === "HEADER") {
          return <HeaderSection key={i} data={section as Record<string, unknown>} pageTitle={page.title} />;
        }
        const Renderer = SECTION_RENDERERS[section.type];
        if (!Renderer) return null;
        return <Renderer key={i} data={section as Record<string, unknown>} />;
      })}

      {!skipOwnFooter && (
        <footer className="py-8 bg-gray-900 text-white/60 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} {page.title}. All rights reserved.</p>
        </footer>
      )}
    </div>
  );
}
