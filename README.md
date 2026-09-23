# Tenun — Studio Auto-Post Threads

CMS satu akun untuk menjadwalkan posting, membalas auto-reply (dengan persetujuan manual), memantau keyword, dan membaca insight di Threads (Meta Threads API). Biaya: $0 (Vercel Hobby + Vercel Postgres free tier + Meta API gratis).

## Fitur

- **Composer & Jadwal** — tulis draf, jadwalkan, unggah media, publish manual atau otomatis via cron. Dua langkah API (`container` → `publish`), 250 post / 24 jam.
- **Reply Queue** — auto-reply hanya membuat draf `PENDING`; Anda tinjau/ubah lalu kirim (1.000 reply / 24 jam).
- **Keyword Monitor** — daftar vektor keyword, pencarian manual + cron otomatis (500 permintaan search / 7 hari), auto-reply per keyword dengan template `{username}`.
- **Dashboard** — metrik hari ini, jadwal terdekat, aktivitas, kuota posting/balasan.
- **Generate dengan AI** — di Composer: tulis topik (bisa langsung dari hasil pindai via tombol *Jadikan Post*), pilih nada (data/opini/tips/pertanyaan), AI menulis draf ≤500 karakter. Provider-agnostic (OpenAI-compatible), isi preset gratis sekali klik.
- **Affiliate Shopee** — simpan beberapa link affiliate (label + URL) di **Settings → Affiliate Shopee**; di Composer pilih produk (atau custom link per-post) lalu *Sisipkan* ke naskah. Link hanya masuk teks yang kamu setujui (dalam batas 500 karakter).
- **Lingkungan via UI** — kredensial Meta, email/password admin, CRON_SECRET, dan konfigurasi AI dikelola langsung dari **Settings → Lingkungan** (tersimpan terenkripsi AES-256-GCM di DB, menimpa `.env`, berlaku tanpa restart).

## Stack

- Next.js 15 (App Router) + TypeScript, Tailwind CSS v3
- Prisma ORM — SQLite lokal, pindahkan ke Postgres saat deploy
- Session: JWT HS256 (`jose`) di cookie `tenun_session`
- OAuth Threads via Meta Graph API, long-lived token ±60 hari
- Cron endpoint (`/api/cron/publish`, `/api/cron/search`) dilindungi `CRON_SECRET`

## Menjalankan Lokal

```bash
npm install
npx prisma db push          # buat skema (pakai SQLite prisma/dev.db)
npm run dev                 # → http://localhost:3000
```

1. Copy `.env.example` → `.env`, isi minimal `ADMIN_EMAIL`, `ADMIN_PASSWORD` (pakai sandi kuat), dan `AUTH_SECRET` (>32 karakter acak). Kredensial lain bisa diisi nanti lewat UI **Settings → Lingkungan**.
2. Login dengan kredensial admin tersebut.
3. Di **Settings → Lingkungan**, isi `THREADS_CLIENT_ID`, `THREADS_CLIENT_SECRET`, `THREADS_REDIRECT_URI` (dan opsional `THREADS_OAUTH_SCOPES`, `CRON_SECRET`) — langsung tersimpan terenkripsi di database, menimpa `.env`, berlaku tanpa restart.

### Mengaktifkan Generate AI (gratis)

1. Buka **Composer → Generate dengan AI**. Klik salah satu preset gratis: **Gemini**, **Groq**, **Mistral**, atau **OpenRouter** — ini mengisi `AI_BASE_URL` + `AI_MODEL`.
2. Ambil API key di halaman penyedia (dari pesan konfirmasi preset) dan tempel ke **Settings → Lingkungan → AI API Key** (`AI_API_KEY`).
3. Generate draf, sesuaikan, lalu jadwalkan/terbitkan.

| Provider | Base URL (preset) | Model default | Catatan gratis |
| --- | --- | --- | --- |
| Google AI Studio (Gemini) | `https://generativelanguage.googleapis.com/v1beta/openai` | `gemini-2.5-flash` | Kuota token gratis paling murah; kualitas terbaik; 1M konteks |
| Groq | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` | Sangat cepat (LPU), ~1.000 permintaan/hari |
| Mistral | `https://api.mistral.ai/v1` | `mistral-small-latest` | Open-weight solid, ada tier gratis |
| OpenRouter | `https://openrouter.ai/api/v1` | `llama-3.3-70b-instruct:free` | Satu kunci banyak model; model `:free` bisa padat jam sibuk |

Rekomendasi: **Gemini** sebagai default (kuota + kualitas), **Groq** kalau butuh kecepatan. Semua endpoint OpenAI-compatible, jadi cukup sesuaikan kunci `AI_BASE_URL`/`AI_MODEL` bila berpindah.

> Fallback lokal (jika env kosong): `admin@tenun.id` / `tenun`. Jangan dipakai produksi.
> `AUTH_SECRET` tidak dikelola via UI (dipakai edge middleware untuk sesi) — wajib identik di semua instance melalui env deploy.

## Setup Aplikasi Meta (sekali saja)

1. Buka [developers.facebook.com](https://developers.facebook.com) → buat app tipe **Business**, tambah produk **Threads**.
2. Di app settings simpan **App ID** (`THREADS_CLIENT_ID`) & **App Secret** (`THREADS_CLIENT_SECRET`).
3. Set **Valid OAuth Redirect URIs** ke `https://localhost:3000/api/threads/callback` (lokal) dan `https://<app>.vercel.app/api/threads/callback` (produksi) — sesuai `THREADS_REDIRECT_URI`.
4. Scope yang diminta: `threads_basic threads_content_publish threads_manage_replies threads_read_replies threads_manage_mentions threads_keyword_search threads_manage_insights`.
5. Agar bisa membalas akun lain & memakai keyword search di produksi: jalankan **App Review** dan minta **Advanced Access** untuk `threads_manage_replies` & `threads_keyword_search`.

## Publish Terjadwal

Cron endpoint dipanggil via scheduler (pilih salah satu):

- **Upstash Cron** (disarankan gratis): `https://<app>/api/cron/publish?token=<CRON_SECRET>` setiap menit; `/api/cron/search?token=<CRON_SECRET>` setiap 15–30 menit.
- **Vercel Cron**: di `vercel.json` — `crons: [{ "path": "/api/cron/publish", "schedule": "* * * * *" }]` (Hobby: minimal 1x/hari — cukup bila jadwal dalam satuan jam).
- **GitHub Actions**: `schedule` workflow memanggil kedua endpoint via `curl`.

Endpoint menolak tanpa token yang cocok dengan `CRON_SECRET`.

## Deploy ke Vercel

```bash
npx vercel
```

1. Buat Postgres di Vercel (atau Neon/Supabase) → pasang `DATABASE_URL` ke env produk.
2. Ubah provider di `prisma/schema.prisma` ke `postgresql`, lalu `npx prisma generate` dan `npx prisma db push` terhadap URL produksi.
3. Set env produksi minimal: `AUTH_SECRET`, `DATABASE_URL`. Sisanya (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CRON_SECRET`, `THREADS_CLIENT_ID/SECRET/REDIRECT_URI`) bisa diatur dari **Settings → Lingkungan** setelah deploy.
4. Login, hubungkan akun Threads via OAuth, aktifkan Vektor keyword, atur jadwal.

> Catatan `@vercel/blob` (gambar): aktifkan Blob store lalu definisikan env `BLOB_READ_WRITE_TOKEN`; tanpa itu upload lokal ke folder `public/uploads`.

## Struktur

```
src/
  lib/        db, session, auth, threads (meta client), activity, publish, reply, http, client (fetch)
  middleware.ts        gate /app + /api, proteksi cron
  app/
    api/       auth, threads, posts, replies, keywords, search, activities, cron, accounts, upload, me, ai, affiliate, health
    app/       shell + halaman: dashboard, posts, replies, search, settings
    login/
design-stitch/ 6 layar HTML/PNG hasil desain Stitch sebagai acuan visual
```