const express = require('express');
const path = require('path');
const powerData = require('./post.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use(express.static(__dirname, {
  index: 'index.html',
  setHeaders(res, filePath) {
    if (filePath.endsWith('server.js') || filePath.endsWith('post.js')) {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.statusCode = 404;
    }
  }
}));

const normalize = value => String(value || '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

function flattenPowerData() {
  const rows = [];
  if (Array.isArray(powerData)) {
    for (const item of powerData) {
      if (!item || typeof item !== 'object') continue;
      rows.push({
        code: String(item.kode_pos || item.postal_code || item.code || ''),
        district: item.kecamatan || item.district || '',
        city: item.kabupaten || item.kota || item.city || '',
        province: item.provinsi || item.province || '',
        raw: item
      });
    }
    return rows;
  }

  for (const [areaName, entries] of Object.entries(powerData || {})) {
    if (!Array.isArray(entries)) continue;
    const match = areaName.match(/^(Kabupaten|Kota)\s+(.+)$/i);
    const adminType = match ? match[1] : '';
    const city = match ? match[2] : areaName;
    for (const item of entries) {
      if (!item || typeof item !== 'object') continue;
      rows.push({
        code: String(item.kode_pos || item.postal_code || item.code || ''),
        district: item.kecamatan || item.district || '',
        city,
        province: item.provinsi || item.province || 'Jawa Timur',
        administrativeType: adminType,
        raw: item
      });
    }
  }
  return rows;
}
const powerRows = flattenPowerData();

app.get('/api/health', (req, res) => res.json({
  ok: true,
  endpoint: '/api/power',
  postalRecords: powerRows.length,
  areaGroups: Object.keys(powerData || {}).length
}));

// Endpoint API yang diberikan pengguna: mengirim isi post.js apa adanya.
app.get('/api/power', (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(200).json(powerData);
  } catch (err) {
    console.error('ERROR API POWER:', err);
    return res.status(500).json({
      error: 'Gagal memuat data pemadaman/wilayah',
      details: err.message
    });
  }
});

// Pencarian kode pos/wilayah memakai sumber data API /api/power (post.js).
app.get('/api/postal/search', (req, res) => {
  const q = normalize(req.query.q);
  if (!q) return res.status(400).json({ error: 'Masukkan kode pos atau nama kecamatan.' });
  let results;
  if (/^\d{1,5}$/.test(q)) {
    results = powerRows.filter(row => normalize(row.code) === q.padStart(5, '0'));
  } else {
    results = powerRows.filter(row =>
      normalize(row.district).includes(q) ||
      normalize(row.city).includes(q) ||
      normalize(row.province).includes(q)
    );
  }
  if (!results.length) {
    return res.status(404).json({ error: 'Data tidak ditemukan dalam post.js yang saat ini terpasang.' });
  }
  res.json({
    query: req.query.q,
    count: results.length,
    results: results.map(({raw, ...row}) => row),
    source: '/api/power → post.js',
    note: 'Data wilayah/kode pos, bukan bukti bahwa listrik sedang padam.'
  });
});

// Laporan padam aktual adalah data terpisah dari daftar kode pos.
// Format: env POWER_OUTAGES_JSON berisi JSON array laporan aktual.
app.get('/api/outages', (req, res) => {
  try {
    const reports = process.env.POWER_OUTAGES_JSON
      ? JSON.parse(process.env.POWER_OUTAGES_JSON)
      : [];
    if (!Array.isArray(reports)) throw new Error('POWER_OUTAGES_JSON harus berupa JSON array.');
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      source: process.env.POWER_OUTAGES_SOURCE || 'Belum ada sumber laporan pemadaman',
      reports
    });
  } catch (err) {
    res.status(500).json({ error: 'POWER_OUTAGES_JSON tidak valid: ' + err.message, reports: [] });
  }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server lokal aktif di http://localhost:${PORT}`));
}
module.exports = app;
