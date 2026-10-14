import { NextResponse } from "next/server";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

type JsonReadResult = { ok: true; data: unknown } | { ok: false; error: string };

export async function readJson(request: Request, maxBytes = 24_000): Promise<JsonReadResult> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxBytes) return { ok: false, error: "Request body is too large." };
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) {
    return { ok: false, error: "Request body is too large." };
  }
  try {
    return { ok: true, data: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, error: "Request body must contain valid JSON." };
  }
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const store = globalThis as typeof globalThis & {
    __niarRateLimit?: Map<string, { count: number; resetAt: number }>;
  };
  const entries = (store.__niarRateLimit ??= new Map());
  const current = entries.get(key);
  if (!current || current.resetAt <= now) {
    entries.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}
