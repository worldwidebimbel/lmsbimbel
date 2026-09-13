"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { applyListConfig } from "@/lib/list-config";
import { SITE_DEFAULTS } from "@/lib/site-config";

interface Testimonial {
  id: string;
  name: string;
  role: string | null;
  text: string;
  photoUrl: string | null;
  avatarUrl: string | null;
  rating: number;
  programName: string | null;
  isFeatured: boolean;
  createdAt: string | Date;
}

// Adapter: SiteTestimonial pakai isFeatured, ListConfigItem pakai featured
function withFeatured(t: Testimonial) {
  return { ...t, featured: t.isFeatured };
}

export default function TestimoniSection({
  testimonials,
  config,
}: {
  testimonials: Testimonial[];
  config: typeof SITE_DEFAULTS;
}) {
  const style = config.testimonial_style ?? "grid";
  const adapted = testimonials.map(withFeatured);
  const display = applyListConfig(adapted, config.testimonial_count, config.testimonial_filter);

  if (!display || display.length === 0) return null;

  if (style === "marquee") return <MarqueeTestimonials testimonials={display} config={config} />;
  if (style === "carousel") return <CarouselTestimonials testimonials={display} config={config} />;
  return <GridTestimonials testimonials={display} />;
}

/* ============ Style 1: Grid 3 kolom + nav (default / existing) ============ */

function GridTestimonials({ testimonials }: { testimonials: Testimonial[] }) {
  const [current, setCurrent] = useState(0);

  const pages = Math.ceil(testimonials.length / 3);
  const next = () => setCurrent((c) => (c + 1) % pages);
  const prev = () => setCurrent((c) => (c - 1 + pages) % pages);

  const startIndex = current * 3;
  const visible = testimonials.slice(startIndex, startIndex + 3);

  return (
    <section id="testimoni" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader />

        {/* Desktop grid */}
        <div className="mt-12 hidden gap-6 sm:grid sm:grid-cols-3">
          {visible.map((t) => (
            <TestimonialCard key={t.id} t={t} />
          ))}
        </div>

        {/* Mobile slider */}
        <div className="mt-12 sm:hidden">
          <div className="overflow-hidden">
            <div className="flex transition-transform" style={{ transform: `translateX(-${current * 100}%)` }}>
              {testimonials.map((t) => (
                <div key={t.id} className="w-full flex-shrink-0 px-2">
                  <TestimonialCard t={t} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation */}
        {testimonials.length > 3 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button onClick={prev} className="rounded-full border border-gray-300 p-2 text-gray-500 hover:bg-gray-50">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex gap-2">
              {Array.from({ length: pages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className="h-2 rounded-full transition-all"
                  style={{ width: i === current ? "24px" : "8px", backgroundColor: i === current ? "#1e3a8a" : "#d1d5db" }}
                />
              ))}
            </div>
            <button onClick={next} className="rounded-full border border-gray-300 p-2 text-gray-500 hover:bg-gray-50">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        <SeeAllLink />
      </div>
    </section>
  );
}

/* ============ Style 2: Carousel Infinity Loop (marquee) ============ */

function MarqueeTestimonials({ testimonials, config }: { testimonials: Testimonial[]; config: typeof SITE_DEFAULTS }) {
  const direction = config.testimonial_marquee_direction === "right" ? "right" : "left";
  const speed = parseInt(config.testimonial_marquee_speed ?? "30", 10) || 30;

  return (
    <section id="testimoni" className="overflow-hidden bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader />
      </div>
      <div className="marquee-paused relative mt-12">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent" />
        <div
          className={`flex w-max gap-6 ${direction === "left" ? "animate-marquee-left" : "animate-marquee-right"}`}
          style={{ "--marquee-duration": `${speed}s` } as React.CSSProperties}
        >
          {[...testimonials, ...testimonials].map((t, i) => (
            <div key={`${t.id}-${i}`} className="w-80">
              <TestimonialCard t={t} />
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-7xl px-6">
        <SeeAllLink />
      </div>
    </section>
  );
}

/* ============ Style 3: Carousel Slide (arrow + dots + autoplay) ============ */

function CarouselTestimonials({ testimonials, config }: { testimonials: Testimonial[]; config: typeof SITE_DEFAULTS }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const autoplay = (config.testimonial_carousel_autoplay ?? "true") === "true";
  const loop = (config.testimonial_carousel_loop ?? "true") === "true";
  const interval = parseInt(config.testimonial_carousel_interval ?? "5", 10) || 5;

  const step = useCallback(() => {
    const container = containerRef.current;
    const card = cardRef.current;
    if (!container || !card) return;
    const gap = 24;
    const cardStep = card.offsetWidth + gap;
    const maxIndex = testimonials.length - 1;
    const nextIndex = current >= maxIndex ? (loop ? 0 : current) : current + 1;
    if (nextIndex === current && !loop) return;
    setCurrent(nextIndex);
    if (nextIndex === 0 && current === maxIndex) {
      container.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      container.scrollBy({ left: cardStep, behavior: "smooth" });
    }
  }, [current, loop, testimonials.length]);

  useEffect(() => {
    if (!autoplay || testimonials.length < 2) return;
    const timer = setInterval(step, interval * 1000);
    return () => clearInterval(timer);
  }, [autoplay, interval, step, testimonials.length]);

  function handleScroll() {
    const container = containerRef.current;
    const card = cardRef.current;
    if (!container || !card) return;
    const idx = Math.round(container.scrollLeft / (card.offsetWidth + 24));
    setCurrent(Math.min(Math.max(idx, 0), testimonials.length - 1));
  }

  function goPrev() {
    const container = containerRef.current;
    const card = cardRef.current;
    if (!container || !card) return;
    container.scrollBy({ left: -(card.offsetWidth + 24), behavior: "smooth" });
  }

  function goTo(idx: number) {
    const container = containerRef.current;
    const card = cardRef.current;
    if (!container || !card) return;
    container.scrollTo({ left: idx * (card.offsetWidth + 24), behavior: "smooth" });
    setCurrent(idx);
  }

  return (
    <section id="testimoni" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader />

        <div className="relative mt-12">
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {testimonials.map((t, i) => (
              <div
                key={t.id}
                ref={i === 0 ? cardRef : undefined}
                className="w-[85%] shrink-0 snap-start sm:w-[45%] lg:w-[31%]"
              >
                <TestimonialCard t={t} />
              </div>
            ))}
          </div>

          <button
            onClick={goPrev}
            aria-label="Sebelumnya"
            className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-gray-200 bg-white p-3 shadow-md hover:bg-gray-50 lg:flex"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={step}
            aria-label="Berikutnya"
            className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-gray-200 bg-white p-3 shadow-md hover:bg-gray-50 lg:flex"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {testimonials.length > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Slide ${i + 1}`}
                className="h-2 rounded-full transition-all"
                style={{ width: i === current ? "24px" : "8px", backgroundColor: i === current ? "#1e3a8a" : "#d1d5db" }}
              />
            ))}
          </div>
        )}

        <SeeAllLink />
      </div>
    </section>
  );
}

/* ============ Shared sub-components ============ */

function SectionHeader() {
  return (
    <>
      <div className="mb-12 flex items-center justify-center gap-4">
        <div className="h-px w-12 bg-gray-300" />
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-900">
          <Quote className="h-6 w-6 text-yellow-400" />
        </div>
        <div className="h-px w-12 bg-gray-300" />
      </div>
      <h2 className="text-center text-3xl font-bold text-blue-900 sm:text-4xl">TESTIMONI SISWA</h2>
      <p className="mt-3 text-center text-gray-500">Apa kata siswa & orang tua tentang kami</p>
    </>
  );
}

function SeeAllLink() {
  return (
    <div className="mt-8 text-center">
      <a href="/testimoni" className="text-sm font-bold text-blue-600 hover:text-blue-700">
        Lihat semua testimoni →
      </a>
    </div>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  const photo = t.photoUrl ?? t.avatarUrl;
  return (
    <div className="h-full rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      {photo && (
        <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
          <Image src={photo} alt={t.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
        </div>
      )}
      <Quote className="h-8 w-8 text-yellow-400" />
      <p className="mt-2 text-sm leading-relaxed text-gray-600 line-clamp-4">&ldquo;{t.text}&rdquo;</p>
      <div className="mt-4 flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`h-4 w-4 ${i < t.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
        ))}
      </div>
      <div className="mt-3">
        <p className="font-bold text-gray-900">{t.name}</p>
        <p className="text-xs text-gray-500">{t.role ?? t.programName}</p>
      </div>
    </div>
  );
}
