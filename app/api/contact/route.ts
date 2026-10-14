import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { isSameOrigin, jsonError, rateLimit, readJson } from "@/lib/http";
import { emailSchema } from "@/lib/validation";
import { z } from "zod";

const messageSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: emailSchema,
  subject: z.string().trim().min(1).max(120),
  message: z.string().trim().min(10).max(5000),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Request origin is not allowed.", 403);
  const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`contact:${ip}`, 5, 60 * 60 * 1000)) {
    return jsonError("Too many messages. Try again later.", 429);
  }
  const body = await readJson(request);
  if (!body.ok) return jsonError(body.error, 400);
  const parsed = messageSchema.safeParse(body.data);
  if (!parsed.success) return jsonError("Complete all contact fields with a valid email and a message of at least 10 characters.", 400);
  await db.contactMessage.create({ data: parsed.data });
  return NextResponse.json({ message: "Your message was saved. Thank you for getting in touch." }, { status: 201 });
}
