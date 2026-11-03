
'use strict';

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

// ==========================================
// NORMALISASI NAMA KABUPATEN / KOTA
// ==========================================

function normalizeCity(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/^(kabupaten|kab\.|kota)\s+/i, '')
        .replace(/[^a-z0-9]/g, '');
}

// ==========================================
// KOORDINAT DEFAULT KABUPATEN / KOTA
// ==========================================

const cityDefaults = {
    Jember: { lat: -8.1844, lng: 113.7024 },
    Bangkalan: { lat: -7.0250, lng: 112.7419 },
    Banyuwangi: { lat: -8.2192, lng: 114.3691 },
    Blitar: { lat: -8.0954, lng: 112.1609 },
    Bojonegoro: { lat: -7.1550, lng: 111.8967 },
    Bondowoso: { lat: -7.9139, lng: 113.8217 },
    Gresik: { lat: -7.1561, lng: 112.6552 },
    Jombang: { lat: -7.5461, lng: 112.2338 },
    Kediri: { lat: -7.8480, lng: 112.0178 },
    Lamongan: { lat: -7.1219, lng: 112.4168 },
    Lumajang: { lat: -8.1326, lng: 113.2201 },
    Madiun: { lat: -7.6298, lng: 111.5239 },
    Malang: { lat: -7.9666, lng: 112.6326 },
    Mojokerto: { lat: -7.4726, lng: 112.4339 },
    Pasuruan: { lat: -7.6453, lng: 112.9075 },
    Probolinggo: { lat: -7.7543, lng: 113.2159 },
    Surabaya: { lat: -7.2575, lng: 112.7521 }
};

// ==========================================
// KOORDINAT KECAMATAN
// Format: Kabupaten/Kota::Kecamatan
// ==========================================

const districtCoordinates = {
    'Jember::Patrang': { lat: -8.1689, lng: 113.7022 },
    'Jember::Sumbersari': { lat: -8.1721, lng: 113.7228 },
    'Jember::Kaliwates': { lat: -8.1736, lng: 113.6791 },
    'Jember::Ambulu': { lat: -8.3614, lng: 113.6151 },
    'Jember::Sukorambi': { lat: -8.1362, lng: 113.6534 },
    'Jember::Rambipuji': { lat: -8.2134, lng: 113.5932 },
    'Jember::Panti': { lat: -8.1512, lng: 113.5784 },
    'Jember::Bangsalsari': { lat: -8.2231, lng: 113.5221 },
    'Jember::Tanggul': { lat: -8.1472, lng: 113.3912 },
    'Jember::Sumberbaru': { lat: -8.1354, lng: 113.3241 },
    'Jember::Semboro': { lat: -8.2431, lng: 113.4352 },
    'Jember::Balung': { lat: -8.3142, lng: 113.5351 },
    'Jember::Wuluhan': { lat: -8.3751, lng: 113.6781 },
    'Jember::Puger': { lat: -8.3912, lng: 113.5782 },
    'Jember::Gumukmas': { lat: -8.3341, lng: 113.4215 },
    'Jember::Umbulsari': { lat: -8.2514, lng: 113.4812 },
    'Jember::Kencong': { lat: -8.2812, lng: 113.3614 },
    'Jember::Jombang': { lat: -8.2014, lng: 113.4312 },
    'Jember::Jenggawah': { lat: -8.2814, lng: 113.6712 },
    'Jember::Tempurejo': { lat: -8.3154, lng: 113.7912 },
    'Jember::Mumbulsari': { lat: -8.2412, lng: 113.7712 },
    'Jember::Ajung': { lat: -8.2314, lng: 113.7214 },
    'Jember::Pakusari': { lat: -8.1412, lng: 113.7612 },
    'Jember::Mayang': { lat: -8.1514, lng: 113.8314 },
    'Jember::Silo': { lat: -8.2114, lng: 113.8814 },
    'Jember::Arjasa': { lat: -8.1114, lng: 113.7512 },
    'Jember::Jelbuk': { lat: -8.0614, lng: 113.7712 },
    'Jember::Kalisat': { lat: -8.0814, lng: 113.8214 },
    'Jember::Sukowono': { lat: -8.0614, lng: 113.8814 },
    'Jember::Sumberjambe': { lat: -8.0314, lng: 113.9214 },
    'Jember::Ledokombo': { lat: -8.1114, lng: 113.8914 },

    'Surabaya::Sukolilo': { lat: -7.2854, lng: 112.7952 },
    'Surabaya::Mulyorejo': { lat: -7.2654, lng: 112.7852 },
    'Surabaya::Bulak': { lat: -7.2354, lng: 112.7852 },
    'Surabaya::Kenjeran': { lat: -7.2354, lng: 112.7652 },
    'Surabaya::Tambaksari': { lat: -7.2454, lng: 112.7552 },
    'Surabaya::Simokerto': { lat: -7.2454, lng: 112.7452 },
    'Surabaya::Semampir': { lat: -7.2254, lng: 112.7452 },
    'Surabaya::Pabean Cantian': { lat: -7.2254, lng: 112.7352 },
    'Surabaya::Bubutan': { lat: -7.2454, lng: 112.7352 },
    'Surabaya::Krembangan': { lat: -7.2354, lng: 112.7252 },
    'Surabaya::Asem Rowo': { lat: -7.2454, lng: 112.7052 },
    'Surabaya::Tandes': { lat: -7.2554, lng: 112.6852 },
    'Surabaya::Sukomanunggal': { lat: -7.2654, lng: 112.7052 },
    'Surabaya::Benowo': { lat: -7.2454, lng: 112.6552 },
    'Surabaya::Pakal': { lat: -7.2354, lng: 112.6252 },
    'Surabaya::Lakarsantri': { lat: -7.3054, lng: 112.6652 },
    'Surabaya::Sambikerep': { lat: -7.2754, lng: 112.6652 },
    'Surabaya::Karang Pilang': { lat: -7.3254, lng: 112.7152 },
    'Surabaya::Dukuh Pakis': { lat: -7.2954, lng: 112.7152 },
    'Surabaya::Wiyung': { lat: -7.3154, lng: 112.6952 },
    'Surabaya::Gayungan': { lat: -7.3254, lng: 112.7352 },
    'Surabaya::Jambangan': { lat: -7.3254, lng: 112.7252 },
    'Surabaya::Wonocolo': { lat: -7.3154, lng: 112.7452 },
    'Surabaya::Wonokromo': { lat: -7.2954, lng: 112.7452 },
    'Surabaya::Sawahan': { lat: -7.2654, lng: 112.7252 },
    'Surabaya::Tegalsari': { lat: -7.2754, lng: 112.7352 },
    'Surabaya::Genteng': { lat: -7.2554, lng: 112.7452 },
    'Surabaya::Gubeng': { lat: -7.2754, lng: 112.7552 },
    'Surabaya::Tenggilis Mejoyo': { lat: -7.3254, lng: 112.7552 },
    'Surabaya::Rungkut': { lat: -7.3154, lng: 112.7852 },
    'Surabaya::Gunung Anyar': { lat: -7.3354, lng: 112.7952 },

    'Malang::Klojen': { lat: -7.9786, lng: 112.6295 },
    'Malang::Blimbing': { lat: -7.9543, lng: 112.6412 },
    'Malang::Kedungkandang': { lat: -8.0012, lng: 112.6534 },
    'Malang::Lowokwaru': { lat: -7.9482, lng: 112.6175 },
    'Malang::Sukun': { lat: -8.0054, lng: 112.6123 }
};

// ==========================================
// MEMUAT DATABASE POST.JS
// ==========================================

function loadDatabase() {
    const dbPath = path.join(__dirname, 'post.js');

    delete require.cache[require.resolve(dbPath)];

    const database = require(dbPath);

    if (
        !database ||
        typeof database !== 'object' ||
        Array.isArray(database)
    ) {
        throw new Error('Format post.js harus menggunakan module.exports object');
    }

    return database;
}

// ==========================================
// MENGAMBIL KOORDINAT
// ==========================================

function getCoordinates(city, district) {
    const cityKey = normalizeCity(city);
    const districtKey = normalizeCity(district);

    const scopedKey = Object.keys(districtCoordinates).find(key => {
        const parts = key.split('::');

        return (
            normalizeCity(parts[0]) === cityKey &&
            normalizeCity(parts[1]) === districtKey
        );
    });

    if (scopedKey) {
        return districtCoordinates[scopedKey];
    }

    const cityKeyFound = Object.keys(cityDefaults).find(
        name => normalizeCity(name) === cityKey
    );

    return cityKeyFound ? cityDefaults[cityKeyFound] : null;
}

// ==========================================
// VALIDASI KODE POS
// ==========================================

function validateCode(code) {
    return /^[0-9]{5}$/.test(String(code ?? '').trim());
}

// ==========================================
// API UTAMA: POWER
// ==========================================

app.get('/api/power', (req, res) => {
    try {
        const database = loadDatabase();

        const result = [];
        let index = 0;

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

        for (const [cityName, items] of Object.entries(database)) {
            const city = cityName
                .replace(/^Kabupaten\s+/i, '')
                .replace(/^Kota\s+/i, '')
                .trim();

            if (!Array.isArray(items)) {
                console.error(`Data ${cityName} bukan array`);
                continue;
            }

            for (const item of items) {
                const district = String(item.kecamatan ?? '').trim();
                const code = String(item.kode_pos ?? '').trim();

                if (!district || !validateCode(code)) {
                    console.warn('Data dilewati:', {
                        city,
                        district,
                        code
                    });
                    continue;
                }

                const coordinate = getCoordinates(city, district);

                // Koordinat fallback kabupaten/kota.
                const lat = coordinate ? coordinate.lat : null;
                const lng = coordinate ? coordinate.lng : null;

                const level = levels[index % levels.length];

                result.push({
                    code: code,
                    district: district,
                    city: city,
                    lat: lat,
                    lng: lng,
                    status: statuses[index % statuses.length],
                    durasi: level === 'Normal'
                        ? 'Sistem Optimal'
                        : '09:00 - 14:00 WIB',
                    level: level
                });

                index++;
            }
        }

        res.setHeader('Cache-Control', 'no-store');

        return res.status(200).json(result);

    } catch (error) {
        console.error('API POWER ERROR:', error);

        return res.status(500).json({
            error: 'Gagal membaca database kode pos',
            details: error.message
        });
    }
});

// ==========================================
// API STATISTIK DATABASE
// ==========================================

app.get('/api/postal-check', (req, res) => {
    try {
        const database = loadDatabase();

        let total = 0;
        let valid = 0;
        let invalid = 0;

        const result = [];

        for (const [cityName, items] of Object.entries(database)) {
            if (!Array.isArray(items)) continue;

            const city = cityName
                .replace(/^Kabupaten\s+/i, '')
                .replace(/^Kota\s+/i, '')
                .trim();

            for (const item of items) {
                total++;

                const code = String(item.kode_pos ?? '').trim();
                const district = String(item.kecamatan ?? '').trim();

                const isValid = validateCode(code) && district.length > 0;

                if (isValid) {
                    valid++;
                } else {
                    invalid++;
                }

                result.push({
                    city,
                    district,
                    code,
                    valid: isValid
                });
            }
        }

        return res.json({
            success: true,
            total,
            valid,
            invalid,
            data: result
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==========================================
// API STATUS
// ==========================================

app.get('/api/status', (req, res) => {
    res.json({
        success: true,
        server: 'AbidinAI Postal API',
        status: 'online',
        time: new Date().toISOString()
    });
});

// ==========================================
// HALAMAN UTAMA
// ==========================================

app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// ==========================================
// MENJALANKAN SERVER
// ==========================================

if (require.main === module) {
    app.listen(PORT, () => {
        console.log('====================================');
        console.log('       ABIDINAI POSTAL SERVER       ');
        console.log('====================================');
        console.log(`Server  : http://localhost:${PORT}`);
        console.log(`Power   : http://localhost:${PORT}/api/power`);
        console.log(`Check   : http://localhost:${PORT}/api/postal-check`);
        console.log(`Status  : http://localhost:${PORT}/api/status`);
        console.log('====================================');
    });
}

module.exports = app;
