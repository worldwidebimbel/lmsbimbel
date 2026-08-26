import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/permission";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { DoorOpen, Building2, Plus } from "lucide-react";
import { RoomsManager } from "@/components/admin/RoomsManager";

export const metadata = { title: "Gedung & Ruangan" };

export default async function RoomsPage() {
  const session = await auth();
  if (!session?.user || !isAdminRole(session.user.role)) {
    redirect("/admin");
  }

  const [buildings, rooms, branches] = await Promise.all([
    db.building.findMany({
      include: {
        _count: { select: { rooms: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.room.findMany({
      include: {
        building: { select: { id: true, name: true } },
        _count: { select: { classes: true, schedules: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.branch.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gedung & Ruangan</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Kelola gedung, ruangan, kapasitas, dan fasilitas
          </p>
        </div>
      </div>

      <RoomsManager
        initialBuildings={buildings}
        initialRooms={rooms}
        branches={branches}
        isSuperAdmin={session.user.role === "SUPER_ADMIN"}
      />
    </div>
  );
}
