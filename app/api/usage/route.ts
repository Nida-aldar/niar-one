import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isSameOrigin, jsonError, readJson } from "@/lib/http";
import { z } from "zod";

const schema = z.object({ tool: z.enum(["utilities", "data-lab", "study"]) });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Request origin is not allowed.", 403);
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ ok: true });
  const body = await readJson(request, 1000);
  if (!body.ok) return jsonError(body.error, 400);
  const parsed = schema.safeParse(body.data);
  if (!parsed.success) return jsonError("Unknown tool.", 400);
  await db.usageEvent.create({ data: { userId: user.id, tool: parsed.data.tool } });
  return NextResponse.json({ ok: true }, { status: 201 });
}
