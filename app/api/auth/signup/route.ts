import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { jsonError, isSameOrigin, rateLimit, readJson } from "@/lib/http";
import { createAccountSchema } from "@/lib/validation";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Request origin is not allowed.", 403);
  const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`signup:${ip}`, 5, 60 * 60 * 1000)) {
    return jsonError("Too many sign-up attempts. Try again later.", 429);
  }

  const body = await readJson(request);
  if (!body.ok) return jsonError(body.error, 400);
  const parsed = createAccountSchema.safeParse(body.data);
  if (!parsed.success) return jsonError("Enter a name, a valid email, and a password with at least 12 characters.", 400);

  const exists = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (exists) return jsonError("An account with this email already exists.", 409);

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  let user: { id: string; name: string; email: string };
  try {
    user = await db.user.create({
      data: { name: parsed.data.name, email: parsed.data.email, passwordHash },
      select: { id: true, name: true, email: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError("An account with this email already exists.", 409);
    }
    throw error;
  }
  await createSession(user.id);
  return NextResponse.json({ user }, { status: 201 });
}
