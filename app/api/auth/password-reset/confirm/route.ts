import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { hashToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { isSameOrigin, jsonError, rateLimit, readJson } from "@/lib/http";
import { passwordSchema } from "@/lib/validation";
import { z } from "zod";

const schema = z.object({ token: z.string().min(32).max(128), password: passwordSchema });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Request origin is not allowed.", 403);
  const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`password-reset-confirm:${ip}`, 10, 60 * 60 * 1000)) {
    return jsonError("Too many reset attempts. Try again later.", 429);
  }
  const body = await readJson(request);
  if (!body.ok) return jsonError(body.error, 400);
  const parsed = schema.safeParse(body.data);
  if (!parsed.success) return jsonError("Enter a valid reset token and a password with at least 12 characters.", 400);

  const resetToken = await db.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(parsed.data.token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });
  if (!resetToken || resetToken.usedAt || resetToken.expiresAt <= new Date()) {
    return jsonError("This reset link is invalid or has expired.", 400);
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const redeemed = await db.$transaction(async (transaction) => {
    const now = new Date();
    const claimed = await transaction.passwordResetToken.updateMany({
      where: { id: resetToken.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) return false;
    await transaction.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash, sessionVersion: { increment: 1 } },
    });
    await transaction.passwordResetToken.deleteMany({
      where: { userId: resetToken.userId, id: { not: resetToken.id } },
    });
    return true;
  });
  if (!redeemed) return jsonError("This reset link is invalid or has expired.", 400);
  return NextResponse.json({ message: "Password updated. You can now log in." });
}
