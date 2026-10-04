/**
 * Penjaga secret aplikasi.
 *
 * Prinsip keamanan: fail-fast di production. Nilai default yang tertulis
 * di repo ini BISA DIBACA SIAPA PUN di GitHub, jadi tidak boleh dipakai
 * di production. Kalau secret belum di-set, aplikasi menolak berjalan
 * dengan pesan yang jelas — bukan diam-diam tidak aman.
 *
 * File ini sengaja tanpa dependensi node:* agar aman dipakai di Edge
 * runtime (middleware).
 */

const DEV_AUTH_FALLBACK = "tenun-dev-secret-change-me-0123456789";

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * AUTH_SECRET efektif.
 * - Production: WAJIB di-set (min. 32 karakter acak). Kalau tidak, throw.
 * - Development: fallback ke default lokal + warning agar tetap nyaman.
 */
export function requireAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (secret) {
    if (secret.length < 32 && isProduction()) {
      throw new Error(
        "[tenun] AUTH_SECRET terlalu pendek (minimal 32 karakter acak). " +
          "Set di Vercel → Project Settings → Environment Variables, lalu redeploy."
      );
    }
    return secret;
  }
  if (isProduction()) {
    throw new Error(
      "[tenun] AUTH_SECRET belum di-set — aplikasi MENOLAK berjalan tanpa secret sesi di production. " +
        "Set AUTH_SECRET (minimal 32 karakter acak) di Vercel → Project Settings → Environment Variables, lalu redeploy."
    );
  }
  console.warn(
    "[tenun] AUTH_SECRET kosong — memakai secret DEV. Jangan deploy ke production dalam kondisi ini."
  );
  return DEV_AUTH_FALLBACK;
}
