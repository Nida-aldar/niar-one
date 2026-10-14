import { randomBytes } from "node:crypto";
import nodemailer from "nodemailer";
import { NextResponse } from "next/server";
import { hashToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { isSameOrigin, jsonError, rateLimit, readJson } from "@/lib/http";
import { emailSchema } from "@/lib/validation";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Request origin is not allowed.", 403);
  const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`password-reset:${ip}`, 5, 60 * 60 * 1000)) {
    return jsonError("Too many reset requests. Try again later.", 429);
  }
  const emailConfigured = Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      process.env.SMTP_FROM &&
      process.env.APP_URL,
  );
  if (!emailConfigured) {
    return jsonError("Password reset email is unavailable until SMTP is configured.", 503);
  }

  let resetUrl: URL;
  try {
    resetUrl = new URL("/reset-password", process.env.APP_URL);
  } catch {
    return jsonError("APP_URL must be a valid public application URL to send password reset links.", 503);
  }
  if (resetUrl.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && resetUrl.hostname === "localhost")) {
    return jsonError("APP_URL must use HTTPS for password reset email.", 503);
  }

  const body = await readJson(request);
  if (!body.ok) return jsonError(body.error, 400);
  const parsed = emailSchema.safeParse((body.data as { email?: unknown })?.email);
  if (!parsed.success) return jsonError("Enter a valid email address.", 400);

  const user = await db.user.findUnique({ where: { email: parsed.data }, select: { id: true, email: true } });
  if (user) {
    const token = randomBytes(32).toString("base64url");
    await db.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
    await db.passwordResetToken.create({
      data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 30 * 60 * 1000) },
    });

    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT || 587) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
    resetUrl.searchParams.set("token", token);
    try {
      await transport.sendMail({
        from: process.env.SMTP_FROM,
        to: user.email,
        subject: "Reset your NIAR One password",
        text: `Use this link within 30 minutes to reset your NIAR One password: ${resetUrl.toString()}`,
      });
    } catch (error) {
      await db.passwordResetToken.deleteMany({ where: { tokenHash: hashToken(token) } });
      console.error("Password reset email delivery failed.", error);
      return jsonError("The reset email could not be delivered. Check the mail service configuration.", 502);
    }
  }

  return NextResponse.json({ message: "If an account exists for that email, a reset link has been sent." });
}
