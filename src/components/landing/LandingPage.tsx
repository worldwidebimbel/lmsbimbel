import Link from "next/link";
import Image from "next/image";
import { GraduationCap, BookOpen, Users, Award, ArrowRight, CheckCircle, Star, Phone, FlaskConical, Calculator, Monitor, PenTool, Layers, Rocket } from "lucide-react";
import { db } from "@/lib/db";
import { getSiteConfig } from "@/lib/site-config";
import { getHomepageData } from "@/lib/homepage-data";
import LandingInquiryForm from "@/components/landing/LandingInquiryForm";
import HeroBannerSlider from "@/components/landing/HeroBannerSlider";
import HeroVideoBackground from "@/components/landing/HeroVideoBackground";
import HeroSplitLayout from "@/components/landing/HeroSplitLayout";
import PromoPopup from "@/components/landing/PromoPopup";
import QuickActionCards from "@/components/landing/QuickActionCards";
import ProgramUnggulanSection from "@/components/landing/ProgramUnggulanSection";
import VideoActivitySection from "@/components/landing/VideoActivitySection";
import TestimoniSection from "@/components/landing/TestimoniSection";

const PROGRAM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  GraduationCap,
  BookOpen,
  Users,
  Award,
  FlaskConical,
  Calculator,
  Monitor,
  PenTool,
  Layers,
  Rocket,
};

async function getLandingData() {
  try {
    const [students, teachers, classes, subjects, gallery, homepage] = await Promise.all([
      db.user.count({ where: { role: "SISWA", isActive: true } }),
      db.user.count({ where: { role: "GURU", isActive: true } }),
      db.class.count({ where: { isActive: true } }),
      db.subject.count({ where: { isActive: true } }),
      db.siteGallery.findMany({ where: { isActive: true }, orderBy: [{ category: "asc" }, { order: "asc" }] }),
      getHomepageData(),
    ]);
    return {
      students, teachers, classes, subjects,
      gallery,
      banners: homepage.banners,
      quickActions: homepage.quickActions,
      programs: homepage.programs,
      videos: homepage.videos,
      videoHighlights: homepage.videoHighlights,
      testimonials: homepage.testimonials,
    };
  } catch {
    return { students: 0, teachers: 0, classes: 0, subjects: 0, gallery: [], banners: [], quickActions: [], programs: [], videos: [], videoHighlights: [], testimonials: [] };
  }
}

export default async function LandingPage() {
  const [data, cfg] = await Promise.all([getLandingData(), getSiteConfig()]);
  const { students, teachers, classes, subjects, banners, gallery, programs, quickActions, videos, videoHighlights, testimonials } = data;

  const groupedGallery: Record<string, typeof gallery> = {};
  for (const item of gallery) {
    if (!groupedGallery[item.category]) groupedGallery[item.category] = [];
    groupedGallery[item.category].push(item);
  }

  return (
    <>
      {cfg.popupEnabled === "true" && <PromoPopup config={cfg} />}

      {/* Hero — switch by cfg.hero_type */}
      {cfg.hero_type === "video" && banners.length > 0 ? (
        <HeroVideoBackground banners={banners} />
      ) : cfg.hero_type === "split" ? (
        <HeroSplitLayout banners={banners} tagline={cfg.tagline} description={cfg.description} colorPrimary={cfg.colorPrimary} students={students} />
      ) : cfg.hero_type === "default" ? (
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold" style={{ color: cfg.colorPrimary }}>
                  <Star className="h-3.5 w-3.5" /> Bimbingan Belajar Terbaik
                </div>
                <h1 className="text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl lg:text-6xl">
                  {cfg.tagline.split(" ").slice(0, -2).join(" ")} <br />
                  <span style={{ color: cfg.colorPrimary }}>{cfg.tagline.split(" ").slice(-2).join(" ")}</span>
                </h1>
                <p className="text-lg text-gray-600 max-w-lg">{cfg.description}</p>
                <div className="flex flex-wrap gap-4">
                  <Link href="/daftar" className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-white transition-colors" style={{ backgroundColor: cfg.colorPrimary }}>
                    Daftar Sekarang <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a href="#program" className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 px-6 py-3 text-base font-semibold text-gray-700 hover:border-blue-300 hover:text-blue-600 transition-colors">
                    Lihat Program
                  </a>
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex -space-x-3">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-xs font-bold text-gray-600">
                        {String.fromCharCode(64+i)}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">
                    <span className="font-bold text-gray-900">{students}+</span> siswa telah bergabung
                  </p>
                </div>
              </div>
              <div className="relative hidden lg:block">
                <div className="absolute -left-10 -top-10 h-72 w-72 rounded-full bg-blue-100 opacity-50 blur-3xl" />
                <div className="absolute -bottom-10 -right-10 h-72 w-72 rounded-full bg-indigo-100 opacity-50 blur-3xl" />
                <div className="relative rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4">
                      <BookOpen className="h-8 w-8 text-blue-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Materi Lengkap</p>
                        <p className="text-xs text-gray-500">Video, PDF, Quiz interaktif</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-green-50 p-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Tryout Berkala</p>
                        <p className="text-xs text-gray-500">Simulasi ujian nasional</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-xl bg-purple-50 p-4">
                      <Users className="h-8 w-8 text-purple-600" />
                      <div>
                        <p className="font-semibold text-gray-900">Guru Berpengalaman</p>
                        <p className="text-xs text-gray-500">{teachers}+ pengajar profesional</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      ) : banners.length > 0 ? (
        <HeroBannerSlider banners={banners} colorPrimary={cfg.colorPrimary} />
      ) : (
        <HeroSplitLayout banners={[]} tagline={cfg.tagline} description={cfg.description} colorPrimary={cfg.colorPrimary} students={students} />
      )}

      {/* Quick Action Cards (overlapping hero) */}
      <QuickActionCards actions={quickActions} />

      {/* Stats Section */}
      <section id="statistik" className="border-y border-gray-100 bg-gray-50/50 py-14">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <StatBox number={`${students}+`} label="Siswa Aktif" color={cfg.colorPrimary} />
            <StatBox number={`${teachers}+`} label="Guru Profesional" color={cfg.colorPrimary} />
            <StatBox number={`${classes}+`} label="Kelas Tersedia" color={cfg.colorPrimary} />
            <StatBox number={`${subjects}+`} label="Mata Pelajaran" color={cfg.colorPrimary} />
          </div>
        </div>
      </section>

      {/* Program Unggulan Section */}
      <ProgramUnggulanSection programs={programs} />

      {/* Video Activity Section */}
      <VideoActivitySection videos={videos} highlights={videoHighlights} />

      {/* Features */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Mengapa Memilih EduBimbel?</h2>
              <p className="mt-4 text-gray-500">Kami berkomitmen memberikan pengalaman belajar terbaik dengan teknologi modern dan guru berkualitas.</p>
              <div className="mt-8 space-y-4">
                {[
                  "Kurikulum terstruktur & terupdate",
                  "Guru berpengalaman & bersertifikasi",
                  "Akses materi 24/7 via LMS",
                  "Tryout & simulasi ujian berkala",
                  "Laporan perkembangan untuk orang tua",
                  "Biaya terjangkau dengan kualitas terbaik",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
                    <p className="text-gray-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FeatureBox title="Pembelajaran Interaktif" desc="Video, animasi, dan quiz untuk pemahaman optimal" color="bg-blue-50" iconColor="text-blue-600" />
              <FeatureBox title="Tryout Berkala" desc="Simulasi ujian dengan soal berkualitas" color="bg-green-50" iconColor="text-green-600" />
              <FeatureBox title="Laporan Real-time" desc="Pantau perkembangan siswa kapan saja" color="bg-purple-50" iconColor="text-purple-600" />
              <FeatureBox title="Forum Diskusi" desc="Tanya jawab dengan guru & teman" color="bg-orange-50" iconColor="text-orange-600" />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <TestimoniSection testimonials={testimonials} />
      )}

      {/* Gallery Section */}
      {gallery.length > 0 && (
        <section id="gallery" className="py-16 bg-white">
          <div className="mx-auto max-w-7xl px-6">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-bold text-gray-900">Gallery</h2>
              <p className="mt-2 text-gray-500">Momen berharga bersama siswa dan kegiatan kami</p>
            </div>
            {Object.entries(groupedGallery).map(([cat, items]) => (
              <div key={cat} className="mb-10">
                <h3 className="text-lg font-semibold text-gray-700 mb-4 capitalize">{cat.toLowerCase()}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {items.map((item) => (
                    <div key={item.id} className="group rounded-xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="relative aspect-square bg-gray-100 overflow-hidden">
                        <Image src={item.imageUrl} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 768px) 50vw, 25vw" />
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        {item.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Inquiry / Registration Form */}
      <section id="daftar" className="py-16 bg-gray-50">
        <div className="mx-auto max-w-2xl px-6">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Daftar Sekarang</h2>
            <p className="mt-2 text-gray-500">Isi form di bawah, tim kami akan menghubungi Anda segera.</p>
          </div>
          <LandingInquiryForm />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16" style={{ backgroundColor: cfg.colorPrimary }}>
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">{cfg.ctaHeading}</h2>
          <p className="mt-4 text-lg text-blue-100">{cfg.trialText}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a href={cfg.ctaPrimaryLink || "#daftar"} className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold transition-colors" style={{ backgroundColor: cfg.ctaPrimaryColor || "#FFFFFF", color: cfg.colorPrimary }}>
              {cfg.ctaPrimaryLabel || "Daftar Sekarang"} <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href={cfg.ctaSecondaryLink || `https://wa.me/${cfg.whatsapp}`}
              target={cfg.ctaSecondaryLink ? undefined : "_blank"}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white px-6 py-3 text-base font-semibold text-white hover:bg-white/10 transition-colors"
            >
              <Phone className="h-4 w-4" /> {cfg.ctaSecondaryLabel || "Hubungi Kami"}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
    </>
  );
}

function StatBox({ number, label, color }: { number: string; label: string; color: string }) {
  return (
    <div className="text-center">
      <p className="text-4xl font-extrabold" style={{ color }}>{number}</p>
      <p className="mt-1 text-sm font-medium text-gray-500">{label}</p>
    </div>
  );
}

function ProgramCard({ program }: { program: { id: string; title: string; description: string | null; icon: string; color: string; linkUrl: string | null } }) {
  const Icon = PROGRAM_ICONS[program.icon] ?? GraduationCap;
  const link = program.linkUrl || "/daftar";
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${program.color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold text-gray-900">{program.title}</h3>
      <p className="mt-2 text-sm text-gray-500">{program.description}</p>
      <div className="mt-4 flex items-center gap-3">
        <Link href={link} className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
          Daftar Sekarang <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function FeatureBox({ title, desc, color, iconColor }: { title: string; desc: string; color: string; iconColor: string }) {
  return (
    <div className={`rounded-xl ${color} p-5`}>
      <CheckCircle className={`h-6 w-6 ${iconColor}`} />
      <h4 className="mt-3 font-semibold text-gray-900">{title}</h4>
      <p className="mt-1 text-sm text-gray-600">{desc}</p>
    </div>
  );
}

function TestimonialCard({ name, role, text, avatarUrl }: { name: string; role: string | null; text: string; avatarUrl: string | null }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex gap-1">
        {[1,2,3,4,5].map(s => <Star key={s} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
      </div>
      <p className="mt-4 text-sm text-gray-600 leading-relaxed">&ldquo;{text}&rdquo;</p>
      <div className="mt-4 flex items-center gap-3">
        {avatarUrl ? (
          <Image src={avatarUrl} alt={name} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
            {name.charAt(0)}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <p className="text-xs text-gray-500">{role}</p>
        </div>
      </div>
    </div>
  );
}
