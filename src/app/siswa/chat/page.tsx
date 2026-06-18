import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ChatInterface from "@/components/chat/ChatInterface";
import { MessageSquare } from "lucide-react";

export const metadata = { title: "Chat" };

export default async function SiswaChatPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") redirect("/siswa");

  const enrolled = await db.classStudent.findMany({
    where: { studentId: session.user.id },
    include: { class: { include: { teacher: { select: { id: true, name: true, avatar: true, role: true } } } } },
  });

  const teacherMap = new Map(enrolled.map((e) => [e.class.teacherId, e.class.teacher]));
  const contacts = Array.from(teacherMap.values());

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <MessageSquare className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chat dengan Guru</h1>
          <p className="text-sm text-gray-500">Diskusi langsung dengan guru kelasmu</p>
        </div>
      </div>
      <ChatInterface
        currentUserId={session.user.id}
        initialContacts={JSON.parse(JSON.stringify(contacts))}
      />
    </div>
  );
}
