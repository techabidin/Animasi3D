const express = require('express');
const path = require('path');
const rawData = require('./post.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Titik pusat koordinat (Latitude & Longitude) yang akurat per Kabupaten/Kota di Jatim
const cityCoordinates = {
  "Jember": { lat: -8.1844, lng: 113.7024 },
  "Bangkalan": { lat: -7.0250, lng: 112.7419 },
  "Banyuwangi": { lat: -8.2192, lng: 114.3691 },
  "Blitar": { lat: -8.0954, lng: 112.1609 },
  "Bojonegoro": { lat: -7.1550, lng: 111.8967 },
  "Bondowoso": { lat: -7.9139, lng: 113.8217 },
  "Gresik": { lat: -7.1561, lng: 112.6552 },
  "Jombang": { lat: -7.5461, lng: 112.2338 },
  "Kediri": { lat: -7.8480, lng: 112.0178 },
  "Lamongan": { lat: -7.1219, lng: 112.4168 },
  "Lumajang": { lat: -8.1326, lng: 113.2201 },
  "Madiun": { lat: -7.6298, lng: 111.5239 },
  "Malang": { lat: -7.9666, lng: 112.6326 },
  "Mojokerto": { lat: -7.4726, lng: 112.4339 },
  "Pasuruan": { lat: -7.6453, lng: 112.9075 },
  "Probolinggo": { lat: -7.7543, lng: 113.2159 },
  "Surabaya": { lat: -7.2575, lng: 112.7521 }
};

// API Endpoint Pemadaman Listrik (/api/power)
app.get('/api/power', (req, res) => {
  try {
    delete require.cache[require.resolve('./post.js')];
    const rawData = require('./post.js');
    
    let flatList = [];
    let index = 0;

    for (const [cityNameKey, items] of Object.entries(rawData)) {
      // Bersihkan nama kabupaten/kota
      const cleanCityName = cityNameKey.replace('Kabupaten ', '').replace('Kota ', '').trim();
      const baseCoord = cityCoordinates[cleanCityName] || { lat: -7.8, lng: 112.5 };

      items.forEach((item, idx) => {
        // Menyebar titik secara natural di sekitar pusat kota/kabupaten tanpa garis lurus
        const angle = idx * 0.5;
        const radius = 0.02 + (idx % 5) * 0.015;
        const lat = baseCoord.lat + (Math.sin(angle) * radius);
        const lng = baseCoord.lng + (Math.cos(angle) * radius);

        const statuses = ['Normal', 'Pemeliharaan JTM 20kV', 'Gangguan Distribusi', 'Normal'];
        const levels = ['Normal', 'Siaga', 'Padam', 'Normal'];
        const status = statuses[index % statuses.length];
        const level = levels[index % levels.length];

        flatList.push({
          code: String(item.kode_pos),
          district: item.kecamatan,
          city: cleanCityName,
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
