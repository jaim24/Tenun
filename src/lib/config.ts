import crypto from "crypto";
import { prisma } from "./db";
import { requireAuthSecret } from "./secrets";

export type ConfigKind = {
  key: string;
  label: string;
  hint: string;
  secret: boolean;
  placeholder?: string;
};

// Kunci AI dikelola dengan nama konstanta agar konsisten di seluruh kode.
export const AI_CONFIG_PROVIDER = "AI_PROVIDER";
export const AI_CONFIG_BASE_URL = "AI_BASE_URL";
export const AI_CONFIG_MODEL = "AI_MODEL";
export const AI_CONFIG_API_KEY = "AI_API_KEY";

// Kunci yang bisa dikelola dari panel Settings. AUTH_SECRET sengaja TIDAK
// didaftarkan: dipakai middleware/edge untuk validasi sesi, harus ada di env
// deploy dan identik di semua instance.
export const MANAGED_CONFIG: ConfigKind[] = [
  {
    key: "THREADS_CLIENT_ID",
    label: "Meta App ID",
    hint: "App ID aplikasi Meta (threads_basic dkk). Ditemukan di developers.facebook.com.",
    secret: false,
    placeholder: "1234567890123456",
  },
  {
    key: "THREADS_CLIENT_SECRET",
    label: "Meta App Secret",
    hint: "App Secret aplikasi Meta. Disimpan terenkripsi (AES-256-GCM) di database.",
    secret: true,
  },
  {
    key: "THREADS_REDIRECT_URI",
    label: "OAuth Redirect URI",
    hint: "Harus sama persis dengan 'Valid OAuth Redirect URIs' di Meta App.",
    secret: false,
    placeholder: "https://localhost:3000/api/threads/callback",
  },
  {
    key: "THREADS_OAUTH_SCOPES",
    label: "OAuth Scopes",
    hint: "Daftar scope dipisah spasi. Kosongkan untuk pakai default aplikasi.",
    secret: false,
  },
  {
    key: "ADMIN_EMAIL",
    label: "Email Admin",
    hint: "Email untuk login ke studio ini. Berlaku setelah disimpan.",
    secret: false,
    placeholder: "admin@example.com",
  },
  {
    key: "ADMIN_PASSWORD",
    label: "Password Admin",
    hint: "Password login admin. Disimpan terenkripsi AES-256-GCM.",
    secret: true,
  },
  {
    key: "CRON_SECRET",
    label: "Cron Secret",
    hint: "Token untuk memanggil /api/cron/* (publish & search). Mulai berlaku tanpa restart.",
    secret: true,
  },
  {
    key: AI_CONFIG_PROVIDER,
    label: "Provider AI",
    hint: "Nama penyedia (informasi saja) — mis. Gemini, Groq, Mistral, OpenRouter.",
    secret: false,
    placeholder: "Gemini",
  },
  {
    key: AI_CONFIG_BASE_URL,
    label: "AI Base URL",
    hint: "Endpoint OpenAI-compatible: /chat/completions dipanggil di bawahnya. Contoh: https://generativelanguage.googleapis.com/v1beta/openai",
    secret: false,
    placeholder: "https://api.groq.com/openai/v1",
  },
  {
    key: AI_CONFIG_MODEL,
    label: "AI Model",
    hint: "Nama model, mis. gemini-2.5-flash, llama-3.3-70b-versatile, mistral-small-latest.",
    secret: false,
    placeholder: "gemini-2.5-flash",
  },
  {
    key: AI_CONFIG_API_KEY,
    label: "AI API Key",
    hint: "Kunci API dari penyedia. Disimpan terenkripsi AES-256-GCM.",
    secret: true,
  },
];

const MANAGED = new Map(MANAGED_CONFIG.map((c) => [c.key, c]));

function encryptionKey(): Buffer {
  // Kunci enkripsi diturunkan dari AUTH_SECRET; fail-fast di production bila kosong.
  // Tanpa ini, secret terenkripsi di DB (ADMIN_PASSWORD, dll) bisa didekripsi publik.
  return crypto.createHash("sha256").update(requireAuthSecret()).digest();
}

function encryptValue(plain: string): string {
  const key = encryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64url"), tag.toString("base64url"), ct.toString("base64url")].join(".");
}

function decryptValue(stored: string): string {
  try {
    const [ivB64, tagB64, ctB64] = stored.split(".");
    const key = encryptionKey();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64url"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64url"));
    return Buffer.concat([decipher.update(Buffer.from(ctB64, "base64url")), decipher.final()]).toString("utf8");
  } catch {
    return "";
  }
}

export function isManagedConfig(key: string): boolean {
  return MANAGED.has(key);
}

/** Nilai dari database (bila diatur) untuk sebuah kunci; null = belum diatur. */
export async function getStoredValue(key: string): Promise<string | null> {
  const row = await prisma.appConfig.findUnique({ where: { key } });
  if (!row) return null;
  const kind = MANAGED.get(key);
  if (kind?.secret) {
    const decrypted = decryptValue(row.value);
    return decrypted ? decrypted : null;
  }
  return row.value;
}

/** Nilai efektif: DB dulu → env → null. */
export async function getManagedValue(key: string): Promise<string | null> {
  const stored = await getStoredValue(key);
  if (stored !== null && stored !== "") return stored;
  const envValue = process.env[key]?.trim();
  return envValue ? envValue : null;
}

export async function saveStoredValue(key: string, value: string): Promise<void> {
  const kind = MANAGED.get(key);
  if (!kind) throw new Error(`Kunci "${key}" tidak dapat dikelola dari aplikasi`);
  const trimmed = value.trim();
  if (!trimmed) {
    await prisma.appConfig.delete({ where: { key } }).catch(() => undefined);
    return;
  }
  if (kind.secret) {
    await prisma.appConfig.upsert({
      where: { key },
      create: { key, value: encryptValue(trimmed) },
      update: { value: encryptValue(trimmed) },
    });
  } else {
    await prisma.appConfig.upsert({
      where: { key },
      create: { key, value: trimmed },
      update: { value: trimmed },
    });
  }
}

export async function clearStoredValue(key: string): Promise<void> {
  await prisma.appConfig.delete({ where: { key } }).catch(() => undefined);
}

/** Bungkus rahasia: tampilkan 4 karakter terakhir saja. */
export function maskSecret(value: string): string {
  if (!value) return "";
  if (value.length <= 8) return "••••••••";
  return `••••••••${value.slice(-4)}`;
}

export type ConfigManifestItem = {
  key: string;
  label: string;
  hint: string;
  secret: boolean;
  source: "db" | "env" | null;
  value: string;
};

/** Manifes utuh untuk panel Settings + API. source=null berarti kosong (pakai default). */
export async function listConfigManifest(): Promise<ConfigManifestItem[]> {
  const out: ConfigManifestItem[] = [];
  for (const kind of MANAGED_CONFIG) {
    const dbValue = await getStoredValue(kind.key);
    if (dbValue !== null) {
      out.push({ ...kind, source: "db", value: dbValue });
    } else if (process.env[kind.key]?.trim()) {
      out.push({ ...kind, source: "env", value: process.env[kind.key]!.trim() });
    } else {
      out.push({ ...kind, source: null, value: "" });
    }
  }
  return out;
}

/**
 * CRON_SECRET efektif (DB → env).
 * Di production WAJIB di-set — pemanggil harus fail-closed (tolak request)
 * bila fungsi ini throw. Di development fallback ke default lokal agar
 * script `npm run cron:*` tetap bisa jalan.
 */
export async function getCronSecret(): Promise<string> {
  const v = await getManagedValue("CRON_SECRET");
  if (v) return v;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "[tenun] CRON_SECRET belum diatur — endpoint /api/cron/* menolak semua request di production. " +
        "Atur di aplikasi (Settings → Konfigurasi) atau sebagai env di Vercel."
    );
  }
  return "dev-cron-secret";
}

/** Kredensial Threads efektif. Lempar OAuthConfigError pada kekurangan. */
export async function getThreadsConfig(): Promise<{ clientId: string; clientSecret: string; redirectUri: string }> {
  const [clientId, clientSecret, redirectUri] = await Promise.all([
    getManagedValue("THREADS_CLIENT_ID"),
    getManagedValue("THREADS_CLIENT_SECRET"),
    getManagedValue("THREADS_REDIRECT_URI"),
  ]);
  if (!clientId || !clientSecret || !redirectUri) {
    const missing = [
      !clientId && "THREADS_CLIENT_ID",
      !clientSecret && "THREADS_CLIENT_SECRET",
      !redirectUri && "THREADS_REDIRECT_URI",
    ].filter(Boolean);
    throw new Error(
      `Kredensial Meta/Threads belum lengkap: ${missing.join(", ")}. Atur di Settings → Lingkungan atau .env`
    );
  }
  return { clientId, clientSecret, redirectUri };
}

/** Scopes efektif (DB → env THREADS_OAUTH_SCOPES → default). */
export async function getEffectiveScopes(): Promise<string> {
  const scopes = (await getManagedValue("THREADS_OAUTH_SCOPES")) || "threads_basic threads_content_publish threads_manage_replies threads_read_replies threads_manage_mentions threads_keyword_search threads_manage_insights";
  return scopes.replace(/\s+/g, " ").trim();
}