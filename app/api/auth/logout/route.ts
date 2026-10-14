import { NextResponse } from "next/server";
import { clearSession, getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isSameOrigin, jsonError } from "@/lib/http";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Request origin is not allowed.", 403);
  const user = await getSessionUser();
  if (user) await db.user.update({ where: { id: user.id }, data: { sessionVersion: { increment: 1 } } });
  await clearSession();
  return NextResponse.json({ ok: true });
}
