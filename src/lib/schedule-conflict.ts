import { db } from "@/lib/db";

export type ConflictType =
  | "TEACHER_DOUBLE_BOOKED"
  | "ROOM_DOUBLE_BOOKED"
  | "CLASS_DOUBLE_BOOKED"
  | "ROOM_OVER_CAPACITY";

export type ScheduleConflict = {
  type: ConflictType;
  message: string;
  conflictWith: {
    scheduleId: string;
    className: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  };
};

export type ConflictCheckResult = {
  hasConflict: boolean;
  conflicts: ScheduleConflict[];
};

type TimeOverlap = {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  excludeScheduleId?: string;
  startDate?: Date | null;
  endDate?: Date | null;
};

function timesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA < endB && startB < endA;
}

function dateRangesOverlap(
  startA: Date | null | undefined,
  endA: Date | null | undefined,
  startB: Date | null | undefined,
  endB: Date | null | undefined
): boolean {
  if (!startA && !endA && !startB && !endB) return true;
  const sA = startA ?? new Date(0);
  const eA = endA ?? new Date(8640000000000000);
  const sB = startB ?? new Date(0);
  const eB = endB ?? new Date(8640000000000000);
  return sA < eB && sB < eA;
}

export async function checkScheduleConflict(
  params: TimeOverlap & {
    classId: string;
    teacherId?: string | null;
    roomId?: string | null;
    classStudentCount?: number;
  }
): Promise<ConflictCheckResult> {
  const {
    dayOfWeek,
    startTime,
    endTime,
    excludeScheduleId,
    startDate,
    endDate,
    classId,
    teacherId,
    roomId,
    classStudentCount,
  } = params;

  const conflicts: ScheduleConflict[] = [];

  const whereClause: Record<string, unknown> = {
    dayOfWeek: dayOfWeek as string,
    id: { not: excludeScheduleId ?? undefined },
    OR: [
      { startDate: null, endDate: null },
      ...(startDate
        ? [{ endDate: { gte: startDate } }, { startDate: { lte: endDate ?? undefined } }]
        : []),
      { startDate: { lte: endDate ?? undefined } },
    ],
  };

  const candidateSchedules = await db.schedule.findMany({
    where: {
      dayOfWeek: dayOfWeek as never,
      id: { not: excludeScheduleId ?? undefined },
      class: { isActive: true },
    },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          teacherId: true,
          maxStudents: true,
          roomId: true,
        },
      },
    },
  });

  const overlapping = candidateSchedules.filter(
    (s) =>
      timesOverlap(startTime, endTime, s.startTime, s.endTime) &&
      dateRangesOverlap(startDate, endDate, s.startDate, s.endDate)
  );

  for (const s of overlapping) {
    const conflictInfo = {
      scheduleId: s.id,
      className: s.class.name,
      dayOfWeek: s.dayOfWeek as string,
      startTime: s.startTime,
      endTime: s.endTime,
    };

    if (teacherId && s.class.teacherId === teacherId) {
      conflicts.push({
        type: "TEACHER_DOUBLE_BOOKED",
        message: `Tutor sudah mengajar kelas "${s.class.name}" di hari & jam yang sama.`,
        conflictWith: conflictInfo,
      });
    }

    if (roomId && s.class.roomId === roomId) {
      conflicts.push({
        type: "ROOM_DOUBLE_BOOKED",
        message: `Ruangan sudah dipakai kelas "${s.class.name}" di hari & jam yang sama.`,
        conflictWith: conflictInfo,
      });
    }

    if (s.classId === classId) {
      conflicts.push({
        type: "CLASS_DOUBLE_BOOKED",
        message: `Kelas "${s.class.name}" sudah memiliki jadwal di hari & jam yang sama.`,
        conflictWith: conflictInfo,
      });
    }
  }

  if (roomId && classStudentCount !== undefined) {
    const room = await db.room.findUnique({
      where: { id: roomId },
      select: { capacity: true, name: true },
    });
    if (room && classStudentCount > room.capacity) {
      conflicts.push({
        type: "ROOM_OVER_CAPACITY",
        message: `Jumlah siswa (${classStudentCount}) melebihi kapasitas ruangan "${room.name}" (${room.capacity}).`,
        conflictWith: {
          scheduleId: "",
          className: "",
          dayOfWeek,
          startTime,
          endTime,
        },
      });
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}
