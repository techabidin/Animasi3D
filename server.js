
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(__dirname));

function loadPostalData() {
    const filePath = require.resolve("./post.js");

    delete require.cache[filePath];

    const data = require(filePath);

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Format post.js tidak valid");
    }

    return data;
}

function normalize(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

// Membaca database tanpa mengubah kecamatan atau kode pos.
function getAllPostalRecords() {
    const database = loadPostalData();
    const records = [];

    for (const [wilayah, daftar] of Object.entries(database)) {
        if (!Array.isArray(daftar)) continue;

        for (const item of daftar) {
            const kodePos = String(item.kode_pos || "").trim();
            const kecamatan = String(item.kecamatan || "").trim();

            if (!/^\d{5}$/.test(kodePos) || !kecamatan) {
                continue;
            }

            records.push({
                code: kodePos,
                kode_pos: kodePos,
                district: kecamatan,
                kecamatan: kecamatan,
                city: wilayah,
                wilayah: wilayah
            });
        }
    }

    return records;
}

// Validasi data: mendeteksi kode pos yang sama tetapi
// terdaftar pada kecamatan berbeda dalam wilayah yang sama.
function validatePostalData() {
    const records = getAllPostalRecords();
    const grouped = new Map();

    for (const item of records) {
        const key = `${normalize(item.city)}:${item.code}`;

        if (!grouped.has(key)) {
            grouped.set(key, new Set());
        }

        grouped.get(key).add(normalize(item.district));
    }

    const conflicts = [];

    for (const [key, districts] of grouped.entries()) {
        if (districts.size > 1) {
            conflicts.push({
                wilayah_dan_kode: key,
                kecamatan_terdaftar: [...districts]
            });
        }
    }

    return {
        total_data: records.length,
        total_konflik: conflicts.length,
        konflik: conflicts
    };
}

// API utama
app.get("/api/power", (req, res) => {
    try {
        const records = getAllPostalRecords();

        const result = records.map((item, index) => ({
            ...item,

            // Status ini hanya simulasi.
            status: ["NORMAL", "GANGGUAN", "PEMELIHARAAN"][
                index % 3
            ],

            durasi: "0 menit",
            level: "INFO"
        }));

        res.json(result);
    } catch (error) {
        console.error("API error:", error);

        res.status(500).json({
            error: "Gagal membaca database kode pos",
            detail: error.message
        });
    }
});

// API untuk mencari kode pos
app.get("/api/postal/:kode", (req, res) => {
    try {
        const kode = String(req.params.kode).trim();

        const results = getAllPostalRecords().filter(
            item => item.code === kode
        );

        res.json({
            kode_pos: kode,
            ditemukan: results.length > 0,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// API daftar kecamatan berdasarkan kabupaten/kota
app.get("/api/kecamatan", (req, res) => {
    try {
        const records = getAllPostalRecords();
        const wilayah = req.query.wilayah;

        const filtered = wilayah
            ? records.filter(
                item => normalize(item.city) === normalize(wilayah)
            )
            : records;

        const grouped = {};

        for (const item of filtered) {
            const key = `${item.city}|${item.district}`;

            if (!grouped[key]) {
                grouped[key] = {
                    wilayah: item.city,
                    kecamatan: item.district,
                    kode_pos: []
                };
            }

            if (!grouped[key].kode_pos.includes(item.code)) {
                grouped[key].kode_pos.push(item.code);
            }
        }

        res.json(Object.values(grouped));
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// API validasi database
app.get("/api/postal-check", (req, res) => {
    try {
        res.json(validatePostalData());
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// Halaman utama
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

if (require.main === module) {
    app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server berjalan di http://localhost:${PORT}`);

        const check = validatePostalData();

        console.log(`Total kode pos: ${check.total_data}`);
        console.log(`Konflik data: ${check.total_konflik}`);
    });
}

module.exports = app;
