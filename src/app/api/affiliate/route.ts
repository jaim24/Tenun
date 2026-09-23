import { authed, fail, handleRoute, ok, readJson } from "@/lib/http";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

function normalizeUrl(raw: string): string | null {
  const url = raw.trim();
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) return `https://${url}`;
  return url;
}

export const GET = handleRoute(async (req) => {
  await authed(req);
  const links = await prisma.affiliateLink.findMany({ orderBy: { createdAt: "asc" } });
  return ok({
    links: links.map((l) => ({
      id: l.id,
      label: l.label,
      url: l.url,
      isActive: l.isActive,
    })),
  });
});

export const POST = handleRoute(async (req) => {
  await authed(req);
  const body = await readJson(req);
  const label = String(body.label ?? "").trim().slice(0, 80);
  if (!label) return fail("Label produk wajib diisi.", 422);
  const url = normalizeUrl(String(body.url ?? ""));
  if (!url) return fail("URL affiliate wajib diisi.", 422);

  const link = await prisma.affiliateLink.create({ data: { label, url } });
  await logActivity("AFFILIATE", `Link affiliate "${label}" ditambahkan`);
  return ok({ link: { id: link.id, label: link.label, url: link.url, isActive: link.isActive } }, 201);
});