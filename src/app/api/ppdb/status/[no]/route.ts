import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ no: string }> }
) {
  const { no } = await params;

  const registration = await db.registration.findUnique({
    where: { registrationNo: no.toUpperCase() },
    select: {
      registrationNo: true,
      fullName: true,
      birthDate: true,
      status: true,
      program: { select: { name: true } },
      branch: { select: { name: true } },
      createdAt: true,
      rejectionReason: true,
      adminNote: true,
    },
  });

  if (!registration) {
    return NextResponse.json(
      { error: "Nomor pendaftaran tidak ditemukan" },
      { status: 404 }
    );
  }

  return NextResponse.json(registration);
}
