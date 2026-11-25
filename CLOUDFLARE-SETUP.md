# KAU Access API — tahap fondasi

Branch: feature/cloudflare-access-v1

## Berkas
- worker.js: API OTP (email Resend / WhatsApp Fonnte), verifikasi kontak, dan pendaftaran awal.
- schema.sql: skema D1.
- wrangler.toml: konfigurasi awal; database_id harus diganti.

## Konfigurasi Cloudflare
1. Buat D1 database bernama kau-access.
2. Jalankan schema.sql pada database.
3. Isi database_id pada wrangler.toml.
4. Atur Worker secrets: OTP_PEPPER (acak panjang), RESEND_API_KEY, OTP_FROM_EMAIL, FONNTE_TOKEN.
5. Atur ALLOWED_ORIGINS sesuai URL GitHub Pages.
6. Deploy Worker dan uji GET /health.

## Batas tahap ini
API ini belum boleh dipakai untuk membuka ekspor atau menganggap pendaftaran sudah aktif. Persetujuan admin, autentikasi admin, aktivasi perangkat, endpoint pemeriksaan izin/ekspor, rate limiting, dan integrasi frontend masih harus diselesaikan. Device ID dari browser adalah pengenal instalasi, bukan bukti perangkat keras yang tidak dapat dipalsukan. Gunakan token sesi server dan persetujuan admin untuk keputusan akses.
