const express = require('express');
const path = require('path');
const rawData = require('./post.js'); // Memuat langsung dari post.js

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API Endpoint Pemadaman Listrik (/api/power)
app.get('/api/power', (req, res) => {
  try {
    let flatList = [];
    let index = 0;

    // Mengubah struktur objek bersarang post.js menjadi array datar untuk Leaflet Map
    for (const [cityName, items] of Object.entries(rawData)) {
      items.forEach(item => {
        const baseLat = -7.8;
        const baseLng = 112.5;
        const lat = baseLat - ((index * 0.01) % 3.0);
        const lng = baseLng + ((index * 0.015) % 3.0);

        const statuses = ['Normal', 'Pemeliharaan JTM 20kV', 'Gangguan Distribusi', 'Normal'];
        const levels = ['Normal', 'Siaga', 'Padam', 'Normal'];
        const status = statuses[index % statuses.length];
        const level = levels[index % levels.length];

        flatList.push({
          code: String(item.kode_pos),
          district: item.kecamatan,
          city: cityName.replace('Kabupaten ', '').replace('Kota ', ''),
          lat: parseFloat(lat.toFixed(4)),
          lng: parseFloat(lng.toFixed(4)),
          status: status,
          durasi: level === 'Normal' ? 'Sistem Optimal' : '09:00 - 14:00 WIB',
          level: level
        });
        index++;
      });
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(flatList);
  } catch (err) {
    console.error('ERROR API POWER:', err);
    return res.status(500).json({ error: 'Gagal memuat database post.js', details: err.message });
  }
});

// Route utama melayani index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server lokal aktif di http://localhost:${PORT}`);
  });
}

module.exports = app;
 
