const powerData = [
  // --- KABUPATEN JEMBER ---
  { code: '68111', district: 'Patrang', city: 'Kabupaten Jember', lat: -8.1582, lng: 113.7042, status: 'Padam Terkonfirmasi', durasi: '12:00 - 15:00 WIB', level: 'Padam' },
  { code: '68121', district: 'Sumbersari', city: 'Kabupaten Jember', lat: -8.1689, lng: 113.7022, status: 'Padam Terkonfirmasi', durasi: '11:30 - 14:30 WIB', level: 'Padam' },
  { code: '68131', district: 'Kaliwates', city: 'Kabupaten Jember', lat: -8.1721, lng: 113.6745, status: 'Normal', durasi: 'Sistem Optimal', level: 'Normal' },
  { code: '68132', district: 'Ambulu', city: 'Kabupaten Jember', lat: -8.3333, lng: 113.6167, status: 'Laporan Belum Terkonfirmasi', durasi: 'Menunggu verifikasi', level: 'Siaga' },
  { code: '68152', district: 'Rambipuji', city: 'Kabupaten Jember', lat: -8.2167, lng: 113.6167, status: 'Normal', durasi: 'Sistem Optimal', level: 'Normal' },
  { code: '68161', district: 'Balung', city: 'Kabupaten Jember', lat: -8.3167, lng: 113.5333, status: 'Normal', durasi: 'Sistem Optimal', level: 'Normal' },
  { code: '68164', district: 'Puger', city: 'Kabupaten Jember', lat: -8.3833, lng: 113.5833, status: 'Laporan Belum Terkonfirmasi', durasi: 'Laporan warga', level: 'Siaga' },
  { code: '68196', district: 'Ledokombo', city: 'Kabupaten Jember', lat: -8.1333, lng: 113.8833, status: 'Laporan Belum Terkonfirmasi', durasi: 'Pemeriksaan petugas', level: 'Siaga' },

  // --- KABUPATEN LUMAJANG ---
  { code: '67311', district: 'Lumajang', city: 'Kabupaten Lumajang', lat: -8.1333, lng: 113.2167, status: 'Padam Terkonfirmasi', durasi: '09:00 - 12:00 WIB', level: 'Padam' },
  { code: '67352', district: 'Padang', city: 'Kabupaten Lumajang', lat: -8.0833, lng: 113.2500, status: 'Normal', durasi: 'Sistem Optimal', level: 'Normal' },
  { code: '67356', district: 'Klakah', city: 'Kabupaten Lumajang', lat: -7.9667, lng: 113.3167, status: 'Normal', durasi: 'Sistem Optimal', level: 'Normal' },
  { code: '67357', district: 'Ranuyoso', city: 'Kabupaten Lumajang', lat: -7.9000, lng: 113.3333, status: 'Normal', durasi: 'Sistem Optimal', level: 'Normal' },
  { code: '67358', district: 'Kedungjajang', city: 'Kabupaten Lumajang', lat: -8.1167, lng: 113.2167, status: 'Laporan Belum Terkonfirmasi', durasi: 'Gangguan lokal', level: 'Siaga' },
  { code: '67359', district: 'Rowokangkung', city: 'Kabupaten Lumajang', lat: -8.2333, lng: 113.3167, status: 'Normal', durasi: 'Sistem Optimal', level: 'Normal' },
  { code: '67373', district: 'Candipuro', city: 'Kabupaten Lumajang', lat: -8.2167, lng: 113.1333, status: 'Padam Terkonfirmasi', durasi: 'Pemeliharaan jalur', level: 'Padam' },

  // --- KABUPATEN BONDOWOSO ---
  { code: '68211', district: 'Bondowoso', city: 'Kabupaten Bondowoso', lat: -7.9139, lng: 113.8219, status: 'Padam Terkonfirmasi', durasi: '10:00 - 13:00 WIB', level: 'Padam' },
  { code: '68263', district: 'Tamanan', city: 'Kabupaten Bondowoso', lat: -7.9833, lng: 113.7833, status: 'Laporan Belum Terkonfirmasi', durasi: 'Pemeriksaan lapangan', level: 'Siaga' },
  { code: '68285', district: 'Prajekan', city: 'Kabupaten Bondowoso', lat: -7.7833, lng: 113.8833, status: 'Normal', durasi: 'Sistem Optimal', level: 'Normal' },
  { code: '68289', district: 'Sumberwringin', city: 'Kabupaten Bondowoso', lat: -7.9667, lng: 113.9833, status: 'Normal', durasi: 'Sistem Optimal', level: 'Normal' },

  // --- KABUPATEN BANYUWANGI ---
  { code: '68411', district: 'Banyuwangi', city: 'Kabupaten Banyuwangi', lat: -8.2192, lng: 114.3691, status: 'Normal', durasi: 'Sistem Optimal', level: 'Normal' },
  { code: '68461', district: 'Kabat', city: 'Kabupaten Banyuwangi', lat: -8.2667, lng: 114.3333, status: 'Normal', durasi: 'Sistem Optimal', level: 'Normal' },
  { code: '68462', district: 'Rogojampi', city: 'Kabupaten Banyuwangi', lat: -8.3000, lng: 114.3167, status: 'Normal', durasi: 'Sistem Optimal', level: 'Normal' },
  { code: '68472', district: 'Muncar', city: 'Kabupaten Banyuwangi', lat: -8.4333, lng: 114.3333, status: 'Normal', durasi: 'Sistem Optimal', level: 'Normal' },

  // --- KABUPATEN BLITAR ---
  { code: '66151', district: 'Sanankulon', city: 'Kabupaten Blitar', lat: -8.0833, lng: 112.1167, status: 'Normal', durasi: 'Sistem Optimal', level: 'Normal' },
  { code: '66171', district: 'Kanigoro', city: 'Kabupaten Blitar', lat: -8.1000, lng: 112.2167, status: 'Normal', durasi: 'Sistem Optimal', level: 'Normal' },
  { code: '66184', district: 'Wlingi', city: 'Kabupaten Blitar', lat: -8.1000, lng: 112.3167, status: 'Normal', durasi: 'Sistem Optimal', level: 'Normal' },

  // --- KABUPATEN BOJONEGORO ---
  { code: '62111', district: 'Bojonegoro', city: 'Kabupaten Bojonegoro', lat: -7.1500, lng: 111.8833, status: 'Normal', durasi: 'Sistem Optimal', level: 'Normal' },
  { code: '62152', district: 'Kalitidu', city: 'Kabupaten Bojonegoro', lat: -7.1667, lng: 111.7833, status: 'Normal', durasi: 'Sistem Optimal', level: 'Normal' },

  // --- KOTA SURABAYA ---
  { code: '60241', district: 'Wonokromo', city: 'Kota Surabaya', lat: -7.2900, lng: 112.7400, status: 'Normal', durasi: 'Sistem Optimal', level: 'Normal' },
  { code: '60111', district: 'Sukolilo', city: 'Kota Surabaya', lat: -7.2833, lng: 112.7833, status: 'Normal', durasi: 'Sistem Optimal', level: 'Normal' },

  // --- KOTA MALANG ---
  { code: '65111', district: 'Klojen', city: 'Kota Malang', lat: -7.9833, lng: 112.6333, status: 'Normal', durasi: 'Sistem Optimal', level: 'Normal' },
  { code: '65121', district: 'Blimbing', city: 'Kota Malang', lat: -7.9500, lng: 112.6500, status: 'Normal', durasi: 'Sistem Optimal', level: 'Normal' }
];

module.exports = powerData;
