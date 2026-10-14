import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isSameOrigin, jsonError, readJson } from "@/lib/http";
import { z } from "zod";

const profileSchema = z.object({ name: z.string().trim().min(1).max(80) });

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("Sign in to access account settings.", 401);
  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Request origin is not allowed.", 403);
  const user = await getSessionUser();
  if (!user) return jsonError("Sign in to update your account.", 401);
  const body = await readJson(request);
  if (!body.ok) return jsonError(body.error, 400);
  const parsed = profileSchema.safeParse(body.data);
  if (!parsed.success) return jsonError("Enter a display name no longer than 80 characters.", 400);
  const updatedUser = await db.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  return NextResponse.json({ user: updatedUser });
}
