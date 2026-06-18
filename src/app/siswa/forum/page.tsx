import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { MessagesSquare } from "lucide-react";
import ForumClient from "@/components/forum/ForumClient";

export const metadata = { title: "Forum Diskusi" };

export default async function SiswaForumPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "SISWA") redirect("/siswa");

  const enrolled = await db.classStudent.findMany({
    where: { studentId: session.user.id },
    include: {
      class: { include: { subject: { select: { id: true, name: true, color: true } } } },
    },
  });

  const classIds = enrolled.map((e) => e.classId);

  const threads = await db.forumThread.findMany({
    where: { classId: { in: classIds } },
    include: {
      author: { select: { id: true, name: true, avatar: true, role: true } },
      class: { select: { id: true, name: true } },
      subject: { select: { id: true, name: true, color: true } },
      _count: { select: { replies: true, upvotes: true } },
    },
    orderBy: [{ isPinned: "desc" }, { updatedAt: "desc" }],
    take: 50,
  });

  const classes = enrolled.map((e) => ({ id: e.classId, name: e.class.name }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
          <MessagesSquare className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forum Diskusi</h1>
          <p className="text-sm text-gray-500">Diskusi, tanya jawab, dan berbagi ilmu</p>
        </div>
      </div>

      <ForumClient
        initialThreads={JSON.parse(JSON.stringify(threads))}
        classes={JSON.parse(JSON.stringify(classes))}
        currentUserId={session.user.id}
        currentUserRole={session.user.role}
      />
    </div>
  );
}
