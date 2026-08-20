"use client";

import { useState } from "react";
import Image from "next/image";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";

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
}

export default function TestimoniSection({ testimonials }: { testimonials: Testimonial[] }) {
  const [current, setCurrent] = useState(0);

  if (!testimonials || testimonials.length === 0) return null;

  const featured = testimonials.filter((t) => t.isFeatured);
  const display = featured.length > 0 ? featured : testimonials;

  const next = () => setCurrent((c) => (c + 1) % Math.ceil(display.length / 3));
  const prev = () => setCurrent((c) => (c - 1 + Math.ceil(display.length / 3)) % Math.ceil(display.length / 3));

  const startIndex = current * 3;
  const visible = display.slice(startIndex, startIndex + 3);

  return (
    <section id="testimoni" className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header with decorative lines */}
        <div className="mb-12 flex items-center justify-center gap-4">
          <div className="h-px w-12 bg-gray-300" />
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-900">
            <Quote className="h-6 w-6 text-yellow-400" />
          </div>
          <div className="h-px w-12 bg-gray-300" />
        </div>
        <h2 className="text-center text-3xl font-bold sm:text-4xl text-blue-900">TESTIMONI SISWA</h2>
        <p className="mt-3 text-center text-gray-500">Apa kata siswa & orang tua tentang kami</p>

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
              {display.map((t) => (
                <div key={t.id} className="w-full flex-shrink-0 px-2">
                  <TestimonialCard t={t} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation */}
        {display.length > 3 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button onClick={prev} className="rounded-full border border-gray-300 p-2 text-gray-500 hover:bg-gray-50">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex gap-2">
              {Array.from({ length: Math.ceil(display.length / 3) }).map((_, i) => (
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

        {/* See all link */}
        <div className="mt-8 text-center">
          <a href="/testimoni" className="text-sm font-bold text-blue-600 hover:text-blue-700">
            Lihat semua testimoni →
          </a>
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ t }: { t: Testimonial }) {
  const photo = t.photoUrl ?? t.avatarUrl;
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      {/* Portrait 4:3 */}
      {photo && (
        <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-xl bg-gray-100">
          <Image src={photo} alt={t.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
        </div>
      )}
      <Quote className="h-8 w-8 text-yellow-400" />
      <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-4">&ldquo;{t.text}&rdquo;</p>
      {/* Stars */}
      <div className="mt-4 flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < t.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
          />
        ))}
      </div>
      <div className="mt-3">
        <p className="font-bold text-gray-900">{t.name}</p>
        <p className="text-xs text-gray-500">{t.role ?? t.programName}</p>
      </div>
    </div>
  );
}
