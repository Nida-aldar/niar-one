import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { jsonError } from "@/lib/http";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("Sign in to view your dashboard.", 401);

  const [notes, tasks, completedTasks, flashcards, recentUsage] = await Promise.all([
    db.studyItem.count({ where: { userId: user.id, type: "NOTE" } }),
    db.studyItem.count({ where: { userId: user.id, type: "TASK" } }),
    db.studyItem.count({ where: { userId: user.id, type: "TASK", completed: true } }),
    db.studyItem.count({ where: { userId: user.id, type: "FLASHCARD" } }),
    db.usageEvent.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, tool: true, createdAt: true },
    }),
  ]);

  return NextResponse.json({ user, stats: { notes, tasks, completedTasks, flashcards }, recentUsage });
}
