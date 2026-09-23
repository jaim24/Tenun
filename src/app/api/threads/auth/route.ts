import { NextResponse } from "next/server";
import { authorizeUrl } from "@/lib/threads";
import { fail } from "@/lib/http";
import { logActivity } from "@/lib/activity";

export async function GET() {
  try {
    const state = `tenun-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const url = await authorizeUrl(state);
    await logActivity("AUTH", "Mengarahkan ke OAuth Meta/Threads");
    return NextResponse.redirect(url);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Kredensial Meta belum diatur", 500);
  }
}