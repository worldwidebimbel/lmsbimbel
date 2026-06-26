import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const target = await db.user.findUnique({
    where: { id },
    select: {
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
      enrolledClasses: {
        select: {
          class: { select: { id: true, name: true, subject: { select: { name: true } } } },
        },
      },
      taughtClasses: {
        select: { id: true, name: true, subject: { select: { name: true } } },
      },
    },
  });

  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const role = session.user.role;
  const isOwner = session.user.id === id;
  const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";
  const isTeacher = role === "GURU";
  const isParent = role === "ORANG_TUA";
  const isStudent = role === "SISWA";
  const targetRole = target.role;

  const canViewFull =
    isOwner ||
    isAdmin ||
    (isTeacher && (targetRole === "SISWA" || targetRole === "GURU")) ||
    (isParent && targetRole === "SISWA") ||
    (isStudent && targetRole === "GURU");

  const response = {
    id: target.id,
    name: target.name,
    role: target.role,
    avatar: target.avatar,
    bio: target.profile?.bio ?? null,
    schoolName: target.profile?.schoolName ?? null,
    gradeLevel: target.profile?.gradeLevel ?? null,
    profileComplete: target.profile?.profileComplete ?? false,
    joinedAt: target.createdAt,
    ...(canViewFull && {
      email: target.email,
      phone: target.profile?.phone ?? null,
      address: target.profile?.address ?? null,
      birthDate: target.profile?.birthDate ?? null,
      birthPlace: target.profile?.birthPlace ?? null,
      gender: target.profile?.gender ?? null,
      religion: target.profile?.religion ?? null,
      nationality: target.profile?.nationality ?? null,
      nisn: target.profile?.nisn ?? null,
      nik: target.profile?.nik ?? null,
      educationHistory: target.profile?.educationHistory ?? [],
      parentName: target.profile?.parentName ?? null,
      parentPhone: target.profile?.parentPhone ?? null,
      bloodType: target.profile?.bloodType ?? null,
      hobbies: target.profile?.hobbies ?? null,
      emergencyContact: target.profile?.emergencyContact ?? {},
      socialLinks: target.profile?.socialLinks ?? {},
      classes: targetRole === "SISWA"
        ? target.enrolledClasses.map((e) => e.class)
        : targetRole === "GURU"
          ? target.taughtClasses
          : [] as { id: string; name: string; subject: { name: string } | null }[],
    }),
  };

  return NextResponse.json(response);
}
