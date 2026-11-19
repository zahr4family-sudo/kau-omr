KAU OMR — PAKET PWA
================================

ISI FOLDER
- index.html: aplikasi utama
- manifest.json: identitas PWA dan ikon
- sw.js: service worker untuk cache/offline app shell
- icons/: ikon 192, 512, maskable 512
- template-import-siswa-nilai.csv: contoh format impor data siswa/jawaban/nilai

CARA MENJALANKAN / UJI
1. Ekstrak folder ini ke komputer.
2. Unggah seluruh isi folder ke hosting HTTPS (misalnya Netlify, Cloudflare Pages, GitHub Pages).
3. Buka URL HTTPS hasil deploy. Jangan membuka index.html langsung dari file:// karena kamera dan service worker memerlukan secure context.
4. Izinkan kamera saat diminta. Jika kamera tidak tersedia, gunakan unggah foto.
5. Uji PWA melalui Chrome DevTools > Application > Manifest dan Service Workers.

CARA MEMBUAT APK DENGAN PWABUILDER
1. Deploy folder lengkap ke hosting HTTPS sehingga manifest.json, sw.js, icons/icon-192.png dan icons/icon-512.png dapat diakses.
2. Buka https://www.pwabuilder.com/
3. Masukkan URL HTTPS aplikasi KAU, lalu tekan Start.
4. Periksa hasil validasi. Pastikan manifest terbaca, ikon 192/512 terdeteksi, start_url dan scope benar, serta situs berjalan melalui HTTPS.
5. Pilih Package for Stores / Android (Android package).
6. Ikuti wizard Android. Isi nama aplikasi, package ID unik (contoh: id.sch.kau.omr), versi, ikon, dan konfigurasi signing sesuai petunjuk yang tampil.
7. Unduh paket Android yang dihasilkan (umumnya proyek/paket TWA). Jika PWABuilder meminta signing key, simpan keystore dan password dengan aman; jangan hilangkan.
8. Untuk uji instalasi, gunakan APK yang disediakan bila opsi tersebut tersedia. Untuk distribusi Play Store, ikuti format AAB dan proses Play Console terbaru.
9. Instal pada HP Android dan uji kamera, unggah foto, input nilai, ekspor Excel, serta mode offline.

CATATAN PENTING
- PWA membutuhkan HTTPS untuk kamera dan service worker, kecuali localhost.
- Service worker menyimpan app shell. Library XLSX saat ini dimuat dari CDN, sehingga ekspor Excel memerlukan internet pada pemuatan pertama dan belum dijamin offline. Untuk offline penuh, simpan xlsx.full.min.js secara lokal dan tambahkan ke APP_SHELL pada sw.js.
- Data aplikasi saat ini disimpan di localStorage browser/perangkat. Hapus data browser atau ganti perangkat dapat menghilangkan data. Ekspor Excel/CSV sebagai cadangan rutin.
- Scanner ini membaca template LJK yang dibuat aplikasi. Hasil scan tetap harus diverifikasi sebelum nilai ditetapkan. Pencahayaan, kemiringan, ukuran cetak, dan kualitas foto dapat memengaruhi hasil.
- Fitur CSV mendukung header: nis/nama/pg/bs/ur/remedial. Kolom ur memisahkan skor per soal dengan tanda | atau ;. B-S dapat diinput manual atau CSV (B/S); scanner kamera LJK saat ini membaca PG, bukan bulatan B-S. Kolom nama wajib ada.
- Untuk CSV, contoh: nis,nama,pg,bs,ur,remedial
  001,CONTOH SISWA,ABCD,BSSB,3|2|4,
