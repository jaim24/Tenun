import { NextRequest, NextResponse } from "next/server";
import { OAUTH_STATE_COOKIE } from "./auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { ApiError, exchangeCode, exchangeForLongLivedToken, getMe } from "@/lib/threads";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  // Verifikasi state OAuth (anti-CSRF): callback wajib membawa state yang
  // sama dengan cookie httpOnly. Cookie sekali pakai — dihapus di semua exit.
  const clearState = (res: NextResponse) => {
    res.cookies.delete(OAUTH_STATE_COOKIE);
    return res;
  };
  const state = url.searchParams.get("state");
  const expectedState = req.cookies.get(OAUTH_STATE_COOKIE)?.value;
  if (!state || !expectedState || state !== expectedState) {
    await logActivity("AUTH", "Callback OAuth ditolak: state tidak valid (kemungkinan CSRF)");
    return clearState(
      NextResponse.redirect(
        `${appUrl}/app/settings?connected=error&reason=${encodeURIComponent("Sesi OAuth tidak valid, silakan coba lagi")}`
      )
    );
  }

  if (error || !code) {
    await logActivity("AUTH", `Koneksi Threads dibatalkan (${error ?? "no_code"})`);
    return clearState(NextResponse.redirect(`${appUrl}/app/settings?connected=denied`));
  }

  let stage = "exchange_code";
  try {
    const { access_token: shortToken } = await exchangeCode(code);
    if (!shortToken) throw new Error("Respons pertukaran kode tidak berisi access_token");
    stage = "exchange_long_lived_token";
    const long = await exchangeForLongLivedToken(shortToken);
    if (!long.access_token) throw new Error("Respons token jangka panjang tidak berisi access_token");
    stage = "get_profile";
    const me = await getMe(long.access_token);

    stage = "save_account";
    const accountId = me.id;
    const exists = await prisma.account.findUnique({ where: { threadsUserId: accountId } });

    const data = {
      threadsUserId: accountId,
      username: me.username ?? `user_${accountId}`,
      name: me.name ?? null,
      profilePictureUrl: me.threads_profile_picture_url ?? null,
      accessToken: long.access_token,
      tokenKind: "LONG",
      tokenExpiresAt: new Date(Date.now() + (long.expires_in ?? 5184000) * 1000),
      isActive: true,
    };

    if (exists) {
      await prisma.account.update({ where: { id: exists.id }, data });
    } else {
      await prisma.account.create({ data });
    }

    await logActivity("AUTH", `Akun Threads @${data.username} berhasil terhubung`, { id: accountId });

    return clearState(NextResponse.redirect(`${appUrl}/app/settings?connected=ok`));
  } catch (e) {
    const message = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Gagal bertukar kode";
    const diagnostic = {
      stage,
      code: e instanceof ApiError ? e.code : undefined,
      status: e instanceof ApiError ? e.status : undefined,
    };
    console.error("[threads-oauth]", diagnostic);
    await logActivity("ERROR", `Gagal konek Threads [${stage}]: ${message}`, diagnostic);
    return clearState(NextResponse.redirect(`${appUrl}/app/settings?connected=error&reason=${encodeURIComponent(message)}`));
  }
}
