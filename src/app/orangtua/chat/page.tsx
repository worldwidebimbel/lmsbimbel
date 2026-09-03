import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import ChatInterface from "@/components/chat/ChatInterface";

export const metadata = { title: "Chat dengan Guru" };

export default async function OrangtuaChatPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORANG_TUA") redirect("/orangtua");

  const children = await db.parentChild.findMany({
    where: { parentId: session.user.id },
    select: { childId: true },
  });
  const childIds = children.map((c) => c.childId);

  const enrolled = await db.classStudent.findMany({
    where: { studentId: { in: childIds } },
    include: { class: { include: { teacher: { select: { id: true, name: true, avatar: true, role: true } } } } },
  });

  const teacherMap = new Map(enrolled.map((e) => [e.class.teacherId, e.class.teacher]));
  const contacts = Array.from(teacherMap.values());

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <MessageSquare className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chat dengan Guru</h1>
          <p className="text-sm text-gray-500">Komunikasi langsung dengan guru anak Anda</p>
        </div>
      </div>

      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-16">
          <MessageSquare className="mb-3 h-10 w-10 text-gray-300" />
          <p className="text-sm text-gray-500">Belum ada guru yang terhubung.</p>
          <p className="text-xs text-gray-500 mt-1">Hubungkan akun anak terlebih dahulu.</p>
        </div>
      ) : (
        <ChatInterface currentUserId={session.user.id} initialContacts={JSON.parse(JSON.stringify(contacts))} />
      )}
    </div>
  );
}
