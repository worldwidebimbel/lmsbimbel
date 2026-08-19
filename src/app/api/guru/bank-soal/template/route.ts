import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import ExcelJS from "exceljs";

const TYPES = ["PILGAN", "PILGAN_KOMPLEK", "BENAR_SALAH", "MENJODOHKAN", "MENGURUTKAN", "SETUJU_TIDAK", "ESSAY", "ISIAN"];

const COLUMNS = [
  { key: "tipe", header: "tipe *", note: "PILGAN / PILGAN_KOMPLEK / BENAR_SALAH / MENJODOHKAN / MENGURUTKAN / SETUJU_TIDAK / ESSAY / ISIAN" },
  { key: "soal", header: "soal *", note: "Teks soal. Untuk LaTeX: $\\frac{x}{y}$. Arab/Jawa: paste langsung." },
  { key: "soal_image_url", header: "soal_image_url", note: "URL gambar untuk soal (opsional)" },
  { key: "opsi_a", header: "opsi_a", note: "PILGAN: teks opsi A | MENJODOHKAN: kiri::kanan | MENGURUTKAN: item urutan ke-1 | SETUJU_TIDAK: pernyataan::Setuju" },
  { key: "opsi_a_image_url", header: "opsi_a_image_url", note: "URL gambar opsi A (opsional)" },
  { key: "opsi_b", header: "opsi_b", note: "Teks opsi B" },
  { key: "opsi_b_image_url", header: "opsi_b_image_url", note: "URL gambar opsi B (opsional)" },
  { key: "opsi_c", header: "opsi_c", note: "Teks opsi C" },
  { key: "opsi_c_image_url", header: "opsi_c_image_url", note: "URL gambar opsi C (opsional)" },
  { key: "opsi_d", header: "opsi_d", note: "Teks opsi D" },
  { key: "opsi_d_image_url", header: "opsi_d_image_url", note: "URL gambar opsi D (opsional)" },
  { key: "opsi_e", header: "opsi_e", note: "Teks opsi E (opsional)" },
  { key: "opsi_e_image_url", header: "opsi_e_image_url", note: "URL gambar opsi E (opsional)" },
  { key: "kunci_jawaban", header: "kunci_jawaban *", note: "PILGAN: A/B/C/D/E. PILGAN_KOMPLEK: A|B. BENAR_SALAH: Benar/Salah. ISIAN: teks jawaban." },
  { key: "pembahasan", header: "pembahasan", note: "Teks pembahasan (opsional)" },
  { key: "pembahasan_image_url", header: "pembahasan_image_url", note: "URL gambar pembahasan (opsional)" },
  { key: "bobot", header: "bobot", note: "Nilai poin soal ini (default: 1)" },
  { key: "kesulitan", header: "kesulitan", note: "1=Mudah, 2=Sedang, 3=Sulit (default: 2)" },
  { key: "tags", header: "tags", note: "Pisahkan dengan koma. Contoh: UTBK,Limit,Kalkulus" },
];

const EXAMPLE_ROWS = [
  ["PILGAN", "Ibu kota Indonesia adalah...", "", "Jakarta", "", "Surabaya", "", "Bandung", "", "Medan", "", "", "", "A", "Jakarta adalah ibu kota Indonesia sejak kemerdekaan.", "", 1, 1, "Geografi,Indonesia"],
  ["PILGAN", "Nilai dari $\\frac{12}{4} + 3$ adalah...", "", "3", "", "6", "", "9", "", "12", "", "", "", "B", "12/4 = 3, ditambah 3 = 6.", "", 1, 2, "Matematika,Aritmatika"],
  ["PILGAN_KOMPLEK", "Manakah yang termasuk bilangan prima?", "", "2", "", "3", "", "4", "", "5", "", "7", "", "A|B|D|E", "2, 3, 5, 7 adalah bilangan prima. 4 bukan.", "", 2, 2, "Matematika,Bilangan"],
  ["BENAR_SALAH", "Air mendidih pada suhu 100°C di tekanan normal.", "", "", "", "", "", "", "", "", "", "", "", "Benar", "Titik didih air = 100°C pada tekanan 1 atm.", "", 1, 1, "Fisika,Suhu"],
  ["BENAR_SALAH", "Matahari berputar mengelilingi bumi.", "", "", "", "", "", "", "", "", "", "", "", "Salah", "Bumilah yang berputar mengelilingi matahari.", "", 1, 1, "IPA"],
  ["ESSAY", "Jelaskan proses fotosintesis!", "", "", "", "", "", "", "", "", "", "", "", "", "Fotosintesis adalah proses tumbuhan mengubah CO₂ + H₂O menjadi glukosa dengan bantuan cahaya matahari.", "", 5, 3, "Biologi"],
  ["ISIAN", "Rumus luas lingkaran adalah π × ___", "", "", "", "", "", "", "", "", "", "", "", "r²", "Luas lingkaran = π × r²", "", 2, 2, "Matematika,Geometri"],
  ["MENJODOHKAN", "Jodohkan ibu kota dengan negaranya!", "", "Jakarta::Indonesia", "", "Paris::Prancis", "", "Tokyo::Jepang", "", "Berlin::Jerman", "", "", "", "", "Jakarta=Indonesia, Paris=Prancis, dst.", "", 4, 2, "Geografi"],
  ["MENGURUTKAN", "Urutkan tahap metamorfosis kupu-kupu dari awal ke akhir!", "", "Telur", "", "Larva/Ulat", "", "Pupa/Kepompong", "", "Imago/Kupu-kupu", "", "", "", "", "Urutan: Telur → Larva → Pupa → Imago", "", 3, 2, "Biologi,Metamorfosis"],
  ["SETUJU_TIDAK", "Tentukan pernyataan berikut Setuju atau Tidak!", "", "Bumi berputar mengelilingi matahari::Setuju", "", "Matahari adalah planet::Tidak", "", "Bulan memiliki gravitasi::Setuju", "", "", "", "", "", "", "", 3, 2, "IPA,Tata Surya"],
];

export async function GET() {
  const session = await auth();
  if (!session?.user || !["GURU", "ADMIN", "SUPER_ADMIN", "ADMIN_CABANG", "ADMIN_AKADEMIK"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const wb = new ExcelJS.Workbook();
  wb.creator = "EduBimbel LMS";

  const wsInfo = wb.addWorksheet("PETUNJUK", { properties: { tabColor: { argb: "FF2563EB" } } });
  wsInfo.getCell("A1").value = "PETUNJUK PENGISIAN TEMPLATE BANK SOAL";
  wsInfo.getCell("A1").font = { bold: true, size: 14, color: { argb: "FF2563EB" } };
  wsInfo.getCell("A3").value = "Sheet SOAL berisi data soal. Jangan ubah baris header (baris 1 & 2).";
  wsInfo.getCell("A4").value = "Kolom bertanda * adalah wajib diisi.";
  wsInfo.getCell("A6").value = "Dukungan Karakter Khusus:";
  wsInfo.getCell("A6").font = { bold: true };
  wsInfo.getCell("A7").value = "• Matematika/LaTeX: Tulis formula dalam tanda $...$. Contoh: $\\frac{x}{y}$  atau  $\\int_0^1 f(x)dx$";
  wsInfo.getCell("A8").value = "• Arab/Al-Quran: Paste teks Arab langsung di sel. Font akan dirender otomatis.";
  wsInfo.getCell("A9").value = "• Aksara Jawa (Hanacaraka): Paste aksara Unicode langsung. Font Noto Serif Javanese akan digunakan.";
  wsInfo.getCell("A11").value = "Format Tipe Khusus:";
  wsInfo.getCell("A11").font = { bold: true };
  wsInfo.getCell("A12").value = "• MENJODOHKAN — Isi kolom opsi_a, opsi_b, dst. dengan format: bagian kiri :: bagian kanan";
  wsInfo.getCell("A13").value = "  Contoh: Jakarta::Indonesia  |  Paris::Prancis  |  Tokyo::Jepang";
  wsInfo.getCell("A14").value = "• MENGURUTKAN — Isi kolom opsi_a, opsi_b, dst. dengan item-item dalam URUTAN BENAR. kunci_jawaban dikosongkan.";
  wsInfo.getCell("A15").value = "  Contoh: opsi_a=Telur  opsi_b=Larva  opsi_c=Pupa  opsi_d=Imago";
  wsInfo.getCell("A16").value = "• SETUJU_TIDAK — Isi opsi_a, opsi_b, dst. dengan format: pernyataan::Setuju  atau  pernyataan::Tidak";
  wsInfo.getCell("A17").value = "  Contoh: Bumi mengelilingi matahari::Setuju  |  Matahari adalah planet::Tidak";
  wsInfo.getCell("A19").value = "Cara Upload Gambar:";
  wsInfo.getCell("A19").font = { bold: true };
  wsInfo.getCell("A20").value = "1. Upload gambar ke cloud storage (Cloudinary, Supabase, Google Drive, dll.)";
  wsInfo.getCell("A21").value = "2. Copy URL gambar (harus bisa diakses publik)";
  wsInfo.getCell("A22").value = "3. Paste URL di kolom *_image_url yang sesuai";

  const ws = wb.addWorksheet("SOAL", { properties: { tabColor: { argb: "FFEA580C" } } });

  ws.views = [{ state: "frozen", ySplit: 2 }];

  const headerStyle: Partial<ExcelJS.Style> = {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A5F" } },
    font: { bold: true, color: { argb: "FFFFFFFF" }, size: 11 },
    alignment: { horizontal: "center", wrapText: true },
    border: {
      bottom: { style: "medium", color: { argb: "FF2563EB" } },
    },
  };

  const noteStyle: Partial<ExcelJS.Style> = {
    fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FFE0E7FF" } },
    font: { italic: true, size: 9, color: { argb: "FF374151" } },
    alignment: { wrapText: true },
  };

  COLUMNS.forEach((col, i) => {
    const colLetter = String.fromCharCode(65 + i);
    const headerCell = ws.getCell(`${colLetter}1`);
    const noteCell = ws.getCell(`${colLetter}2`);
    headerCell.value = col.header;
    headerCell.style = headerStyle;
    noteCell.value = col.note;
    noteCell.style = noteStyle;
  });

  ws.getRow(1).height = 28;
  ws.getRow(2).height = 40;

  const colWidths = [18, 50, 30, 20, 25, 20, 25, 20, 25, 20, 25, 20, 25, 30, 45, 30, 8, 10, 25];
  COLUMNS.forEach((_, i) => {
    ws.getColumn(i + 1).width = colWidths[i] ?? 20;
  });

  EXAMPLE_ROWS.forEach((row) => {
    const dataRow = ws.addRow(row);
    dataRow.eachCell((cell) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFBEB" } };
      cell.font = { color: { argb: "FF6B7280" }, italic: true };
    });
  });

  for (let r = 3; r <= 1002; r++) {
    ws.getCell(`A${r}`).dataValidation = {
      type: "list",
      allowBlank: false,
      formulae: [`"${TYPES.join(",")}"`],
      showErrorMessage: true,
      errorTitle: "Tipe tidak valid",
      error: `Pilih salah satu: ${TYPES.join(", ")}`,
    };
    ws.getCell(`R${r}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: ['"1,2,3"'],
      showErrorMessage: true,
      errorTitle: "Kesulitan tidak valid",
      error: "Isi dengan 1 (Mudah), 2 (Sedang), atau 3 (Sulit)",
    };
  }

  const buf = await wb.xlsx.writeBuffer();
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="template-bank-soal.xlsx"',
    },
  });
}
