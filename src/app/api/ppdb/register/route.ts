import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateRegistrationNo } from "@/lib/registration-number";
import { logAudit } from "@/lib/audit";
import { createReferral } from "@/lib/commission";
import { z } from "zod";
import { registrationSchema } from "@/lib/ppdb-validation";
import { RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const limited = RATE_LIMITS.publicForm(req);
  if (limited) return limited;

  try {
    const body = await req.json();
    const data = registrationSchema.parse(body);

    const registrationNo = await generateRegistrationNo();

    const registration = await db.registration.create({
      data: {
        registrationNo,
        fullName: data.fullName,
        nik: data.nik || null,
        birthPlace: data.birthPlace,
        birthDate: new Date(data.birthDate),
        gender: data.gender as never,
        educationLevelId: data.educationLevelId || null,
        schoolName: data.schoolName || null,
        gradeLevel: data.gradeLevel || null,
        address: data.address || null,
        whatsapp: data.whatsapp || null,
        email: data.email || null,
        parentName: data.parentName || null,
        parentPhone: data.parentPhone || null,
        parentEmail: data.parentEmail || null,
        parentJob: data.parentJob || null,
        programId: data.programId || null,
        branchId: data.branchId || null,
        preferredScheduleNote: data.preferredScheduleNote || null,
        infoSource: data.infoSource || null,
        referralCode: data.referralCode || null,
        status: "SUBMITTED",
      },
    });

    await db.registrationStatusLog.create({
      data: {
        registrationId: registration.id,
        fromStatus: null,
        toStatus: "SUBMITTED",
      },
    });

    await logAudit({
      action: "CREATE",
      entity: "Registration",
      entityId: registration.id,
      after: { registrationNo, fullName: data.fullName },
    });

    // Create referral if affiliate code provided
    if (data.referralCode) {
      await createReferral({
        affiliateCode: data.referralCode,
        registrationId: registration.id,
        programId: data.programId,
        email: data.email || undefined,
        whatsapp: data.whatsapp || undefined,
        nik: data.nik || undefined,
      });
    }

    return NextResponse.json(
      { registrationNo, id: registration.id },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasi gagal", details: e.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Gagal membuat pendaftaran" },
      { status: 500 }
    );
  }
}
