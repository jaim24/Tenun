import { fail, handleRoute, ok, readJson } from "@/lib/http";
import { listConfigManifest, saveStoredValue, clearStoredValue, isManagedConfig, maskSecret } from "@/lib/config";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

export const GET = handleRoute(async () => {
  const manifest = await listConfigManifest();
  return ok({
    configs: manifest.map((c) => ({
      key: c.key,
      label: c.label,
      hint: c.hint,
      secret: c.secret,
      source: c.source,
      value: c.secret ? (c.value ? maskSecret(c.value) : "") : c.value,
    })),
  });
});

export const PUT = handleRoute(async (req) => {
  const body = await readJson(req);
  const key = String(body.key ?? "").trim();
  if (!isManagedConfig(key)) return fail(`Kunci "${key}" tidak dapat dikelola dari aplikasi`, 422);
  const value = String(body.value ?? "").trim();
  await saveStoredValue(key, value);
  await logActivity("CONFIG", value ? `Konfig "${key}" diperbarui dari studio` : `Konfig "${key}" dihapus (kembali ke default)`);
  return ok({ key, updated: true, source: "db" });
});

export const DELETE = handleRoute(async (req) => {
  const url = new URL(req.url);
  const key = url.searchParams.get("key") ?? "";
  if (!isManagedConfig(key)) return fail(`Kunci "${key}" tidak dapat dikelola dari aplikasi`, 422);
  await clearStoredValue(key);
  await logActivity("CONFIG", `Penyimpanan konfig "${key}" direset`);
  return ok({ key, cleared: true });
});