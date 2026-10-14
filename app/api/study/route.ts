import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isSameOrigin, jsonError, readJson } from "@/lib/http";
import { studyItemSchema } from "@/lib/validation";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return jsonError("Sign in to access your saved study items.", 401);
  const items = await db.studyItem.findMany({
    where: { userId: user.id },
    orderBy: [{ dueAt: "asc" }, { updatedAt: "desc" }],
  });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Request origin is not allowed.", 403);
  const user = await getSessionUser();
  if (!user) return jsonError("Sign in to save study items.", 401);
  const body = await readJson(request);
  if (!body.ok) return jsonError(body.error, 400);
  const parsed = studyItemSchema.safeParse(body.data);
  if (!parsed.success) return jsonError("Enter a valid item type and a title up to 160 characters.", 400);

  const item = await db.studyItem.create({
    data: {
      userId: user.id,
      ...parsed.data,
      dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
    },
  });
  return NextResponse.json({ item }, { status: 201 });
}
