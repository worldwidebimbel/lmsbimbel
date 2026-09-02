import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { logAudit } from "@/lib/audit";

const profileSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
  isActive: true,
  createdAt: true,
  defaultBranchId: true,
  profile: {
    select: {
      phone: true,
      address: true,
      birthDate: true,
      birthPlace: true,
      gender: true,
      religion: true,
      nationality: true,
      nisn: true,
      nik: true,
      schoolName: true,
      gradeLevel: true,
      educationHistory: true,
      parentName: true,
      parentPhone: true,
      bio: true,
      bloodType: true,
      hobbies: true,
      emergencyContact: true,
      socialLinks: true,
      profileComplete: true,
    },
  },
};

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: profileSelect,
  });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const {
    name,
    avatar,
    phone,
    address,
    birthDate,
    birthPlace,
    gender,
    religion,
    nationality,
    nisn,
    nik,
    schoolName,
    gradeLevel,
    educationHistory,
    parentName,
    parentPhone,
    bio,
    bloodType,
    hobbies,
    emergencyContact,
    socialLinks,
    currentPassword,
    newPassword,
  } = body;

  const updateData: Record<string, unknown> = {};
  if (name?.trim()) updateData.name = name.trim();
  if (avatar !== undefined) updateData.avatar = avatar || null;

  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: "Password lama wajib diisi" }, { status: 400 });
    const user = await db.user.findUnique({ where: { id: session.user.id }, select: { password: true } });
    if (!user?.password) return NextResponse.json({ error: "Akun tidak menggunakan password" }, { status: 400 });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return NextResponse.json({ error: "Password lama salah" }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ error: "Password minimal 6 karakter" }, { status: 400 });
    updateData.password = await bcrypt.hash(newPassword, 10);
  }

  const profileFields = {
    phone: phone ?? null,
    address: address ?? null,
    birthDate: birthDate ? new Date(birthDate) : null,
    birthPlace: birthPlace ?? null,
    gender: gender ?? null,
    religion: religion ?? null,
    nationality: nationality ?? null,
    nisn: nisn ?? null,
    nik: nik ?? null,
    schoolName: schoolName ?? null,
    gradeLevel: gradeLevel ?? null,
    educationHistory: parseJson(educationHistory) ?? [],
    parentName: parentName ?? null,
    parentPhone: parentPhone ?? null,
    bio: bio ?? null,
    bloodType: bloodType ?? null,
    hobbies: hobbies ?? null,
    emergencyContact: parseJson(emergencyContact) ?? {},
    socialLinks: parseJson(socialLinks) ?? {},
    profileComplete: computeProfileComplete({
      phone, address, birthDate, birthPlace, gender, religion, nationality,
      schoolName, gradeLevel, bio,
    }),
  };

  await db.userProfile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...profileFields },
    update: profileFields,
  });
  await logAudit({ entity: "UserProfile", entityId: session.user.id, action: "UPSERT", after: { userId: session.user.id, profileComplete: profileFields.profileComplete } });

  const hasUserChanges = Object.keys(updateData).length > 0;

  let updated;
  if (hasUserChanges) {
    updated = await db.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: profileSelect,
    });
    await logAudit({ entity: "User", entityId: session.user.id, action: "UPDATE", after: { fields: Object.keys(updateData), passwordChanged: Boolean(updateData.password) } });
  } else {
    updated = await db.user.findUnique({
      where: { id: session.user.id },
      select: profileSelect,
    });
  }
  return NextResponse.json(updated);
}

function parseJson(value: unknown): unknown {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  return value;
}

function computeProfileComplete(fields: Record<string, unknown>) {
  const required = ["phone", "address", "birthDate", "birthPlace", "gender"];
  return required.every((key) => {
    const value = fields[key];
    return value !== undefined && value !== null && value !== "";
  });
}
