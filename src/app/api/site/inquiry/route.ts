import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, phone, email, program, message } = body;

  if (!name || !phone) {
    return NextResponse.json({ error: "Nama dan nomor HP wajib diisi" }, { status: 400 });
  }

  const inquiry = await db.siteInquiry.create({
    data: { name, phone, email: email || null, program: program || null, message: message || null },
  });

  return NextResponse.json({ success: true, id: inquiry.id }, { status: 201 });
}
