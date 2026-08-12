import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const faqs = await db.siteFaq.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(faqs);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { question, answer, category, order } = body;

  if (!question || !answer) {
    return NextResponse.json({ error: "question dan answer wajib diisi" }, { status: 400 });
  }

  const faq = await db.siteFaq.create({
    data: {
      question,
      answer,
      category: category ?? "Umum",
      order: Number(order ?? 0),
    },
  });

  return NextResponse.json(faq, { status: 201 });
}
