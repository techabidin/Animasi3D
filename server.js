const express = require('express');
const path = require('path');
const postalData = require('./post.js');

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({ limit: '32kb' }));
app.use((req, res, next) => {
  if (['/server.js', '/post.js', '/package.json'].includes(req.path)) return res.sendStatus(404);
  next();
});
app.use(express.static(__dirname));

const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

function flattenPostalData() {
  const rows = [];
  for (const [groupName, entries] of Object.entries(postalData)) {
    const parts = groupName.split(',').map(x => x.trim());
    const cityName = parts[0] || groupName;
    const province = parts[1] || 'Tidak diketahui';
    const administrativeType = /^(Kota|Kabupaten)\s/i.test(cityName) ? cityName.match(/^(Kota|Kabupaten)/i)[0] : '';
    const city = cityName.replace(/^(Kabupaten|Kota)\s+/i, '');
    for (const item of entries) {
      rows.push({
        code: String(item.kode_pos).padStart(5, '0'), district: item.kecamatan,
        village: item.desa || '', city, administrativeType, province,
        districtId: item.kecamatan_id || '', lat: item.lat == null ? null : Number(item.lat),
        lng: item.lng == null ? null : Number(item.lng),
        status: 'BELUM ADA LAPORAN', reportCount: 0, lastReport: null,
        source: 'Data wilayah/kode pos; bukan status listrik'
      });
    }
  }
  return rows;
}

const postalRows = flattenPostalData();
let outageCache = { at: 0, rows: [], configured: false, error: null };
const CACHE_MS = 60 * 1000;

// Adapter untuk endpoint/API ListrikPadam yang telah diizinkan pengelolanya.
// Tidak melakukan scraping HTML. Bentuk respons yang diharapkan: array atau {data:[...]}
// item minimal: { postal_code|kode_pos, status, report_count|jumlah_laporan, updated_at|waktu }
async function loadAuthorizedOutages(force = false) {
  const apiUrl = process.env.LISTRIK_PADAM_API_URL;
  if (!apiUrl) return { rows: [], configured: false, error: null };
  if (!force && Date.now() - outageCache.at < CACHE_MS) return outageCache;
  try {
    const headers = { Accept: 'application/json' };
    if (process.env.LISTRIK_PADAM_API_KEY) headers.Authorization = `Bearer ${process.env.LISTRIK_PADAM_API_KEY}`;
    const response = await fetch(apiUrl, { headers, signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error(`Sumber laporan HTTP ${response.status}`);
    const body = await response.json();
    const list = Array.isArray(body) ? body : (Array.isArray(body.data) ? body.data : []);
    const rows = list.map(item => ({
      code: String(item.postal_code ?? item.kode_pos ?? item.postalCode ?? '').replace(/\D/g, '').padStart(5, '0'),
      status: String(item.status ?? item.state ?? 'BELUM ADA LAPORAN').toUpperCase(),
      reportCount: Number(item.report_count ?? item.jumlah_laporan ?? item.reports_count ?? 0),
      lastReport: item.updated_at ?? item.waktu ?? item.last_report ?? null,
      confidence: item.confidence ?? item.keyakinan ?? null,
      detail: item.detail ?? item.catatan ?? ''
    })).filter(x => /^\d{5}$/.test(x.code));
    outageCache = { at: Date.now(), rows, configured: true, error: null };
    return outageCache;
  } catch (error) {
    outageCache = { at: Date.now(), rows: [], configured: true, error: error.message };
    return outageCache;
  }
}

function mergeOutages(rows, outages) {
  const byCode = new Map();
  for (const outage of outages) {
    const current = byCode.get(outage.code);
    if (!current || outage.reportCount > current.reportCount) byCode.set(outage.code, outage);
  }
  return rows.map(row => {
    const hit = byCode.get(row.code);
    return hit ? { ...row, ...hit, status: hit.status } : row;
  });
}

app.get('/api/health', (req, res) => res.json({ ok: true, postalRows: postalRows.length, nationalData: postalRows.some(x => x.province !== 'Jawa Timur') }));

app.get('/api/power', async (req, res) => {
  const feed = await loadAuthorizedOutages();
  const merged = mergeOutages(postalRows, feed.rows);
  res.set('Cache-Control', 'no-store');
  res.json({ data: merged, meta: {
    totalPostalRows: postalRows.length,
    outageSourceConfigured: feed.configured,
    outageSourceError: feed.error,
    outageRecords: feed.rows.length,
    updatedAt: feed.at ? new Date(feed.at).toISOString() : null,
    note: feed.configured ? 'Status laporan komunitas; bukan konfirmasi resmi PLN.' : 'DETEKSI REAL-TIME BELUM AKTIF: feed laporan belum tersambung. Minta endpoint/API resmi dan izin pengelola ListrikPadam.'
  }});
});

app.get('/api/postal/search', async (req, res) => {
  const query = normalize(req.query.q);
  if (!query) return res.status(400).json({ error: 'Masukkan kode pos, kecamatan, kabupaten/kota, atau provinsi.' });
  let results = /^\d{1,5}$/.test(query)
    ? postalRows.filter(row => row.code === query.padStart(5, '0'))
    : postalRows.filter(row => [row.district, row.village, row.city, row.province].some(v => normalize(v).includes(query)));
  if (!results.length) return res.status(404).json({ error: 'Data kode pos/wilayah tidak ditemukan. Jalankan npm run sync:postal terlebih dahulu.' });

  const feed = await loadAuthorizedOutages();
  results = mergeOutages(results, feed.rows);
  const first = results[0];
  let location = first.lat != null && first.lng != null && Number.isFinite(first.lat) && Number.isFinite(first.lng)
    ? { lat: first.lat, lng: first.lng, displayName: `${first.district}, ${first.city}, ${first.province}` }
    : null;

  // Fallback geocoding hanya jika dataset koordinat tidak tersedia.
  if (!location) {
    try {
      const q = `Kecamatan ${first.district}, ${first.city}, ${first.province}, Indonesia`;
      const url = 'https://nominatim.openstreetmap.org/search?' + new URLSearchParams({ q, format: 'jsonv2', limit: '1' });
      const r = await fetch(url, { headers: { 'User-Agent': 'AbidinAI-Radar/1.0', 'Accept-Language': 'id' }, signal: AbortSignal.timeout(10000) });
      const hits = r.ok ? await r.json() : [];
      if (hits[0]) location = { lat: Number(hits[0].lat), lng: Number(hits[0].lon), displayName: hits[0].display_name };
    } catch (_) {}
  }
  res.json({ query: req.query.q, count: results.length, results: results.slice(0, 100), location,
    outageSourceConfigured: feed.configured,
    note: 'Kode pos dipetakan dari desa/kelurahan. Status listrik berasal dari laporan komunitas jika sumber API berizin telah dikonfigurasi. Belum ada laporan bukan berarti listrik menyala.' });
});

app.post('/api/assistant', async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  const question = String(req.body && req.body.question || '').trim();
  if (!question) return res.status(400).json({ error: 'Pertanyaan kosong.' });
  if (!apiKey) return res.status(503).json({ error: 'Asisten AI belum dikonfigurasi. Tambahkan GROQ_API_KEY.' });
  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'openai/gpt-oss-20b', messages: [
        { role: 'system', content: 'Kamu AI Emergency Assistant AbidinAI. Jawab Bahasa Indonesia. Jangan mengarang status pemadaman. Belum ada laporan bukan berarti listrik menyala. Laporan komunitas bukan konfirmasi resmi PLN.' },
        { role: 'user', content: question }
      ], temperature: 0.4, max_tokens: 1024 })
    });
    const data = await upstream.json();
    if (!upstream.ok) return res.status(upstream.status).json({ error: data.error?.message || 'Layanan AI gagal.' });
    res.json({ answer: data.choices?.[0]?.message?.content || 'Tidak ada jawaban.' });
  } catch (error) { res.status(502).json({ error: 'Gagal menghubungi layanan AI.' }); }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
if (require.main === module) app.listen(PORT, () => console.log(`AbidinAI Radar aktif di port ${PORT}`));
module.exports = app;
