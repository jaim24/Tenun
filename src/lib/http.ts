import { NextResponse } from "next/server";
import { SessionError, requireSessionUser } from "./auth";
import { prisma } from "./db";
import { OAuthConfigError, ApiError } from "./threads";
import { getCronSecret } from "./config";

export function ok(data?: Record<string, unknown>, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export async function readJson(req: Request): Promise<any> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}

export async function isCronAuthorized(req: Request): Promise<boolean> {
  const expected = await getCronSecret();
  const auth = req.headers.get("authorization") ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  const token =
    new URL(req.url).searchParams.get("token") ??
    req.headers.get("x-cron-secret") ??
    bearer;
  if (!token) return false;
  return token === expected;
}

export function handleRoute<T>(fn: (req: Request, ctx: any) => Promise<T | NextResponse> | T | NextResponse) {
  return async (req: Request, ctx: any) => {
    try {
      const result = await fn(req, ctx);
      return result instanceof NextResponse ? result : ok(result as Record<string, unknown>);
    } catch (e) {
      if (e instanceof SessionError) return e.response;
      if (e instanceof OAuthConfigError) return fail(e.message, 500, { code: "OAUTH_CONFIG" });
      if (e instanceof ApiError) {
        return fail(e.message, e.status ?? 400, { code: e.code ?? "THREADS_API" });
      }
      console.error("[tenun-error]", e);
      const message = e instanceof Error ? e.message : "Terjadi kesalahan internal";
      return fail("Gagal memproses permintaan", 500, { detail: message });
    }
  };
}

export async function authed(req: Request) {
  await requireSessionUser();
  void req;
  return prisma;
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));