# RuangUang

Dashboard keuangan pribadi berbahasa Indonesia. Aplikasi ini berjalan sebagai situs statis tanpa layanan luar, akun, atau kunci API. Catatan yang kamu buat disimpan di `localStorage` browser pada perangkat yang sedang dipakai.

## Fitur

- Ringkasan saldo, pemasukan, pengeluaran, arus kas enam bulan, dan komposisi pengeluaran.
- Akses cepat untuk mencatat pemasukan/pengeluaran, mengatur anggaran, dan membuka laporan.
- Tombol untuk menyamarkan nominal di beranda saat melihat layar bersama.
- Laporan bulanan dengan perbandingan periode dan rincian kategori.
- Rekap Excel berwarna dengan enam lembar: ringkasan, transaksi, anggaran, target, tagihan, dan arus kas bulanan.
- Tambah, cari, filter, hapus, dan ekspor transaksi ke CSV.
- Anggaran per kategori dengan indikator pemakaian.
- Target tabungan dengan pencatatan setoran.
- Kalkulator bunga majemuk, cicilan, pembagian 50/30/20, dan lama mencapai target.
- Kalender transaksi dan tagihan, jam otomatis WITA, serta jadwal tagihan yang bisa ditandai lunas.
- Insight sederhana dari catatan, tema terang/gelap, serta ekspor dan impor cadangan data JSON.
- Tampilan responsif untuk ponsel, tablet, dan desktop.
- Tipografi berukuran sedang, jam WITA di beranda, dan menu laporan bulanan.
- Dapat dipasang sebagai aplikasi web dan dibuka offline setelah kunjungan online pertama.

> Data pertama yang tampil adalah data contoh agar dashboard langsung terlihat. Hapus atau ganti data contoh dengan catatanmu sendiri. Aplikasi ini tidak terhubung ke bank dan tidak memberikan rekomendasi investasi.

## Jalankan di komputer

Pastikan Node.js 18 atau lebih baru sudah terpasang. Ekstrak berkas situs, buka PowerShell di folder yang berisi `package.json`, lalu jalankan:

```powershell
npm start
```

Buka `http://localhost:8080`. Untuk perintah pengembangan, gunakan `npm run dev`. Tidak perlu menjalankan `npm install`; aplikasi ini tidak memakai paket tambahan.

## Deploy online

### Vercel

1. Unggah isi folder ini ke repositori Git atau pilih folder ini saat membuat proyek baru.
2. Di Vercel, pilih **Other** sebagai framework preset.
3. Biarkan **Build Command** dan **Output Directory** kosong, lalu deploy. Berkas `vercel.json` memasang header keamanan.

### Netlify

1. Seret folder `ruang-uang` ke halaman deploy manual Netlify, atau hubungkan repositori yang berisi folder ini.
2. Untuk folder dalam repositori, isi publish directory dengan `ruang-uang`. Tidak perlu build command.
3. Berkas `_headers` memasang header keamanan pada deploy Netlify.

### Cloudflare Workers

Konfigurasi `wrangler.jsonc` sudah disiapkan untuk menyajikan situs statis dari folder ini. Jika proyek terhubung ke GitHub, pastikan seluruh isi folder ini berada di root repositori. Di pengaturan build Cloudflare, gunakan **Build command** kosong, **Root directory** `/`, dan **Deploy command** `npx wrangler deploy`.

Kamu juga dapat mengunggah berkas situs ke layanan hosting statis yang menerima HTML, CSS, dan JavaScript. Konfigurasi header keamanan bergantung pada penyedia hosting.

## Keamanan dan batasan

- Konten teks yang dimasukkan pengguna ditampilkan dengan escaping; aplikasi tidak menggunakan `eval`, skrip pihak ketiga, font CDN, atau permintaan jaringan.
- Konfigurasi deploy memasang Content Security Policy dan header keamanan dasar. Aturan gaya mengizinkan atribut style yang diperlukan oleh visualisasi kecil di aplikasi.
- Aplikasi statis tidak menyediakan akun, enkripsi data lokal, sinkronisasi, atau autentikasi server. Hindari menyimpan kata sandi bank, nomor kartu, PIN, dan informasi rahasia lain. Browser yang sama dapat membaca data lokal ini.
- Kode yang dikirim ke browser dapat dilihat dan disalin. Tidak ada cara andal untuk membuat aplikasi sisi-klien antisalinnya; perlindungan yang lebih kuat memerlukan arsitektur server dan kontrol akses.
- Kalkulator memberi perkiraan matematis. Bunga, biaya, pajak, inflasi, syarat pemberi pinjaman, dan hasil investasi nyata dapat berbeda.

## Berkas

- `index.html` — halaman aplikasi.
- `styles.css` — tampilan dan layout responsif.
- `app.js` — fungsi aplikasi dan penyimpanan lokal.
- `xlsx-export.js` — pembuat rekap Excel langsung di browser, tanpa paket tambahan.
- `package.json` dan `server.mjs` — perintah `npm start` dan server lokal tanpa paket tambahan.
- `vercel.json` dan `_headers` — header keamanan untuk deploy Vercel/Netlify.
