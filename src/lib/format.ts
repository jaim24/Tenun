const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function formatUtc(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${DAYS[d.getUTCDay()]}, ${dd} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()} — ${hh}:${mm} UTC`;
}

export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const t = typeof date === "string" ? new Date(date) : date;
  const diff = Math.max(0, Date.now() - t.getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins}m lalu`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}j ${mins % 60}m lalu`;
  const days = Math.floor(hrs / 24);
  return `${days}h lalu`;
}

export function inHumanized(date: Date | string | null | undefined): string {
  if (!date) return "";
  const t = typeof date === "string" ? new Date(date) : date;
  const diff = t.getTime() - Date.now();
  const neg = diff < 0;
  const abs = Math.abs(diff);
  const mins = Math.floor(abs / 60000);
  const hh = Math.floor(mins / 60);
  const mm = mins % 60;
  if (hh >= 24) return `${Math.floor(hh / 24)}H ${hh % 24}M ${neg ? "LEWAT" : "LAGI"}`;
  if (hh > 0) return `${hh}H ${mm}M`;
  if (mm > 0) return `${mm}M`;
  return "<1M";
}

export function clockUtc(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} UTC`;
}

export function toLocalInputValue(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function clampText(text: string, max = 200): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "…";
}

export function countdownBar(used: number, total: number): string {
  return `${(Math.min(used, total) / total) * 100}`;
}