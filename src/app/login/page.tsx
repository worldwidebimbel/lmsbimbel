"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, GraduationCap, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const DEMO_ACCOUNTS = [
    { label: "Super Admin", email: "admin@lmsbimbel.id", password: "admin123", color: "bg-red-100 text-red-700 border-red-200", desc: "Akses global semua cabang" },
    { label: "Admin Cabang", email: "admincabang@lmsbimbel.id", password: "admincabang123", color: "bg-orange-100 text-orange-700 border-orange-200", desc: "Keuangan & ops per cabang" },
    { label: "Guru", email: "guru@lmsbimbel.id", password: "guru123", color: "bg-yellow-100 text-yellow-700 border-yellow-200", desc: "Kelola kelas, soal, ujian" },
    { label: "Siswa", email: "siswa@lmsbimbel.id", password: "siswa123", color: "bg-green-100 text-green-700 border-green-200", desc: "Akses materi & ujian" },
    { label: "Orang Tua", email: "orangtua@lmsbimbel.id", password: "ortu123", color: "bg-blue-100 text-blue-700 border-blue-200", desc: "Pantau progress anak" },
  ];

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        toast.error("Email atau password salah");
      } else {
        toast.success("Login berhasil!");
        router.push("/");
        router.refresh();
      }
    } finally {
      setIsLoading(false);
    }
  }

  function fillDemo(email: string, password: string) {
    setEmail(email);
    setPassword(password);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500 mb-4 shadow-lg shadow-blue-500/40">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">EduBimbel LMS</h1>
          <p className="text-blue-300 mt-1 text-sm">Sistem Manajemen Pembelajaran Bimbingan Belajar</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-black/30 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Masuk ke Akun</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                placeholder="email@contoh.com"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-3 font-medium uppercase tracking-wide">Akun Demo</p>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => fillDemo(acc.email, acc.password)}
                  className={`text-xs px-3 py-2 rounded-lg border font-medium transition-opacity hover:opacity-80 text-left ${acc.color}`}
                >
                  <div className="font-semibold">{acc.label}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{acc.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-blue-300/60 text-xs mt-6">
          © 2026 EduBimbel LMS · lmsbimbel.digsan.id
        </p>
      </div>
    </div>
  );
}
