const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API Endpoint Pemadaman Listrik (/api/power)
app.get('/api/power', (req, res) => {
  // Daftar jalur alternatif untuk mencari post.json agar aman di Vercel & Lokal
  const possiblePaths = [
    path.join(process.cwd(), 'post.json'),
    path.join(__dirname, 'post.json'),
    path.resolve('post.json')
  ];

  let rawData = null;
  let foundPath = '';

  // Cari file di jalur-jalur yang tersedia
  for (const filePath of possiblePaths) {
    try {
      if (fs.existsSync(filePath)) {
        rawData = fs.readFileSync(filePath, 'utf8');
        foundPath = filePath;
        break;
      }
    } catch (e) {
      // Abaikan dan coba jalur berikutnya
    }
  }

  // Jika file sama sekali tidak ditemukan
  if (!rawData) {
    console.error('DATABASE ERROR: post.json tidak ditemukan di semua path:', possiblePaths);
    return res.status(404).json({ 
      error: 'Database post.json tidak ditemukan di server.',
      pathsChecked: possiblePaths 
    });
  }

  // Parse isi JSON
  try {
    const jsonData = JSON.parse(rawData);
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(jsonData);
  } catch (parseErr) {
    console.error('PARSE ERROR: Format JSON post.json tidak valid:', parseErr.message);
    return res.status(500).json({ 
      error: 'Format JSON pada post.json tidak valid.',
      details: parseErr.message 
    });
  }
});

// Jalankan server lokal jika file dipanggil langsung (bukan sebagai serverless)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server lokal aktif di http://localhost:${PORT}`);
  });
}

// Wajib diexport untuk Vercel Serverless Function
module.exports = app;
