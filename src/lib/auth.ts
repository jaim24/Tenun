import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySessionToken, createSessionToken, sessionCookieOptions, SESSION_COOKIE } from "./session";
import { getManagedValue } from "./config";

export { SESSION_COOKIE, sessionCookieOptions, createSessionToken };

export async function verifyCredentials(email: string, password: string): Promise<boolean> {
  const adminEmail = (await getManagedValue("ADMIN_EMAIL")) ?? process.env.ADMIN_EMAIL ?? "admin@tenun.id";
  const adminPassword = (await getManagedValue("ADMIN_PASSWORD")) ?? process.env.ADMIN_PASSWORD ?? "tenun";
  return email.trim().toLowerCase() === adminEmail.trim().toLowerCase() && password === adminPassword;
}

export async function getSessionUser(): Promise<{ email: string } | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function requireSessionUser(): Promise<{ email: string }> {
  const user = await getSessionUser();
  if (!user) {
    const res = NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    res.cookies.delete(SESSION_COOKIE);
    throw new SessionError(res);
  }
  return user;
}

export class SessionError extends Error {
  constructor(public readonly response: NextResponse) {
    super("Unauthorized");
  }
}