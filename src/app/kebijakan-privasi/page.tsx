import type { Metadata } from "next";
import { Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Kebijakan Privasi — EduBimbel LMS",
  description: "Kebijakan privasi dan perlindungan data pengguna EduBimbel LMS.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-100 mb-4">
            <Shield className="h-6 w-6 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Kebijakan Privasi</h1>
          <p className="mt-2 text-gray-500">Terakhir diperbarui: 14 Agustus 2026</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Pendahuluan</h2>
            <p className="text-gray-600 leading-relaxed">
              EduBimbel LMS (&quot;Kami&quot;, &quot;Platform&quot;) menghormati privasi pengguna
              (&quot;Anda&quot;) dan berkomitmen untuk melindungi data pribadi Anda. Kebijakan privasi
              ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan melindungi
              informasi Anda saat menggunakan platform kami di lmsbimbel.digsan.id.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Informasi yang Kami Kumpulkan</h2>
            <p className="text-gray-600 leading-relaxed mb-3">Kami mengumpulkan jenis informasi berikut:</p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>
                <strong>Data Akun:</strong> Nama, alamat email, nomor telepon, dan kata sandi
                (terenkripsi) saat Anda mendaftar.
              </li>
              <li>
                <strong>Data Profil:</strong> Informasi tambahan seperti foto profil, peran
                (siswa, guru, orang tua, admin), dan cabang bimbel.
              </li>
              <li>
                <strong>Data Akademik:</strong> Nilai, hasil ujian, progress belajar, absensi,
                dan tugas yang dikumpulkan.
              </li>
              <li>
                <strong>Data Transaksi:</strong> Riwayat pembayaran SPP, tagihan, dan transaksi
                event berbayar.
              </li>
              <li>
                <strong>Data Otentikasi Google:</strong> Saat Anda login dengan Google, kami
                menerima token akses dan email Google Anda untuk keperluan otentikasi.
                Kami tidak mengakses email Anda tanpa izin.
              </li>
              <li>
                <strong>Data Teknis:</strong> Alamat IP, jenis browser, dan log aktivitas
                untuk keamanan dan audit.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Bagaimana Kami Menggunakan Informasi</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Menyediakan dan mengelola akun serta layanan pembelajaran.</li>
              <li>Memproses pembayaran dan mengelola tagihan.</li>
              <li>Mengirim notifikasi terkait jadwal, tugas, hasil ujian, dan tagihan.</li>
              <li>Mengirim email melalui layanan Google Gmail API untuk keperluan resmi platform.</li>
              <li>Meningkatkan kualitas layanan, keamanan, dan pengembangan fitur baru.</li>
              <li>Memenuhi kewajiban hukum dan regulasi yang berlaku.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Layanan Pihak Ketiga</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              Platform kami mengintegrasikan layanan pihak ketiga berikut:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>
                <strong>Google OAuth2 &amp; Gmail API:</strong> Digunakan untuk otentikasi
                login dan pengiriman email notifikasi. Kami hanya mengakses email Anda
                untuk mengirim notifikasi resmi platform, tidak membaca atau menyimpan
                konten email pribadi Anda.
              </li>
              <li>
                <strong>Cloudinary:</strong> Digunakan untuk penyimpanan gambar dan file
                materi pembelajaran.
              </li>
              <li>
                <strong>Duitku:</strong> Digunakan sebagai payment gateway untuk pemrosesan
                pembayaran online.
              </li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              Masing-masing layanan pihak ketiga memiliki kebijakan privasi sendiri yang
              dapat diakses di situs resmi mereka.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Penyimpanan dan Keamanan Data</h2>
            <p className="text-gray-600 leading-relaxed">
              Data Anda disimpan di server yang terlindungi dengan enkripsi dan kontrol akses
              berbasis peran (role-based access control). Kata sandi di-hash menggunakan
              algoritma bcrypt. Akses ke data dibatasi sesuai peran pengguna — admin cabang
              hanya dapat mengakses data cabangnya, dan orang tua hanya dapat melihat data
              anaknya. Kami melakukan audit log untuk semua aktivitas penting.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Berbagi Data</h2>
            <p className="text-gray-600 leading-relaxed">
              Kami tidak menjual, menyewakan, atau memperdagangkan data pribadi Anda.
              Data dapat dibagikan kepada:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Pengelola bimbel (admin/guru) untuk keperluan akademik sesuai peran.</li>
              <li>Orang tua siswa untuk memantau perkembangan anak.</li>
              <li>Layanan pihak ketiga sebagaimana disebut di atas untuk operasional platform.</li>
              <li>Otoritas hukum jika diwajibkan oleh hukum yang berlaku.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Hak Anda</h2>
            <ul className="list-disc pl-6 space-y-2 text-gray-600">
              <li>Mengakses dan memperbarui data pribadi Anda melalui halaman profil.</li>
              <li>Meminta penghapusan akun dan data terkait (kecuali data yang wajib disimpan oleh hukum).</li>
              <li>Menarik izin untuk login Google kapan saja melalui pengaturan akun Google Anda.</li>
              <li>Menghubungi kami untuk pertanyaan terkait privasi.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Privasi Anak</h2>
            <p className="text-gray-600 leading-relaxed">
              Platform kami digunakan oleh siswa di bawah umur 18 tahun. Pendaftaran siswa
              dilakukan oleh orang tua/wali atau pihak bimbel. Orang tua memiliki akses
              penuh untuk memantau dan mengelola data anaknya.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Perubahan Kebijakan</h2>
            <p className="text-gray-600 leading-relaxed">
              Kami dapat memperbarui kebijakan privasi ini dari waktu ke waktu. Perubahan
              akan diumumkan melalui platform atau email. Tanggal pembaruan tercantum
              di bagian atas halaman ini.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. Kontak</h2>
            <p className="text-gray-600 leading-relaxed">
              Untuk pertanyaan terkait kebijakan privasi, silakan hubungi kami di:
              <br />
              Email: admin@lmsbimbel.digsan.id
              <br />
              Website: lmsbimbel.digsan.id
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 text-center">
          <a href="/" className="text-sm text-indigo-600 hover:underline">
            ← Kembali ke Beranda
          </a>
        </div>
      </div>
    </div>
  );
}
