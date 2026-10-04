import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_BYTES = 10 * 1024 * 1024;

// Whitelist format + magic bytes (header file). Ekstensi dan MIME dari client
// TIDAK dipercaya — SVG berisi JavaScript misalnya wajib ditolak (XSS).
const ALLOWED: Record<string, { mime: string; magic: number[] }> = {
  jpg: { mime: "image/jpeg", magic: [0xff, 0xd8, 0xff] },
  jpeg: { mime: "image/jpeg", magic: [0xff, 0xd8, 0xff] },
  png: { mime: "image/png", magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  gif: { mime: "image/gif", magic: [0x47, 0x49, 0x46, 0x38] }, // GIF8
  webp: { mime: "image/webp", magic: [0x52, 0x49, 0x46, 0x46] }, // RIFF....WEBP
};

function magicOk(buf: Buffer, ext: string): boolean {
  const kind = ALLOWED[ext];
  if (!kind || buf.length < 12) return false;
  for (let i = 0; i < kind.magic.length; i++) {
    if (buf[i] !== kind.magic[i]) return false;
  }
  if (ext === "webp") {
    // WebP: tanda "WEBP" di offset 8
    return buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;
  }
  return true;
}

const err = (error: string, status: number) => NextResponse.json({ ok: false, error }, { status });

export async function POST(req: Request) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return err("Body bukan multipart/form-data", 400);
  }
  const file = form.get("file");
  if (!(file instanceof File)) return err("File tidak ditemukan", 400);
  if (file.size > MAX_BYTES) return err("Ukuran maksimal 10MB", 413);

  const name = file.name || "gambar";
  const ext = (name.includes(".") ? (name.split(".").pop() ?? "") : "").toLowerCase();
  const kind = ALLOWED[ext];
  if (!kind) return err("Format gambar tidak didukung (jpg, png, gif, webp)", 415);

  const buf = Buffer.from(await file.arrayBuffer());
  if (!magicOk(buf, ext)) return err("File bukan gambar yang valid", 415);

  const filename = `${randomUUID()}.${ext === "jpeg" ? "jpg" : ext}`;

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = await import("@vercel/blob");
      const blob = await put(`tenun/${filename}`, buf, { access: "public", contentType: kind.mime });
      return NextResponse.json({ ok: true, url: blob.url });
    } catch (e) {
      return err(e instanceof Error ? `Blob: ${e.message}` : "Upload blob gagal", 500);
    }
  }

  // Tanpa Blob, disk lokal ephemeral di serverless → di production tolak
  // dengan pesan jelas daripada sukses palsu (file hilang setelahnya).
  if (process.env.NODE_ENV === "production") {
    return err("Upload file belum dikonfigurasi (BLOB_READ_WRITE_TOKEN kosong). Hubungkan Vercel Blob dulu.", 503);
  }

  const dir = join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, filename), buf);
  return NextResponse.json({ ok: true, url: `/uploads/${filename}` });
}
