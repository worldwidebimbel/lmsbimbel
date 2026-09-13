# Future Commit: Modul AI Builder / AI Ecosystem

> **Status:** Eksplorasi → eksekusi. **SEMUA FASE (0–5) TERIMPLEMENTASI**: fondasi, materi teks, materi gambar, aset visual CMS, materi audio, video audio-visual (composite + direct via OpenRouter), penyatuan & Paket Bab AI. Sisa: item backlog lanjutan.
> Dokumen ini berisi jabaran teknologi, penyesuaian sistem yang diperlukan, timeline build, dan task list terperinci untuk membangun **Modul AI Builder**.
> Tiap fase di-checklist di sini lalu dijadikan commit terpisah (`feat(ai-builder): fase N — ...`).

---

## 1. Ringkasan & Tujuan

Modul **AI Builder / Ecosystem** adalah satu pintu untuk semua kapabilitas AI pembuatan konten edukatif:

| Kapabilitas | Output | Status saat ini |
|---|---|---|
| **AI Question Generator** | Soal ujian (PILGAN, essay, menjodohkan, dll.) | ✅ Sudah ada (`/guru/bank-soal`) |
| **Materi Teks** | Artikel/ringkasan materi pelajaran (rich text, key points, tips) | ❌ Belum ada |
| **Materi Gambar** | Ilustrasi/diagram untuk materi & soal | ⚠️ Setengah — `imageMode` hanya menghasilkan *prompt teks*, guru harus generate manual di tool eksternal (mis. Bing Image Creator) lalu upload sendiri |
| **Materi Audio** | Narasi materi (TTS) untuk siswa dengar | ❌ Belum ada |
| **Materi Video (audio-visual)** | Video pembelajaran: narasi + visual | ❌ Belum ada |
| **Aset Visual CMS (DESIGN)** | Banner/hero & slider, cover program, gambar popup promo, gambar section Landing/Custom Page, cover blog — untuk kebutuhan Super Admin/Admin | ❌ Belum ada (upload manual via Media Manager) |

Tujuan bisnis: guru membuat **satu Bab lengkap** (artikel → gambar → audio → video → latihan soal) dalam hitungan menit, bukan hari.

---

## 2. Kondisi Eksisting (Fondasi yang Sudah Ada)

### 2.1 AI Provider — teks/JSON saja
- `src/lib/ai-providers.ts` — registry 2 provider, keduanya **OpenAI-compatible chat completions**:
  - **APIClaude.net** (default) — `AI_BASE_URL`, `AI_MODEL`, key `APICLAUDE_API_KEY`/`OPENAI_API_KEY`
  - **OpenRouter.ai** — `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, dll.
  - Model tersedia: Claude, GPT-4o, Gemini Flash, DeepSeek, Grok, Llama, Qwen.
- Pattern yang sudah bagus dan akan dipertahankan: metadata non-secret di client, `resolveProviderConfig()` server-only untuk key.
- **Update (Fase 4 lanjutan):** OpenRouter ternyata mendukung multimodal output — sekarang menjadi opsi provider untuk **gambar** (`POST /api/v1/images`), **TTS** (`POST /api/v1/audio/speech`, kompatibel OpenAI), dan **direct video-gen** (`POST /api/v1/videos`, async) — semua memakai `OPENROUTER_API_KEY` yang sama.

### 2.2 AI Question Generator
- Route: `src/app/api/guru/bank-soal/ai-generate/route.ts` (+ `ai-prompt-import`).
- Fitur: pilih provider/model, tipe soal, difficulty, jumlah, jenjang, kurikulum, bahasa, instruksi detail, `sourceMaterial` (konteks materi), `strictMode`, `imageMode`.
- Output dinormalisasi (jawaban huruf → teks opsi, pair menjodohkan) lalu insert ke `Question`.
- Kelemahan yang akan diselesaikan modul ini: `imageMode` berhenti di `imagePrompt` (teks) — UI malah menautkan ke Bing Image Creator.

### 2.3 Infrastruktur pendukung
- **Media:** Cloudinary (`src/lib/cloudinary.ts` → `uploadToCloudinary()`, folder `edubimbel/...`, resource type image/video/raw) + model `MediaFile`.
- **Materi:** model `Material` — `type` (PDF, VIDEO, YOUTUBE, PRESENTATION, DOCUMENT, LINK, TEXT), `content` (rich text), `keyPoints` (Json), `tips`, `chapterTitle`/`chapterOrder` (sistem Bab), relasi `classId`/`subjectId`, `isPublished`.
- **Keamanan:** `logAudit()` untuk audit trail; `RATE_LIMITS.ai` (10 req/menit per IP, in-memory) di `src/lib/rate-limit.ts`.
- **Gating:** model `FeatureFlag` + `BillingPlan`/`FeatureTier` — bisa dipakai untuk aktifkan modul per cabang/plan.
- **Deploy:** VPS single instance + PM2 (belum ada Redis) → desain job **tanpa dependency baru** untuk MVP.

---

## 3. Gambaran Arsitektur Modul

```
┌─────────────────────────── AI Builder (UI) ───────────────────────────┐
│  /guru/ai-builder                                                     │
│  Tab: Soal │ Teks │ Gambar │ Desain (CMS) │ Audio │ Video │ Paket Bab  │
│  + Riwayat job │ Pengaturan (Super Admin)                               │
└──────┬────────────────────────────────────────────────────────────────┘
       │
┌──────▼──────────────────── src/lib/ai-guard.ts ───────────────────────┐
│ auth → feature flag → rate limit per kapabilitas → kuota user → audit │
└──────┬────────────────────────────────────────────────────────────────┘
       │
┌──────▼─────────────── /api/ai/* (route handlers) ────────────────────┐
│  POST /api/ai/text   → sinkron (opsional SSE stream)                  │
│  POST /api/ai/image  → job singkat (detik) — materi & soal            │
│  POST /api/ai/design → job singkat — aset visual CMS (banner dll.)    │
│  POST /api/ai/audio  → job singkat (detik–menit)                      │
│  POST /api/ai/video  → job panjang (menit) + polling status           │
│  GET  /api/ai/jobs, /api/ai/jobs/[id]                                 │
└──────┬────────────────────────────────────────────────────────────────┘
       │
┌──────▼──────────── Provider per kapabilitas (ai-providers.ts) ───────┐
│  TEXT  : APIClaude / OpenRouter          (sudah ada)                  │
│  IMAGE : baru (OpenAI Images / Replicate / Stability / Gemini-Imagen)  │
│  DESIGN: provider image yang sama, preset & ukuran khusus CMS          │
│  AUDIO : baru (OpenAI TTS / ElevenLabs / Google TTS id-ID)             │
│  VIDEO : composite pipeline (FFmpeg) — MVP; direct video-gen nanti    │
└──────┬────────────────────────────────────────────────────────────────┘
       │
┌──────▼─────────────── Cloudinary + Prisma ───────────────────────────┐
│  uploadToCloudinary("ai-materials") → MediaFile                      │
│  Material (type TEXT/IMAGE/AUDIO/VIDEO, attach ke Bab)               │
│  AiGenerationJob + AiUsageLog (tracking & kuota)                     │
└───────────────────────────────────────────────────────────────────────┘
```

Prinsip desain:
1. **Satu gerbang** (`ai-guard`) untuk semua kapabilitas — mudah atur kuota/biaya/audit di satu tempat.
2. **Provider per kapabilitas**, bukan satu provider serba bisa — tiap kapabilitas punya registry + env sendiri mengikuti pattern `ai-providers.ts` yang ada.
3. **Job DB-backed, tanpa Redis** (MVP) — cocok dengan deploy PM2 single instance; upgrade path ke BullMQ/Inngest bila multi-instance.
4. **Hasil selalu masuk MediaFile + Material** — konsisten dengan alur konten yang ada, guru tetap review sebelum publish (`isPublished: false` default).

---

## 4. Jabaran Teknologi per Kapabilitas

### 4.1 Materi Teks (AI Writer)
- **Provider:** reuse APIClaude/OpenRouter (chat completions) — tanpa provider baru.
- **Prompt:** structured output JSON: `{ title, content (markdown/rich text), keyPoints: string[], tips, estDurationMenit }` dengan parameter jenjang, kurikulum, mapel, topik, panjang, gaya bahasa, `sourceMaterial`.
- **Output:** `Material` type `TEXT` + `keyPoints` + `tips`, attach ke `chapterTitle` (Bab) — reuse field yang ada. Konten dalam format **markdown-lite** sesuai `ArticleRenderer` (`#`, `##`, `**bold**`, `1. daftar`, tabel pipe).
- **Opsional (Fase 1b):** SSE streaming (`ReadableStream`) agar guru lihat teks muncul bertahap.
- **Biaya:** murah (≈ Rp 100–500 per materi).

### 4.2 Materi Gambar (AI Image)
- **Kandidat provider** (pilih 1 utama + 1 fallback):
  | Provider | Model | Kelebihan | Catatan |
  |---|---|---|---|
  | OpenAI Images | `gpt-image-1` / `dall-e-3` | Kualitas & adherence prompt tinggi | Harga per gambar lebih tinggi |
  | Replicate | Flux, SDXL | Banyak pilihan model, murah | Rate limit & latency bervariasi |
  | Stability AI | SD 3.5 | Stabil, murah | Gaya lebih terbatas |
  | Gemini/Imagen | `imagen-3` | Bagus untuk diagram teknis | Perlu project GCP |
- **Fitur:** preset gaya edukatif (flat vector, diagram berlabel, kartun edukatif, whiteboard), rasio (1:1, 16:9), jumlah batch.
- **Alur:** prompt (bisa dari `imagePrompt` soal!) → generate → buffer → `uploadToCloudinary("ai-materials")` → `MediaFile` → attach ke `Material`/`Question`.
- **Upgrade langsung ke fitur lama:** `imageMode` di AI Question Generator tidak lagi berhenti di prompt — tombol "Generate gambar" langsung di preview soal.
- **Biaya:** ≈ Rp 1.000–2.500 per gambar.

### 4.3 Materi Audio (TTS)
- **Kandidat provider:**
  | Provider | Kelebihan | Catatan |
  |---|---|---|
  | OpenAI TTS (`gpt-4o-mini-tts`, `tts-1`) | Kualitas bagus, natural, mudah | Per menit audio berbayar |
  | Google Cloud TTS | Voice `id-ID` terbaik untuk Bahasa Indonesia | Setup GCP |
  | ElevenLabs | Paling natural + cloning | Paling mahal |
- **Fitur:** pilih voice (prioritas voice Indonesia natural), kecepatan baca, input dari teks materi (bisa langsung dari hasil AI Writer).
- **Penyesuaian:** `MaterialType` perlu nilai enum baru `AUDIO`; upload Cloudinary `resource_type: "video"` (Cloudinary menggolongkan audio sebagai video).
- **Biaya:** ≈ Rp 500–2.000 per menit audio.

### 4.4 Materi Video Audio-Visual
Dua strategi — **MVP pakai composite**, direct video-gen jadi fase premium:

**Strategi A — Composite pipeline (MVP, direkomendasikan):**
```
Topik → AI Writer: naskah per bagian/scene (JSON: narasi + prompt gambar per scene)
      → AI Image: gambar per scene (paralel)
      → TTS: audio narasi per scene
      → FFmpeg (server): gabung gambar + audio + subtitle otomatis + transisi
      → MP4 → Cloudinary → Material type VIDEO
```
- Paket npm: `fluent-ffmpeg` + `ffmpeg-static` (binary bundel, tanpa install manual di server) — atau `apt install ffmpeg` di VPS bila ingin native.
- Durasi dibatasi (MVP: ≤ 5 menit); job berjalan background, UI polling status per tahap (naskah → gambar → audio → render → upload).
- Cocok untuk konten edukatif (narasi + ilustrasi), biaya jauh lebih murah dari video-gen.

**Strategi B — Direct video-gen (fase premium):** **terimplementasi via OpenRouter async video API** (`POST /api/v1/videos` — Veo 3.1, Hailuo 3, Wan 2.7): submit → poll → download → Cloudinary → Material VIDEO. Mode dapat dipilih di UI (default dari settings `videoMode`).

- **Biaya composite:** ≈ Rp 5.000–15.000 per video materi (tergantung jumlah scene).

### 4.5 Paket Bab AI (puncak integrasi)
Satu wizard: topik + mapel + jenjang → hasilkan sekaligus **artikel + gambar ilustrasi + audio narasi + video audio-visual + set latihan soal** — semuanya masuk sebagai `Material` berurutan dalam satu `chapterTitle` (Bab) + `Exam` latihan terlampir. Ini meng-otomatisasi alur manual di `guide-pembuatan-bab.md`.

### 4.6 Aset Visual CMS — kapabilitas DESIGN (untuk Super Admin/Admin)
Kapabilitas gambar yang sama dengan 4.2, tapi diarahkan ke **aset promosi website** (bukan materi belajar) — dipakai Super Admin/Admin untuk Banner, Hero/Slider, cover Program, gambar Popup, hingga gambar section Landing/Custom Page. Saat ini semua harus dibuat manual di tool eksternal lalu di-upload ke Media Manager.

- **Preset use case** (ukuran + rasio + gaya otomatis terisi):

| Preset | Ukuran | Dipasang ke |
|---|---|---|
| Hero/Slider Banner | 1920×800 (21:9–16:9) | `SiteBanner` (CMS → Banner) |
| Cover Program | 1200×900 (4:3) | `SiteProgram.imageUrl` (CMS → Program) |
| Popup Promo | 800×800 / 600×800 | `popupBgImage` (CMS → Homepage → Popup) |
| Gambar Section LP/CP | 1600×900 | field gambar Section Builder (HERO `bgImage`, dst.) |
| Cover Blog | 1200×630 (OG) | `BlogPost.coverImage` |
| Galeri | 1200×1200 | `SiteGallery` |

- **Alur:** pilih preset → prompt (+ saran tema pendidikan & warna brand) → generate → `uploadToCloudinary("ai-cms")` → `MediaFile` → tombol **"Pasang ke..."** sesuai preset (langsung isi field tujuan) atau salin URL.
- **Integrasi Section Builder:** tambah media picker di field gambar (HERO `bgImage`, CONTENT, dll.) agar hasil AI di Media Manager tinggal dipilih — tidak perlu copy-paste URL.
- **Peran:** berbeda dari kapabilitas materi — default role **SUPER_ADMIN & ADMIN** saja (aturan di matriks akses, bisa diubah di settings).
- **Biaya:** sama dengan gambar materi (≈ Rp 1.000–2.500 per aset).

---

## 5. Penyesuaian Sistem yang Diperlukan

### 5.1 Database (Prisma)
1. `MaterialType` enum: tambah **`IMAGE`** dan **`AUDIO`** + migrasi.
2. Model baru **`AiGenerationJob`**:
   ```
   id, capability (TEXT|IMAGE|DESIGN|AUDIO|VIDEO|QUESTION|BAB_PACKAGE), status
   (PENDING|PROCESSING|DONE|FAILED), provider, model, params Json,
   resultMaterialId?, resultMediaId?, resultUrl?, errorMessage?, costEstimate?,
   durationMs?, createdBy, createdAt, updatedAt
   ```
3. Model baru **`AiUsageLog`** (atau agregat bulanan `AiUsageMonthly`): userId, capability, provider, model, units (char/gambar/detik), costEstimate, createdAt → dasar kuota & laporan biaya.
4. `Material` opsional: `aiGenerated Boolean @default(false)` (label transparansi).
5. `FeatureFlag`: entri `ai_builder`, `ai_image`, `ai_design`, `ai_audio`, `ai_video` (gating per cabang/plan).

### 5.2 Provider registry (`src/lib/ai-providers.ts`)
- Pertahankan pattern: metadata aman client, `resolveProviderConfig()` server-only.
- Tambah: `AI_IMAGE_PROVIDERS`, `AI_TTS_PROVIDERS`, `AI_VIDEO_PROVIDERS` + resolver masing-masing.
- Env baru (contoh): `AI_IMAGE_PROVIDER`, `AI_IMAGE_API_KEY`, `AI_IMAGE_MODEL`, `AI_TTS_PROVIDER`, `AI_TTS_API_KEY`, `AI_TTS_VOICE`, `AI_VIDEO_*` → update `.env.example` + kedua deploy doc.

### 5.3 API & guard
- `src/lib/ai-guard.ts` — middleware bersama: auth (role GURU ke atas), feature flag, rate limit **per kapabilitas** (usulan: teks 10/menit, gambar 5/menit, audio 5/menit, video 2/jam), cek kuota bulanan user, `logAudit`.
- Route baru: `POST /api/ai/{text|image|audio|video}`, `GET /api/ai/jobs`, `GET /api/ai/jobs/[id]`, `POST /api/ai/bab-package`.
- Catatan rate limit: store in-memory (`rate-limit.ts`) hanya valid single instance — sesuai deploy sekarang; catat upgrade path bila nanti multi-instance (Redis/BullMQ).

### 5.4 UI
- Halaman: `/guru/ai-builder` (mengikuti preseden AI Question Generator yang berada di area guru; layout `/guru` mengizinkan GURU + SUPER_ADMIN + ADMIN). Tab per kapabilitas + tab "Paket Bab AI" + tab "Desain (CMS)" + riwayat job (status, retry, lihat hasil).
- Sidebar: entry **AI Builder** di sidebar guru (NAV_GURU) **dan** sidebar admin (NAV_ADMIN, role SUPER_ADMIN & ADMIN saja — cabang/akademik tidak bisa akses area `/guru`).
- Tab Desain (CMS) hanya tampil untuk role yang punya akses capability DESIGN (default: SUPER_ADMIN & ADMIN).
- Pengaturan modul: tab **Pengaturan** khusus Super Admin di dalam AI Builder (mengikuti preseden CMS settings yang hidup di module-nya sendiri), bukan digabung ke `/admin/settings` yang sudah padat.
- Integrasi ke halaman existing: tombol **"Generate dengan AI"** di form Materi & preview soal (`AIQuestionGenerator.tsx`).
- Hasil generate selalu **preview dulu** → guru pilih classId/subjectId/chapterTitle → simpan sebagai draft (`isPublished: false`) → review → publish. (Kontrol kualitas & moderasi konten.)

### 5.5 Settings & kuota (semuanya runtime — tanpa deploy ulang)
- `/admin/settings` → section AI Builder (SUPER_ADMIN; aktif per-cabang bisa via FeatureFlag):
  - **Provider aktif per kapabilitas** — dropdown provider & model (hanya menampilkan provider yang terimplementasi + terkonfigurasi; indikator status key per provider) + tombol **Test koneksi**.
  - **Budget & kuota** — angka budget AI bulanan global + kuota unit per role per kapabilitas.
  - **Matriks akses role** — checkbox role × kapabilitas (default: materi & soal untuk GURU ke atas; **DESIGN khusus SUPER_ADMIN & ADMIN**).
  - **Label AI** — toggle tampilkan/sembunyikan badge "Dibuat dengan AI" di view siswa.
  - **Mode video** — Composite (hemat) / Direct video-gen (premium; opsi muncul setelah provider-nya tersedia).
  - **Tujuan storage video** — Cloudinary / VPS lokal (serve via Nginx) + indikator sisa kuota.
- Tampilkan **estimasi biaya sebelum generate** (tabel harga per model, editable) dan **total pemakaian bulan berjalan** per user.
- **Kunci API tetap di environment variables** (server-only, mengikuti pattern `resolveProviderConfig` yang sudah ada) — settings hanya *memilih* provider aktif, tidak menyimpan key. Alternatif menyimpan key terenkripsi di DB (ganti key tanpa akses server) dicatat sebagai enhancement lanjutan.

### 5.6 Deploy & docs
- `ffmpeg-static` (bundled) — tidak ada apt baru di VPS; alternatif: `apt install ffmpeg`.
- Update `guide-deploy-worldwidebimbel.md` & `doc/private/deploy-digsanstudy.md` dengan env vars baru.
- Panduan pemakaian baru → `doc/guide-ai-builder.md` + daftarkan di `src/lib/guidance.ts`.

---

## 6. Build Timeline

> Asumsi 1 developer fokus; beberapa fase bisa diparalelkan bila 2 orang.

| Fase | Deliverable | Estimasi |
|---|---|---|
| **0 — Fondasi** | Model job & usage, `ai-guard`, AI Hub shell (UI tab kosong), settings runtime (provider/kuota/role/label/mode), feature flags | 1 minggu |
| **1 — Materi Teks** | Generator teks → Material draft (keyPoints, tips, Bab) + tombol "Generate dengan AI" di form Materi; *(1b: SSE streaming)* | 1 minggu (+1) |
| **2 — Materi Gambar** | Provider image, generate → Cloudinary → MediaFile → Material IMAGE; upgrade `imageMode` soal jadi generate langsung | 1 minggu |
| **2b — Aset Visual CMS** | Kapabilitas DESIGN: preset banner/hero/cover/popup + tombol "Pasang ke..." + media picker di Section Builder | 1 minggu |
| **3 — Materi Audio** | Provider TTS, voice picker, Material AUDIO + duration | 1 minggu |
| **4 — Video Audio-Visual** | Composite pipeline (naskah → gambar → TTS → FFmpeg → MP4 → Cloudinary), job polling UI, batas durasi | 2–3 minggu |
| **5 — Penyatuan** | AI Question Generator pindah UI ke AI Hub (API tetap), wizard **Paket Bab AI**, `guide-ai-builder.md` | 1–2 minggu |
| **Total MVP (0–4, termasuk 2b)** | | **7–9 minggu** |
| **Total termasuk integrasi penuh (0–5)** | | **8–11 minggu** |
| *(Lanjutan)* | Direct video-gen premium, avatar presenter, PPT otomatis, billing per plan | backlog |

---

## 7. Build Task List

### Fase 0 — Fondasi ✅ (terimplementasi)
- [x] Prisma: model `AiGenerationJob` + `AiUsageLog` + migrasi (`20260913120000_ai_builder_foundation` — jalankan `npx prisma migrate deploy` di server; DB lokal dev sedang tidak bisa diakses)
- [x] Prisma: `FeatureFlag` seed `ai_builder` (aktif), `ai_image`, `ai_design`, `ai_audio`, `ai_video` (nonaktif sampai fasenya)
- [x] `src/lib/ai-guard.ts` (rate limit per kapabilitas + auth + flag + role + kuota + budget + audit)
- [x] `src/lib/ai-providers.ts`: registry per kapabilitas — TEXT/QUESTION dari existing; IMAGE/DESIGN/AUDIO/VIDEO baru (metadata + resolver env)
- [x] `/guru/ai-builder` shell + sidebar (guru & admin SA/ADMIN) + tab per kapabilitas + Riwayat job & pemakaian
- [x] Pengaturan (tab Super Admin): provider per kapabilitas + indikator status key, budget & unit cost, kuota matrix role × kapabilitas, akses role, role DESIGN, mode video, storage, toggle label AI (tombol *Test koneksi* menyusul bersama implementasi provider di Fase 2)
- [x] `AiUsageLog` write helper (`logAIUsage`) + ringkasan pemakaian bulanan (`getMonthlyUsageSummary`)
- [x] Env: `.env.example` — placeholder provider gambar & TTS (opsional sampai Fase 2/2b; deploy docs diupdate saat key mulai dibutuhkan)

### Fase 1 — Materi Teks ✅ (terimplementasi)
- [x] `POST /api/ai/text` (prompt terstruktur → JSON naskah; dua mode generate & save, pola seperti ai-generate)
- [x] UI tab Teks: form (topik, mapel, jenjang, kurikulum, panjang, gaya, instruksi detail, sourceMaterial, provider & model) + preview yang bisa diedit + penempatan kelas/mapel/Bab
- [x] Simpan hasil → `Material` (TEXT, `keyPoints`, `tips`, `chapterTitle`) draft — `isPublished: false`
- [x] Tombol "Isi dengan AI" di form Upload Materi (tipe Teks) — mengisi deskripsi, isi artikel, poin penting, tips
- [x] Job record + usage log untuk teks (+ refresh pemakaian setelah generate)
- [ ] *(1b — opsional)* SSE streaming endpoint + render progresif
- Catatan implementasi: konten TEXT di-generate dalam format **markdown-lite** (`#`, `##`, `**bold**`, `1. daftar`, tabel pipe) mengikuti `ArticleRenderer` — bukan HTML.

### Fase 2 — Materi Gambar
- [x] `AI_IMAGE_PROVIDERS` + resolver + env (pilih provider utama & fallback)
- [x] `POST /api/ai/image` (job singkat: prompt/preset gaya/rasio/batch)
- [x] Upload hasil → `uploadToCloudinary("ai-materials")` → `MediaFile`
- [x] `MaterialType.IMAGE` + attach ke Material/Bab
- [x] UI tab Gambar: gallery hasil + pilih-pakai + regenerate
- [x] Upgrade `imageMode` Question Generator: tombol generate langsung di preview soal
- [x] Moderasi: default `isPublished: false`, review admin
- Catatan implementasi: 3 adapter provider (OpenAI Images `gpt-image-1`/`dall-e-3`, Replicate Flux/SDXL dengan polling `Prefer: wait`, Stability SD3.5); migrasi `20260913200000_ai_image_material_type` menambah enum `IMAGE` ke `MaterialType` (jalankan `npx prisma migrate deploy` di server); tab Gambar di `AiBuilderClient` menggantikan `ComingSoonTab`; tombol "Generate gambar" di `AIQuestionGenerator` memanggil `/api/ai/image` untuk auto-isi `imageUrl` soal; tipe `IMAGE` ditambahkan ke `MaterialUploadModal` agar materi gambar bisa diedit manual.

### Fase 2b — Aset Visual CMS (kapabilitas DESIGN)
- [x] `POST /api/ai/design` + capability DESIGN di guard/quota/usage (model job sudah mendukung sejak Fase 0)
- [x] Preset use case: Hero/Slider Banner, Cover Program, Popup Promo, Gambar Section LP/CP, Cover Blog, Galeri (ukuran + rasio + style hint per preset)
- [x] Upload hasil → `uploadToCloudinary("ai-cms")` → `MediaFile`
- [x] Tombol **"Pasang ke..."** per preset: `SiteBanner` (buat banner baru), `SiteProgram.imageUrl`, `popupBgImage`, `BlogPost.coverImage`
- [ ] Media picker di field gambar Section Builder (HERO `bgImage`, CONTENT, dll.) — pilih dari Media Manager
- [x] Tab Desain di AI Builder — hanya tampil untuk role dengan akses DESIGN (default SUPER_ADMIN & ADMIN)
- [x] Role matrix + kuota DESIGN di settings
- Catatan implementasi: preset didefinisikan di `src/lib/ai-design-presets.ts` (dipakai bersama route & UI); adapter provider image difaktor ke `src/lib/ai-image-providers.ts` (dipakai route image & design); mode "Pasang ke..." di route `/api/ai/design` membuat/memperbarui entitas CMS target (SiteBanner/SiteProgram/SiteConfig.popupBgImage/BlogPost/SiteGallery) — daftar program/blog di-fetch on-demand di UI saat memilih preset Cover Program/Blog. Media picker di Section Builder dicatat sebagai tindak lanjut (hasil DESIGN sudah masuk Media Manager, bisa dipilih manual lewat Media Picker yang sudah ada).

### Fase 3 — Materi Audio
- [x] `AI_TTS_PROVIDERS` + resolver + env + voice list (`id-ID` prioritas)
- [x] `POST /api/ai/audio` (teks → MP3, kecepatan, voice)
- [x] `MaterialType.AUDIO` + `duration` + player di view siswa
- [x] UI tab Audio: textarea (atau ambil dari hasil AI Writer) + preview player
- [x] Job record + usage log (unit: detik audio)
- Catatan implementasi: 3 adapter provider di `src/lib/ai-tts-providers.ts` (OpenAI TTS `gpt-4o-mini-tts`/`tts-1`, Google Cloud TTS dengan voice `id-ID` Neural2/Wavenet/Standard, ElevenLabs Multilingual v2); voice list per provider diekspos ke UI (prioritas voice Indonesia natural); migrasi `20260913210000` menambah enum `AUDIO` ke `MaterialType`; upload Cloudinary `resource_type: "video"` (Cloudinary menggolongkan audio sebagai video); `Material.duration` diisi durasi detik; usage log unit = detik audio; tipe `AUDIO` ditambahkan ke `MaterialUploadModal`; preview player `<audio controls>` di tab Audio. Player di view siswa memakai renderer materi yang sudah ada (field `fileUrl` + `duration`).

### Fase 4 — Video Audio-Visual
- [x] Dependency: `ffmpeg-static` (binary bundel FFmpeg — fluent-ffmpeg tidak jadi dipakai, lihat catatan)
- [x] `POST /api/ai/video` → buat `AiGenerationJob` (PENDING) → eksekusi async
- [x] Pipeline step 1: AI Writer naskah per scene (narasi + imagePrompt) — job stage tracking
- [x] Pipeline step 2: AI Image per scene (paralel, limit konkuransi)
- [x] Pipeline step 3: TTS per scene
- [x] Pipeline step 4: FFmpeg composite (gambar + audio + subtitle `.srt` otomatis dari naskah + transisi)
- [x] Upload MP4 → Cloudinary → `Material` VIDEO
- [x] `GET /api/ai/jobs/[id]` polling + UI progress per tahap + retry on FAILED
- [x] Guardrails: durasi ≤ 5 menit, jumlah scene ≤ 12, satu job video aktif per user
- Catatan implementasi: pipeline di `src/lib/ai-video-pipeline.ts` — FFmpeg dijalankan via `child_process.execFile` + `ffmpeg-static` (binary bundel, tanpa apt install) dengan `cwd` folder temp + relative paths; ini lebih robust untuk path escaping filter `subtitles` lintas Windows/Linux daripada fluent-ffmpeg (fluent-ffmpeg di-uninstall — deprecated & tidak diperlukan). Per scene: gambar + audio + `.srt` timing lokal per kalimat → MP4 1280×720 H.264+AAC dengan fade in/out + subtitle burn-in (libass), lalu concat demuxer `-c copy`. Progress per tahap (naskah → gambar → audio → render → upload) di `AiGenerationJob.params.progress`, dipolling UI tiap 3 detik. Retry: job FAILED bisa dijalankan ulang dengan parameter sama via `retryJobId`. Usage log unit = 1 video (log setelah sukses). Material VIDEO dibuat otomatis sebagai draft (`isPublished: false`) dengan `duration` total detik. Perintah FFmpeg sudah diuji end-to-end di Windows (render scene + concat).
- **Direct video-gen (Strategi B) terimplementasi:** `src/lib/ai-video-direct.ts` — AI Writer menyusun satu prompt sinematik → OpenRouter `POST /api/v1/videos` (model: Veo 3.1/Hailuo 3/Wan 2.7) → poll (±20s, timeout 15 menit) → download → Cloudinary → Material VIDEO. Mode composite/direct dipilih di UI (default dari settings `videoMode`), dispatch di route, retry per mode. Registry `AI_VIDEO_PROVIDERS` + `resolveVideoProviderConfig` di `ai-providers.ts`. OpenRouter juga ditambahkan sebagai opsi provider **gambar** (`/api/v1/images` → b64_json, adapter di `ai-image-providers.ts`) dan **TTS** (`/api/v1/audio/speech`, adapter di `ai-tts-providers.ts`) — semua memakai `OPENROUTER_API_KEY`.

### Fase 5 — Penyatuan & Paket Bab AI
- [x] UI AI Question Generator dipindah ke tab AI Hub (API `/api/guru/bank-soal/*` tidak berubah)
- [x] Wizard Paket Bab AI: satu form → artikel + gambar + audio + video + soal dalam satu `chapterTitle`
- [x] Progress dashboard paket (per bagian: status, retry)
- [x] `doc/guide-ai-builder.md` + register di `src/lib/guidance.ts` (BUILD_KONTEN)
- [x] Review keamanan: prompt injection (`sourceMaterial`), sanitasi HTML hasil AI, kuota
- Catatan implementasi: **wizard Paket Bab AI diorkestrasi client-side** (tab "Paket Bab") — memanggil API kapabilitas yang sudah ada secara berurutan (`/api/ai/text` → `/api/ai/image` → `/api/ai/audio` → `/api/guru/bank-soal/ai-generate` → `/api/ai/video` opsional) sehingga tiap bagian otomatis tunduk pada guard/quota/audit per kapabilitas dan mendapat status + retry sendiri; route monolitik `POST /api/ai/bab-package` tidak diperlukan. AIQuestionGenerator di-embed di tab Soal (komponen sama tetap dipakai Bank Soal dengan integrasi mapel/ujian). Keamanan: system prompt `/api/ai/text` & `ai-generate` kini menyatakan SOURCE MATERIAL sebagai data tidak terpercaya (anti prompt-injection); konten teks tetap markdown-lite tanpa HTML (di-render aman oleh ArticleRenderer); kuota/rate/budget via guardAI sudah berlaku sejak Fase 0.

---

## 8. Estimasi Biaya Operasional (indikatif)

| Kapabilitas | Unit | Estimasi biaya |
|---|---|---|
| Teks | per materi | Rp 100–500 |
| Gambar | per gambar | Rp 1.000–2.500 |
| Aset visual CMS (DESIGN) | per banner/cover | Rp 1.000–2.500 (sama dengan gambar) |
| Audio | per menit | Rp 500–2.000 |
| Video composite | per video (≤5 mnt) | Rp 5.000–15.000 |
| Soal (existing) | per batch 10 | ± Rp 200–1.000 |

> Angka bergantung provider & model terpilih — tabel harga live di settings, ditampilkan sebagai estimasi sebelum generate. Kuota per role mencegah pembengkakan (mis. guru: 50 gambar, 60 menit audio, 10 video/bulan).

---

## 9. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Biaya API membengkak / abuse | Kuota bulanan per role, rate limit per kapabilitas, estimasi biaya pre-generate, usage report |
| Kualitas/kesesuaian konten AI | Preview + draft-only (`isPublished: false`), guru wajib review, label `aiGenerated` |
| Beban CPU server saat render video | Batas durasi & jumlah scene, antrean serial per user, ffmpeg-static, offload ke worker terpisah bila perlu |
| Provider eksternal down/mahal | Fallback provider per kapabilitas, semua hasil tersimpan di Cloudinary (tidak tergantung provider) |
| Prompt injection via `sourceMaterial` | Sanitasi input, instruksi sistem tegas, validasi struktur output |
| Konten tidak pantas (gambar) | Provider-side moderation + review manual sebelum publish |
| Rate limit in-memory tidak valid multi-instance | Catat sebagai batasan known; upgrade ke Redis/BullMQ saat scaling |

---

## 10. Konfigurasi Runtime di Admin (bukan keputusan permanen)

Semua aspek operasional di bawah ini **tidak perlu dikunci sebelum mulai** — dibuat sebagai opsi fleksibel di `/admin/settings` (lihat 5.5) dan bisa diubah kapan pun tanpa deploy ulang:

| # | Aspek | Opsi di Settings Admin | Default awal |
|---|---|---|---|
| 1 | Provider gambar | Dropdown provider & model + **Test koneksi** | OpenAI Images |
| 2 | Provider TTS | Dropdown provider & voice (dengan preview suara) | OpenAI TTS |
| 3 | Budget AI bulanan | Angka budget global + kuota unit per role per kapabilitas | Rp 500rb (pilot) |
| 4 | Role yang boleh akses | Matriks checkbox role × kapabilitas | GURU ke atas |
| 5 | Label "Dibuat dengan AI" | Toggle tampilkan/sembunyikan badge di view siswa | ON |
| 6 | Storage video | Cloudinary / VPS lokal (serve via Nginx) | Cloudinary |
| 7 | Mode video | Composite (hemat) / Direct video-gen (premium) | Composite |

Yang tetap menjadi keputusan **fase development** (karena berbiaya implementasi, bukan sekadar konfigurasi):

| Keputusan | Implikasi |
|---|---|
| Provider mana yang diimplementasikan duluan per kapabilitas | Tiap provider = adapter + testing sendiri. MVP cukup 1 utama + 1 fallback; sisanya menyusul bertahap — dropdown settings otomatis hanya menampilkan provider yang sudah tersedia, jadi menambah provider baru tidak mengubah kode pemanggilnya |
| Kunci API di env (rekomendasi) vs DB terenkripsi | Env = lebih aman & konsisten dengan pola `resolveProviderConfig` sekarang; DB = ganti key tanpa akses server (enhancement lanjutan, bukan blokir) |

> Dengan pendekatan ini, tabel "keputusan" berubah menjadi tabel **konfigurasi**: pindah dari OpenAI Images ke Replicate kelak cukup implementasi adapter barunya sekali, lalu ganti pilihan di admin — tanpa menyentuh kode fitur lainnya.
