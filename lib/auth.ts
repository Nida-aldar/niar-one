import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";

const COOKIE_NAME = "niar_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

function sessionKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must be configured with at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId }, select: { sessionVersion: true } });
  if (!user) throw new Error("Cannot create a session for a missing account.");
  const token = await new SignJWT({ sub: userId, ver: user.sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(sessionKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  let userId: string;
  let sessionVersion: number;
  try {
    const { payload } = await jwtVerify(token, sessionKey(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.ver !== "number") return null;
    userId = payload.sub;
    sessionVersion = payload.ver;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("SESSION_SECRET")) throw error;
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, createdAt: true, sessionVersion: true },
  });
  if (!user || user.sessionVersion !== sessionVersion) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt };
}

export async function requireUser() {
  return getSessionUser();
}

export async function requireAdmin() {
  const user = await getSessionUser();
  return user?.role === "ADMIN" ? user : null;
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
