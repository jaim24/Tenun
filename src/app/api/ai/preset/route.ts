import { authed, fail, handleRoute, ok, readJson } from "@/lib/http";
import { AI_PRESETS } from "@/lib/ai";
import { AI_CONFIG_BASE_URL, AI_CONFIG_MODEL, saveStoredValue } from "@/lib/config";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export const POST = handleRoute(async (req) => {
  await authed(req);
  const body = await readJson(req);
  const preset = AI_PRESETS.find((p) => p.key === String(body.provider ?? "").trim());
  if (!preset) return fail("Preset provider tidak dikenal.", 422);

  await saveStoredValue(AI_CONFIG_BASE_URL, preset.baseUrl);
  await saveStoredValue(AI_CONFIG_MODEL, preset.model);
  await logActivity("AI", `Preset AI "${preset.label}" diterapkan (base URL + model). Tempel API key untuk aktif.`);

  return ok({
    provider: preset.label,
    baseUrl: preset.baseUrl,
    model: preset.model,
    keyUrl: preset.keyUrl,
    note: preset.note,
  });
});