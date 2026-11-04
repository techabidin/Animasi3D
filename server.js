const express = require('express');
const path = require('path');
const postalData = require('./post.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '32kb' }));

// Jangan izinkan browser mengunduh file backend/database mentah.
app.use((req, res, next) => {
  if (['/server.js', '/post.js', '/package.json'].includes(req.path)) {
    return res.sendStatus(404);
  }
  next();
});
app.use(express.static(__dirname));

function normalize(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

function flattenPostalData() {
  const rows = [];
  for (const [cityName, entries] of Object.entries(postalData)) {
    const city = cityName.replace(/^(Kabupaten|Kota)\s+/i, '');
    const administrativeType = /^Kota\s/i.test(cityName) ? 'Kota' : 'Kabupaten';
    for (const item of entries) {
      rows.push({
        code: String(item.kode_pos).padStart(5, '0'),
        district: item.kecamatan,
        city,
        administrativeType,
        province: 'Jawa Timur',
        status: 'Belum ada data status listrik',
        durasi: 'Tidak tersedia',
        level: 'Tidak diketahui'
      });
    }
  }
  return rows;
}

const postalRows = flattenPostalData();
const geocodeCache = new Map();
let lastGeocodeAt = 0;

app.get('/api/power', (req, res) => {
  res.set('Cache-Control', 'public, max-age=300');
  res.json(postalRows);
});

async function geocodeDistrict(district, city) {
  const key = normalize(district + '|' + city);
  if (geocodeCache.has(key)) return geocodeCache.get(key);

  // Nominatim meminta penggunaan yang hemat dan tidak boleh dibanjiri request.
  const wait = Math.max(0, 1100 - (Date.now() - lastGeocodeAt));
  if (wait) await new Promise(resolve => setTimeout(resolve, wait));
  lastGeocodeAt = Date.now();

  const query = `Kecamatan ${district}, ${city}, Jawa Timur, Indonesia`;
  const url = 'https://nominatim.openstreetmap.org/search?' +
    new URLSearchParams({ q: query, format: 'jsonv2', limit: '1' });

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PostalDistrictMap/1.0 (postal lookup application)',
        'Accept-Language': 'id'
      }
    });
    if (!response.ok) throw new Error('Geocoding HTTP ' + response.status);
    const items = await response.json();
    const location = items && items[0] ? {
      lat: Number(items[0].lat),
      lng: Number(items[0].lon),
      displayName: items[0].display_name
    } : null;
    geocodeCache.set(key, location);
    return location;
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return null;
  }
}

app.get('/api/postal/search', async (req, res) => {
  const query = normalize(req.query.q);
  if (!query) return res.status(400).json({ error: 'Masukkan kode pos atau nama kecamatan.' });

  let results;
  if (/^\d{1,5}$/.test(query)) {
    results = postalRows.filter(row => row.code === query.padStart(5, '0'));
  } else {
    results = postalRows.filter(row =>
      normalize(row.district).includes(query) ||
      normalize(row.city).includes(query)
    );
  }

  if (!results.length) {
    return res.status(404).json({ error: 'Data kode pos/kecamatan tidak ditemukan.' });
  }

  const first = results[0];
  const location = await geocodeDistrict(first.district, first.city);
  res.json({
    query: req.query.q,
    count: results.length,
    results,
    location,
    locationAccuracy: location ? 'Titik representasi/pusat kecamatan dari geocoding' : null,
    note: 'Database yang tersedia hanya memetakan kode pos ke kecamatan. Kode pos bukan selalu satu titik koordinat; untuk akurasi tingkat desa/kelurahan diperlukan dataset lebih rinci.'
  });
});

app.post('/api/assistant', async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  const question = String(req.body && req.body.question || '').trim();
  if (!question) return res.status(400).json({ error: 'Pertanyaan kosong.' });
  if (!apiKey) return res.status(503).json({ error: 'Asisten AI belum dikonfigurasi. Tambahkan GROQ_API_KEY di environment server.' });

  try {
    const upstream = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b',
        messages: [
          { role: 'system', content: 'Kamu adalah AI Emergency Assistant. Jawab dalam Bahasa Indonesia. Jangan mengarang status pemadaman listrik; database kode pos tidak berisi data pemadaman real-time.' },
          { role: 'user', content: question }
        ],
        temperature: 0.4,
        max_tokens: 1024
      })
    });
    const data = await upstream.json();
    if (!upstream.ok) return res.status(upstream.status).json({ error: data.error && data.error.message || 'Layanan AI gagal.' });
    res.json({ answer: data.choices?.[0]?.message?.content || 'Tidak ada jawaban.' });
  } catch (error) {
    console.error('Assistant error:', error);
    res.status(502).json({ error: 'Gagal menghubungi layanan AI.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server aktif di http://localhost:${PORT}`));
}

module.exports = app;
