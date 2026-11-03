
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ========================================
// BLOKIR FILE BACKEND AGAR TIDAK TERBUKA
// ========================================

const blockedFiles = [
    "/server.js",
    "/post.js",
    "/package.json",
    "/package-lock.json",
    "/.env",
    "/.git"
];

app.use((req, res, next) => {
    const requestedPath = decodeURIComponent(req.path);

    if (
        blockedFiles.includes(requestedPath) ||
        requestedPath.startsWith("/.git/") ||
        requestedPath.startsWith("/node_modules/")
    ) {
        return res.status(403).json({
            error: "Akses ditolak"
        });
    }

    next();
});

// ========================================
// FILE FRONTEND TETAP DI ROOT
// ========================================

app.use(express.static(__dirname, {
    dotfiles: "deny",
    index: false
}));

// ========================================
// MEMBACA DATABASE POSTAL
// ========================================

function loadPostalData() {
    const filePath = require.resolve("./post.js");

    delete require.cache[filePath];

    const data = require(filePath);

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Format post.js tidak valid");
    }

    return data;
}

// ========================================
// NORMALISASI TEKS
// ========================================

function normalize(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

// ========================================
// MEMBACA SEMUA DATA KODE POS
// TANPA MENGUBAH NAMA KECAMATAN
// ========================================

function getAllPostalRecords() {
    const database = loadPostalData();
    const records = [];

    for (const [wilayah, daftar] of Object.entries(database)) {
        if (!Array.isArray(daftar)) continue;

        for (const item of daftar) {
            if (!item || typeof item !== "object") continue;

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

// ========================================
// VALIDASI DATA KODE POS
// ========================================

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

// ========================================
// API UTAMA PETA
// ========================================

app.get("/api/power", (req, res) => {
    try {
        const records = getAllPostalRecords();

        const result = records.map((item, index) => ({
            ...item,

            // Status simulasi, bukan data resmi PLN.
            status: [
                "NORMAL",
                "GANGGUAN",
                "PEMELIHARAAN"
            ][index % 3],

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

// ========================================
// API PENCARIAN KODE POS
// ========================================

app.get("/api/postal/:kode", (req, res) => {
    try {
        const kode = String(req.params.kode).trim();

        if (!/^\d{5}$/.test(kode)) {
            return res.status(400).json({
                error: "Kode pos harus terdiri dari 5 angka"
            });
        }

        const results = getAllPostalRecords().filter(
            item => item.code === kode
        );

        res.json({
            kode_pos: kode,
            ditemukan: results.length > 0,
            data: results
        });

    } catch (error) {
        console.error("Postal search error:", error);

        res.status(500).json({
            error: error.message
        });
    }
});

// ========================================
// API DAFTAR KECAMATAN
// BERDASARKAN KABUPATEN/KOTA
// ========================================

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
        console.error("Kecamatan API error:", error);

        res.status(500).json({
            error: error.message
        });
    }
});

// ========================================
// API VALIDASI DATABASE
// ========================================

app.get("/api/postal-check", (req, res) => {
    try {
        res.json(validatePostalData());

    } catch (error) {
        console.error("Postal check error:", error);

        res.status(500).json({
            error: error.message
        });
    }
});

// ========================================
// HALAMAN UTAMA
// INDEX.HTML TETAP DI ROOT
// ========================================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// ========================================
// HALAMAN TIDAK DITEMUKAN
// ========================================

app.use((req, res) => {
    res.status(404).json({
        error: "Halaman atau endpoint tidak ditemukan"
    });
});

// ========================================
// MENJALANKAN SERVER
// ========================================

if (require.main === module) {
    app.listen(PORT, "0.0.0.0", () => {
        console.log("--------------------------------");
        console.log("ABIDINAI SERVER BERJALAN");
        console.log("--------------------------------");

        console.log(`Server: http://localhost:${PORT}`);
        console.log(`Frontend: ${path.join(__dirname, "index.html")}`);

        try {
            const check = validatePostalData();

            console.log(`Total kode pos: ${check.total_data}`);
            console.log(`Konflik data: ${check.total_konflik}`);

        } catch (error) {
            console.error("Database error:", error.message);
        }
    });
}

module.exports = app;
