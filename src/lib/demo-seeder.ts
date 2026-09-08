import { db } from "@/lib/db";
import { hash } from "bcryptjs";

export const DEMO_DOMAIN = "demo.lmsbimbel.id";
const SUFFIX = `@${DEMO_DOMAIN}`;
const DEMO_SUBJECT_PREFIX = "DEMO_";

export type DemoType = "AKADEMIK" | "UTBK_SNBT" | "KEDINASAN" | "BAHASA";

export const DEMO_TYPE_LABELS: Record<DemoType, string> = {
  AKADEMIK: "Bimbel Akademik",
  UTBK_SNBT: "Bimbel Persiapan Ujian (UTBK/SNBT)",
  KEDINASAN: "Bimbel Tes Masuk Kedinasan & CPNS",
  BAHASA: "Bimbel Kemampuan Bahasa",
};

export async function getDemoStatus() {
  const userCount = await db.user.count({ where: { email: { endsWith: SUFFIX } } });
  const subjectCount = await db.subject.count({ where: { code: { startsWith: DEMO_SUBJECT_PREFIX } } });
  return { exists: userCount > 0, userCount, subjectCount };
}

export async function clearDemoData() {
  const demoUsers = await db.user.findMany({ where: { email: { endsWith: SUFFIX } }, select: { id: true } });
  const demoIds = demoUsers.map((u) => u.id);
  const demoSubjects = await db.subject.findMany({ where: { code: { startsWith: DEMO_SUBJECT_PREFIX } }, select: { id: true } });
  const demoSubjectIds = demoSubjects.map((s) => s.id);
  const demoClasses = await db.class.findMany({ where: { teacherId: { in: demoIds } }, select: { id: true } });
  const demoClassIds = demoClasses.map((c) => c.id);
  const demoExams = await db.exam.findMany({ where: { classId: { in: demoClassIds } }, select: { id: true } });
  const demoExamIds = demoExams.map((e) => e.id);
  const demoThreads = await db.forumThread.findMany({ where: { authorId: { in: demoIds } }, select: { id: true } });
  const demoThreadIds = demoThreads.map((t) => t.id);
  const demoReplies = await db.forumReply.findMany({ where: { authorId: { in: demoIds } }, select: { id: true } });
  const demoReplyIds = demoReplies.map((r) => r.id);

  await db.forumUpvote.deleteMany({ where: { OR: [{ userId: { in: demoIds } }, { threadId: { in: demoThreadIds } }, { replyId: { in: demoReplyIds } }] } });
  await db.forumReply.deleteMany({ where: { OR: [{ authorId: { in: demoIds } }, { threadId: { in: demoThreadIds } }] } });
  await db.forumThread.deleteMany({ where: { OR: [{ authorId: { in: demoIds } }, { classId: { in: demoClassIds } }] } });
  await db.message.deleteMany({ where: { OR: [{ senderId: { in: demoIds } }, { receiverId: { in: demoIds } }] } });
  await db.studentBadge.deleteMany({ where: { studentId: { in: demoIds } } });
  await db.studentPoints.deleteMany({ where: { userId: { in: demoIds } } });
  await db.certificate.deleteMany({ where: { userId: { in: demoIds } } });
  await db.eventRegistration.deleteMany({ where: { userId: { in: demoIds } } });
  await db.submission.deleteMany({ where: { studentId: { in: demoIds } } });
  await db.examAttempt.deleteMany({ where: { OR: [{ studentId: { in: demoIds } }, { examId: { in: demoExamIds } }] } });
  await db.attendanceRecord.deleteMany({ where: { studentId: { in: demoIds } } });
  await db.teacherAttendance.deleteMany({ where: { OR: [{ teacherId: { in: demoIds } }, { classId: { in: demoClassIds } }] } });
  await db.teachingJournal.deleteMany({ where: { OR: [{ teacherId: { in: demoIds } }, { classId: { in: demoClassIds } }] } });
  await db.raportAttitude.deleteMany({ where: { raport: { studentId: { in: demoIds } } } });
  await db.raport.deleteMany({ where: { OR: [{ studentId: { in: demoIds } }, { classId: { in: demoClassIds } }] } });
  await db.grade.deleteMany({ where: { studentId: { in: demoIds } } });
  await db.payment.deleteMany({ where: { OR: [{ userId: { in: demoIds } }, { invoice: { studentId: { in: demoIds } } }] } });
  await db.invoice.deleteMany({ where: { studentId: { in: demoIds } } });
  await db.notification.deleteMany({ where: { userId: { in: demoIds } } });
  await db.materialProgress.deleteMany({ where: { studentId: { in: demoIds } } });
  await db.liveSession.deleteMany({ where: { OR: [{ teacherId: { in: demoIds } }, { classId: { in: demoClassIds } }] } });
  await db.scheduleException.deleteMany({ where: { schedule: { classId: { in: demoClassIds } } } });
  await db.schedule.deleteMany({ where: { classId: { in: demoClassIds } } });
  await db.question.deleteMany({ where: { OR: [{ examId: { in: demoExamIds } }, { subjectId: { in: demoSubjectIds }, examId: null }] } });
  await db.exam.deleteMany({ where: { OR: [{ classId: { in: demoClassIds } }, { event: { createdBy: { in: demoIds } } }] } });
  await db.eventRegistration.deleteMany({ where: { event: { createdBy: { in: demoIds } } } });
  await db.eventPackage.deleteMany({ where: { event: { createdBy: { in: demoIds } } } });
  await db.event.deleteMany({ where: { createdBy: { in: demoIds } } });
  await db.assignment.deleteMany({ where: { classId: { in: demoClassIds } } });
  await db.attendance.deleteMany({ where: { classId: { in: demoClassIds } } });
  await db.gradeComponent.deleteMany({ where: { classId: { in: demoClassIds } } });
  await db.material.deleteMany({ where: { classId: { in: demoClassIds } } });
  await db.classStudent.deleteMany({ where: { OR: [{ classId: { in: demoClassIds } }, { studentId: { in: demoIds } }] } });
  await db.class.deleteMany({ where: { teacherId: { in: demoIds } } });
  await db.subject.deleteMany({ where: { code: { startsWith: DEMO_SUBJECT_PREFIX } } });
  await db.announcement.deleteMany({ where: { authorId: { in: demoIds } } });
  await db.userProfile.deleteMany({ where: { userId: { in: demoIds } } });
  await db.account.deleteMany({ where: { userId: { in: demoIds } } });
  await db.session.deleteMany({ where: { userId: { in: demoIds } } });
  await db.parentChild.deleteMany({ where: { OR: [{ parentId: { in: demoIds } }, { childId: { in: demoIds } }] } });
  await db.user.deleteMany({ where: { email: { endsWith: SUFFIX } } });

  return { deleted: { users: demoIds.length, subjects: demoSubjectIds.length, classes: demoClassIds.length } };
}

// ─── helpers ──────────────────────────────────────────────────────────────────

async function makeUser(name: string, slug: string, role: "GURU" | "SISWA" | "ORANG_TUA", pw: string) {
  return db.user.create({ data: { name, email: `${slug}${SUFFIX}`, role, password: pw } });
}

function daysAgo(n: number) {
  const d = new Date(); d.setDate(d.getDate() - n); return d;
}
function daysFromNow(n: number) {
  const d = new Date(); d.setDate(d.getDate() + n); return d;
}

// ─── AKADEMIK ─────────────────────────────────────────────────────────────────

export async function seedAkademik() {
  const pw = await hash("demo123", 10);

  // Subjects
  const [sMtk, sIpa, sBin] = await Promise.all([
    db.subject.create({ data: { name: "Matematika [Demo]", code: "DEMO_AKD_MTK", color: "#3B82F6", description: "Pelajaran Matematika (Demo)" } }),
    db.subject.create({ data: { name: "IPA [Demo]", code: "DEMO_AKD_IPA", color: "#10B981", description: "Ilmu Pengetahuan Alam (Demo)" } }),
    db.subject.create({ data: { name: "Bahasa Indonesia [Demo]", code: "DEMO_AKD_BIN", color: "#F59E0B", description: "Bahasa Indonesia (Demo)" } }),
  ]);

  // Guru
  const [gMtk, gIpa, gBin] = await Promise.all([
    makeUser("Ahmad Fauzi, S.Pd", "ahmad.akd", "GURU", pw),
    makeUser("Siti Rahayu, M.Pd", "siti.akd", "GURU", pw),
    makeUser("Budi Hartono, S.S", "budi.akd", "GURU", pw),
  ]);

  // Siswa
  const siswaData = [
    ["Andi Wijaya", "andi.akd"], ["Dewi Putri", "dewi.akd"], ["Rizky Maulana", "rizky.akd"],
    ["Sari Indah", "sari.akd"], ["Fajar Nugroho", "fajar.akd"], ["Maya Kusuma", "maya.akd"],
  ];
  const siswaList = await Promise.all(siswaData.map(([n, s]) => makeUser(n, s, "SISWA", pw)));

  // Orang Tua
  const [ot1, ot2] = await Promise.all([
    makeUser("Bapak Wijaya (Demo)", "ortu1.akd", "ORANG_TUA", pw),
    makeUser("Ibu Putri Lestari (Demo)", "ortu2.akd", "ORANG_TUA", pw),
  ]);
  await db.parentChild.createMany({ data: [{ parentId: ot1.id, childId: siswaList[0].id }, { parentId: ot2.id, childId: siswaList[1].id }] });

  // Classes
  const [cMtk, cIpa, cBin] = await Promise.all([
    db.class.create({ data: { name: "Kelas 7A Matematika", subjectId: sMtk.id, teacherId: gMtk.id, maxStudents: 15, isActive: true } }),
    db.class.create({ data: { name: "Kelas 8B IPA", subjectId: sIpa.id, teacherId: gIpa.id, maxStudents: 15, isActive: true } }),
    db.class.create({ data: { name: "Kelas 9A Bahasa Indonesia", subjectId: sBin.id, teacherId: gBin.id, maxStudents: 15, isActive: true } }),
  ]);

  // Enroll all students
  for (const cls of [cMtk, cIpa, cBin]) {
    await db.classStudent.createMany({ data: siswaList.map((s) => ({ classId: cls.id, studentId: s.id })) });
  }

  // Schedules
  for (const cls of [cMtk, cIpa, cBin]) {
    await db.schedule.create({ data: { classId: cls.id, dayOfWeek: "SENIN", startTime: "08:00", endTime: "09:30" } });
    await db.schedule.create({ data: { classId: cls.id, dayOfWeek: "RABU", startTime: "08:00", endTime: "09:30" } });
  }

  // Live Session (online class demo)
  await db.liveSession.create({
    data: {
      classId: cMtk.id, teacherId: gMtk.id,
      title: "Live: Persamaan Linear",
      startTime: daysFromNow(2), endTime: daysFromNow(2),
      meetingUrl: "https://meet.google.com/demo-akd-mtk",
      platform: "Google Meet",
    },
  });

  // GradeComponents
  const makeGC = (classId: string) => db.gradeComponent.createMany({
    data: [
      { classId, name: "Kehadiran", weight: 20, order: 1 },
      { classId, name: "Tugas Harian", weight: 30, order: 2 },
      { classId, name: "Ujian", weight: 50, order: 3 },
    ],
  });
  await Promise.all([makeGC(cMtk.id), makeGC(cIpa.id), makeGC(cBin.id)]);

  // Materials
  await db.material.createMany({
    data: [
      { title: "Pengantar Aljabar", classId: cMtk.id, subjectId: sMtk.id, uploaderId: gMtk.id, type: "PDF", isPublished: true, description: "Materi pengantar aljabar untuk kelas 7. Mencakup variabel, koefisien, dan persamaan dasar.", chapterTitle: "Bab 1: Aljabar", chapterOrder: 1, order: 1, keyPoints: JSON.stringify(["Memahami variabel dan koefisien", "Menyelesaikan persamaan dasar"]), content: "Aljabar adalah cabang matematika yang menggunakan huruf untuk mewakili bilangan..." },
      { title: "Persamaan Linear Satu Variabel", classId: cMtk.id, subjectId: sMtk.id, uploaderId: gMtk.id, type: "DOCUMENT", isPublished: true, description: "Membahas cara menyelesaikan persamaan linear satu variabel dengan metode substitusi.", chapterTitle: "Bab 1: Aljabar", chapterOrder: 1, order: 2, keyPoints: JSON.stringify(["Metode substitusi", "Pindah ruas"]), tips: "Ingat: saat pindah ruas, tanda berubah." },
      { title: "Sistem Tata Surya", classId: cIpa.id, subjectId: sIpa.id, uploaderId: gIpa.id, type: "VIDEO", isPublished: true, description: "Penjelasan lengkap tentang planet-planet dalam tata surya, satelit, dan benda langit lainnya.", chapterTitle: "Bab 2: Tata Surya", chapterOrder: 2, order: 1, keyPoints: JSON.stringify(["Urutan planet", "Satelit alami"]) },
      { title: "Ekosistem dan Lingkungan", classId: cIpa.id, subjectId: sIpa.id, uploaderId: gIpa.id, type: "PDF", isPublished: true, description: "Mempelajari komponen biotik dan abiotik dalam suatu ekosistem serta interaksinya.", chapterTitle: "Bab 3: Ekosistem", chapterOrder: 3, order: 1, keyPoints: JSON.stringify(["Komponen biotik", "Komponen abiotik", "Rantai makanan"]) },
      { title: "Teks Deskriptif", classId: cBin.id, subjectId: sBin.id, uploaderId: gBin.id, type: "PDF", isPublished: true, description: "Pengertian, ciri-ciri, dan contoh teks deskriptif dalam Bahasa Indonesia.", chapterTitle: "Bab 1: Teks Deskriptif", chapterOrder: 1, order: 1, keyPoints: JSON.stringify(["Ciri teks deskriptif", "Penggunaan kata sifat"]) },
      { title: "Menulis Karangan Narasi", classId: cBin.id, subjectId: sBin.id, uploaderId: gBin.id, type: "DOCUMENT", isPublished: true, description: "Teknik menulis karangan narasi yang baik, termasuk struktur dan pemilihan kata.", chapterTitle: "Bab 2: Narasi", chapterOrder: 2, order: 1, keyPoints: JSON.stringify(["Struktur narasi", "Orientasi-komplikasi-resolusi"]) },
    ],
  });

  // Assignments
  const dueNext = daysFromNow(7);
  const duePast = daysAgo(14);
  const [asMtk, asIpa, asBin] = await Promise.all([
    db.assignment.create({ data: { title: "Latihan Aljabar", classId: cMtk.id, teacherId: gMtk.id, dueDate: dueNext, maxScore: 100, isPublished: true, description: "Kerjakan soal aljabar halaman 25-30 dari buku paket." } }),
    db.assignment.create({ data: { title: "Laporan Pengamatan Ekosistem", classId: cIpa.id, teacherId: gIpa.id, dueDate: duePast, maxScore: 100, isPublished: true, description: "Buat laporan pengamatan ekosistem di lingkungan sekitar rumah." } }),
    db.assignment.create({ data: { title: "Menulis Teks Deskriptif", classId: cBin.id, teacherId: gBin.id, dueDate: duePast, maxScore: 100, isPublished: true, description: "Tulis teks deskriptif tentang tempat favoritmu minimal 200 kata." } }),
  ]);

  // Submissions (IPA & BIN assignments already due)
  const subScoresIpa = [88, 92, 75, 85, 90, 78];
  const subScoresBin = [82, 95, 70, 88, 76, 91];
  await db.submission.createMany({
    data: [
      ...siswaList.map((s, i) => ({ assignmentId: asIpa.id, studentId: s.id, content: "Laporan pengamatan terlampir.", score: subScoresIpa[i], submittedAt: daysAgo(10), gradedAt: daysAgo(8) })),
      ...siswaList.map((s, i) => ({ assignmentId: asBin.id, studentId: s.id, content: "Teks deskriptif tentang pantai.", score: subScoresBin[i], submittedAt: daysAgo(12), gradedAt: daysAgo(10) })),
    ],
  });

  // Exams
  const [exMtk, exIpa, exBin] = await Promise.all([
    db.exam.create({ data: { title: "Ulangan Harian Aljabar", classId: cMtk.id, duration: 60, passingScore: 60, isPublished: true, description: "Ulangan materi aljabar bab 1-2" } }),
    db.exam.create({ data: { title: "Ulangan IPA Tata Surya", classId: cIpa.id, duration: 45, passingScore: 60, isPublished: true, description: "Ulangan materi sistem tata surya" } }),
    db.exam.create({ data: { title: "Ulangan Bahasa Indonesia", classId: cBin.id, duration: 60, passingScore: 60, isPublished: true, description: "Ulangan teks deskriptif dan narasi" } }),
  ]);

  // Questions for Matematika exam
  await db.question.createMany({
    data: [
      { examId: exMtk.id, subjectId: sMtk.id, type: "PILGAN", content: "Jika 2x + 5 = 13, maka nilai x adalah...", options: JSON.stringify(["A. 3", "B. 4", "C. 5", "D. 6"]), correctAnswer: "B", score: 20, difficulty: 2, explanation: "2x + 5 = 13 → 2x = 8 → x = 4" },
      { examId: exMtk.id, subjectId: sMtk.id, type: "PILGAN", content: "Hasil dari 5² - 3² = ...", options: JSON.stringify(["A. 16", "B. 20", "C. 25", "D. 34"]), correctAnswer: "A", score: 20, difficulty: 1, explanation: "25 - 9 = 16" },
      { examId: exMtk.id, subjectId: sMtk.id, type: "PILGAN", content: "FPB dari 24 dan 36 adalah...", options: JSON.stringify(["A. 6", "B. 8", "C. 12", "D. 18"]), correctAnswer: "C", score: 20, difficulty: 2, explanation: "Faktor bersama terbesar dari 24 dan 36 adalah 12." },
      { examId: exMtk.id, subjectId: sMtk.id, type: "PILGAN", content: "Luas segitiga dengan alas 8 cm dan tinggi 6 cm adalah...", options: JSON.stringify(["A. 24 cm²", "B. 48 cm²", "C. 96 cm²", "D. 14 cm²"]), correctAnswer: "A", score: 20, difficulty: 1, explanation: "L = ½ × 8 × 6 = 24 cm²" },
      { examId: exMtk.id, subjectId: sMtk.id, type: "PILGAN", content: "3/4 dalam bentuk persen adalah...", options: JSON.stringify(["A. 25%", "B. 50%", "C. 75%", "D. 80%"]), correctAnswer: "C", score: 20, difficulty: 1, explanation: "3/4 × 100% = 75%" },
    ],
  });
  await db.question.createMany({
    data: [
      { examId: exIpa.id, subjectId: sIpa.id, type: "PILGAN", content: "Planet terbesar dalam tata surya adalah...", options: JSON.stringify(["A. Bumi", "B. Saturn", "C. Jupiter", "D. Uranus"]), correctAnswer: "C", score: 20, difficulty: 1 },
      { examId: exIpa.id, subjectId: sIpa.id, type: "PILGAN", content: "Gas yang dibutuhkan manusia untuk bernapas adalah...", options: JSON.stringify(["A. CO₂", "B. N₂", "C. O₂", "D. H₂"]), correctAnswer: "C", score: 20, difficulty: 1 },
      { examId: exIpa.id, subjectId: sIpa.id, type: "PILGAN", content: "Fotosintesis menghasilkan...", options: JSON.stringify(["A. CO₂ dan Air", "B. O₂ dan Glukosa", "C. N₂ dan Air", "D. H₂ dan CO₂"]), correctAnswer: "B", score: 20, difficulty: 2 },
      { examId: exIpa.id, subjectId: sIpa.id, type: "PILGAN", content: "Hewan yang berkembang biak dengan bertelur disebut...", options: JSON.stringify(["A. Vivipar", "B. Ovovivipar", "C. Ovipar", "D. Herbivora"]), correctAnswer: "C", score: 20, difficulty: 2 },
      { examId: exIpa.id, subjectId: sIpa.id, type: "PILGAN", content: "Jumlah tulang pada tubuh manusia dewasa adalah...", options: JSON.stringify(["A. 196", "B. 206", "C. 216", "D. 226"]), correctAnswer: "B", score: 20, difficulty: 2 },
    ],
  });
  await db.question.createMany({
    data: [
      { examId: exBin.id, subjectId: sBin.id, type: "PILGAN", content: "Sinonim dari kata 'mewah' adalah...", options: JSON.stringify(["A. Sederhana", "B. Gemerlap", "C. Miskin", "D. Biasa"]), correctAnswer: "B", score: 25, difficulty: 1 },
      { examId: exBin.id, subjectId: sBin.id, type: "PILGAN", content: "Antonim dari kata 'keras' adalah...", options: JSON.stringify(["A. Kasar", "B. Halus", "C. Kuat", "D. Besar"]), correctAnswer: "B", score: 25, difficulty: 1 },
      { examId: exBin.id, subjectId: sBin.id, type: "PILGAN", content: "Teks yang berisi fakta dan bersifat informatif disebut...", options: JSON.stringify(["A. Fiksi", "B. Nonfiksi", "C. Narasi imajinatif", "D. Puisi"]), correctAnswer: "B", score: 25, difficulty: 2 },
      { examId: exBin.id, subjectId: sBin.id, type: "ISIAN", content: "Sebutkan tiga ciri-ciri teks deskriptif!", options: undefined, correctAnswer: "Menggambarkan secara detail, menggunakan kata sifat, memberikan kesan nyata", score: 25, difficulty: 3 },
    ],
  });

  // Bank soal (examId = null, hanya subjectId)
  await db.question.createMany({
    data: [
      { subjectId: sMtk.id, type: "PILGAN", content: "KPK dari 4 dan 6 adalah...", options: JSON.stringify(["A. 8", "B. 10", "C. 12", "D. 24"]), correctAnswer: "C", score: 1, difficulty: 1 },
      { subjectId: sMtk.id, type: "PILGAN", content: "Jika a = 3 dan b = 4, maka a² + b² = ...", options: JSON.stringify(["A. 16", "B. 25", "C. 14", "D. 49"]), correctAnswer: "B", score: 1, difficulty: 2 },
      { subjectId: sMtk.id, type: "ISIAN", content: "Hitunglah nilai dari 3x + 2 jika x = 5!", options: undefined, correctAnswer: "17", score: 1, difficulty: 1 },
      { subjectId: sIpa.id, type: "PILGAN", content: "Proses penguapan air dari permukaan bumi disebut...", options: JSON.stringify(["A. Kondensasi", "B. Presipitasi", "C. Evaporasi", "D. Infiltrasi"]), correctAnswer: "C", score: 1, difficulty: 2 },
      { subjectId: sIpa.id, type: "PILGAN", content: "Sel tumbuhan memiliki bagian yang tidak dimiliki sel hewan, yaitu...", options: JSON.stringify(["A. Mitokondria", "B. Dinding sel", "C. Nukleus", "D. Sitoplasma"]), correctAnswer: "B", score: 1, difficulty: 2 },
      { subjectId: sBin.id, type: "PILGAN", content: "Kalimat yang mengandung satu subjek dan satu predikat disebut kalimat...", options: JSON.stringify(["A. Majemuk", "B. Tunggal", "C. Aktif", "D. Pasif"]), correctAnswer: "B", score: 1, difficulty: 1 },
      { subjectId: sBin.id, type: "ISIAN", content: "Apa yang dimaksud dengan kata baku? Berikan satu contoh!", options: undefined, correctAnswer: "Kata yang sesuai dengan kaidah Ejaan Yang Disempurnakan (EYD)", score: 1, difficulty: 2 },
    ],
  });

  // Exam Attempts (4 siswa sudah mengerjakan ujian Mtk dan IPA)
  const mtkScores = [80, 100, 60, 90];
  const ipaScores = [85, 75, 95, 65];
  await db.examAttempt.createMany({
    data: [
      ...siswaList.slice(0, 4).map((s, i) => ({ examId: exMtk.id, studentId: s.id, score: mtkScores[i], isCompleted: true, startedAt: daysAgo(3), submittedAt: daysAgo(3) })),
      ...siswaList.slice(0, 4).map((s, i) => ({ examId: exIpa.id, studentId: s.id, score: ipaScores[i], isCompleted: true, startedAt: daysAgo(5), submittedAt: daysAgo(5) })),
    ],
  });

  // Attendance (3 sesi per kelas)
  for (const cls of [cMtk, cIpa, cBin]) {
    for (const daysBack of [21, 14, 7]) {
      const att = await db.attendance.create({ data: { classId: cls.id, date: daysAgo(daysBack) } });
      await db.attendanceRecord.createMany({
        data: siswaList.map((s, i) => ({ attendanceId: att.id, studentId: s.id, status: i === 3 ? "IZIN" : "HADIR" })),
      });
    }
  }

  // Invoices
  const dueDate = daysFromNow(14);
  await db.invoice.createMany({
    data: siswaList.map((s) => ({ studentId: s.id, amount: 350000, dueDate, status: "UNPAID", note: "SPP Bulan Juli 2025 (Demo)" })),
  });

  // Forum threads
  const t1 = await db.forumThread.create({
    data: { classId: cMtk.id, authorId: siswaList[0].id, title: "Bingung soal persamaan linear", content: "Kak, kalau 3x - 2 = 10 itu caranya gimana ya? Aku selalu bingung di bagian pindah ruasnya." },
  });
  await db.forumReply.createMany({
    data: [
      { threadId: t1.id, authorId: gMtk.id, content: "Halo Andi! Caranya: 3x = 10 + 2 = 12, maka x = 12/3 = 4. Ingat ya, kalau pindah ruas tanda berubah!", isAnswer: true },
      { threadId: t1.id, authorId: siswaList[2].id, content: "Wah makasih Pak Ahmad, jadi paham sekarang!" },
    ],
  });

  const t2 = await db.forumThread.create({
    data: { classId: cIpa.id, authorId: siswaList[1].id, title: "Bedanya vivipar dan ovipar apa ya?", content: "Bu Siti, saya masih bingung membedakan hewan vivipar, ovipar, dan ovovivipar. Bisa dijelaskan dengan contoh?" },
  });
  await db.forumReply.create({
    data: { threadId: t2.id, authorId: gIpa.id, content: "Vivipar = melahirkan (kucing, anjing). Ovipar = bertelur (ayam, ikan). Ovovivipar = telur menetas di dalam tubuh (hiu, ular boa). Mudah kan?", isAnswer: true },
  });

  // Teaching Journals
  for (const [cls, teacher] of [[cMtk, gMtk], [cIpa, gIpa], [cBin, gBin]] as const) {
    await db.teachingJournal.create({ data: { classId: cls.id, teacherId: teacher.id, sessionDate: daysAgo(7), startTime: "08:00", endTime: "09:30", activity: "Pengajaran materi bab berjalan lancar", material: "Bab 1", studentCount: 6, status: "PUBLISHED" } });
    await db.teachingJournal.create({ data: { classId: cls.id, teacherId: teacher.id, sessionDate: daysAgo(3), startTime: "08:00", endTime: "09:30", activity: "Latihan soal dan diskusi", material: "Bab 2", obstacles: "Beberapa siswa kesulitan", solution: "Remedial tambahan", studentCount: 6, status: "PUBLISHED" } });
  }

  // Teacher Attendance (unique per teacher per date)
  for (const [cls, teacher] of [[cMtk, gMtk], [cIpa, gIpa], [cBin, gBin]] as const) {
    await db.teacherAttendance.create({ data: { teacherId: teacher.id, classId: cls.id, date: daysAgo(7), checkIn: daysAgo(7), status: "HADIR" } });
    await db.teacherAttendance.create({ data: { teacherId: teacher.id, classId: cls.id, date: daysAgo(3), checkIn: daysAgo(3), status: "HADIR" } });
  }

  // Report Period + Raport (untuk 3 siswa pertama di kelas MTK)
  const period = await db.reportPeriod.create({ data: { name: "Semester Ganjil 2025 (Demo)", startDate: daysAgo(120), endDate: daysFromNow(60) } });
  for (const s of siswaList.slice(0, 3)) {
    const raport = await db.raport.create({
      data: {
        studentId: s.id, classId: cMtk.id, periodId: period.id,
        semester: "GANJIL",
        finalGrade: 82, predicate: "B",
        academicStars: 4, academicCategory: "Sangat Baik",
        academicDescription: "Menunjukkan pemahaman yang sangat baik dalam materi aljabar.",
        teacherNote: "Pertahankan prestasimu, terus tingkatkan kemampuan!",
        status: "PUBLISHED", publishedAt: daysAgo(1),
      },
    });
    const aspectKerjasama = await db.attitudeAspect.findFirst({ where: { name: "Kerja Sama" } });
    const aspectDisiplin = await db.attitudeAspect.findFirst({ where: { name: "Disiplin" } });
    if (aspectKerjasama) await db.raportAttitude.create({ data: { raportId: raport.id, aspectId: aspectKerjasama.id, stars: 4, note: "Aktif dalam kerja kelompok." } });
    if (aspectDisiplin) await db.raportAttitude.create({ data: { raportId: raport.id, aspectId: aspectDisiplin.id, stars: 5, note: "Selalu tepat waktu dan rajin." } });
  }

  // Notifications
  await db.notification.createMany({
    data: [
      ...siswaList.map((s) => ({ userId: s.id, title: "Selamat datang di Demo LMS Bimbel!", content: "Akun demo Anda telah dibuat. Password: demo123", type: "INFO" as const })),
      ...siswaList.map((s) => ({ userId: s.id, title: "Tugas baru: Latihan Aljabar", content: "Tugas Matematika baru telah dipublikasikan. Tenggat 7 hari lagi.", type: "ASSIGNMENT" as const })),
      ...siswaList.slice(0, 3).map((s) => ({ userId: s.id, title: "Raport telah dipublikasikan", content: "Raport Semester Ganjil 2025 sudah tersedia.", type: "INFO" as const })),
    ],
  });

  // Student Points (gamification)
  await db.studentPoints.createMany({
    data: [
      { userId: siswaList[0].id, points: 320, level: 3, streak: 5, xp: 320 },
      { userId: siswaList[1].id, points: 250, level: 2, streak: 3, xp: 250 },
      { userId: siswaList[2].id, points: 180, level: 2, streak: 1, xp: 180 },
    ],
  });

  // Payment (2 siswa sudah bayar SPP)
  const invoices = await db.invoice.findMany({ where: { studentId: { in: siswaList.map((s) => s.id) } } });
  if (invoices.length >= 2) {
    await db.payment.create({ data: { invoiceId: invoices[0].id, userId: siswaList[0].id, amount: 350000, method: "TRANSFER", confirmedAt: daysAgo(5) } });
    await db.payment.create({ data: { invoiceId: invoices[1].id, userId: siswaList[1].id, amount: 350000, method: "CASH", confirmedAt: daysAgo(3) } });
    await db.invoice.update({ where: { id: invoices[0].id }, data: { status: "PAID" } });
    await db.invoice.update({ where: { id: invoices[1].id }, data: { status: "PAID" } });
  }

  // Announcement
  await db.announcement.create({
    data: {
      title: "Pengumuman Demo: Jadwal Live Session",
      content: "Live session Matematika akan diadakan 2 hari lagi. Pastikan kalian hadir ya!",
      authorId: gMtk.id,
      targetRoles: ["SISWA"],
      targetClassIds: [cMtk.id],
    },
  });

  return { type: "AKADEMIK", users: 11, classes: 3 };
}

// ─── UTBK / SNBT ─────────────────────────────────────────────────────────────

export async function seedUTBK() {
  const pw = await hash("demo123", 10);

  const [sTPS, sLit] = await Promise.all([
    db.subject.create({ data: { name: "TPS (Tes Potensi Skolastik) [Demo]", code: "DEMO_UTBK_TPS", color: "#8B5CF6" } }),
    db.subject.create({ data: { name: "Literasi & Penalaran Matematika [Demo]", code: "DEMO_UTBK_LIT", color: "#EC4899" } }),
  ]);
  const [gTPS, gLit] = await Promise.all([
    makeUser("Reza Firmansyah, S.Pd (UTBK)", "reza.utbk", "GURU", pw),
    makeUser("Nadia Pratiwi, M.Sc (UTBK)", "nadia.utbk", "GURU", pw),
  ]);
  const siswaUtbk = await Promise.all([
    makeUser("Kevin Gunawan", "kevin.utbk", "SISWA", pw),
    makeUser("Putri Amelia", "putri.utbk", "SISWA", pw),
    makeUser("Dimas Ardianto", "dimas.utbk", "SISWA", pw),
    makeUser("Lestari Wulandari", "lestari.utbk", "SISWA", pw),
    makeUser("Hendra Saputra", "hendra.utbk", "SISWA", pw),
  ]);
  const [cTPS, cLit] = await Promise.all([
    db.class.create({ data: { name: "UTBK TPS Intensif", subjectId: sTPS.id, teacherId: gTPS.id, maxStudents: 20, isActive: true } }),
    db.class.create({ data: { name: "UTBK Literasi Intensif", subjectId: sLit.id, teacherId: gLit.id, maxStudents: 20, isActive: true } }),
  ]);
  for (const cls of [cTPS, cLit]) {
    await db.classStudent.createMany({ data: siswaUtbk.map((s) => ({ classId: cls.id, studentId: s.id })) });
  }
  // Schedules
  for (const cls of [cTPS, cLit]) {
    await db.schedule.create({ data: { classId: cls.id, dayOfWeek: "SABTU", startTime: "09:00", endTime: "12:00" } });
    await db.schedule.create({ data: { classId: cls.id, dayOfWeek: "MINGGU", startTime: "09:00", endTime: "12:00" } });
  }
  // Materials with Bab
  await db.material.createMany({
    data: [
      { title: "Strategi Penalaran Umum UTBK", classId: cTPS.id, subjectId: sTPS.id, uploaderId: gTPS.id, type: "PDF", isPublished: true, description: "Strategi mengerjakan soal penalaran umum UTBK dalam waktu terbatas.", chapterTitle: "Bab 1: Penalaran Umum", chapterOrder: 1, order: 1, keyPoints: JSON.stringify(["Manajemen waktu", "Logika deduktif"]) },
      { title: "Tips Pemahaman Bacaan", classId: cLit.id, subjectId: sLit.id, uploaderId: gLit.id, type: "PDF", isPublished: true, description: "Teknik membaca cepat dan menjawab pertanyaan pemahaman bacaan UTBK.", chapterTitle: "Bab 1: Literasi", chapterOrder: 1, order: 1, keyPoints: JSON.stringify(["Skimming", "Scanning"]) },
    ],
  });
  const [exTPS, exLit] = await Promise.all([
    db.exam.create({ data: { title: "Tryout TPS #1", classId: cTPS.id, duration: 90, passingScore: 500, isPublished: true, description: "Simulasi tes TPS seperti UTBK asli" } }),
    db.exam.create({ data: { title: "Tryout Literasi #1", classId: cLit.id, duration: 75, passingScore: 500, isPublished: true, description: "Simulasi literasi Bahasa Indonesia dan Bahasa Inggris" } }),
  ]);
  await db.question.createMany({
    data: [
      { examId: exTPS.id, subjectId: sTPS.id, type: "PILGAN", content: "Semua mahasiswa rajin belajar. Budi adalah mahasiswa. Kesimpulan yang tepat adalah...", options: JSON.stringify(["A. Budi mungkin rajin belajar", "B. Budi pasti rajin belajar", "C. Budi tidak rajin belajar", "D. Tidak dapat disimpulkan"]), correctAnswer: "B", score: 25, difficulty: 2 },
      { examId: exTPS.id, subjectId: sTPS.id, type: "PILGAN", content: "Jika 3x − 4 = 11, maka x = ...", options: JSON.stringify(["A. 4", "B. 5", "C. 6", "D. 7"]), correctAnswer: "B", score: 25, difficulty: 2 },
      { examId: exTPS.id, subjectId: sTPS.id, type: "PILGAN", content: "Dokter : Pasien = Guru : ...", options: JSON.stringify(["A. Buku", "B. Siswa", "C. Sekolah", "D. Ilmu"]), correctAnswer: "B", score: 25, difficulty: 1 },
      { examId: exTPS.id, subjectId: sTPS.id, type: "PILGAN", content: "Angka yang melanjutkan deret 2, 4, 8, 16, ... adalah...", options: JSON.stringify(["A. 24", "B. 28", "C. 32", "D. 36"]), correctAnswer: "C", score: 25, difficulty: 2 },
      { examId: exLit.id, subjectId: sLit.id, type: "PILGAN", content: "Bacaan: 'Polusi udara meningkat tajam di kota-kota besar.' Ide pokok kalimat tersebut adalah...", options: JSON.stringify(["A. Kota besar tercemar", "B. Polusi udara meningkat di kota besar", "C. Udara tidak sehat", "D. Kota besar berbahaya"]), correctAnswer: "B", score: 25, difficulty: 2 },
      { examId: exLit.id, subjectId: sLit.id, type: "PILGAN", content: "Rata-rata nilai 5 siswa adalah 80. Jika satu siswa mendapat 90, rata-rata 4 siswa lainnya adalah...", options: JSON.stringify(["A. 76", "B. 77.5", "C. 78", "D. 80"]), correctAnswer: "B", score: 25, difficulty: 3 },
    ],
  });
  await db.question.createMany({
    data: [
      { subjectId: sTPS.id, type: "PILGAN", content: "Berikut yang BUKAN termasuk penalaran deduktif adalah...", options: JSON.stringify(["A. Silogisme", "B. Modus ponens", "C. Analogi induktif", "D. Modus tollens"]), correctAnswer: "C", score: 1, difficulty: 3 },
      { subjectId: sLit.id, type: "PILGAN", content: "Kata 'rekonsiliasi' memiliki arti...", options: JSON.stringify(["A. Perdamaian kembali", "B. Pertikaian baru", "C. Kesepakatan bersama", "D. Pemberontakan"]), correctAnswer: "A", score: 1, difficulty: 3 },
    ],
  });
  const scores = [620, 580, 650, 540, 700];
  await db.examAttempt.createMany({
    data: siswaUtbk.map((s, i) => ({ examId: exTPS.id, studentId: s.id, score: scores[i], isCompleted: true, startedAt: daysAgo(4), submittedAt: daysAgo(4) })),
  });
  // Notifications
  await db.notification.createMany({
    data: siswaUtbk.map((s) => ({ userId: s.id, title: "Tryout TPS #1", content: "Tryout TPS telah dipublikasikan. Kerjakan sebelum batas waktu!", type: "EXAM" as const })),
  });

  // Student Points
  await db.studentPoints.createMany({
    data: [
      { userId: siswaUtbk[0].id, points: 450, level: 4, streak: 7, xp: 450 },
      { userId: siswaUtbk[1].id, points: 300, level: 3, streak: 4, xp: 300 },
    ],
  });

  // Event (Tryout) — requires a branch
  const branch = await db.branch.findFirst();
  if (branch) {
    const event = await db.event.create({ data: { branchId: branch.id, title: "Tryout UTBK SNBT 2025 (Demo)", type: "TRYOUT", status: "PUBLISHED", startDate: daysFromNow(14), endDate: daysFromNow(14), registrationDeadline: daysFromNow(13), location: "Online", isPaid: false, createdBy: gTPS.id } });
    const pkg = await db.eventPackage.create({ data: { eventId: event.id, name: "Paket Gratis", price: 0 } });
    await db.eventRegistration.createMany({ data: siswaUtbk.slice(0, 3).map((s) => ({ eventId: event.id, userId: s.id, packageId: pkg.id, status: "CONFIRMED", paymentStatus: "FREE" })) });
  }

  return { type: "UTBK_SNBT", users: 7, classes: 2 };
}

// ─── KEDINASAN / CPNS ─────────────────────────────────────────────────────────

export async function seedKedinasan() {
  const pw = await hash("demo123", 10);

  const [sTWK, sTKP] = await Promise.all([
    db.subject.create({ data: { name: "TWK & TIU (Tes Wawasan) [Demo]", code: "DEMO_KDN_TWK", color: "#EF4444" } }),
    db.subject.create({ data: { name: "TKP (Tes Karakteristik Pribadi) [Demo]", code: "DEMO_KDN_TKP", color: "#F97316" } }),
  ]);
  const [gTWK, gTKP] = await Promise.all([
    makeUser("Agus Setiawan, S.H (Kedinasan)", "agus.kdn", "GURU", pw),
    makeUser("Rina Marlina, M.Si (Kedinasan)", "rina.kdn", "GURU", pw),
  ]);
  const siswaKdn = await Promise.all([
    makeUser("Bagas Prasetyo", "bagas.kdn", "SISWA", pw),
    makeUser("Fitria Handayani", "fitria.kdn", "SISWA", pw),
    makeUser("Galih Prabowo", "galih.kdn", "SISWA", pw),
    makeUser("Hani Safitri", "hani.kdn", "SISWA", pw),
  ]);
  const [cTWK, cTKP] = await Promise.all([
    db.class.create({ data: { name: "Bimbel TWK & TIU CPNS", subjectId: sTWK.id, teacherId: gTWK.id, maxStudents: 20, isActive: true } }),
    db.class.create({ data: { name: "Bimbel TKP CPNS", subjectId: sTKP.id, teacherId: gTKP.id, maxStudents: 20, isActive: true } }),
  ]);
  for (const cls of [cTWK, cTKP]) {
    await db.classStudent.createMany({ data: siswaKdn.map((s) => ({ classId: cls.id, studentId: s.id })) });
  }
  // Schedules
  for (const cls of [cTWK, cTKP]) {
    await db.schedule.create({ data: { classId: cls.id, dayOfWeek: "SABTU", startTime: "08:00", endTime: "11:00" } });
    await db.schedule.create({ data: { classId: cls.id, dayOfWeek: "MINGGU", startTime: "08:00", endTime: "11:00" } });
  }
  await db.material.createMany({
    data: [
      { title: "Pancasila & UUD 1945 untuk CPNS", classId: cTWK.id, subjectId: sTWK.id, uploaderId: gTWK.id, type: "PDF", isPublished: true, description: "Rangkuman Pancasila, UUD 1945, NKRI, dan Bhineka Tunggal Ika untuk TWK CPNS." },
      { title: "Strategi Menjawab TKP", classId: cTKP.id, subjectId: sTKP.id, uploaderId: gTKP.id, type: "PDF", isPublished: true, description: "Panduan menjawab soal TKP dengan skor maksimal. Setiap jawaban memiliki bobot 1-5." },
    ],
  });
  const [exTWK, exTKP] = await Promise.all([
    db.exam.create({ data: { title: "Simulasi TWK & TIU #1", classId: cTWK.id, duration: 100, passingScore: 65, isPublished: true } }),
    db.exam.create({ data: { title: "Simulasi TKP #1", classId: cTKP.id, duration: 35, passingScore: 126, isPublished: true } }),
  ]);
  await db.question.createMany({
    data: [
      { examId: exTWK.id, subjectId: sTWK.id, type: "PILGAN", content: "Sila ke-3 Pancasila berbunyi...", options: JSON.stringify(["A. Ketuhanan Yang Maha Esa", "B. Kemanusiaan yang adil dan beradab", "C. Persatuan Indonesia", "D. Kerakyatan yang dipimpin"]), correctAnswer: "C", score: 5, difficulty: 1 },
      { examId: exTWK.id, subjectId: sTWK.id, type: "PILGAN", content: "UUD 1945 disahkan pada tanggal...", options: JSON.stringify(["A. 17 Agustus 1945", "B. 18 Agustus 1945", "C. 1 Juni 1945", "D. 22 Juni 1945"]), correctAnswer: "B", score: 5, difficulty: 1 },
      { examId: exTWK.id, subjectId: sTWK.id, type: "PILGAN", content: "Lembaga tinggi negara yang berwenang membuat undang-undang adalah...", options: JSON.stringify(["A. Presiden", "B. MA", "C. DPR", "D. MPR"]), correctAnswer: "C", score: 5, difficulty: 2 },
      { examId: exTKP.id, subjectId: sTKP.id, type: "PILGAN", content: "Anda diberi tugas mendadak oleh atasan saat hari libur. Sikap terbaik Anda adalah...", options: JSON.stringify(["A. Menolak karena hari libur", "B. Menerima dan menyelesaikan dengan baik", "C. Meminta rekan kerja menggantikan", "D. Melaporkan ke HRD"]), correctAnswer: "B", score: 5, difficulty: 2 },
      { examId: exTKP.id, subjectId: sTKP.id, type: "PILGAN", content: "Rekan kerja Anda sering datang terlambat. Tindakan terbaik adalah...", options: JSON.stringify(["A. Melaporkan ke atasan langsung", "B. Menegur langsung dengan kasar", "C. Mengajaknya bicara baik-baik secara pribadi", "D. Membiarkan saja"]), correctAnswer: "C", score: 5, difficulty: 2 },
    ],
  });
  const kdnScores = [75, 82, 68, 90];
  await db.examAttempt.createMany({
    data: siswaKdn.map((s, i) => ({ examId: exTWK.id, studentId: s.id, score: kdnScores[i], isCompleted: true, startedAt: daysAgo(2), submittedAt: daysAgo(2) })),
  });
  // Notifications
  await db.notification.createMany({
    data: siswaKdn.map((s) => ({ userId: s.id, title: "Simulasi TWK & TIU #1", content: "Simulasi ujian TWK telah dipublikasikan. Kerjakan sebelum batas waktu!", type: "EXAM" as const })),
  });

  return { type: "KEDINASAN", users: 6, classes: 2 };
}

// ─── BAHASA ───────────────────────────────────────────────────────────────────

export async function seedBahasa() {
  const pw = await hash("demo123", 10);

  const [sEng, sMnd, sJpn] = await Promise.all([
    db.subject.create({ data: { name: "Bahasa Inggris [Demo]", code: "DEMO_BHS_ENG", color: "#3B82F6" } }),
    db.subject.create({ data: { name: "Bahasa Mandarin [Demo]", code: "DEMO_BHS_MND", color: "#EF4444" } }),
    db.subject.create({ data: { name: "Bahasa Jepang [Demo]", code: "DEMO_BHS_JPN", color: "#F59E0B" } }),
  ]);
  const [gEng, gMnd, gJpn] = await Promise.all([
    makeUser("Mrs. Diana Kusuma (English)", "diana.bhs", "GURU", pw),
    makeUser("Laoshi Wang Li (Mandarin)", "wangli.bhs", "GURU", pw),
    makeUser("Sensei Tanaka Yuki (Jepang)", "tanaka.bhs", "GURU", pw),
  ]);
  const siswaBhs = await Promise.all([
    makeUser("Alisha Permata", "alisha.bhs", "SISWA", pw),
    makeUser("Bintang Ramadhan", "bintang.bhs", "SISWA", pw),
    makeUser("Claudia Santika", "claudia.bhs", "SISWA", pw),
    makeUser("David Pratama", "david.bhs", "SISWA", pw),
    makeUser("Elsa Ningrum", "elsa.bhs", "SISWA", pw),
  ]);
  const [cEng, cMnd, cJpn] = await Promise.all([
    db.class.create({ data: { name: "English Intermediate", subjectId: sEng.id, teacherId: gEng.id, maxStudents: 15, isActive: true } }),
    db.class.create({ data: { name: "Mandarin Pemula", subjectId: sMnd.id, teacherId: gMnd.id, maxStudents: 15, isActive: true } }),
    db.class.create({ data: { name: "Nihongo N5", subjectId: sJpn.id, teacherId: gJpn.id, maxStudents: 15, isActive: true } }),
  ]);
  for (const cls of [cEng, cMnd, cJpn]) {
    await db.classStudent.createMany({ data: siswaBhs.map((s) => ({ classId: cls.id, studentId: s.id })) });
  }
  // Schedules
  for (const cls of [cEng, cMnd, cJpn]) {
    await db.schedule.create({ data: { classId: cls.id, dayOfWeek: "SELASA", startTime: "16:00", endTime: "17:30" } });
    await db.schedule.create({ data: { classId: cls.id, dayOfWeek: "JUMAT", startTime: "16:00", endTime: "17:30" } });
  }
  // Materials with Bab
  await db.material.createMany({
    data: [
      { title: "Present & Past Tense Review", classId: cEng.id, subjectId: sEng.id, uploaderId: gEng.id, type: "PDF", isPublished: true, description: "Materi penggunaan present tense dan past tense dalam kalimat bahasa Inggris.", chapterTitle: "Bab 1: Tenses", chapterOrder: 1, order: 1, keyPoints: JSON.stringify(["Simple present", "Simple past"]) },
      { title: "Sapaan dan Perkenalan dalam Bahasa Mandarin", classId: cMnd.id, subjectId: sMnd.id, uploaderId: gMnd.id, type: "PDF", isPublished: true, description: "Nǐ hǎo! Belajar sapaan dasar, perkenalan diri, dan angka dalam Bahasa Mandarin.", chapterTitle: "Bab 1: Sapaan", chapterOrder: 1, order: 1, keyPoints: JSON.stringify(["Nǐ hǎo", "Perkenalan diri"]) },
      { title: "Hiragana & Katakana Dasar", classId: cJpn.id, subjectId: sJpn.id, uploaderId: gJpn.id, type: "PDF", isPublished: true, description: "Pengenalan aksara Hiragana dan Katakana untuk pemula bahasa Jepang.", chapterTitle: "Bab 1: Aksara", chapterOrder: 1, order: 1, keyPoints: JSON.stringify(["Hiragana", "Katakana"]) },
    ],
  });
  const [exEng, exMnd, exJpn] = await Promise.all([
    db.exam.create({ data: { title: "English Mid-Term Test", classId: cEng.id, duration: 60, passingScore: 70, isPublished: true } }),
    db.exam.create({ data: { title: "Ujian Mandarin Dasar", classId: cMnd.id, duration: 45, passingScore: 65, isPublished: true } }),
    db.exam.create({ data: { title: "Nihongo Shiken N5", classId: cJpn.id, duration: 50, passingScore: 65, isPublished: true } }),
  ]);
  await db.question.createMany({
    data: [
      { examId: exEng.id, subjectId: sEng.id, type: "PILGAN", content: "The synonym of 'happy' is...", options: JSON.stringify(["A. Sad", "B. Angry", "C. Glad", "D. Tired"]), correctAnswer: "C", score: 25, difficulty: 1 },
      { examId: exEng.id, subjectId: sEng.id, type: "PILGAN", content: "Choose the correct sentence:", options: JSON.stringify(["A. She go to school.", "B. She goes to school.", "C. She going to school.", "D. She goed to school."]), correctAnswer: "B", score: 25, difficulty: 2 },
      { examId: exMnd.id, subjectId: sMnd.id, type: "PILGAN", content: "'Nǐ hǎo' dalam bahasa Indonesia artinya...", options: JSON.stringify(["A. Selamat tinggal", "B. Terima kasih", "C. Halo / Apa kabar", "D. Maaf"]), correctAnswer: "C", score: 25, difficulty: 1 },
      { examId: exJpn.id, subjectId: sJpn.id, type: "PILGAN", content: "'Arigatou gozaimasu' artinya...", options: JSON.stringify(["A. Selamat pagi", "B. Terima kasih", "C. Permisi", "D. Sampai jumpa"]), correctAnswer: "B", score: 25, difficulty: 1 },
      { examId: exJpn.id, subjectId: sJpn.id, type: "PILGAN", content: "Huruf Hiragana untuk bunyi 'ka' adalah...", options: JSON.stringify(["A. あ", "B. か", "C. さ", "D. た"]), correctAnswer: "B", score: 25, difficulty: 2 },
    ],
  });
  const bhsScores = [85, 72, 91, 68, 80];
  await db.examAttempt.createMany({
    data: siswaBhs.map((s, i) => ({ examId: exEng.id, studentId: s.id, score: bhsScores[i], isCompleted: true, startedAt: daysAgo(6), submittedAt: daysAgo(6) })),
  });
  // Notifications
  await db.notification.createMany({
    data: siswaBhs.map((s) => ({ userId: s.id, title: "Selamat datang di Demo Bimbel Bahasa!", content: "Akun demo Anda telah dibuat. Password: demo123", type: "INFO" as const })),
  });

  // Student Points
  await db.studentPoints.createMany({
    data: [
      { userId: siswaBhs[0].id, points: 280, level: 2, streak: 3, xp: 280 },
      { userId: siswaBhs[2].id, points: 350, level: 3, streak: 6, xp: 350 },
    ],
  });

  return { type: "BAHASA", users: 8, classes: 3 };
}

// ─── dispatcher ───────────────────────────────────────────────────────────────

export async function importDemoData(type: DemoType) {
  switch (type) {
    case "AKADEMIK": return seedAkademik();
    case "UTBK_SNBT": return seedUTBK();
    case "KEDINASAN": return seedKedinasan();
    case "BAHASA": return seedBahasa();
    default: throw new Error(`Unknown demo type: ${type}`);
  }
}
