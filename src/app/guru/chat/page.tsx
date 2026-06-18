import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import ChatInterface from "@/components/chat/ChatInterface";
import { MessageSquare } from "lucide-react";

export const metadata = { title: "Chat" };

export default async function GuruChatPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "GURU") redirect("/guru");

  const classes = await db.class.findMany({
    where: { teacherId: session.user.id, isActive: true },
    include: { students: { include: { student: { select: { id: true, name: true, avatar: true, role: true } } } } },
  });

  const studentMap = new Map<string, { id: string; name: string; avatar: string | null; role: string }>();
  for (const cls of classes) {
    for (const cs of cls.students) studentMap.set(cs.studentId, cs.student);
  }
  const contacts = Array.from(studentMap.values());

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <MessageSquare className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chat dengan Siswa</h1>
          <p className="text-sm text-gray-500">Diskusi langsung dengan siswamu</p>
        </div>
      </div>
      <ChatInterface
        currentUserId={session.user.id}
        initialContacts={JSON.parse(JSON.stringify(contacts))}
      />
    </div>
  );
}
