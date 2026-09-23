import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Body bukan multipart/form-data" }, { status: 400 });
  }
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "File tidak ditemukan" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ ok: false, error: "Hanya file gambar yang didukung" }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "Ukuran maksimal 10MB" }, { status: 413 });
  }

  const name = file.name || "gambar";
  const ext = (name.includes(".") ? (name.split(".").pop() ?? "") : "").toLowerCase();
  const filename = `${randomUUID()}.${ext || "jpg"}`;
  const buf = Buffer.from(await file.arrayBuffer());

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = await import("@vercel/blob");
      const blob = await put(`tenun/${filename}`, buf, { access: "public", contentType: file.type });
      return NextResponse.json({ ok: true, url: blob.url });
    } catch (e) {
      return NextResponse.json({ ok: false, error: e instanceof Error ? `Blob: ${e.message}` : "Upload blob gagal" }, { status: 500 });
    }
  }

  const dir = join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), buf);
  return NextResponse.json({ ok: true, url: `/uploads/${filename}` });
}