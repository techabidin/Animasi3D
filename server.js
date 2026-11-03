
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// ==========================================
// NORMALISASI NAMA WILAYAH
// ==========================================

function normalize(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/^(kabupaten|kab\.|kota administrasi|kota)\s+/i, '')
        .replace(/[^a-z0-9]/g, '');
}

// ==========================================
// KOORDINAT KECAMATAN
// ==========================================

const districtCoordinates = {
    'Patrang': [-8.1689, 113.7022],
    'Sumbersari': [-8.1721, 113.7228],
    'Kaliwates': [-8.1736, 113.6791],
    'Ambulu': [-8.3614, 113.6151],
    'Sukorambi': [-8.1362, 113.6534],
    'Rambipuji': [-8.2134, 113.5932],
    'Panti': [-8.1512, 113.5784],
    'Bangsalsari': [-8.2231, 113.5221],
    'Tanggul': [-8.1472, 113.3912],
    'Sumberbaru': [-8.1354, 113.3241],
    'Semboro': [-8.2431, 113.4352],
    'Balung': [-8.3142, 113.5351],
    'Wuluhan': [-8.3751, 113.6781],
    'Puger': [-8.3912, 113.5782],
    'Gumukmas': [-8.3341, 113.4215],
    'Umbulsari': [-8.2514, 113.4812],
    'Kencong': [-8.2812, 113.3614],
    'Jombang': [-8.2014, 113.4312],
    'Jenggawah': [-8.2814, 113.6712],
    'Tempurejo': [-8.3154, 113.7912],
    'Mumbulsari': [-8.2412, 113.7712],
    'Ajung': [-8.2314, 113.7214],
    'Pakusari': [-8.1412, 113.7612],
    'Mayang': [-8.1514, 113.8314],
    'Silo': [-8.2114, 113.8814],
    'Arjasa': [-8.1114, 113.7512],
    'Jelbuk': [-8.0614, 113.7712],
    'Kalisat': [-8.0814, 113.8214],
    'Sukowono': [-8.0614, 113.8814],
    'Sumberjambe': [-8.0314, 113.9214],
    'Ledokombo': [-8.1114, 113.8914],

    'Bangkalan': [-7.0250, 112.7419],
    'Burneh': [-7.0514, 112.7714],
    'Arosbaya': [-6.9414, 112.7614],
    'Geger': [-6.9314, 112.8714],
    'Klampis': [-6.9114, 112.8314],
    'Sepulu': [-6.8814, 112.9314],
    'Kokop': [-6.9314, 113.0114],
    'Tanjung Bumi': [-6.8614, 112.8714],
    'Socah': [-7.0614, 112.7014],
    'Kamal': [-7.1514, 112.7314],
    'Kwanyar': [-7.1514, 112.8514],
    'Labang': [-7.1314, 112.7714],
    'Tragah': [-7.0714, 112.8214],
    'Modung': [-7.1114, 113.0014],
    'Tanah Merah': [-7.0714, 112.8914],
    'Galis': [-7.0614, 112.9414],
    'Blega': [-7.1114, 113.1114],
    'Konang': [-7.0214, 113.0614],

    'Banyuwangi': [-8.2192, 114.3691],
    'Kalipuro': [-8.1514, 114.3914],
    'Giri': [-8.1814, 114.3614],
    'Glagah': [-8.2314, 114.3214],
    'Wongsorejo': [-8.0314, 114.3814],
    'Licin': [-8.1814, 114.2814],
    'Blimbingsari': [-8.3114, 114.3514],
    'Kabat': [-8.2714, 114.3514],
    'Rogojampi': [-8.3114, 114.3014],
    'Songgon': [-8.2414, 114.1914],
    'Singojuruh': [-8.2714, 114.2414],
    'Genteng': [-8.3614, 114.1514],
    'Glenmore': [-8.3014, 114.0714],
    'Kalibaru': [-8.2814, 113.9914],
    'Sempu': [-8.3414, 114.2214],
    'Srono': [-8.3614, 114.2914],
    'Muncar': [-8.4314, 114.3314],
    'Cluring': [-8.3814, 114.2414],
    'Purwoharjo': [-8.4614, 114.2614],
    'Tegaldlimo': [-8.5414, 114.3514],
    'Tegalsari': [-8.4114, 114.1614],
    'Gambiran': [-8.3814, 114.1614],
    'Bangorejo': [-8.4314, 114.1914],
    'Pesanggaran': [-8.5514, 114.0714],
    'Siliragung': [-8.4814, 114.1214],

    'Klojen': [-7.9786, 112.6295],
    'Blimbing': [-7.9543, 112.6412],
    'Kedungkandang': [-8.0012, 112.6534],
    'Lowokwaru': [-7.9482, 112.6175],
    'Sukun': [-8.0054, 112.6123],

    'Sukolilo': [-7.2854, 112.7952],
    'Mulyorejo': [-7.2654, 112.7852],
    'Bulak': [-7.2354, 112.7852],
    'Kenjeran': [-7.2354, 112.7652],
    'Tambaksari': [-7.2454, 112.7552],
    'Simokerto': [-7.2454, 112.7452],
    'Semampir': [-7.2254, 112.7452],
    'Pabean Cantian': [-7.2254, 112.7352],
    'Bubutan': [-7.2454, 112.7352],
    'Krembangan': [-7.2354, 112.7252],
    'Asem Rowo': [-7.2454, 112.7052],
    'Tandes': [-7.2554, 112.6852],
    'Sukomanunggal': [-7.2654, 112.7052],
    'Benowo': [-7.2454, 112.6552],
    'Pakal': [-7.2354, 112.6252],
    'Lakarsantri': [-7.3054, 112.6652],
    'Sambikerep': [-7.2754, 112.6652],
    'Karang Pilang': [-7.3254, 112.7152],
    'Dukuh Pakis': [-7.2954, 112.7152],
    'Wiyung': [-7.3154, 112.6952],
    'Gayungan': [-7.3254, 112.7352],
    'Jambangan': [-7.3254, 112.7252],
    'Wonocolo': [-7.3154, 112.7452],
    'Wonokromo': [-7.2954, 112.7452],
    'Sawahan': [-7.2654, 112.7252],
    'Tegalsari Surabaya': [-7.2754, 112.7352],
    'Genteng Surabaya': [-7.2554, 112.7452],
    'Gubeng': [-7.2754, 112.7552],
    'Tenggilis Mejoyo': [-7.3254, 112.7552],
    'Rungkut': [-7.3154, 112.7852],
    'Gunung Anyar': [-7.3354, 112.7952]
};

// ==========================================
// KOORDINAT DEFAULT KABUPATEN/KOTA
// ==========================================

const cityDefaults = {
    'Jember': [-8.1844, 113.7024],
    'Bangkalan': [-7.0250, 112.7419],
    'Banyuwangi': [-8.2192, 114.3691],
    'Blitar': [-8.0954, 112.1609],
    'Bojonegoro': [-7.1550, 111.8967],
    'Bondowoso': [-7.9139, 113.8217],
    'Gresik': [-7.1561, 112.6552],
    'Jombang': [-7.5461, 112.2338],
    'Kediri': [-7.8480, 112.0178],
    'Lamongan': [-7.1219, 112.4168],
    'Lumajang': [-8.1326, 113.2201],
    'Madiun': [-7.6298, 111.5239],
    'Malang': [-7.9666, 112.6326],
    'Mojokerto': [-7.4726, 112.4339],
    'Pasuruan': [-7.6453, 112.9075],
    'Probolinggo': [-7.7543, 113.2159],
    'Surabaya': [-7.2575, 112.7521]
};

// ==========================================
// MEMUAT DATABASE POST.JS
// ==========================================

function loadDatabase() {
    const file = require.resolve('./post.js');

    delete require.cache[file];

    const data = require(file);

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Format post.js tidak valid');
    }

    return data;
}

// ==========================================
// MENCARI KOORDINAT KECAMATAN
// ==========================================

function getCoordinates(city, district) {
    const cityKey = normalize(city);
    const districtKey = normalize(district);

    // Hindari kecamatan bernama sama tertukar antarwilayah.
    const scopedKey = normalize(district + ' ' + city);

    if (districtCoordinates[scopedKey]) {
        return districtCoordinates[scopedKey];
    }

    // Koordinat kecamatan hanya dipakai jika tidak ambigu.
    const matches = Object.entries(districtCoordinates)
        .filter(([name]) => normalize(name) === districtKey);

    if (matches.length === 1) {
        return matches[0][1];
    }

    const cityMatch = Object.entries(cityDefaults)
        .find(([name]) => normalize(name) === cityKey);

    return cityMatch
        ? cityMatch[1]
        : null;
}

// ==========================================
// VALIDASI KODE POS
// ==========================================

function validatePostalCode(value) {
    const code = String(value ?? '').trim();

    return /^[0-9]{5}$/.test(code) ? code : null;
}

// ==========================================
// API PEMADAMAN LISTRIK
// ==========================================

app.get('/api/power', (req, res) => {
    try {
        const dataObj = loadDatabase();

        const flatList = [];
        const errors = [];
        let index = 0;

        for (const [cityName, items] of Object.entries(dataObj)) {
            const cleanCity = cityName
                .replace(/^Kabupaten\s+/i, '')
                .replace(/^Kota\s+/i, '')
                .trim();

            if (!Array.isArray(items)) {
                errors.push({
                    city: cleanCity,
                    error: 'Data wilayah bukan array'
                });
                continue;
            }

            items.forEach((item, idx) => {
                const district = String(item.kecamatan || '').trim();
                const postalCode = validatePostalCode(item.kode_pos);

                if (!district) {
                    errors.push({
                        city: cleanCity,
                        index: idx,
                        error: 'Nama kecamatan kosong'
                    });
                    return;
                }

                if (!postalCode) {
                    errors.push({
                        city: cleanCity,
                        district,
                        postalCode: item.kode_pos,
                        error: 'Kode pos harus terdiri dari 5 angka'
                    });
                    return;
                }

                const coordinate = getCoordinates(cleanCity, district);

                // Jangan membuat koordinat palsu.
                if (!coordinate) {
                    errors.push({
                        city: cleanCity,
                        district,
                        postalCode,
                        error: 'Koordinat belum tersedia'
                    });
                    return;
                }

                const [baseLat, baseLng] = coordinate;

                const angle = idx * 2.0;
                const radius = 0.001 + ((idx % 4) * 0.0015);

                const lat = baseLat + Math.sin(angle) * radius;
                const lng = baseLng + Math.cos(angle) * radius;

                const statuses = [
                    'Normal',
                    'Pemeliharaan JTM 20kV',
                    'Gangguan Distribusi',
                    'Normal'
                ];

                const levels = [
                    'Normal',
                    'Siaga',
                    'Padam',
                    'Normal'
                ];

                const level = levels[index % levels.length];

                flatList.push({
                    code: postalCode,
                    district,
                    city: cleanCity,
                    lat: Number(lat.toFixed(5)),
                    lng: Number(lng.toFixed(5)),
                    status: statuses[index % statuses.length],
                    durasi: level === 'Normal'
                        ? 'Sistem Optimal'
                        : '09:00 - 14:00 WIB',
                    level
                });

                index++;
            });
        }

        res.setHeader('Cache-Control', 'no-store');

        return res.status(200).json({
            success: true,
            total: flatList.length,
            totalErrors: errors.length,
            data: flatList,
            errors
        });

    } catch (err) {
        console.error('ERROR API POWER:', err);

        return res.status(500).json({
            success: false,
            error: 'Gagal memuat database post.js',
            details: err.message
        });
    }
});

// ==========================================
// API CEK DATABASE
// ==========================================

app.get('/api/postal-check', (req, res) => {
    try {
        const database = loadDatabase();
        const result = [];

        for (const [city, items] of Object.entries(database)) {
            if (!Array.isArray(items)) continue;

            items.forEach(item => {
                const code = validatePostalCode(item.kode_pos);

                result.push({
                    city: city,
                    district: item.kecamatan || null,
                    postalCode: code,
                    valid: Boolean(code)
                });
            });
        }

        return res.json({
            success: true,
            total: result.length,
            valid: result.filter(x => x.valid).length,
            invalid: result.filter(x => !x.valid).length,
            data: result
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

// ==========================================
// API STATUS SERVER
// ==========================================

app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        server: 'AbidinAI Postal API',
        status: 'online',
        timestamp: new Date().toISOString()
    });
});

// ==========================================
// HALAMAN UTAMA
// ==========================================

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ==========================================
// MENJALANKAN SERVER
// ==========================================

if (require.main === module) {
    app.listen(PORT, () => {
        console.log('================================');
        console.log(' ABIDINAI POSTAL API');
        console.log('================================');
        console.log(`Server: http://localhost:${PORT}`);
        console.log(`API: http://localhost:${PORT}/api/power`);
        console.log(`Cek: http://localhost:${PORT}/api/postal-check`);
    });
}

module.exports = app;
