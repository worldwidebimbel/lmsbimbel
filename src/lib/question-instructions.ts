import type { QuestionType } from "./question-types";

export type QuestionLang = "id" | "en" | "ar";

const INSTRUCTIONS: Record<QuestionType, Record<QuestionLang, string>> = {
  PILGAN: {
    id: "Pilih satu jawaban yang paling tepat.",
    en: "Choose the single best answer.",
    ar: "اختر الإجابة الصحيحة الواحدة.",
  },
  PILGAN_KOMPLEK: {
    id: "Pilih semua jawaban yang benar.",
    en: "Choose all the correct answers.",
    ar: "اختر جميع الإجابات الصحيحة.",
  },
  BENAR_SALAH: {
    id: "Tentukan apakah pernyataan berikut Benar atau Salah.",
    en: "Determine whether the following statement is True or False.",
    ar: "حدد ما إذا كانت العبارة التالية صحيحة أم خاطئة.",
  },
  MENJODOHKAN: {
    id: "Jodohkan item di kolom kiri dengan pasangan yang tepat di kolom kanan.",
    en: "Match the items in the left column with their correct pairs in the right column.",
    ar: "طابق العناصر في العمود الأيسر مع أزواجها الصحيحة في العمود الأيمن.",
  },
  MENGURUTKAN: {
    id: "Urutkan item berikut sesuai urutan yang benar.",
    en: "Arrange the following items in the correct order.",
    ar: "رتب العناصر التالية بالترتيب الصحيح.",
  },
  SETUJU_TIDAK: {
    id: "Tentukan apakah Anda setuju atau tidak setuju dengan pernyataan berikut.",
    en: "Determine whether you agree or disagree with the following statements.",
    ar: "حدد ما إذا كنت توافق أو لا توافق مع العبارات التالية.",
  },
  ESSAY: {
    id: "Jawab pertanyaan berikut dengan uraian yang lengkap.",
    en: "Answer the following question with a complete explanation.",
    ar: "أجب عن السؤال التالي بإجابة كاملة.",
  },
  ISIAN: {
    id: "Isi jawaban singkat pada ruang yang tersedia.",
    en: "Fill in the short answer in the space provided.",
    ar: "أكمل الإجابة القصيرة في الفراغ المتاح.",
  },
};

export function getInstruction(type: QuestionType, lang: QuestionLang = "id"): string {
  return INSTRUCTIONS[type]?.[lang] ?? INSTRUCTIONS[type]?.id ?? "";
}

export function getBenarSalahLabels(lang: QuestionLang = "id"): { benar: string; salah: string } {
  const labels: Record<QuestionLang, { benar: string; salah: string }> = {
    id: { benar: "Benar", salah: "Salah" },
    en: { benar: "True", salah: "False" },
    ar: { benar: "صحيح", salah: "خاطئ" },
  };
  return labels[lang] ?? labels.id;
}

export function getSetujuTidakLabels(lang: QuestionLang = "id"): { setuju: string; tidak: string } {
  const labels: Record<QuestionLang, { setuju: string; tidak: string }> = {
    id: { setuju: "Setuju", tidak: "Tidak Setuju" },
    en: { setuju: "Agree", tidak: "Disagree" },
    ar: { setuju: "أوافق", tidak: "لا أوافق" },
  };
  return labels[lang] ?? labels.id;
}
