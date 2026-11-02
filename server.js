const express = require('express');
const path = require('path');
const rawData = require('./post.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Koordinat pusat riil untuk beberapa kecamatan/wilayah di Jawa Timur sebagai acuan presisi
const districtCoordinates = {
  // Jember
  "Patrang": { lat: -8.1689, lng: 113.7022 },
  "Sumbersari": { lat: -8.1721, lng: 113.7228 },
  "Kaliwates": { lat: -8.1736, lng: 113.6791 },
  "Ambulu": { lat: -8.3614, lng: 113.6151 },
  "Sukorambi": { lat: -8.1362, lng: 113.6534 },
  "Rambipuji": { lat: -8.2134, lng: 113.5932 },
  "Panti": { lat: -8.1512, lng: 113.5784 },
  "Bangsalsari": { lat: -8.2231, lng: 113.5221 },
  "Tanggul": { lat: -8.1472, lng: 113.3912 },
  "Sumberbaru": { lat: -8.1354, lng: 113.3241 },
  "Semboro": { lat: -8.2431, lng: 113.4352 },
  "Balung": { lat: -8.3142, lng: 113.5351 },
  "Wuluhan": { lat: -8.3751, lng: 113.6781 },
  "Puger": { lat: -8.3912, lng: 113.5782 },
  "Gumukmas": { lat: -8.3341, lng: 113.4215 },
  "Umbulsari": { lat: -8.2514, lng: 113.4812 },
  "Kencong": { lat: -8.2812, lng: 113.3614 },
  "Jombang": { lat: -8.2014, lng: 113.4312 },
  "Jenggawah": { lat: -8.2814, lng: 113.6712 },
  "Tempurejo": { lat: -8.3154, lng: 113.7912 },
  "Mumbulsari": { lat: -8.2412, lng: 113.7712 },
  "Ajung": { lat: -8.2314, lng: 113.7214 },
  "Pakusari": { lat: -8.1412, lng: 113.7612 },
  "Mayang": { lat: -8.1514, lng: 113.8314 },
  "Silo": { lat: -8.2114, lng: 113.8814 },
  "Arjasa": { lat: -8.1114, lng: 113.7512 },
  "Jelbuk": { lat: -8.0614, lng: 113.7712 },
  "Kalisat": { lat: -8.0814, lng: 113.8214 },
  "Sukowono": { lat: -8.0614, lng: 113.8814 },
  "Sumberjambe": { lat: -8.0314, lng: 113.9214 },
  "Ledokombo": { lat: -8.1114, lng: 113.8914 },

  // Bangkalan
  "Bangkalan": { lat: -7.0250, lng: 112.7419 },
  "Burneh": { lat: -7.0514, lng: 112.7714 },
  "Arosbaya": { lat: -6.9414, lng: 112.7614 },
  "Geger": { lat: -6.9314, lng: 112.8714 },
  "Klampis": { lat: -6.9114, lng: 112.8314 },
  "Sepulu": { lat: -6.8814, lng: 112.9314 },
  "Kokop": { lat: -6.9314, lng: 113.0114 },
  "Tanjung Bumi": { lat: -6.8614, lng: 112.8714 },
  "Socah": { lat: -7.0614, lng: 112.7014 },
  "Kamal": { lat: -7.1514, lng: 112.7314 },
  "Kwanyar": { lat: -7.1514, lng: 112.8514 },
  "Labang": { lat: -7.1314, lng: 112.7714 },
  "Tragah": { lat: -7.0714, lng: 112.8214 },
  "Modung": { lat: -7.1114, lng: 113.0014 },
  "Tanah Merah": { lat: -7.0714, lng: 112.8914 },
  "Galis": { lat: -7.0614, lng: 112.9414 },
  "Blega": { lat: -7.1114, lng: 113.1114 },
  "Konang": { lat: -7.0214, lng: 113.0614 },

  // Banyuwangi
  "Banyuwangi": { lat: -8.2192, lng: 114.3691 },
  "Kalipuro": { lat: -8.1514, lng: 114.3914 },
  "Giri": { lat: -8.1814, lng: 114.3614 },
  "Glagah": { lat: -8.2314, lng: 114.3214 },
  "Wongsorejo": { lat: -8.0314, lng: 114.3814 },
  "Licin": { lat: -8.1814, lng: 114.2814 },
  "Blimbingsari": { lat: -8.3114, lng: 114.3514 },
  "Kabat": { lat: -8.2714, lng: 114.3514 },
  "Rogojampi": { lat: -8.3114, lng: 114.3014 },
  "Songgon": { lat: -8.2414, lng: 114.1914 },
  "Singojuruh": { lat: -8.2714, lng: 114.2414 },
  "Genteng": { lat: -8.3614, lng: 114.1514 },
  "Glenmore": { lat: -8.3014, lng: 114.0714 },
  "Kalibaru": { lat: -8.2814, lng: 113.9914 },
  "Sempu": { lat: -8.3414, lng: 114.2214 },
  "Srono": { lat: -8.3614, lng: 114.2914 },
  "Muncar": { lat: -8.4314, lng: 114.3314 },
  "Cluring": { lat: -8.3814, lng: 114.2414 },
  "Purwoharjo": { lat: -8.4614, lng: 114.2614 },
  "Tegaldlimo": { lat: -8.5414, lng: 114.3514 },
  "Tegalsari": { lat: -8.4114, lng: 114.1614 },
  "Gambiran": { lat: -8.3814, lng: 114.1614 },
  "Bangorejo": { lat: -8.4314, lng: 114.1914 },
  "Pesanggaran": { lat: -8.5514, lng: 114.0714 },
  "Siliragung": { lat: -8.4814, lng: 114.1214 },

  // Blitar
  "Sanankulon": { lat: -8.0814, lng: 112.1114 },
  "Srengat": { lat: -8.0814, lng: 112.0614 },
  "Ponggok": { lat: -8.0514, lng: 112.1514 },
  "Udanawu": { lat: -8.0614, lng: 112.0314 },
  "Wonodadi": { lat: -8.0314, lng: 112.0414 },
  "Kademangan": { lat: -8.1514, lng: 112.1514 },
  "Bakung": { lat: -8.2114, lng: 112.1814 },
  "Kanigoro": { lat: -8.1114, lng: 112.2114 },
  "Sutojayan": { lat: -8.2514, lng: 112.2614 },
  "Wonotirto": { lat: -8.2514, lng: 112.1414 },
  "Panggungrejo": { lat: -8.2514, lng: 112.3514 },
  "Nglegok": { lat: -8.0314, lng: 112.2114 },
  "Talun": { lat: -8.0814, lng: 112.2814 },
  "Wlingi": { lat: -8.0914, lng: 112.3214 },
  "Doko": { lat: -8.0414, lng: 112.3514 },
  "Gandusari": { lat: -8.0414, lng: 112.2814 },
  "Kesamben": { lat: -8.1314, lng: 112.4214 },
  "Selorejo": { lat: -8.1114, lng: 112.4814 },
  "Binangun": { lat: -8.2114, lng: 112.4414 },
  "Wates": { lat: -8.2014, lng: 112.3914 }
};

// Default koordinat fallback per kabupaten jika kecamatan tidak terdaftar di atas
const cityDefaults = {
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
    const dataObj = require('./post.js');
    
    let flatList = [];
    let index = 0;

    for (const [cityNameKey, items] of Object.entries(dataObj)) {
      const cleanCityName = cityNameKey.replace('Kabupaten ', '').replace('Kota ', '').trim();
      const defaultCoord = cityDefaults[cleanCityName] || { lat: -7.8, lng: 112.5 };

      items.forEach((item, idx) => {
        // Ambil koordinat spesifik kecamatan jika ada, jika tidak pakai pusat kota/kabupaten
        const baseCoord = districtCoordinates[item.kecamatan] || defaultCoord;

        // Berikan variasi kecil agar titik-titik dalam satu kecamatan tidak bertumpuk pas di satu titik yang sama
        const angle = idx * 1.5;
        const radius = 0.003 + ((idx % 3) * 0.002);
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
          lat: parseFloat(lat.toFixed(5)),
          lng: parseFloat(lng.toFixed(5)),
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
