const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

function loadPostalData() {
    delete require.cache[require.resolve("./post.js")];
    return require("./post.js");
}

// Koordinat berikut adalah contoh titik kecamatan.
// Lengkapi dengan koordinat dari sumber peta yang tepercaya.
const districtCoordinates = [
    {
        city: "Kabupaten Jember",
        district: "Patrang",
        lat: -8.157,
        lng: 113.704
    },
    {
        city: "Kabupaten Jember",
        district: "Balung",
        lat: -8.283,
        lng: 113.538
    },
    {
        city: "Kabupaten Jember",
        district: "Puger",
        lat: -8.372,
        lng: 113.474
    },
    {
        city: "Kabupaten Jember",
        district: "Ambulu",
        lat: -8.345,
        lng: 113.605
    }
];

function normalize(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

function findCoordinates(city, district) {
    return districtCoordinates.find(item =>
        normalize(item.city) === normalize(city) &&
        normalize(item.district) === normalize(district)
    );
}

app.get("/api/postal", (req, res) => {
    try {
        const data = loadPostalData();
        const result = [];

        for (const [city, entries] of Object.entries(data)) {
            for (const item of entries) {
                const location = findCoordinates(
                    city,
                    item.kecamatan
                );

                result.push({
                    city,
                    kecamatan: item.kecamatan,
                    kode_pos: String(item.kode_pos),
                    lat: location ? location.lat : null,
                    lng: location ? location.lng : null,
                    matched: Boolean(location)
                });
            }
        }

        res.json({
            success: true,
            total: result.length,
            matched: result.filter(x => x.matched).length,
            unmatched: result.filter(x => !x.matched).length,
            data: result
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Gagal membaca data kode pos."
        });
    }
});

app.get("/api/postal/search", (req, res) => {
    const keyword = normalize(req.query.q);

    if (!keyword) {
        return res.json({ success: true, data: [] });
    }

    try {
        const data = loadPostalData();
        const result = [];

        for (const [city, entries] of Object.entries(data)) {
            for (const item of entries) {
                if (
                    normalize(item.kode_pos).includes(keyword) ||
                    normalize(item.kecamatan).includes(keyword) ||
                    normalize(city).includes(keyword)
                ) {
                    const location = findCoordinates(
                        city,
                        item.kecamatan
                    );

                    result.push({
                        city,
                        kecamatan: item.kecamatan,
                        kode_pos: String(item.kode_pos),
                        lat: location ? location.lat : null,
                        lng: location ? location.lng : null,
                        matched: Boolean(location)
                    });
                }
            }
        }

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Pencarian gagal."
        });
    }
});

app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
    console.log(`AbidinAI Map berjalan di http://localhost:${PORT}`);
});
