import { authed, fail, handleRoute, ok, readJson } from "@/lib/http";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handleRoute(async (req, ctx: Ctx) => {
  await authed(req);
  const { id } = await ctx.params;
  const body = await readJson(req);
  const existing = await prisma.affiliateLink.findUnique({ where: { id } });
  if (!existing) return fail("Link affiliate tidak ditemukan.", 404);

  const data: { label?: string; url?: string; isActive?: boolean } = {};
  if (body.label !== undefined) {
    const label = String(body.label ?? "").trim().slice(0, 80);
    if (!label) return fail("Label produk wajib diisi.", 422);
    data.label = label;
  }
  if (body.url !== undefined) {
    const url = String(body.url ?? "").trim();
    if (!/^https?:\/\//i.test(url)) return fail("URL harus diawali http(s)://.", 422);
    if (!url) return fail("URL affiliate wajib diisi.", 422);
    data.url = url;
  }
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

  await prisma.affiliateLink.update({ where: { id }, data });
  await logActivity("AFFILIATE", existing.isActive === data.isActive ? `Link affiliate "${existing.label}" diperbarui` : `Link affiliate "${existing.label}" ${data.isActive ? "diaktifkan" : "dinonaktifkan"}`);
  return ok({ updated: true, id });
});

export const DELETE = handleRoute(async (req, ctx: Ctx) => {
  await authed(req);
  const { id } = await ctx.params;
  const existing = await prisma.affiliateLink.findUnique({ where: { id } });
  if (!existing) return fail("Link affiliate tidak ditemukan.", 404);
  await prisma.affiliateLink.delete({ where: { id } });
  await logActivity("AFFILIATE", `Link affiliate "${existing.label}" dihapus`);
  return ok({ deleted: true, id });
});