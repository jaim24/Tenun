import {
  AI_CONFIG_API_KEY,
  AI_CONFIG_BASE_URL,
  AI_CONFIG_MODEL,
  AI_CONFIG_PROVIDER,
  getManagedValue,
} from "./config";

export type AiTone = "data" | "opini" | "tips" | "tanya";

export const AI_TONES: { key: AiTone; label: string; guide: string }[] = [
  {
    key: "data",
    label: "Data / Berita",
    guide:
      "Perkenalkan satu angka atau fakta dulu di baris pertama, lalu jelaskan maknanya dengan tenang. Tanpa spekulasi.",
  },
  {
    key: "opini",
    label: "Opini",
    guide:
      "Punya sudut pandang jelas. Akhiri dengan satu argumen tajam, bukan ajakan klik. Hindari hyperbole.",
  },
  {
    key: "tips",
    label: "Tips",
    guide:
      "Berikan 2-3 langkah kontekstual yang bisa segera dipraktikkan. Kalimat pendek.",
  },
  {
    key: "tanya",
    label: "Pertanyaan",
    guide:
      "Buka dengan cerita/konteks singkat, tutup dengan satu pertanyaan diskusi yang spesifik dan jujur.",
  },
];

export const AI_PRESETS: {
  key: string;
  label: string;
  baseUrl: string;
  model: string;
  keyUrl: string;
  note: string;
}[] = [
  {
    key: "gemini",
    label: "Gemini (AI Studio)",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    model: "gemini-2.5-flash",
    keyUrl: "https://aistudio.google.com/apikey",
    note: "Gratis paling murah kuota & kualitas terbaik; 1M token konteks.",
  },
  {
    key: "groq",
    label: "Groq (Llama)",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.3-70b-versatile",
    keyUrl: "https://console.groq.com/keys",
    note: "Sangat cepat, gratis permanen, ~1.000 permintaan/hari.",
  },
  {
    key: "mistral",
    label: "Mistral",
    baseUrl: "https://api.mistral.ai/v1",
    model: "mistral-small-latest",
    keyUrl: "https://console.mistral.ai/api-keys",
    note: "Kualitas open-weight bagus, ada tier gratis.",
  },
  {
    key: "openrouter",
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "meta-llama/llama-3.3-70b-instruct:free",
    keyUrl: "https://openrouter.ai/settings/keys",
    note: "Satu kunci untuk ratusan model; model :free bisa padat.",
  },
];

const SYSTEM_PROMPT = `Kamu penulis naskah untuk aplikasi auto-post Threads bernama Tenun.
Tugas: buat SATU unggahan Threads dalam Bahasa Indonesia (kecuali topik mengharuskan istilah asing), natural dan tidak terasa hasil mesin.

Aturan wajib:
- Maksimal 500 karakter total (termasuk spasi). Jangan pernah melebihi 500.
- Satu ide utama per post. Mulai langsung dari poin, tanpa pengantar basa-basi seperti "Di era digital".
- Tanpa clickbait, tanpa seruan "Baca selengkapnya!", tanpa emoji berlebihan (maks 1 emoji bila benar-benar membantu), tanpa tumpukan hashtag (maks 1 hashtag, dan hanya bila relevan).
- Gaya Tenun: data/fakta dulu, opini kemudian. Kalimat pendek-pendek. Bernada jujur dan tajam, bukan menggurui.
- Bila diberi "Konteks": jadikan inspirasi, jangan menyalin kalimatnya.

Keluarkan hanya naskahnya saja — tanpa tanda kutip, tanpa judul, tanpa penjelasan.`;

export type ChatResult = { content: string; model: string };

async function rawChat(baseUrl: string, apiKey: string, body: unknown): Promise<ChatResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  const cleanBase = baseUrl.trim().replace(/\/+$/, "").replace(/\/chat\/completions$/i, "");
  let res: Response;
  try {
    res = await fetch(`${cleanBase}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      cache: "no-store",
    });
  } catch (err) {
    throw new Error(
      err instanceof Error && err.name === "AbortError"
        ? "Provider AI terlalu lama merespons (20 detik). Coba lagi atau ganti provider."
        : `Gagal terhubung ke provider AI: ${err instanceof Error ? err.message : "network error"}`
    );
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    let detail = "";
    try {
      const data = await res.json();
      detail = data?.error?.message ?? data?.message ?? "";
    } catch {
      detail = "";
    }
    const status = res.status;
    const base =
      status === 401
        ? "Kunci API AI ditolak (401). Periksa AI_API_KEY di Settings → Lingkungan."
        : status === 429
        ? "Kuota/rate limit provider AI habis (429). Tunggu sebentar atau pakai provider lain."
        : detail
        ? `Provider AI menolak (${status}): ${detail}`
        : `Provider AI menolak permintaan (HTTP ${status}).`;
    throw new Error(base);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[]; model?: string };
  const text = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!text) throw new Error("Provider AI tidak mengembalikan teks. Coba lagi.");
  return {
    content: text.slice(0, 500).trim(),
    model: String(data.model ?? "").trim() || modelOf(body),
  };
}

function modelOf(body: unknown): string {
  return (body as { model?: unknown })?.model ? String((body as { model?: string }).model) : "unknown";
}

export async function getAiConfigCore(): Promise<{
  provider: string | null;
  baseUrl: string;
  model: string;
  apiKey: string;
}> {
  const [provider, baseUrl, model, apiKey] = await Promise.all([
    getManagedValue(AI_CONFIG_PROVIDER),
    getManagedValue(AI_CONFIG_BASE_URL),
    getManagedValue(AI_CONFIG_MODEL),
    getManagedValue(AI_CONFIG_API_KEY),
  ]);

  if (!baseUrl && !model && !apiKey) {
    throw new Error(
      'AI belum dikonfigurasi. Klik "Isi preset" pilih provider gratis (Gemini/Groq/Mistral), lalu tempel API key di Settings → Lingkungan → AI API Key.'
    );
  }
  if (!baseUrl || !model || !apiKey) {
    const missing = [
      !baseUrl && "AI_BASE_URL",
      !model && "AI_MODEL",
      !apiKey && "AI_API_KEY",
    ].filter(Boolean);
    throw new Error(
      `Konfigurasi AI belum lengkap: ${missing.join(", ")} belum diisi di Settings → Lingkungan.`
    );
  }

  return { provider: provider ?? null, baseUrl, model, apiKey };
}

export async function generateThreadText({
  topic,
  context,
  tone,
}: {
  topic: string;
  context?: string;
  tone?: AiTone;
}): Promise<{ text: string; model: string }> {
  const { baseUrl, model, apiKey } = await getAiConfigCore();

  const toneGuide = tone ? AI_TONES.find((t) => t.key === tone)?.guide ?? "" : "";
  const user =
    `Topik: ${topic}` +
    (tone ? `\nSasaran nada: ${toneGuide}` : "") +
    (context ? `\nKonteks (inspirasi, jangan disalin):\n${context}` : "");

  const body = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: user },
    ],
    temperature: 0.85,
    max_tokens: 420,
  };

  const { content } = await rawChat(baseUrl, apiKey, body);
  return { text: content, model };
}

/** Uji koneksi: chat minimal 1 token untuk memvalidasi base URL + kunci + model. */
export async function testAiConnection(): Promise<{
  provider: string | null;
  model: string;
  latencyMs: number;
}> {
  const { provider, baseUrl, model, apiKey } = await getAiConfigCore();
  const start = Date.now();
  const { model: returnedModel } = await rawChat(baseUrl, apiKey, {
    model,
    messages: [{ role: "user", content: "ping" }],
    max_tokens: 1,
  });
  return { provider, model: returnedModel, latencyMs: Date.now() - start };
}