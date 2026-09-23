import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    status: "alive",
    time: new Date().toISOString(),
    app: "tenun",
  });
}