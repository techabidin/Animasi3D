const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Menyajikan file statis dari folder yang sama dengan server.js
app.use(express.static(__dirname));

// Endpoint API Pemadaman Listrik
app.get('/api/power', (req, res) => {
  try {
    delete require.cache[require.resolve('./post.json')];
    const jsonData = require('./post.json');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(jsonData);
  } catch (err) {
    console.error('ERROR BACA POST.JSON:', err);
    return res.status(500).json({ error: 'Gagal memuat database post.json', details: err.message });
  }
});

// Route utama untuk melayani index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Fallback untuk route lainnya
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server lokal aktif di http://localhost:${PORT}`);
  });
}

module.exports = app;
