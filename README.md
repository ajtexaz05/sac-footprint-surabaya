# SI JAKA PANTAU (Sistem Informasi Jejak Karbon & Polutan Atmosfer Surabaya)

Platform dashboard analitik geospasial interaktif dan sintesis cerdas AI untuk memantau dinamika kualitas udara, gas polutan troposfer, dan inventaris emisi gas rumah kaca (GRK) delapan sektor ekonomi di Kota Surabaya.

---

## 🌟 Fitur Utama

1. **Pemantauan Polutan & Atmosfer Sentinel-5P / TROPOMI & MODIS (2000–2025)**
   - Visualisasi spasial resolusi tinggi untuk 7 parameter: Karbon Monoksida (CO), Nitrogen Dioksida (NO₂), Sulfur Dioksida (SO₂), Formaldehida (HCHO), Ozon Troposfer (O₃), Indeks Aerosol UV (UVAI), dan Aerosol Optical Depth (AOD 550nm).
   - Legenda skala visual otomatis min-max tersinkronisasi per indikator.
   - Analisis koridor hotspot spasial terakumulasi di Surabaya (Tanjung Perak, Margomulyo, Rungkut SIER, Benowo, dsb.).

2. **Inventaris Emisi Karbon Dioksida EDGAR v2026 (2000–2025)**
   - Data emisi historis 8 sektor ekonomi (Fuel Exploitation, Industrial Combustion, Transport, Power Industry, Buildings, Industrial Processes, Waste, Agriculture).
   - Diagram donat proporsi sektoral dan grafik kurva emisi tahunan vs bulanan.
   - Matriks komparasi antar-tahun terpilih (YoY dan rentang dinamis 2000–2025).

3. **Sintesis Cerdas AI Komprehensif (Kimi K3.1 Pro via OpenAgentic API)**
   - Single-click automated analysis yang membaca seluruh elemen dashboard secara real-time.
   - Menyusun 5 bagian analisis terstruktur:
     1. Peta Spasial & Koridor Hotspot Surabaya
     2. Peringkat Emisi Sektoral & Kontributor Antropogenik Utama
     3. Dinamika Tren Temporal & Komparasi Antar-Tahun
     4. Analisis Risiko Lingkungan & Kesehatan Warga
     5. Rekomendasi Kebijakan Mitigasi Terukur Pemkot Surabaya
   - Mengalirkan respons secara real-time via Server-Sent Events (SSE) dengan proteksi timeout serverless 55 detik dan keep-alive heartbeat.
   - Caching ulasan privat per-browser di `localStorage` dengan mekanisme proteksi kuota LRU.

4. **Arsitektur Front-End Modern & Responsif**
   - Dibangun dengan React 19, Vite, Tailwind CSS, Leaflet, dan Recharts.
   - Code splitting (`React.lazy` + `Suspense`) untuk pemuatan halaman cepat.
   - UI Neo-Glassmorphism modern dengan palet dark-mode, ikon vektor SVG, dan navbar mobile drawer.
   - Pustaka pembelajaran interaktif dengan modul edukasi aerosol, kimia polutan, dan metodologi satelit.

---

## 🔒 Arsitektur Keamanan & Proxy AI

- **Pencegahan Kebocoran API Key**: Kunci API `SECRET_AI_API_KEY` disimpan secara eksklusif di environment variable server (Vercel Serverless / `.env` lokal).
- Endpoint `/api/generate` bertindak sebagai secure streaming proxy dengan header SSE, keep-alive heartbeat, penanganan abort request jika klien disconnect, dan batas waktu 55 detik untuk menjaga kestabilan sebelum hard limit Vercel 60 detik.
- Kunci API tidak pernah dikirimkan atau diekspos ke client browser (`/api/key` telah dihapus secara permanen).

---

## 🚀 Panduan Menjalankan Proyek

### 1. Prasyarat
- Node.js versi 18+ (direkomendasikan Node 20+)
- NPM atau PNPM

### 2. Instalasi & Setup Lingkungan
```bash
# Clone repository
git clone https://github.com/mhmdfauzn/surabaya-footprint.git
cd surabaya-footprint

# Install dependensi
npm install

# Buat file .env lokal berdasarkan .env.example
cp .env.example .env
```

Isi file `.env` dengan kredensial OpenAgentic Anda:
```env
SECRET_AI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Menjalankan Server Pengembangan Lokal
```bash
npm run dev
```
Buka peramban di `http://localhost:5173/`.

### 4. Menjalankan Linting
```bash
npm run lint
```

### 5. Membangun Bundle Produksi
```bash
npm run build
```

---

## ☁️ Penerapan ke Vercel (Deployment)

1. Hubungkan repository GitHub ke Vercel.
2. Tambahkan Environment Variable di Vercel Dashboard:
   - **Key**: `SECRET_AI_API_KEY`
   - **Value**: Masukkan API Key OpenAgentic Anda.
3. Deploy! Konfigurasi serverless function telah dioptimalkan di `api/generate.js` dengan `maxDuration: 60`.
