import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isSameOrigin, jsonError, readJson } from "@/lib/http";
import { studyItemPatchSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  if (!isSameOrigin(request)) return jsonError("Request origin is not allowed.", 403);
  const user = await getSessionUser();
  if (!user) return jsonError("Sign in to update study items.", 401);
  const { id } = await context.params;
  const body = await readJson(request);
  if (!body.ok) return jsonError(body.error, 400);
  const parsed = studyItemPatchSchema.safeParse(body.data);
  if (!parsed.success) return jsonError("Enter valid study item fields.", 400);
  if (!Object.keys(parsed.data).length) return jsonError("Provide a field to update.", 400);
  const existing = await db.studyItem.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!existing) return jsonError("Study item not found.", 404);
  const item = await db.studyItem.update({
    where: { id },
    data: {
      ...parsed.data,
      ...(parsed.data.dueAt !== undefined ? { dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null } : {}),
    },
  });
  return NextResponse.json({ item });
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!isSameOrigin(request)) return jsonError("Request origin is not allowed.", 403);
  const user = await getSessionUser();
  if (!user) return jsonError("Sign in to delete study items.", 401);
  const { id } = await context.params;
  const result = await db.studyItem.deleteMany({ where: { id, userId: user.id } });
  if (!result.count) return jsonError("Study item not found.", 404);
  return NextResponse.json({ ok: true });
}
