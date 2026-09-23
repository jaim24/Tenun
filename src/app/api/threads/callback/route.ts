import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { ApiError, exchangeCode, exchangeForLongLivedToken, getMe } from "@/lib/threads";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  if (error || !code) {
    await logActivity("AUTH", `Koneksi Threads dibatalkan (${error ?? "no_code"})`);
    return NextResponse.redirect(`${appUrl}/app/settings?connected=denied`);
  }

  try {
    const { access_token: shortToken, user_id } = await exchangeCode(code);
    const long = await exchangeForLongLivedToken(shortToken);
    const me = await getMe(long.access_token);

    const accountId = String(user_id ?? me.id);
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

    return NextResponse.redirect(`${appUrl}/app/settings?connected=ok`);
  } catch (e) {
    const message = e instanceof ApiError ? e.message : e instanceof Error ? e.message : "Gagal bertukar kode";
    await logActivity("ERROR", `Gagal konek Threads: ${message}`);
    return NextResponse.redirect(`${appUrl}/app/settings?connected=error&reason=${encodeURIComponent(message)}`);
  }
}