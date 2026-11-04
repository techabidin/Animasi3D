/**
 * Mengunduh data administrasi + kode pos Indonesia dari API statis emsifa v2.
 * Jalankan: npm run sync:postal
 * Sumber: https://www.emsifa.com/api-wilayah-indonesia/v2
 * Data kode pos terhubung ke desa/kelurahan; satu kecamatan bisa punya banyak kode pos.
 */
const fs = require('fs');
const path = require('path');

const BASE = 'https://www.emsifa.com/api-wilayah-indonesia/v2';
const OUT = path.join(__dirname, 'post.js');
const CONCURRENCY = 8;

async function getJson(url) {
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const json = await res.json();
  return Array.isArray(json) ? json : (Array.isArray(json.data) ? json.data : []);
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      out[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

function first(...values) {
  return values.find(v => v !== undefined && v !== null && String(v).trim() !== '');
}

(async () => {
  console.log('Mengambil daftar provinsi...');
  const provinces = await getJson(`${BASE}/provinces.json`);
  if (!provinces.length) throw new Error('Daftar provinsi kosong; proses dihentikan agar post.js lama tidak tertimpa.');

  const groups = {};
  let districtCount = 0;
  let villageCount = 0;
  let postalRows = 0;

  await mapLimit(provinces, 3, async province => {
    const provinceId = first(province.id, province.code, province.kode);
    const provinceName = first(province.name, province.nama, 'Provinsi tidak diketahui');
    const regencies = await getJson(`${BASE}/regencies/${encodeURIComponent(provinceId)}.json`);

    await mapLimit(regencies, 4, async regency => {
      const regencyId = first(regency.id, regency.code, regency.kode);
      const regencyName = first(regency.name, regency.nama, 'Wilayah tidak diketahui');
      const districtList = await getJson(`${BASE}/districts/${encodeURIComponent(regencyId)}.json`);
      districtCount += districtList.length;

      await mapLimit(districtList, CONCURRENCY, async district => {
        const districtId = first(district.id, district.code, district.kode);
        const districtName = first(district.name, district.nama, 'Kecamatan tidak diketahui');
        const villages = await getJson(`${BASE}/villages/${encodeURIComponent(districtId)}.json`);
        villageCount += villages.length;
        const key = `${regencyName}, ${provinceName}`;
        if (!groups[key]) groups[key] = [];

        const byPostal = new Map();
        for (const village of villages) {
          const raw = first(village.postal_code, village.postalCode, village.kodepos, village.kode_pos);
          const codes = Array.isArray(raw) ? raw : String(raw || '').split(/[;,|]/).map(x => x.trim());
          for (const candidate of codes) {
            const code = String(candidate || '').replace(/\D/g, '').padStart(5, '0');
            if (!/^\d{5}$/.test(code) || code === '00000') continue;
            if (!byPostal.has(code)) byPostal.set(code, []);
            byPostal.get(code).push({
              desa: first(village.name, village.nama, ''),
              village_id: first(village.id, village.code, village.kode, ''),
              lat: first(village.latitude, village.lat, null),
              lng: first(village.longitude, village.lng, village.lon, null)
            });
          }
        }

        for (const [kode_pos, desaList] of byPostal.entries()) {
          groups[key].push({
            kode_pos,
            kecamatan: districtName,
            desa: [...new Set(desaList.map(x => x.desa).filter(Boolean))].join(' / '),
            kecamatan_id: String(districtId),
            desa_ids: desaList.map(x => String(x.village_id)).filter(Boolean),
            lat: district.latitude ?? district.lat ?? null,
            lng: district.longitude ?? district.lng ?? district.lon ?? null,
            provinsi: provinceName
          });
          postalRows++;
        }
      });
    });
    console.log(`Selesai: ${provinceName}`);
  });

  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => a.kode_pos.localeCompare(b.kode_pos));
  }

  if (postalRows === 0) throw new Error('Sumber API tidak menyediakan field kode pos. post.js lama dipertahankan; gunakan dataset kode pos nasional yang memiliki sumber/izin jelas.');

  const output = `// DIBUAT OTOMATIS oleh scripts/sync-postal.js\n// Sumber: API Statis Wilayah Indonesia emsifa v2; kode pos tingkat desa/kelurahan.\n// Jangan mengedit manual; jalankan npm run sync:postal untuk memperbarui.\nmodule.exports = ${JSON.stringify(groups, null, 2)};\n`;
  fs.writeFileSync(OUT, output, 'utf8');
  console.log(`Berhasil: ${provinces.length} provinsi, ${districtCount} kecamatan, ${villageCount} desa/kelurahan, ${postalRows} pasangan kode-pos/kecamatan.`);
  console.log(`File dibuat: ${OUT}`);
})().catch(err => {
  console.error('Sinkronisasi gagal:', err.message);
  process.exitCode = 1;
});
