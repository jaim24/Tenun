// Klien Threads Graph API v1.0
import { getThreadsConfig, getEffectiveScopes } from "./config";

const GRAPH = "https://graph.threads.net";
const AUTH_URL = "https://www.threads.net/oauth/authorize";
const TOKEN_URL = "https://graph.threads.net/oauth/access_token";

export const PUBLISHING_LIMIT = 250; // post / 24 jam
export const REPLY_LIMIT = 1000; // reply / 24 jam
export const SEARCH_LIMIT = 500; // pencarian / 7 hari

export class ApiError extends Error {
  code?: string;
  status?: number;
  constructor(message: string, code?: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export class OAuthConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OAuthConfigError";
  }
}

export function authorizeUrl(state: string): Promise<string> {
  return (async () => {
    const { clientId, redirectUri } = await getThreadsConfig();
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: await getEffectiveScopes(),
      response_type: "code",
      state,
    });
    return `${AUTH_URL}?${params.toString()}`;
  })();
}

async function formRequest(url: string, params: Record<string, string>) {
  const body = new URLSearchParams(params);
  const res = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await parseJson(res);
  if (!res.ok || data.error) throw new ApiError(data.error?.message ?? "Permintaan token gagal", String(data.error?.code ?? "TOKEN"), res.status);
  return data;
}

async function parseJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { error: { message: text.slice(0, 300) } };
  }
}

/**
 * fetch dengan timeout — bila API Meta hang, function serverless tidak ikut
 * menggantung sampai maxDuration. Timeout default 20 detik.
 */
export async function fetchWithTimeout(input: string, init: RequestInit = {}, ms = 20000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: ctrl.signal });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new ApiError("Permintaan ke Threads API timeout", "TIMEOUT", 504);
    }
    throw e;
  } finally {
    clearTimeout(t);
  }
}

export async function graphRequest(
  path: string,
  params: Record<string, string>,
  opts: { method?: "GET" | "POST"; form?: boolean } = {}
) {
  const method = opts.method ?? "GET";
  const url = `${GRAPH}/v1.0/${path}`;
  let res: Response;
  if (method === "POST") {
    res = opts.form
      ? await fetchWithTimeout(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams(params),
        })
      : await fetchWithTimeout(`${url}?${new URLSearchParams(params)}`, { method: "POST" });
  } else {
    res = await fetchWithTimeout(`${url}?${new URLSearchParams(params)}`);
  }
  const data = await parseJson(res);
  if (!res.ok || data.error) {
    const err = data.error ?? {};
    throw new ApiError(
      err.error_user_msg || err.message || "Permintaan ke Threads API gagal",
      String(err.code ?? "GRAPH"),
      res.status
    );
  }
  return data;
}

// --- Aliran OAuth ---

export async function exchangeCode(code: string): Promise<{ access_token: string; user_id: string }> {
  const { clientId, clientSecret, redirectUri } = await getThreadsConfig();
  const data = await formRequest(TOKEN_URL, {
    client_id: clientId,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });
  return data;
}

export async function exchangeForLongLivedToken(shortToken: string): Promise<{ access_token: string; expires_in: number }> {
  const { clientSecret } = await getThreadsConfig();
  const params = new URLSearchParams({
    grant_type: "th_exchange_token",
    client_secret: clientSecret,
    access_token: shortToken,
  });
  const res = await fetchWithTimeout(`${GRAPH}/access_token?${params}`, { cache: "no-store" });
  const data = await parseJson(res);
  if (!res.ok || data.error) throw new ApiError(data.error?.message ?? "Permintaan token gagal", String(data.error?.code ?? "TOKEN"), res.status);
  return data;
}

export async function getMe(accessToken: string) {
  const profile = await graphRequest("me", {
    fields: "id,username,name,threads_profile_picture_url",
    access_token: accessToken,
  });
  if (typeof profile.id !== "string" || !/^\d+$/.test(profile.id)) {
    throw new ApiError("Respons profil Threads tidak berisi ID string yang valid", "PROFILE_ID");
  }
  return profile;
}

// --- Konten ---

export async function createContainer(
  userId: string,
  accessToken: string,
  input: { text: string; imageUrl?: string | null; mediaType?: "TEXT" | "IMAGE"; replyToId?: string }
) {
  const params: Record<string, string> = {
    media_type: input.mediaType ?? (input.imageUrl ? "IMAGE" : "TEXT"),
    access_token: accessToken,
  };
  if (input.text) params.text = input.text;
  if (input.imageUrl) params.image_url = input.imageUrl;
  if (input.replyToId) params.reply_to_id = input.replyToId;
  const data = await graphRequest(`${userId}/threads`, params, { method: "POST", form: true });
  return data as { id: string };
}

export async function publishContainer(userId: string, accessToken: string, creationId: string) {
  const data = await graphRequest(`${userId}/threads_publish`, {
    creation_id: creationId,
    access_token: accessToken,
  }, { method: "POST", form: true });
  return data as { id: string; permalink?: string };
}

export async function containerStatus(creationId: string, accessToken: string) {
  return graphRequest(creationId, {
    fields: "status,error_message",
    access_token: accessToken,
  });
}

// --- Pencarian ---

export async function searchThreads(
  userId: string,
  accessToken: string,
  input: { q: string; searchType?: "KEYWORD" | "TAG"; limit?: number }
) {
  const data = await graphRequest(`${userId}/threads`, {
    search_type: input.searchType ?? "KEYWORD",
    q: input.q,
    limit: String(input.limit ?? 25),
    access_token: accessToken,
  });
  return data as {
    data?: Array<{
      id: string;
      media_product_type?: string;
      permalink?: string;
      username?: string;
      text?: string;
      timestamp?: string;
      allowed_commenting?: boolean;
    }>;
  };
}

// --- Kuota & wawasan ---

export async function getPublishingQuota(userId: string, accessToken: string) {
  let usage = { posts: 0, replies: 0 };
  const totals = { posts: PUBLISHING_LIMIT, replies: REPLY_LIMIT };
  try {
    const data = await graphRequest(userId, {
      fields: "quota_usage,quota_total",
      access_token: accessToken,
    });
    const u = data.quota_usage ?? {};
    const t = data.quota_total ?? {};
    usage.posts = u.num_posts_published_this_period ?? 0;
    usage.replies = u.posts_reply_count_this_period ?? 0;
    if (t.num_posts_published_this_period) totals.posts = t.num_posts_published_this_period;
    if (t.posts_reply_count_this_period) totals.replies = t.posts_reply_count_this_period;
  } catch {
    // kuota kadang belum tersedia; tetap pakai nilai default
  }
  return { usage, totals };
}

export async function getMediaInsights(
  mediaId: string,
  accessToken: string,
  metrics = "likes,replies,reposts,quotes"
) {
  try {
    const data = await graphRequest(`${mediaId}/insights`, {
      metric: metrics,
      access_token: accessToken,
    });
    const out: Record<string, number | undefined> = {};
    for (const row of Array.isArray(data.data) ? data.data : []) {
      const value = row.values?.[0]?.value ?? 0;
      out[row.name] = typeof value === "number" ? value : 0;
    }
    return out;
  } catch {
    return {};
  }
}

// --- Refresh token ---

// Token long-lived Threads ±60 hari. Di-refresh otomatis bila sisa < 7 hari
// setiap kali akun primer diambil, agar fitur tidak mati diam-diam.
const TOKEN_REFRESH_THRESHOLD_MS = 7 * 24 * 3600 * 1000;

export async function refreshLongLivedToken(accessToken: string): Promise<{ access_token: string; expires_in: number }> {
  const params = new URLSearchParams({ grant_type: "th_refresh_token", access_token: accessToken });
  const res = await fetchWithTimeout(`${GRAPH}/refresh_access_token?${params}`, { cache: "no-store" }, 20000);
  const data = await parseJson(res);
  if (!res.ok || data.error) throw new ApiError(data.error?.message ?? "Gagal me-refresh token", String(data.error?.code ?? "TOKEN_REFRESH"), res.status);
  return data;
}

// --- Akun aktif ---

export async function getPrimaryAccount(prisma: any): Promise<any> {
  const account = await prisma.account.findFirst({ orderBy: { createdAt: "asc" } });
  if (!account?.accessToken) return account;
  const expiresAt = account.tokenExpiresAt ? new Date(account.tokenExpiresAt).getTime() : 0;
  if (expiresAt - Date.now() > TOKEN_REFRESH_THRESHOLD_MS) return account;
  try {
    const refreshed = await refreshLongLivedToken(account.accessToken);
    if (!refreshed.access_token) return account;
    return await prisma.account.update({
      where: { id: account.id },
      data: {
        accessToken: refreshed.access_token,
        tokenExpiresAt: new Date(Date.now() + (refreshed.expires_in ?? 5184000) * 1000),
      },
    });
  } catch (e) {
    // Refresh gagal (mis. token sudah mati) → pakai token lama; biarkan
    // pemanggil menangani error API seperti biasa.
    console.error("[tenun] Gagal me-refresh token Threads:", e instanceof Error ? e.message : e);
    return account;
  }
}

export function requireAccount<T>(account: T): asserts account is NonNullable<T> {
  if (!account) throw new ApiError("Belum ada akun Threads yang terhubung", "NO_ACCOUNT", 428);
}
