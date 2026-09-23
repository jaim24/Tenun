import { createSessionToken, sessionCookieOptions, verifyCredentials } from "@/lib/auth";
import { ok, fail } from "@/lib/http";

export async function POST(req: Request) {
  try {
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
    if (!valid) return fail("Kredensial tidak cocok", 401);

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