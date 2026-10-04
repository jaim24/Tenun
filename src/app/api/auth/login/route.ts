import { createSessionToken, sessionCookieOptions, verifyCredentials } from "@/lib/auth";
import { ok, fail } from "@/lib/http";

// Rate limit sederhana per IP (in-memory per instance): maks 5 percobaan
// gagal per 5 menit. Di serverless multi-instance ini bukan pembatas sempurna,
// tapi menaikkan biaya brute-force secara signifikan.
const WINDOW_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() ?? "unknown";
}

/** Catat percobaan; true = sudah melebihi batas. */
function registerAttempt(ip: string): boolean {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now > rec.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  rec.count += 1;
  if (attempts.size > 2000) {
    for (const [k, v] of attempts) if (now > v.resetAt) attempts.delete(k);
  }
  return rec.count > MAX_ATTEMPTS;
}

export async function POST(req: Request) {
  try {
    const ip = clientIp(req);
    if (registerAttempt(ip)) {
      console.warn(`[tenun-login] rate limit terlampaui (IP ${ip})`);
      return fail("Terlalu banyak percobaan login. Coba lagi dalam 5 menit.", 429);
    }
    let body: { email?: string; password?: string } = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const email = (body.email ?? "").trim();
    const password = body.password ?? "";
    if (!email || !password) return fail("Email dan kata sandi wajib diisi", 422);
    const valid = await verifyCredentials(email, password);
    if (!valid) {
      console.warn(`[tenun-login] kredensial salah untuk ${email} (IP ${ip})`);
      return fail("Kredensial tidak cocok", 401);
    }

    attempts.delete(ip); // sukses → reset hitungan
    const token = await createSessionToken(email);
    const res = ok({ email } as Record<string, unknown>);
    res.cookies.set("tenun_session", token, sessionCookieOptions);
    return res;
  } catch (e) {
    console.error("[tenun-login-error]", e);
    const message = e instanceof Error ? e.message : "Terjadi kesalahan internal";
    return fail("Gagal login", 500, { detail: message });
  }
}
