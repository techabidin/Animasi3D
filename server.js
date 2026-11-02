const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
// Gunakan process.cwd() agar Vercel dapat mendeteksi file statis di root
app.use(express.static(path.join(process.cwd())));

// API Endpoint Pemadaman Listrik
app.get('/api/power', (req, res) => {
  const filePath = path.join(process.cwd(), 'post.json');
  
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Gagal membaca post.json:', err);
      return res.status(500).json({ error: 'Gagal membaca database post.json', details: err.message });
    }
    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch (parseErr) {
      console.error('Format JSON tidak valid:', parseErr);
      res.status(500).json({ error: 'Format JSON pada post.json tidak valid' });
    }
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
  });
}

module.exports = app;
