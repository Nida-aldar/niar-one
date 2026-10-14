import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { createSession } from "@/lib/auth";
import { jsonError, isSameOrigin, rateLimit, readJson } from "@/lib/http";
import { loginSchema } from "@/lib/validation";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Request origin is not allowed.", 403);
  const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
    return jsonError("Too many login attempts. Try again later.", 429);
  }

  const body = await readJson(request);
  if (!body.ok) return jsonError(body.error, 400);
  const parsed = loginSchema.safeParse(body.data);
  if (!parsed.success) return jsonError("Enter a valid email and password.", 400);

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return jsonError("Email or password is incorrect.", 401);
  }
  await createSession(user.id);
  return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}
