import { authed, fail, handleRoute, ok } from "@/lib/http";
import { testAiConnection } from "@/lib/ai";

export const dynamic = "force-dynamic";

export const POST = handleRoute(async (req) => {
  await authed(req);
  try {
    const result = await testAiConnection();
    return ok({ connected: true, ...result });
  } catch (err) {
    console.error("[ai-test]", err);
    return fail(err instanceof Error ? err.message : "Gagal menguji koneksi AI", 502, { code: "AI_ERROR" });
  }
});