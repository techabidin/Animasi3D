const express = require('express');
const path = require('path');
const powerData = require('./post.js'); // Memuat langsung dari modul JS

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Menyajikan file statis frontend (index.html, dll)
app.use(express.static(__dirname));

// API Endpoint Pemadaman Listrik
app.get('/api/power', (req, res) => {
  try {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(powerData);
  } catch (err) {
    console.error('ERROR API POWER:', err);
    return res.status(500).json({ error: 'Gagal memuat data pemadaman', details: err.message });
  }
});

// Route utama untuk melayani index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server lokal aktif di http://localhost:${PORT}`);
  });
}

module.exports = app;
