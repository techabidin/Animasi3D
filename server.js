const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware JSON
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API Endpoint Pemadaman Listrik
app.get('/api/power', (req, res) => {
  const filePath = path.join(__dirname, 'post.json');
  
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Gagal membaca database post.json' });
    }
    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch (parseErr) {
      res.status(500).json({ error: 'Format JSON pada post.json tidak valid' });
    }
  });
});

// Jalankan server lokal jika diakses langsung
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
  });
}

module.exports = app;
