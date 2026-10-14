import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    aiConfigured: Boolean(process.env.AI_API_KEY),
    emailConfigured: Boolean(
      process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASSWORD &&
        process.env.SMTP_FROM &&
        process.env.APP_URL,
    ),
    databaseConfigured: Boolean(process.env.DATABASE_URL),
    sessionConfigured: Boolean(process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32),
  });
}
