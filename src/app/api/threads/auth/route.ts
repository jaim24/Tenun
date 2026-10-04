import crypto from "crypto";
import { NextResponse } from "next/server";
import { authorizeUrl } from "@/lib/threads";
import { fail } from "@/lib/http";
import { logActivity } from "@/lib/activity";

export const OAUTH_STATE_COOKIE = "tenun_oauth_state";

export async function GET() {
  try {
    // State anti-CSRF: token acak disimpan di cookie httpOnly,
    // diverifikasi di /api/threads/callback sebelum kode ditukar.
    const state = `tenun-${Date.now()}-${crypto.randomBytes(8).toString("hex")}`;
    const url = await authorizeUrl(state);
    await logActivity("AUTH", "Mengarahkan ke OAuth Meta/Threads");
    const res = NextResponse.redirect(url);
    res.cookies.set(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600, // 10 menit — cukup untuk menyelesaikan login di Meta
    });
    return res;
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Kredensial Meta belum diatur", 500);
  }
}
