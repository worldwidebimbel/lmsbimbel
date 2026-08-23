import type { Metadata } from "next";
import { FileText } from "lucide-react";
import PublicShell from "@/components/landing/PublicShell";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan Layanan — EduBimbel LMS",
  description: "Syarat dan ketentuan penggunaan platform EduBimbel LMS.",
};

export default function TermsOfServicePage() {
  return (
    <PublicShell>
      <div className="bg-white">
        <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 mb-4">
            <FileText className="h-6 w-6 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Syarat &amp; Ketentuan Layanan</h1>
          <p className="mt-2 text-gray-500">Terakhir diperbarui: 14 Agustus 2026</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Penerimaan Ketentuan</h2>
            <p className="text-gray-600 leading-relaxed">
              Dengan mengakses dan menggunakan EduBimbel LMS di lmsbimbel.digsan.id
              (&quot;Platform&quot;), Anda menyetujui untuk terikat oleh syarat dan ketentuan
              ini (&quot;Ketentuan&quot;). Jika Anda tidak menyetujui Ketentuan ini, mohon
              untuk tidak menggunakan Platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Definisi</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li><strong>Platform</strong> merujuk pada EduBimbel LMS di lmsbimbel.digsan.id.</li>
              <li><strong>Pengguna</strong> merujuk pada setiap orang yang mendaftar dan menggunakan Platform.</li>
              <li><strong>Konten</strong> merujuk pada materi, soal, tugas, dan data lain yang diunggah ke Platform.</li>
              <li><strong>Pengelola</strong> merujuk pada pihak bimbel yang mengoperasikan Platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Pendaftaran Akun</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Pengguna harus mendaftar dengan data yang benar dan akurat.</li>
              <li>Pengguna bertanggung jawab menjaga kerahasiaan kata sandi akunnya.</li>
              <li>Satu akun per individu. Berbagi akun dengan orang lain tidak diperbolehkan.</li>
              <li>Pengguna dapat mendaftar menggunakan email/kata sandi atau login Google (OAuth2).</li>
              <li>Pengelola berhak menonaktifkan akun yang melanggar Ketentuan ini.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Peran Pengguna</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Platform memiliki beberapa peran dengan hak akses berbeda:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li><strong>Super Admin:</strong> Akses penuh ke semua cabang dan fitur.</li>
              <li><strong>Admin Cabang / Keuangan / Akademik:</strong> Akses sesuai lingkup tugas masing-masing.</li>
              <li><strong>Guru:</strong> Mengelola kelas, materi, soal, ujian, dan menilai siswa.</li>
              <li><strong>Siswa:</strong> Mengakses materi, mengerjakan tugas dan ujian, melihat nilai.</li>
              <li><strong>Orang Tua:</strong> Memantau perkembangan akademik anak.</li>
              <li><strong>Afiliator:</strong> Mengelola referral dan melihat komisi.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Penggunaan yang Dilarang</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Mengunggah konten yang melanggar hukum, pornografi, SARA, atau kekerasan.</li>
              <li>Melakukan kecurangan dalam ujian, tugas, atau aktivitas akademik lainnya.</li>
              <li>Mencoba mengakses data atau fitur yang tidak berhak diakses (hacking, bypass security).</li>
              <li>Melakukan spam, harassment, atau penyalahgunaan terhadap pengguna lain.</li>
              <li>Menggunakan Platform untuk tujuan komersial di luar kesepakatan dengan Pengelola.</li>
              <li>Melakukan reverse engineering atau scraping data Platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Konten Pengguna</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Pengguna mempertahankan kepemilikan atas Konten yang diunggah.</li>
              <li>Dengan mengunggah Konten, Pengguna memberi lisensi non-eksklusif kepada Pengelola untuk menampilkan dan menggunakan Konten dalam Platform.</li>
              <li>Pengelola berhak menghapus Konten yang melanggar Ketentuan ini.</li>
              <li>Konten yang bersifat akademik (nilai, hasil ujian) disimpan sesuai kebutuhan operasional Platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Pembayaran</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Biaya layanan ditentukan oleh Pengelola dan dapat berubah sewaktu-waktu.</li>
              <li>Pembayaran dapat dilakukan secara manual atau online melalui payment gateway (Duitku).</li>
              <li>Tagihan yang tidak dibayar tepat waktu dapat mengakibatkan penangguhan akses.</li>
              <li>Pengembalian dana (refund) tunduk pada kebijakan Pengelola.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Privasi dan Data</h2>
            <p className="text-gray-600 leading-relaxed">
              Penggunaan data pribadi diatur dalam Kebijakan Privasi terpisah. Dengan
              menggunakan Platform, Anda menyetujui praktik pengumpulan dan penggunaan
              data sebagaimana dijelaskan dalam Kebijakan Privasi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Layanan Email</h2>
            <p className="text-gray-600 leading-relaxed">
              Platform menggunakan Google Gmail API untuk mengirim email notifikasi resmi
              (seperti jadwal, tagihan, hasil ujian). Email dikirim dari akun resmi bimbel
              yang telah diotorisasi. Pengguna tidak akan menerima email promosi tanpa
              persetujuan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Batasan Tanggung Jawab</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Platform disediakan &quot;sebagaimana adanya&quot; tanpa jaminan tertentu.</li>
              <li>Pengelola tidak bertanggung jawab atas kerugian akibat gangguan teknis atau downtime.</li>
              <li>Pengelola berkomitmen menjaga keamanan data namun tidak menjamin 100% bebas dari pelanggaran.</li>
              <li>Pengguna bertanggung jawab atas backup data pribadi yang penting.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Perubahan Ketentuan</h2>
            <p className="text-gray-600 leading-relaxed">
              Pengelola berhak mengubah Ketentuan ini sewaktu-waktu. Perubahan akan
              diumumkan melalui Platform atau email. Pengguna disarankan meninjau
              Ketentuan secara berkala. Penggunaan Platform setelah perubahan dianggap
              sebagai persetujuan terhadap Ketentuan yang diperbarui.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">12. Hukum yang Berlaku</h2>
            <p className="text-gray-600 leading-relaxed">
              Ketentuan ini diatur dan ditafsirkan berdasarkan hukum Republik Indonesia.
              Setiap sengketa akan diselesaikan secara musyawarah, dan apabila tidak
              tercapai, akan diselesaikan melalui mekanisme hukum yang berlaku.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">13. Kontak</h2>
            <p className="text-gray-600 leading-relaxed">
              Untuk pertanyaan terkait Syarat &amp; Ketentuan ini, silakan hubungi:
              <br />
              Email: admin@lmsbimbel.digsan.id
              <br />
              Website: lmsbimbel.digsan.id
            </p>
          </section>
        </div>

          <div className="mt-12 pt-8 border-t border-gray-100 text-center space-x-4">
            <a href="/" className="text-sm text-indigo-600 hover:underline">
              ← Kembali ke Beranda
            </a>
            <a href="/kebijakan-privasi" className="text-sm text-indigo-600 hover:underline">
              Kebijakan Privasi
            </a>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
