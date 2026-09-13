"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle, ArrowRight, Phone, ChevronLeft, ChevronRight } from "lucide-react";
import { applyListConfig } from "@/lib/list-config";
import { SITE_DEFAULTS } from "@/lib/site-config";

type ProgramFeature = string | { title?: string; desc?: string };

interface Program {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  imageUrl: string | null;
  features: unknown;
  levelLabel: string | null;
  theme: string;
  imagePosition: string;
  linkUrl: string | null;
  featured: boolean;
  createdAt: string | Date;
}

export default function ProgramUnggulanSection({
  programs,
  config,
}: {
  programs: Program[];
  config: typeof SITE_DEFAULTS;
}) {
  const style = config.program_style ?? "grid";
  const display = applyListConfig(programs, config.program_count, config.program_filter);

  if (!display || display.length === 0) return null;

  if (style === "marquee") return <MarqueePrograms programs={display} config={config} />;
  if (style === "carousel") return <CarouselPrograms programs={display} config={config} />;
  return <GridPrograms programs={display} />;
}

/* ============ Style 1: Grid 2x2 (default / existing) ============ */

function GridPrograms({ programs }: { programs: Program[] }) {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {programs.map((program) => (
            <ProgramCardLarge key={program.id} program={program} />
          ))}
        </div>

        <UspBar />
      </div>
    </section>
  );
}

/* ============ Style 2: Carousel Infinity Loop (marquee) ============ */

function MarqueePrograms({ programs, config }: { programs: Program[]; config: typeof SITE_DEFAULTS }) {
  const direction = config.program_marquee_direction === "right" ? "right" : "left";
  const speed = parseInt(config.program_marquee_speed ?? "30", 10) || 30;

  return (
    <section className="overflow-hidden py-20">
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
          {/* Duplicate content 2x untuk seamless loop */}
          {[...programs, ...programs].map((program, i) => (
            <ProgramCardCompact key={`${program.id}-${i}`} program={program} />
          ))}
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-7xl px-6">
        <UspBar />
      </div>
    </section>
  );
}

/* ============ Style 3: Carousel Slide (arrow + dots + autoplay) ============ */

function CarouselPrograms({ programs, config }: { programs: Program[]; config: typeof SITE_DEFAULTS }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);
  const autoplay = (config.program_carousel_autoplay ?? "true") === "true";
  const loop = (config.program_carousel_loop ?? "true") === "true";
  const interval = parseInt(config.program_carousel_interval ?? "5", 10) || 5;

  const step = useCallback(() => {
    const container = containerRef.current;
    const card = cardRef.current;
    if (!container || !card) return;
    const gap = 24; // gap-6
    const cardStep = card.offsetWidth + gap;
    const maxIndex = programs.length - 1;
    const nextIndex = current >= maxIndex ? (loop ? 0 : current) : current + 1;
    if (nextIndex === current && !loop) return;
    setCurrent(nextIndex);
    if (nextIndex === 0 && current === maxIndex) {
      container.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      container.scrollBy({ left: cardStep, behavior: "smooth" });
    }
  }, [current, loop, programs.length]);

  useEffect(() => {
    if (!autoplay || programs.length < 2) return;
    const timer = setInterval(step, interval * 1000);
    return () => clearInterval(timer);
  }, [autoplay, interval, step, programs.length]);

  // Track index dari scroll position (arrow manual & drag)
  function handleScroll() {
    const container = containerRef.current;
    const card = cardRef.current;
    if (!container || !card) return;
    const gap = 24;
    const idx = Math.round(container.scrollLeft / (card.offsetWidth + gap));
    setCurrent(Math.min(Math.max(idx, 0), programs.length - 1));
  }

  function goPrev() {
    const container = containerRef.current;
    const card = cardRef.current;
    if (!container || !card) return;
    const cardStep = card.offsetWidth + 24;
    container.scrollBy({ left: -cardStep, behavior: "smooth" });
  }

  function goNext() {
    step();
  }

  function goTo(idx: number) {
    const container = containerRef.current;
    const card = cardRef.current;
    if (!container || !card) return;
    const gap = 24;
    const cardStep = card.offsetWidth + gap;
    container.scrollTo({ left: idx * cardStep, behavior: "smooth" });
    setCurrent(idx);
  }

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-6">
        <SectionHeader />

        <div className="relative mt-12">
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {programs.map((program, i) => (
              <div
                key={program.id}
                ref={i === 0 ? cardRef : undefined}
                className="w-[85%] shrink-0 snap-start sm:w-[45%] lg:w-[31%]"
              >
                <ProgramCardCompact program={program} />
              </div>
            ))}
          </div>

          {/* Arrows */}
          <button
            onClick={goPrev}
            aria-label="Sebelumnya"
            className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-gray-200 bg-white p-3 shadow-md hover:bg-gray-50 lg:flex"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <button
            onClick={goNext}
            aria-label="Berikutnya"
            className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-gray-200 bg-white p-3 shadow-md hover:bg-gray-50 lg:flex"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Dots */}
        {programs.length > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {programs.map((_, i) => (
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

        <UspBar />
      </div>
    </section>
  );
}

/* ============ Shared sub-components ============ */

function SectionHeader() {
  return (
    <div className="mb-12 text-center">
      <h2 className="text-3xl font-bold sm:text-4xl">
        <span className="text-blue-900">PROGRAM </span>
        <span className="text-yellow-500">UNGGULAN</span>
      </h2>
      <p className="mt-3 text-gray-500">Program terbaik untuk kesuksesan akademik Anda</p>
    </div>
  );
}

function UspBar() {
  return (
    <div className="mt-12 flex flex-col items-center justify-between gap-6 rounded-2xl bg-blue-900 p-8 text-white sm:flex-row">
      <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-3">
        {["Guru Profesional", "Kurikulum Terstruktur", "Hasil Terbukti"].map((usp) => (
          <div key={usp} className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-yellow-400" />
            <span className="text-sm font-semibold">{usp}</span>
          </div>
        ))}
      </div>
      <Link
        href="/daftar"
        className="flex items-center gap-2 rounded-lg bg-yellow-400 px-6 py-3 text-sm font-bold text-blue-950 transition-colors hover:bg-yellow-300"
      >
        <Phone className="h-4 w-4" /> KONSULTASI GRATIS
      </Link>
    </div>
  );
}

function ProgramCardLarge({ program }: { program: Program }) {
  const isYellow = program.theme === "yellow";
  const imageLeft = program.imagePosition === "left";
  const features = Array.isArray(program.features) ? (program.features as ProgramFeature[]) : [];

  return (
    <div className={`overflow-hidden rounded-2xl border shadow-lg ${isYellow ? "border-yellow-200" : "border-blue-200"}`}>
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${imageLeft ? "" : "sm:[&>*:first-child]:order-2"}`}>
        <div className="relative aspect-square bg-gray-100 min-h-[200px] sm:aspect-auto">
          {program.imageUrl ? (
            <Image src={program.imageUrl} alt={program.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
          ) : (
            <div className={`flex h-full min-h-[200px] items-center justify-center ${isYellow ? "bg-yellow-100" : "bg-blue-100"}`}>
              <span className="text-4xl font-bold text-gray-300">{program.title.charAt(0)}</span>
            </div>
          )}
        </div>
        <div className="p-6">
          {program.levelLabel && (
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${isYellow ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>
              {program.levelLabel}
            </span>
          )}
          <h3 className="mt-3 text-xl font-bold text-gray-900">{program.title}</h3>
          {program.subtitle && <p className="text-sm font-medium text-gray-500">{program.subtitle}</p>}
          {program.description && <p className="mt-2 text-sm text-gray-600 line-clamp-2">{program.description}</p>}
          {features.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-2">
              {features.slice(0, 4).map((f, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <CheckCircle className={`mt-0.5 h-4 w-4 shrink-0 ${isYellow ? "text-yellow-500" : "text-blue-600"}`} />
                  <span className="text-xs text-gray-600">{typeof f === "string" ? f : f.title}</span>
                </div>
              ))}
            </div>
          )}
          {program.linkUrl && (
            <Link href={program.linkUrl} className={`mt-4 inline-flex items-center gap-1 text-sm font-bold ${isYellow ? "text-yellow-600 hover:text-yellow-700" : "text-blue-600 hover:text-blue-700"}`}>
              Pelajari lebih lanjut <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function ProgramCardCompact({ program }: { program: Program }) {
  const isYellow = program.theme === "yellow";
  const features = Array.isArray(program.features) ? (program.features as ProgramFeature[]) : [];

  return (
    <div className={`flex h-full w-72 flex-col overflow-hidden rounded-2xl border shadow-lg ${isYellow ? "border-yellow-200" : "border-blue-200"}`}>
      <div className="relative aspect-video bg-gray-100">
        {program.imageUrl ? (
          <Image src={program.imageUrl} alt={program.title} fill className="object-cover" sizes="288px" />
        ) : (
          <div className={`flex h-full items-center justify-center ${isYellow ? "bg-yellow-100" : "bg-blue-100"}`}>
            <span className="text-3xl font-bold text-gray-300">{program.title.charAt(0)}</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        {program.levelLabel && (
          <span className={`inline-block w-fit rounded-full px-2.5 py-0.5 text-[10px] font-bold ${isYellow ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-700"}`}>
            {program.levelLabel}
          </span>
        )}
        <h3 className="mt-2 text-base font-bold text-gray-900">{program.title}</h3>
        {program.subtitle && <p className="text-xs font-medium text-gray-500">{program.subtitle}</p>}
        {features.length > 0 && (
          <div className="mt-2 space-y-1">
            {features.slice(0, 3).map((f, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <CheckCircle className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${isYellow ? "text-yellow-500" : "text-blue-600"}`} />
                <span className="text-[11px] text-gray-600">{typeof f === "string" ? f : f.title}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex-1" />
        {program.linkUrl && (
          <Link href={program.linkUrl} className={`mt-3 inline-flex items-center gap-1 text-xs font-bold ${isYellow ? "text-yellow-600 hover:text-yellow-700" : "text-blue-600 hover:text-blue-700"}`}>
            Pelajari <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </div>
  );
}
