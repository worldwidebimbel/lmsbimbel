import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { advanceCommissionStatus } from "@/lib/commission";
import { hash } from "bcryptjs";
import { notifyCredentials, notifyPPDBStatus } from "@/lib/ppdb-notifications";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const registration = await db.registration.findUnique({
    where: { id },
    include: {
      program: { select: { id: true, name: true, price: true } },
      branch: { select: { id: true, name: true } },
    },
  });

  if (!registration) {
    return NextResponse.json({ error: "Pendaftaran tidak ditemukan" }, { status: 404 });
  }

  if (registration.convertedUserId) {
    return NextResponse.json(
      { error: "Pendaftaran ini sudah dikonversi" },
      { status: 409 }
    );
  }

  if (registration.status !== "CLASS_PLACEMENT" && registration.status !== "ACCEPTED") {
    return NextResponse.json(
      { error: "Status harus ACCEPTED atau CLASS_PLACEMENT untuk konversi" },
      { status: 400 }
    );
  }

  try {
    const result = await db.$transaction(async (tx) => {
      const tempPassword = Math.random().toString(36).slice(2, 10);
      const hashedPassword = await hash(tempPassword, 10);

      const studentEmail =
        registration.email ||
        `${registration.fullName.toLowerCase().replace(/\s+/g, ".")}.${Date.now().toString(36)}@ww-edu.com`;

      const existingStudent = await tx.user.findFirst({
        where: { email: studentEmail },
      });

      let studentUser;
      if (existingStudent) {
        studentUser = existingStudent;
      } else {
        studentUser = await tx.user.create({
          data: {
            name: registration.fullName,
            email: studentEmail,
            password: hashedPassword,
            role: "SISWA",
            defaultBranchId: registration.branchId,
          },
        });

        await tx.userProfile.create({
          data: {
            userId: studentUser.id,
            nik: registration.nik,
            phone: registration.whatsapp,
            address: registration.address,
            birthPlace: registration.birthPlace,
            birthDate: registration.birthDate,
            gender: registration.gender,
            schoolName: registration.schoolName,
            gradeLevel: registration.gradeLevel,
            parentName: registration.parentName,
            parentPhone: registration.parentPhone,
            studentStatus: "AKTIF",
          },
        });
      }

      if (registration.parentName && registration.parentPhone) {
        const parentEmail =
          registration.parentEmail ||
          `parent.${registration.fullName.toLowerCase().replace(/\s+/g, ".")}.${Date.now().toString(36)}@ww-edu.com`;

        let parentUser = await tx.user.findFirst({
          where: { email: parentEmail },
        });

        if (!parentUser) {
          const parentPassword = Math.random().toString(36).slice(2, 10);
          parentUser = await tx.user.create({
            data: {
              name: registration.parentName,
              email: parentEmail,
              password: await hash(parentPassword, 10),
              role: "ORANG_TUA",
              defaultBranchId: registration.branchId,
            },
          });
        }

        const existingRelation = await tx.parentChild.findFirst({
          where: { parentId: parentUser.id, childId: studentUser.id },
        });

        if (!existingRelation) {
          await tx.parentChild.create({
            data: {
              parentId: parentUser.id,
              childId: studentUser.id,
            },
          });
        }
      }

      if (registration.program && registration.program.price > 0) {
        await tx.invoice.create({
          data: {
            studentId: studentUser.id,
            branchId: registration.branchId,
            programId: registration.programId,
            amount: registration.program.price,
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            status: "UNPAID",
            note: `Invoice awal - PPDB ${registration.registrationNo}`,
          },
        });
      }

      if (registration.preferredClassId) {
        const existingEnrollment = await tx.classStudent.findFirst({
          where: {
            classId: registration.preferredClassId,
            studentId: studentUser.id,
          },
        });
        if (!existingEnrollment) {
          await tx.classStudent.create({
            data: {
              classId: registration.preferredClassId,
              studentId: studentUser.id,
            },
          });
        }
      }

      const updated = await tx.registration.update({
        where: { id },
        data: {
          status: "ACTIVE_STUDENT",
          convertedUserId: studentUser.id,
          convertedAt: new Date(),
        },
      });

      await tx.registrationStatusLog.create({
        data: {
          registrationId: id,
          fromStatus: registration.status,
          toStatus: "ACTIVE_STUDENT",
          note: "Konversi otomatis ke siswa aktif",
          actorId: session.user.id,
        },
      });

      return { updated, studentUser, tempPassword };
    });

    await logAudit({
      action: "CONVERT_STUDENT",
      entity: "Registration",
      entityId: id,
      after: { convertedUserId: result.studentUser.id, status: "ACTIVE_STUDENT" },
    });

    // Advance affiliate commission to VALID (payment verification is separate)
    await advanceCommissionStatus({
      registrationId: id,
      trigger: "CONVERTED",
    });

    // Send credentials and status notification
    const loginUrl = `${process.env.NEXTAUTH_URL || ""}/login`;
    await notifyCredentials({
      email: result.studentUser.email,
      whatsapp: registration.whatsapp,
      name: registration.fullName,
      loginEmail: result.studentUser.email,
      tempPassword: result.tempPassword,
      loginUrl,
    });

    await notifyPPDBStatus({
      email: registration.email,
      whatsapp: registration.whatsapp,
      name: registration.fullName,
      registrationNo: registration.registrationNo,
      fromStatus: registration.status,
      toStatus: "ACTIVE_STUDENT",
      note: "Selamat! Anda kini siswa aktif EduBimbel.",
    });

    return NextResponse.json({
      success: true,
      studentId: result.studentUser.id,
      studentEmail: result.studentUser.email,
      tempPassword: result.tempPassword,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json(
      { error: "Gagal konversi siswa", details: message },
      { status: 500 }
    );
  }
}
