import { pushGlobalToast } from "@/components/toast";

export class ClientError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "ClientError";
    this.status = status;
  }
}

export async function api<T = any>(
  path: string,
  opts: { method?: string; body?: unknown; form?: FormData; quiet?: boolean } = {}
): Promise<T & { ok: boolean }> {
  const init: RequestInit = { method: opts.method ?? "GET" };
  if (opts.body !== undefined) {
    init.headers = { "content-type": "application/json" };
    init.body = JSON.stringify(opts.body);
  }
  if (opts.form) init.body = opts.form;
  const res = await fetch(path, init);
  const data = await res.json().catch(() => ({ ok: false, error: "Respon server tidak terbaca" }));
  if (!res.ok) {
    const message = data?.error ?? `HTTP ${res.status}`;
    if (!opts.quiet) pushGlobalToast("err", message);
    throw new ClientError(message, res.status);
  }
  return data as T & { ok: boolean };
}

export function toLocalInputValue(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}