import { ok } from "@/lib/http";

export async function POST() {
  const res = ok();
  res.cookies.delete("tenun_session");
  return res;
}