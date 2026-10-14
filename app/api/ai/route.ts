import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { isSameOrigin, jsonError, rateLimit, readJson } from "@/lib/http";
import { z } from "zod";

const schema = z.object({
  tool: z.enum(["chat", "summarize", "email", "rewrite", "ideas", "notes"]),
  input: z.string().trim().min(1).max(12000),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(4000),
  })).max(12).optional(),
});

const instructions: Record<z.infer<typeof schema>["tool"], string> = {
  chat: "You are NIAR AI, a clear, helpful assistant. Be accurate and say when you are uncertain.",
  summarize: "Summarize the supplied text. Preserve important facts and make no unsupported claims.",
  email: "Write a concise, professional email based on the user's request. Include a subject line.",
  rewrite: "Rewrite the supplied text for clarity while preserving its meaning.",
  ideas: "Generate a useful, varied list of ideas that directly addresses the user's brief.",
  notes: "Turn the supplied material into structured study notes with headings and key takeaways.",
};

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return jsonError("Request origin is not allowed.", 403);
  const ip = request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for") ?? "unknown";
  if (!rateLimit(`ai:${ip}`, 12, 60 * 60 * 1000)) {
    return jsonError("AI usage limit reached. Try again later.", 429);
  }
  if (!process.env.AI_API_KEY) {
    return jsonError("AI is not configured. Set AI_API_KEY on the server to enable generation.", 503);
  }
  const body = await readJson(request);
  if (!body.ok) return jsonError(body.error, 400);
  const parsed = schema.safeParse(body.data);
  if (!parsed.success) return jsonError("Choose an AI tool and enter text (up to 12,000 characters).", 400);

  const configuredUrl = process.env.AI_API_URL || "https://api.openai.com/v1/chat/completions";
  let apiUrl: URL;
  try {
    apiUrl = new URL(configuredUrl);
  } catch {
    return jsonError("AI_API_URL must be a valid HTTPS endpoint.", 503);
  }
  if (apiUrl.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && apiUrl.hostname === "localhost")) {
    return jsonError("AI_API_URL must use HTTPS.", 503);
  }

  const user = await getSessionUser();
  const history = parsed.data.history ?? [];
  const messages = [
    { role: "system", content: instructions[parsed.data.tool] },
    ...history.map(({ role, content }) => ({ role, content })),
    { role: "user", content: parsed.data.input },
  ];
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.AI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      messages,
      max_tokens: 1500,
    }),
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });
  if (!response.ok) {
    console.error("Configured AI provider returned an error.", response.status);
    return jsonError("The configured AI service could not complete this request. Check the server logs or try later.", 502);
  }
  const result: unknown = await response.json();
  const output = z.object({
    choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1),
  }).safeParse(result);
  if (!output.success) {
    console.error("Configured AI provider returned an unexpected response.");
    return jsonError("The configured AI service returned an unsupported response.", 502);
  }
  const text = output.data.choices[0].message.content.trim();
  if (!text) return jsonError("The configured AI service returned an empty response.", 502);
  if (user) await db.usageEvent.create({ data: { userId: user.id, tool: `ai-${parsed.data.tool}` } });
  return NextResponse.json({ text });
}
