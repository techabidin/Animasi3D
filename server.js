const express = require('express');
const path = require('path');
const postalData = require('./post.js');

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));
app.use(express.static(__dirname, {
  index: 'index.html',
  setHeaders(res, filePath) {
    if (filePath.endsWith('post.js') || filePath.endsWith('server.js')) res.status(404);
  }
}));

const normalize = value => String(value || '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

function flattenPostalData() {
  const rows = [];
  for (const [cityName, entries] of Object.entries(postalData)) {
    const city = cityName.replace(/^(Kabupaten|Kota)\s+/i, '');
    const administrativeType = /^Kota\s/i.test(cityName) ? 'Kota' : 'Kabupaten';
    for (const item of entries) rows.push({
      code: String(item.kode_pos).padStart(5, '0'),
      district: item.kecamatan, city, administrativeType,
      province: 'Jawa Timur'
    });
  }
  return rows;
}
const postalRows = flattenPostalData();
const geocodeCache = new Map();
let lastGeocodeAt = 0;

app.get('/api/health', (req,res) => res.json({
  ok:true, postalRecords:postalRows.length,
  outageSourceConfigured:Boolean(process.env.LISTRIK_PADAM_API_URL)
}));
app.get('/api/power', (req,res) => res.json(postalRows));

async function geocodeDistrict(district, city) {
  const key = normalize(`${district}|${city}`);
  if (geocodeCache.has(key)) return geocodeCache.get(key);
  const candidates = [
    `Kecamatan ${district}, Kabupaten ${city}, Jawa Timur, Indonesia`,
    `${district}, ${city}, Jawa Timur, Indonesia`,
    `${district}, Jember, Jawa Timur, Indonesia`
  ];
  for (const q of candidates) {
    const wait = Math.max(0, 1100 - (Date.now() - lastGeocodeAt));
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    lastGeocodeAt = Date.now();
    try {
      const url = 'https://nominatim.openstreetmap.org/search?' +
        new URLSearchParams({ q, format:'jsonv2', limit:'1', countrycodes:'id' });
      const response = await fetch(url, {headers:{
        'User-Agent':'AbidinAI-Radar/1.0 (postal map)',
        'Accept-Language':'id'
      }});
      if (!response.ok) continue;
      const items = await response.json();
      if (items[0]) {
        const point = {lat:Number(items[0].lat),lng:Number(items[0].lon),displayName:items[0].display_name};
        if (Number.isFinite(point.lat)&&Number.isFinite(point.lng)) {
          geocodeCache.set(key,point); return point;
        }
      }
    } catch (e) { console.error('Geocoding:',e.message); }
  }
  geocodeCache.set(key,null);
  return null;
}

app.get('/api/postal/search', async (req,res) => {
  const q = normalize(req.query.q);
  if (!q) return res.status(400).json({error:'Masukkan kode pos atau nama kecamatan.'});
  let results;
  if (/^\d{1,5}$/.test(q)) results=postalRows.filter(r=>r.code===q.padStart(5,'0'));
  else results=postalRows.filter(r=>normalize(r.district).includes(q)||normalize(r.city).includes(q));
  if (!results.length) return res.status(404).json({error:'Data kode pos/kecamatan tidak ditemukan pada database yang tersedia.'});
  const first=results[0];
  const location=await geocodeDistrict(first.district,first.city);
  res.json({
    query:req.query.q,count:results.length,results,location,
    locationAccuracy:location?'Titik representasi kecamatan dari OpenStreetMap, bukan titik alamat/kode pos presisi':null,
    note:'Dataset saat ini adalah data kode pos yang tersedia dalam post.js. Perlu verifikasi sumber resmi untuk kelengkapan dan ketepatan.'
  });
});

/*
  Integrasi sumber laporan:
  LISTRIK_PADAM_API_URL = URL API JSON yang memang diizinkan penyedia.
  Format yang didukung: array JSON, {reports:[...]}, atau {data:[...]}.
  Setiap item idealnya punya lat/lng, status, location, district, city,
  province, postal_code, reported_at, description, source.
*/
app.get('/api/outages', async (req,res) => {
  const endpoint=process.env.LISTRIK_PADAM_API_URL;
  if (!endpoint) return res.status(503).json({
    error:'Sumber API laporan belum dikonfigurasi.',
    reports:[],
    hint:'Tambahkan LISTRIK_PADAM_API_URL hanya jika penyedia memberikan endpoint API dan izin penggunaan.'
  });
  try {
    const headers={'Accept':'application/json'};
    if(process.env.LISTRIK_PADAM_API_TOKEN) headers.Authorization=`Bearer ${process.env.LISTRIK_PADAM_API_TOKEN}`;
    const upstream=await fetch(endpoint,{headers,signal:AbortSignal.timeout(15000)});
    if(!upstream.ok) throw new Error(`Sumber API membalas HTTP ${upstream.status}`);
    const payload=await upstream.json();
    const reports=Array.isArray(payload)?payload:(payload.reports||payload.data||[]);
    if(!Array.isArray(reports)) throw new Error('Format API tidak dikenali; gunakan array atau properti reports/data.');
    res.set('Cache-Control','no-store');
    res.json({source:payload.source||'API pemadaman terhubung',reports});
  } catch(e) {
    console.error('Outage source error:',e.message);
    res.status(502).json({error:'Gagal mengambil data sumber pemadaman: '+e.message,reports:[]});
  }
});

app.post('/api/assistant', async (req,res) => {
  const apiKey=process.env.GROQ_API_KEY;
  const question=String(req.body?.question||'').trim();
  if(!question)return res.status(400).json({error:'Pertanyaan kosong.'});
  if(!apiKey)return res.status(503).json({error:'Asisten AI belum dikonfigurasi.'});
  try{
    const upstream=await fetch('https://api.groq.com/openai/v1/chat/completions',{
      method:'POST',
      headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        model:process.env.GROQ_MODEL||'openai/gpt-oss-20b',
        messages:[
          {role:'system',content:'Kamu asisten informasi darurat. Jawab dalam Bahasa Indonesia. Jangan mengarang informasi pemadaman listrik atau menganggap data komunitas sebagai konfirmasi resmi PLN.'},
          {role:'user',content:question}
        ],temperature:0.4,max_tokens:1024
      })
    });
    const data=await upstream.json();
    if(!upstream.ok)return res.status(upstream.status).json({error:data.error?.message||'Layanan AI gagal.'});
    res.json({answer:data.choices?.[0]?.message?.content||'Tidak ada jawaban.'});
  }catch(e){res.status(502).json({error:'Gagal menghubungi layanan AI.'});}
});

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'index.html')));
if(require.main===module){
  const port=process.env.PORT||3000;
  app.listen(port,()=>console.log(`AbidinAI Radar berjalan pada port ${port}`));
}
module.exports=app;
