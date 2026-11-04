ABIDINAI — RADAR PEMADAMAN & PENCARIAN KODE POS
================================================

STRUKTUR UTAMA (ROOT)
- index.html       : tampilan peta + panel Informasi Lokasi Terdeteksi
- server.js        : seluruh API Express
- post.js          : data kode pos yang saat ini tersedia
- package.json     : dependensi dan perintah
- sync-postal.js   : alat sinkronisasi (root)
- vercel.json      : routing Vercel
- api/index.js     : adapter tipis wajib untuk Vercel Functions; logika tetap di server.js root

FITUR YANG DIPERBAIKI
1. Panel "Informasi Lokasi Terdeteksi" di bawah peta.
2. Ringkasan total data wilayah, jumlah status padam/gangguan, dan jumlah titik yang punya koordinat.
3. Daftar lokasi deteksi: status, kecamatan, kabupaten/kota, provinsi, kode pos, jumlah laporan, waktu laporan.
4. Titik peta hanya dibuat dari laporan berstatus PADAM/GANGGUAN/RENCANA yang memiliki koordinat.
5. Jika sumber laporan belum tersambung, panel menyatakan dengan jelas bahwa deteksi real-time belum aktif. Tidak ada data palsu/simulasi.
6. Pencarian wilayah/kode pos tetap memakai endpoint /api/postal/search.

PENTING — MENGAPA BELUM ADA LOKASI TERDETEKSI?
Saat paket ini dibuat, LISTRIK_PADAM_API_URL belum dikonfigurasi. Karena itu sistem tidak menerima feed laporan pemadaman dan tidak bisa menyatakan lokasi mana sedang padam. Panel sekarang menampilkan status koneksi dan alasan tersebut, bukan mengarang titik.
ListrikPadam.com adalah sumber komunitas, bukan konfirmasi resmi PLN. Jangan melakukan scraping atau memakai endpoint privat tanpa izin. Minta URL API JSON dan izin dari pengelola.

AKTIFKAN FEED LAPORAN YANG BERIZIN
Di Vercel > Project > Settings > Environment Variables, tambahkan:
LISTRIK_PADAM_API_URL = endpoint JSON resmi yang diberikan pengelola
LISTRIK_PADAM_API_KEY = token bila diwajibkan (opsional)
Lalu redeploy. Format JSON yang didukung:
[
  {"postal_code":"68161","status":"PADAM","report_count":16,"updated_at":"2026-11-04T10:00:00+07:00"}
]
atau {"data":[...]}. Field kode pos: postal_code/kode_pos/postalCode. Field laporan: status, report_count/jumlah_laporan, updated_at/waktu/last_report.

DATA KODE POS
post.js yang disertakan masih dataset yang sebelumnya diberikan, bukan database nasional final. Jangan menganggapnya mencakup seluruh Indonesia. Sinkronisasi melalui emsifa hanya bisa menambah kode pos bila API sumber benar-benar menyediakan field postal_code/kodepos; script sekarang sengaja menolak menimpa post.js jika tidak menemukan satu pun kode pos. Verifikasi sumber dan lisensi dataset nasional sebelum mengganti data.

MENJALANKAN LOKAL
npm install
npm start
Buka http://localhost:3000
Untuk sinkronisasi kode pos (hanya jika sumber menyediakan kode pos): npm run sync:postal

DEPLOY VERCEL
Root Directory: folder proyek ini. Framework Preset: Other. Install Command: npm install. Build Command: kosong.
Environment Variables opsional: LISTRIK_PADAM_API_URL, LISTRIK_PADAM_API_KEY, GROQ_API_KEY.

TES API
/api/health
/api/power
/api/postal/search?q=68111
