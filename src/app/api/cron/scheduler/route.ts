import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendNotificationFromTemplate, sendInAppNotification } from "@/lib/notification-helper";
import { ScheduleDay } from "@prisma/client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const DAY_MAP: Record<number, ScheduleDay> = {
  0: ScheduleDay.MINGGU,
  1: ScheduleDay.SENIN,
  2: ScheduleDay.SELASA,
  3: ScheduleDay.RABU,
  4: ScheduleDay.KAMIS,
  5: ScheduleDay.JUMAT,
  6: ScheduleDay.SABTU,
};

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { paymentReminders: 0, tunggakanUpdates: 0, scheduleReminders: 0, tutorAlphaAlerts: 0, missingJournalAlerts: 0, errors: [] as string[] };

  try {
    const now = new Date();
    const in3Days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const in1Day = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

    const overdueInvoices = await db.invoice.findMany({
      where: {
        status: { in: ["UNPAID", "OVERDUE"] },
        dueDate: { in: [in3Days, in1Day, yesterday] },
      },
      include: {
        student: { select: { id: true, name: true, email: true, profile: { select: { phone: true } } } },
        plan: { select: { name: true } },
      },
    });

    for (const inv of overdueInvoices) {
      const daysDiff = Math.round((inv.dueDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      const label = daysDiff > 0 ? `H-${daysDiff}` : `H+${Math.abs(daysDiff)}`;
      const phone = inv.student?.profile?.phone ?? inv.student?.email ?? "";

      try {
        await sendNotificationFromTemplate(
          "PAYMENT_REMINDER",
          phone,
          {
            nama: inv.student?.name ?? "",
            jumlah: inv.amount.toLocaleString("id-ID"),
            jatuhTempo: inv.dueDate.toLocaleDateString("id-ID"),
            label,
            nomorInvoice: inv.id,
          },
          inv.studentId,
        );
        results.paymentReminders++;
      } catch (e) {
        results.errors.push(`Payment reminder ${inv.id}: ${(e as Error).message}`);
      }
    }

    const overdueToUpdate = await db.invoice.findMany({
      where: {
        status: "UNPAID",
        dueDate: { lt: now },
      },
      select: { id: true, studentId: true },
    });

    for (const inv of overdueToUpdate) {
      await db.invoice.update({ where: { id: inv.id }, data: { status: "OVERDUE" } });
      results.tunggakanUpdates++;
    }

    const todayDay = DAY_MAP[now.getDay()];
    const todaySchedules = await db.schedule.findMany({
      where: { dayOfWeek: todayDay },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            students: { select: { studentId: true } },
          },
        },
      },
    });

    for (const sched of todaySchedules) {
      for (const cs of sched.class.students) {
        try {
          await sendInAppNotification(
            cs.studentId,
            "Reminder Jadwal Kelas",
            `Kelas ${sched.class.name} hari ini pukul ${sched.startTime} - ${sched.endTime}`,
          );
          results.scheduleReminders++;
        } catch (e) {
          results.errors.push(`Schedule reminder ${cs.studentId}: ${(e as Error).message}`);
        }
      }
    }

    const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayTeacherAttendance = await db.teacherAttendance.findMany({
      where: { date: todayDateOnly, status: "TIDAK_HADIR" },
      select: { teacherId: true, classId: true },
    });

    const adminUsers = await db.user.findMany({
      where: { role: { in: ["SUPER_ADMIN", "ADMIN", "ADMIN_AKADEMIK"] }, isActive: true },
      select: { id: true },
    });

    for (const att of todayTeacherAttendance) {
      const teacher = await db.user.findUnique({ where: { id: att.teacherId }, select: { name: true } });
      for (const admin of adminUsers) {
        try {
          await sendInAppNotification(
            admin.id,
            "Tutor Tidak Hadir",
            `Tutor ${teacher?.name ?? "Unknown"} tercatat TIDAK HADIR hari ini.`,
          );
          results.tutorAlphaAlerts++;
        } catch (e) {
          results.errors.push(`Alpha alert: ${(e as Error).message}`);
        }
      }
    }

    const yesterdayDate = new Date(todayDateOnly.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayDay = DAY_MAP[yesterdayDate.getDay()];
    const yesterdaySchedules = await db.schedule.findMany({
      where: { dayOfWeek: yesterdayDay },
      include: { class: { select: { id: true, name: true, teacherId: true } } },
    });

    for (const sched of yesterdaySchedules) {
      const existingJournal = await db.teachingJournal.findFirst({
        where: { classId: sched.classId, sessionDate: yesterdayDate },
        select: { id: true },
      });

      if (!existingJournal) {
        const teacher = await db.user.findUnique({ where: { id: sched.class.teacherId ?? "" }, select: { name: true } });
        for (const admin of adminUsers) {
          try {
            await sendInAppNotification(
              admin.id,
              "Jurnal Mengajar Belum Diisi",
              `Tutor ${teacher?.name ?? "Unknown"} belum mengisi jurnal untuk kelas ${sched.class.name} tanggal ${yesterdayDate.toLocaleDateString("id-ID")}.`,
            );
            results.missingJournalAlerts++;
          } catch (e) {
            results.errors.push(`Journal alert: ${(e as Error).message}`);
          }
        }
      }
    }
  } catch (e) {
    results.errors.push(`Fatal: ${(e as Error).message}`);
  }

  return NextResponse.json(results);
}
