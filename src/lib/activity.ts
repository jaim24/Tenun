import { prisma } from "./db";

type LogType =
  | "DISPATCH"
  | "REPLY"
  | "SEARCH"
  | "KEYWORD"
  | "QUOTA"
  | "SYSTEM"
  | "ERROR"
  | "CRON"
  | "AUTH"
  | "CONFIG"
  | "AI"
  | "AFFILIATE";

export async function logActivity(type: LogType, message: string, meta?: Record<string, unknown>) {
  try {
    await prisma.activityLog.create({
      data: { type, message, meta: meta ? JSON.stringify(meta) : null },
    });
  } catch (e) {
    console.error("[activity-log]", e);
  }
}