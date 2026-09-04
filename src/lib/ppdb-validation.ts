import { z } from "zod";

export const registrationSchema = z.object({
  fullName: z.string().min(2, "Nama lengkap wajib diisi (minimal 2 karakter)"),
  nik: z.string().optional(),
  birthPlace: z.string().min(2, "Tempat lahir wajib diisi"),
  birthDate: z.string().min(1, "Tanggal lahir wajib diisi"),
  gender: z.enum(["L", "P"]),
  educationLevelId: z.string().optional(),
  schoolName: z.string().optional(),
  gradeLevel: z.string().optional(),
  address: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  parentName: z.string().optional(),
  parentPhone: z.string().optional(),
  parentEmail: z.string().email("Format email orang tua tidak valid").optional().or(z.literal("")),
  parentJob: z.string().optional(),
  programId: z.string().optional(),
  branchId: z.string().optional(),
  preferredScheduleNote: z.string().optional(),
  infoSource: z.string().optional(),
  referralCode: z.string().optional(),
  documentTypeIds: z.array(z.string()).optional(),
  documents: z
    .array(
      z.object({
        documentTypeId: z.string().min(1),
        fileUrl: z.string().min(1, "URL dokumen tidak valid"),
        name: z.string().optional(),
      })
    )
    .optional(),
});

export type RegistrationData = z.infer<typeof registrationSchema>;
