import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isSameOrigin, jsonError, readJson } from "@/lib/http";
import { z } from "zod";

const roleUpdateSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["USER", "ADMIN"]),
});

export async function GET() {
  const admin = await getSessionUser();
  if (!admin || admin.role !== "ADMIN") return jsonError("Administrator access is required.", 403);

  const [users, userCount, studyItems, recentUsage, recentContacts] = await Promise.all([
    db.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, name: true, email: true, role: true, createdAt: true, _count: { select: { studyItems: true } } },
    }),
    db.user.count(),
    db.studyItem.count(),
    db.usageEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true, tool: true, createdAt: true, user: { select: { email: true } } },
    }),
    db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 30 }),
  ]);
  return NextResponse.json({ users, stats: { userCount, studyItems, recentUsage: recentUsage.length }, recentUsage, recentContacts });
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Request origin is not allowed.", 403);
  const admin = await getSessionUser();
  if (!admin || admin.role !== "ADMIN") return jsonError("Administrator access is required.", 403);
  const body = await readJson(request);
  if (!body.ok) return jsonError(body.error, 400);
  const parsed = roleUpdateSchema.safeParse(body.data);
  if (!parsed.success) return jsonError("Provide a valid user and role.", 400);
  if (parsed.data.userId === admin.id && parsed.data.role !== "ADMIN") {
    return jsonError("You cannot remove your own administrator access.", 400);
  }
  const updated = await db.user.updateMany({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role },
  });
  if (!updated.count) return jsonError("User not found.", 404);
  return NextResponse.json({ ok: true });
}
