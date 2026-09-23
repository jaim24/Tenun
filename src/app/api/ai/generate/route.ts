import { authed, fail, handleRoute, ok, readJson } from "@/lib/http";
import { AI_TONES, generateThreadText, type AiTone } from "@/lib/ai";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export const POST = handleRoute(async (req) => {
  await authed(req);
  const body = await readJson(req);
  const topic = String(body.topic ?? "").trim().slice(0, 500);
  if (!topic) {
    return fail("Topik wajib diisi di panel Generate.", 422);
  }

  const toneRaw = String(body.tone ?? "data").trim();
  const tone = AI_TONES.some((t) => t.key === toneRaw) ? (toneRaw as AiTone) : undefined;
  const context = String(body.context ?? "").trim().slice(0, 2000) || undefined;

  try {
    const { text, model } = await generateThreadText({ topic, context, tone });
    await logActivity("AI", `Naskah dibuat dengan AI (${model}) untuk "${topic.slice(0, 60)}"`);
    return ok({ text, model });
  } catch (err) {
    console.error("[ai-generate]", err);
    return fail(err instanceof Error ? err.message : "Gagal memanggil AI", 502, { code: "AI_ERROR" });
  }
});