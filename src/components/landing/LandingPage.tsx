import Link from "next/link";
import { GraduationCap, BookOpen, Users, Award, ArrowRight, CheckCircle, Star, Phone, Mail, MapPin } from "lucide-react";
import { db } from "@/lib/db";
import { getSiteConfig } from "@/lib/site-config";
import LandingInquiryForm from "@/components/landing/LandingInquiryForm";
import HeroBannerSlider from "@/components/landing/HeroBannerSlider";
import PromoPopup from "@/components/landing/PromoPopup";

async function getLandingData() {
  try {
    const [students, teachers, classes, subjects, banners, gallery] = await Promise.all([
      db.user.count({ where: { role: "SISWA", isActive: true } }),
      db.user.count({ where: { role: "GURU", isActive: true } }),
      db.class.count({ where: { isActive: true } }),
      db.subject.count({ where: { isActive: true } }),
      db.siteBanner.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
      db.siteGallery.findMany({ where: { isActive: true }, orderBy: [{ category: "asc" }, { order: "asc" }] }),
    ]);
    return { students, teachers, classes, subjects, banners, gallery };
  } catch {
    return { students: 0, teachers: 0, classes: 0, subjects: 0, banners: [], gallery: [] };
  }
}

export default async function LandingPage() {
  const [data, cfg] = await Promise.all([getLandingData(), getSiteConfig()]);
  const { students, teachers, classes, subjects, banners, gallery } = data;

  const groupedGallery: Record<string, typeof gallery> = {};
  for (const item of gallery) {
    if (!groupedGallery[item.category]) groupedGallery[item.category] = [];
    groupedGallery[item.category].push(item);
  }

  return (
    <div className="min-h-screen bg-white">
      {cfg.popupEnabled === "true" && <PromoPopup config={cfg} />}

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            {cfg.logoUrl ? (
              <img src={cfg.logoUrl} alt={cfg.siteName} className="h-9 w-auto max-w-[140px] object-contain" />
            ) : (
              <>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: cfg.colorPrimary }}>
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">{cfg.siteName}</span>
              </>
            )}
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#program" className="text-sm font-medium text-gray-600 hover:text-blue-600">Program</a>
            <a href="#statistik" className="text-sm font-medium text-gray-600 hover:text-blue-600">Statistik</a>
            <a href="#testimoni" className="text-sm font-medium text-gray-600 hover:text-blue-600">Testimoni</a>
            <a href="#kontak" className="text-sm font-medium text-gray-600 hover:text-blue-600">Kontak</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-medium text-gray-600 hover:text-blue-600 sm:block">
              Masuk
            </Link>
            <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors" style={{ backgroundColor: cfg.colorPrimary }}>
              Daftar Sekarang
            </Link>
          </div>
        </div>
      </header>

      {/* Hero / Banner Slider */}
      {banners.length > 0 ? (
        <HeroBannerSlider banners={banners} colorPrimary={cfg.colorPrimary} />
      ) : (
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
                  <Link href="/login" className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-base font-semibold text-white transition-colors" style={{ backgroundColor: cfg.colorPrimary }}>
                    Mulai Belajar <ArrowRight className="h-4 w-4" />
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
      )}

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

      {/* Program Section */}
      <section id="program" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Program Unggulan</h2>
            <p className="mt-3 text-gray-500">Pilih program yang sesuai dengan kebutuhan belajar Anda</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ProgramCard
              title="SD Kelas 4-6"
              desc="Persiapan ujian sekolah & OSN dengan pendekatan menyenangkan."
              color="bg-orange-100 text-orange-700"
              icon={<GraduationCap className="h-6 w-6" />}
            />
            <ProgramCard
              title="SMP Kelas 7-9"
              desc="Penguatan konsep & persiapan UN SMP dengan latihan soal intensif."
              color="bg-blue-100 text-blue-700"
              icon={<BookOpen className="h-6 w-6" />}
            />
            <ProgramCard
              title="SMA Kelas 10-12"
              desc="Persiapan UTBK-SNBT & ujian sekolah dengan strategi terbaik."
              color="bg-purple-100 text-purple-700"
              icon={<Award className="h-6 w-6" />}
            />
          </div>
        </div>
      </section>

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
      <section id="testimoni" className="py-20">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Apa Kata Mereka?</h2>
            <p className="mt-3 text-gray-500">Testimoni dari siswa & orang tua yang telah merasakan manfaatnya</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <TestimonialCard
              name="Andi Wijaya"
              role="Orang Tua Siswa SMP"
              text="Anak saya jadi lebih rajin belajar sejak gabung EduBimbel. Sistem LMS-nya modern dan laporan perkembangannya sangat membantu."
            />
            <TestimonialCard
              name="Siti Rahmah"
              role="Siswa SMA Kelas 12"
              text="Tryout UTBK-nya sangat membantu! Soal-soalnya berkualitas dan pembahasannya detail. Alhamdulillah lolos PTN impian."
            />
            <TestimonialCard
              name="Budi Santoso"
              role="Orang Tua Siswa SD"
              text="Guru-gurunya sangat sabar dan profesional. Anak saya yang tadinya malas belajar matematika, sekarang jadi suka."
            />
          </div>
        </div>
      </section>

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
                      <div className="aspect-square bg-gray-100 overflow-hidden">
                        <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Siap Meraih Prestasi?</h2>
          <p className="mt-4 text-lg text-blue-100">{cfg.trialText}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a href="#daftar" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-semibold transition-colors" style={{ color: cfg.colorPrimary }}>
              Daftar Sekarang <ArrowRight className="h-4 w-4" />
            </a>
            <a href={`https://wa.me/${cfg.whatsapp}`} target="_blank" className="inline-flex items-center gap-2 rounded-xl border-2 border-white px-6 py-3 text-base font-semibold text-white hover:bg-white/10 transition-colors">
              <Phone className="h-4 w-4" /> Hubungi Kami
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="kontak" className="border-t border-gray-100 bg-gray-50 py-14">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                {cfg.logoUrl ? (
                  <img src={cfg.logoUrl} alt={cfg.siteName} className="h-9 w-auto max-w-[160px] object-contain" />
                ) : (
                  <>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: cfg.colorPrimary }}>
                      <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-gray-900">{cfg.siteName}</span>
                  </>
                )}
              </div>
              <p className="mt-4 text-sm text-gray-500">Lembaga bimbingan belajar terpercaya dengan sistem pembelajaran modern dan guru berkualitas.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Program</h4>
              <ul className="mt-4 space-y-2 text-sm text-gray-500">
                <li><a href="#program" className="hover:text-blue-600">SD Kelas 4-6</a></li>
                <li><a href="#program" className="hover:text-blue-600">SMP Kelas 7-9</a></li>
                <li><a href="#program" className="hover:text-blue-600">SMA Kelas 10-12</a></li>
                <li><a href="#program" className="hover:text-blue-600">UTBK Preparation</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Tautan</h4>
              <ul className="mt-4 space-y-2 text-sm text-gray-500">
                <li><a href="#statistik" className="hover:text-blue-600">Tentang Kami</a></li>
                <li><a href="#daftar" className="hover:text-blue-600">Cara Daftar</a></li>
                <li><Link href="/login" className="hover:text-blue-600">Masuk Akun</Link></li>
                <li><Link href="/events" className="hover:text-blue-600">Event & Tryout</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Kontak</h4>
              <ul className="mt-4 space-y-3 text-sm text-gray-500">
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" /> {cfg.address}</li>
                <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" /> {cfg.phone}</li>
                <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-gray-400" /> {cfg.email}</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-200 pt-8 text-center text-sm text-gray-400">
            &copy; {new Date().getFullYear()} {cfg.siteName} LMS. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
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

function ProgramCard({ title, desc, color, icon }: { title: string; desc: string; color: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">{desc}</p>
      <Link href="/login" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
        Info Lebih Lanjut <ArrowRight className="h-3.5 w-3.5" />
      </Link>
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

function TestimonialCard({ name, role, text }: { name: string; role: string; text: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex gap-1">
        {[1,2,3,4,5].map(s => <Star key={s} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
      </div>
      <p className="mt-4 text-sm text-gray-600 leading-relaxed">&ldquo;{text}&rdquo;</p>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
          {name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{name}</p>
          <p className="text-xs text-gray-400">{role}</p>
        </div>
      </div>
    </div>
  );
}
