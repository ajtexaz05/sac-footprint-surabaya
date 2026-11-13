import { useState } from 'react'

export default function PustakaPage() {
  const [activeTab, setActiveTab] = useState('semua')

  const TABS = [
    {
      id: 'semua',
      label: 'Semua Materi',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
      )
    },
    {
      id: 'konsep',
      label: 'Konsep Dasar (Aerosol vs Gas vs CO₂)',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
        </svg>
      )
    },
    {
      id: 'sumber',
      label: 'Satelit & Metodologi Data',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 7l5 5m-7-3l2 2m-8 4l2 2" /><path d="M4 14l3.5-3.5a2.121 2.121 0 0 1 3 0l3 3a2.121 2.121 0 0 1 0 3L10 20l-6-6z" />
        </svg>
      )
    },
    {
      id: 'polutan',
      label: '7 Polutan & Indikator Atmosfer',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
        </svg>
      )
    },
    {
      id: 'edgar',
      label: '8 Sektor Emisi CO₂ EDGAR',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
        </svg>
      )
    },
    {
      id: 'referensi',
      label: 'Daftar Pustaka & Rujukan',
      icon: (
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      )
    },
  ]

  return (
    <div className="space-y-12 max-w-6xl mx-auto py-4 animate-in fade-in duration-300">
      {/* ==================== HERO HEADER ==================== */}
      <div className="text-center space-y-4 border-b border-blue-900/40 pb-8">
        <div className="inline-flex items-center gap-2 bg-blue-950/70 border border-blue-500/40 px-4 py-1.5 rounded-full text-xs font-semibold text-blue-300 shadow-neon-blue">
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
          <span>Pusat Edukasi & Dokumentasi Ilmiah Resmi</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight font-display drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">
          Pustaka Pengetahuan Atmosfer & Jejak Karbon
        </h1>
        <p className="text-slate-300 max-w-3xl mx-auto text-sm md:text-base leading-relaxed">
          Panduan komprehensif mengenai konsep dasar aerosol, kimia gas polutan atmosfer, metodologi penginderaan jauh satelit Sentinel-5P & MODIS, serta estimasi inventaris emisi delapan sektor IEA–EDGAR Kota Surabaya.
        </p>

        {/* Tab Filter Navigasi */}
        <div className="flex flex-wrap justify-center gap-2 pt-4">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-300 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-neon-blue border border-blue-400'
                  : 'bg-[#0a1120] text-slate-400 hover:text-blue-300 border border-blue-900/40 hover:border-blue-700/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ==================== SECTION 1: KONSEP DASAR ==================== */}
      {(activeTab === 'semua' || activeTab === 'konsep') && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-blue-900/40 pb-3">
            <span className="w-2 h-6 bg-blue-500 rounded-full shadow-neon-blue inline-block"></span>
            <h2 className="text-xl md:text-2xl font-bold text-white font-display">
              Pengertian Aerosol, Gas Polutan, dan Karbon Dioksida (CO₂)
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1.1 Aerosol */}
            <div className="bg-[#0a1120] p-6 rounded-2xl border border-blue-900/40 hover:border-blue-500/40 hover:shadow-neon-blue transition-all flex flex-col gap-3.5 shadow-lg group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-950/70 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">Apa itu Aerosol?</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong>Aerosol</strong> adalah partikel padat atau tetesan cairan renik yang melayang tersuspensi di udara. Contohnya: debu jalanan, garam laut, jelaga hasil pembakaran mesin, abu partikulat, serta senyawa sulfat dan nitrat yang terbentuk dari reaksi kimia di atmosfer.
              </p>
              <div className="bg-[#050B14] p-3 rounded-xl border border-blue-900/30 text-xs text-slate-400 space-y-1.5 mt-auto">
                <p>• <strong>Aerosol Primer:</strong> Partikel yang langsung terlepas dari sumber emisi (asap knalpot, debu tanah, jelaga).</p>
                <p>• <strong>Aerosol Sekunder:</strong> Partikel yang terbentuk di udara akibat transformasi fotokimia gas SO₂ dan NOₓ.</p>
              </div>
            </div>

            {/* 1.2 Gas Polutan Bukan Aerosol */}
            <div className="bg-[#0a1120] p-6 rounded-2xl border border-blue-900/40 hover:border-blue-500/40 hover:shadow-neon-blue transition-all flex flex-col gap-3.5 shadow-lg group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-950/70 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15M14.25 3.104c.251.023.501.05.75.082M19.8 15a2.25 2.25 0 01-1.59 3.844H5.79a2.25 2.25 0 01-1.59-3.844M12 18v3m-3 0h6" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">Gas Polutan vs Aerosol</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                NO₂, SO₂, CO, HCHO, dan O₃ adalah <strong>molekul gas murni</strong>, bukan partikel debu/aerosol. Semuanya sangat krusial dipantau karena menentukan kualitas udara dan kimia atmosfer perkotaan.
              </p>
              <div className="bg-[#050B14] p-3 rounded-xl border border-blue-900/30 text-xs text-slate-400 space-y-1.5 mt-auto">
                <p>• Pada dashboard, kelompok ini dinamakan <strong>"Gas Polutan dan Indikator Aerosol"</strong> agar akurat secara keilmuan meteorologi.</p>
                <p>• <strong>UVAI & AOD055</strong> adalah <em>indeks optik</em> yang mengukur perilaku hamburan radiasi cahaya oleh aerosol, bukan nama materi fisik.</p>
              </div>
            </div>

            {/* 1.3 Karbon dan CO2 */}
            <div className="bg-[#0a1120] p-6 rounded-2xl border border-blue-900/40 hover:border-amber-500/40 hover:shadow-neon-blue transition-all flex flex-col gap-3.5 shadow-lg group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-950/70 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1.289A3.75 3.75 0 0012 18z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">Karbon & Karbon Dioksida</h3>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong>Karbon Monoksida (CO)</strong> berbeda dengan <strong>Karbon Dioksida (CO₂)</strong>. CO berbahaya bagi pernapasan karena mengikat hemoglobin darah. Sedangkan CO₂ adalah gas rumah kaca utama yang memerangkap panas radiasi Bumi.
              </p>
              <div className="bg-[#050B14] p-3 rounded-xl border border-blue-900/30 text-xs text-slate-400 space-y-1.5 mt-auto">
                <p>• <strong>Satuan ton CO₂</strong> yang digunakan dashboard EDGAR adalah <em>massa gas CO₂</em> yang dilepas ke atmosfer.</p>
                <p>• Bukan ton unsur C murni, bukan CO₂-ekuivalen seluruh gas rumah kaca, dan bukan konsentrasi udara permukaan.</p>
              </div>
            </div>
          </div>

          {/* Tabel Komparasi Pengamatan vs Estimasi */}
          <div className="bg-[#0a1120] rounded-2xl border border-blue-900/40 p-6 shadow-xl overflow-hidden">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-500 rounded-full inline-block"></span>
              <span>Tabel Komparasi Ilmiah: Pengamatan Satelit vs Estimasi Emisi EDGAR</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-[#050B14] text-blue-300 uppercase tracking-wider text-[11px] border-b border-blue-900/50">
                  <tr>
                    <th className="py-3 px-4">Aspek Perbandingan</th>
                    <th className="py-3 px-4">Pengamatan Satelit (Sentinel-5P & MODIS)</th>
                    <th className="py-3 px-4">Estimasi Emisi EDGAR (IEA–EDGAR CO₂)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-900/30 font-medium">
                  <tr className="hover:bg-blue-950/20">
                    <td className="py-3 px-4 font-bold text-white">Apa yang Diamati/Dihitung</td>
                    <td className="py-3 px-4">Sensor menangkap radiasi pantulan spektral Matahari; algoritma retrieval menaksir jumlah molekul gas di kolom atmosfer vertikal.</td>
                    <td className="py-3 px-4">Statistik konsumsi bahan bakar, aktivitas industri, faktor emisi standar IPCC, dan model sebaran spasial teresterial.</td>
                  </tr>
                  <tr className="hover:bg-blue-950/20">
                    <td className="py-3 px-4 font-bold text-white">Contoh Produk Dashboard</td>
                    <td className="py-3 px-4">CO, NO₂, SO₂, HCHO, O₃, UVAI (Sentinel-5P) dan AOD055 (MODIS MAIAC).</td>
                    <td className="py-3 px-4">Emisi CO₂ dari Transport, Industri, Pembangkit Listrik, Bangunan, dan 4 sektor lainnya.</td>
                  </tr>
                  <tr className="hover:bg-blue-950/20">
                    <td className="py-3 px-4 font-bold text-white">Makna Angka Nilai</td>
                    <td className="py-3 px-4">Jumlah molekul gas per meter persegi kolom udara vertikal (<code className="text-blue-300 font-mono">mol/m²</code>) atau indeks optik.</td>
                    <td className="py-3 px-4">Massa emisi gas CO₂ (<code className="text-amber-300 font-mono">ton CO₂</code>) yang dilepaskan ke atmosfer pada grid dan bulan tertentu.</td>
                  </tr>
                  <tr className="hover:bg-blue-950/20">
                    <td className="py-3 px-4 font-bold text-rose-300">Bukan Berarti (Batasan)</td>
                    <td className="py-3 px-4">Bukan kadar yang dihirup langsung di tepi jalan (bukan alat pemantau permukaan tanah / ISPU stasiun BMKG).</td>
                    <td className="py-3 px-4">Bukan bacaan sensor cerobong pabrik secara real-time dan bukan inventaris resmi resmi neraca karbon perorangan.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ==================== SECTION 2: SUMBER DATA & PENGOLAHAN ==================== */}
      {(activeTab === 'semua' || activeTab === 'sumber') && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-blue-900/40 pb-3">
            <span className="w-2 h-6 bg-blue-500 rounded-full shadow-neon-blue inline-block"></span>
            <h2 className="text-xl md:text-2xl font-bold text-white font-display">
              Sumber Data Satelit dan Metodologi Pengolahan
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sentinel-5P */}
            <div className="bg-[#0a1120] p-6 rounded-2xl border border-blue-900/40 hover:border-blue-500/40 transition-all flex flex-col gap-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-blue-950 text-blue-400 rounded-full text-[11px] font-bold border border-blue-700/40">ESA Copernicus</span>
                <span className="text-xs text-slate-400 font-mono">2019–2025</span>
              </div>
              <h3 className="text-lg font-bold text-white">Sentinel-5P / TROPOMI</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Satelit Sentinel-5 Precursor diluncurkan 13 Oktober 2017 oleh European Space Agency (ESA). Instrumen utamanya, <strong>TROPOMI</strong> (Tropospheric Monitoring Instrument), mengukur radiasi spektral ultraviolet hingga inframerah dekat untuk menghitung kolom molekul NO₂, SO₂, CO, HCHO, O₃, dan UVAI.
              </p>
              <div className="mt-auto pt-3 border-t border-blue-900/30 text-[11px] text-slate-400">
                Diolah menjadi 7 variabel × 7 tahun × 12 bulan citra bulanan Surabaya format GeoTIFF & PNG ber-masking administratif.
              </div>
            </div>

            {/* MODIS MAIAC */}
            <div className="bg-[#0a1120] p-6 rounded-2xl border border-blue-900/40 hover:border-blue-500/40 transition-all flex flex-col gap-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-blue-950 text-blue-400 rounded-full text-[11px] font-bold border border-blue-700/40">NASA Terra/Aqua</span>
                <span className="text-xs text-slate-400 font-mono">2000–2025</span>
              </div>
              <h3 className="text-lg font-bold text-white">MODIS MAIAC (AOD055)</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sensor <strong>MODIS</strong> milik NASA beroperasi pada satelit Terra & Aqua. Produk MAIAC (MCD19A2) mengolah pantulan optik aerosol resolusi tinggi 1 km pada panjang gelombang 0,55 µm. Memberikan rekaman historis jangka panjang dinamika partikel udara di atas Surabaya selama 26 tahun berturut-turut.
              </p>
              <div className="mt-auto pt-3 border-t border-blue-900/30 text-[11px] text-slate-400">
                Disaring dengan filter mutu (QC70) dan dirata-ratakan bulanan untuk analisis tren jangka panjang 2000–2025.
              </div>
            </div>

            {/* IEA-EDGAR */}
            <div className="bg-[#0a1120] p-6 rounded-2xl border border-blue-900/40 hover:border-amber-500/40 transition-all flex flex-col gap-3 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-amber-950 text-amber-400 rounded-full text-[11px] font-bold border border-amber-700/40">EC JRC & IEA</span>
                <span className="text-xs text-slate-400 font-mono">2000–2025</span>
              </div>
              <h3 className="text-lg font-bold text-white">IEA–EDGAR v2026 GHG</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                <strong>EDGAR</strong> (Emissions Database for Global Atmospheric Research) dirilis oleh Komisi Eropa (JRC) bersama IEA. Menyajikan estimasi spasial emisi CO₂ bahan bakar fosil grid global 0,1° × 0,1°. Data dipotong (*subset*) dan dialokasikan ke batas Surabaya dengan bobot proporsi luas wilayah (*areal proportion weighting*).
              </p>
              <div className="mt-auto pt-3 border-t border-blue-900/30 text-[11px] text-slate-400">
                Meliputi 8 sektor ekonomi, 26 tahun × 12 bulan (total 2.496 file citra spasial terdistribusi).
              </div>
            </div>
          </div>

          {/* Tabel Satuan dan Periode */}
          <div className="bg-[#0a1120] p-6 rounded-2xl border border-blue-900/40 shadow-xl overflow-hidden">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-500 rounded-full inline-block"></span>
              <span>Tabel Rujukan: Periode, Satuan Asli, dan Makna Pengukuran Produk</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-[#050B14] text-blue-300 uppercase tracking-wider text-[11px] border-b border-blue-900/50">
                  <tr>
                    <th className="py-2.5 px-4">Indikator</th>
                    <th className="py-2.5 px-4">Sensor / Sumber</th>
                    <th className="py-2.5 px-4">Periode</th>
                    <th className="py-2.5 px-4">Satuan Asli</th>
                    <th className="py-2.5 px-4">Interpretasi Fisik</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-900/30">
                  <tr className="hover:bg-blue-950/20">
                    <td className="py-2.5 px-4 font-bold text-white">CO</td>
                    <td className="py-2.5 px-4">Sentinel-5P / TROPOMI</td>
                    <td className="py-2.5 px-4 font-mono">2019–2025</td>
                    <td className="py-2.5 px-4 font-mono text-blue-300">mol/m²</td>
                    <td className="py-2.5 px-4">Kerapatan vertikal molekul Karbon Monoksida per meter persegi.</td>
                  </tr>
                  <tr className="hover:bg-blue-950/20">
                    <td className="py-2.5 px-4 font-bold text-white">NO₂</td>
                    <td className="py-2.5 px-4">Sentinel-5P / TROPOMI</td>
                    <td className="py-2.5 px-4 font-mono">2019–2025</td>
                    <td className="py-2.5 px-4 font-mono text-blue-300">mol/m²</td>
                    <td className="py-2.5 px-4">Kolom troposfer Nitrogen Dioksida dari mesin kendaraan & industri.</td>
                  </tr>
                  <tr className="hover:bg-blue-950/20">
                    <td className="py-2.5 px-4 font-bold text-white">SO₂</td>
                    <td className="py-2.5 px-4">Sentinel-5P / TROPOMI</td>
                    <td className="py-2.5 px-4 font-mono">2019–2025</td>
                    <td className="py-2.5 px-4 font-mono text-blue-300">mol/m²</td>
                    <td className="py-2.5 px-4">Kolom atmosfer Sulfur Dioksida dari pembakaran fosil bersulfur.</td>
                  </tr>
                  <tr className="hover:bg-blue-950/20">
                    <td className="py-2.5 px-4 font-bold text-white">HCHO</td>
                    <td className="py-2.5 px-4">Sentinel-5P / TROPOMI</td>
                    <td className="py-2.5 px-4 font-mono">2019–2025</td>
                    <td className="py-2.5 px-4 font-mono text-blue-300">mol/m²</td>
                    <td className="py-2.5 px-4">Penanda proses oksidasi senyawa organik volatil (VOC) di udara.</td>
                  </tr>
                  <tr className="hover:bg-blue-950/20">
                    <td className="py-2.5 px-4 font-bold text-white">O₃</td>
                    <td className="py-2.5 px-4">Sentinel-5P / TROPOMI</td>
                    <td className="py-2.5 px-4 font-mono">2019–2025</td>
                    <td className="py-2.5 px-4 font-mono text-blue-300">mol/m²</td>
                    <td className="py-2.5 px-4">Kolom total ozon atmosfer (termasuk lapisan stratosfer atas).</td>
                  </tr>
                  <tr className="hover:bg-blue-950/20">
                    <td className="py-2.5 px-4 font-bold text-white">UVAI</td>
                    <td className="py-2.5 px-4">Sentinel-5P / TROPOMI</td>
                    <td className="py-2.5 px-4 font-mono">2019–2025</td>
                    <td className="py-2.5 px-4 font-mono text-slate-400">– (indeks)</td>
                    <td className="py-2.5 px-4">Indeks penyerapan radiasi UV oleh asap, jelaga, dan abu vulkanik.</td>
                  </tr>
                  <tr className="hover:bg-blue-950/20">
                    <td className="py-2.5 px-4 font-bold text-white">AOD055</td>
                    <td className="py-2.5 px-4">MODIS Terra/Aqua MAIAC</td>
                    <td className="py-2.5 px-4 font-mono">2000–2025</td>
                    <td className="py-2.5 px-4 font-mono text-slate-400">– (indeks)</td>
                    <td className="py-2.5 px-4">Tingkat redaman berkas cahaya optik 0.55 µm oleh partikel aerosol.</td>
                  </tr>
                  <tr className="hover:bg-blue-950/20">
                    <td className="py-2.5 px-4 font-bold text-white">8 Sektor EDGAR</td>
                    <td className="py-2.5 px-4">EC JRC / IEA–EDGAR GHG</td>
                    <td className="py-2.5 px-4 font-mono">2000–2025</td>
                    <td className="py-2.5 px-4 font-mono text-amber-300">ton CO₂/bulan</td>
                    <td className="py-2.5 px-4">Massa emisi karbon dioksida per sektor kegiatan ekonomi perkotaan.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ==================== SECTION 3: 7 VARIABEL POLUTAN ATMOSFER ==================== */}
      {(activeTab === 'semua' || activeTab === 'polutan') && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-blue-900/40 pb-3">
            <span className="w-2 h-6 bg-blue-500 rounded-full shadow-neon-blue inline-block"></span>
            <h2 className="text-xl md:text-2xl font-bold text-white font-display">
              Ensiklopedia 7 Gas Polutan dan Indikator Aerosol
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* NO2 */}
            <div className="bg-[#0a1120] p-6 rounded-2xl border border-blue-900/40 hover:border-blue-500/50 hover:shadow-neon-blue transition-all flex flex-col gap-3 shadow-lg group">
              <div className="flex items-center justify-between">
                <span className="text-base md:text-lg font-bold text-white group-hover:text-blue-300 transition-colors">NO₂ — Nitrogen Dioksida</span>
                <span className="text-[11px] font-mono bg-blue-950/80 text-blue-300 px-2.5 py-1 rounded-lg border border-blue-700/40">mol/m²</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Gas berwarna kecokelatan yang terbentuk dari pembakaran bahan bakar suhu tinggi pada mesin kendaraan bermotor, turbin pabrik, dan pembangkit listrik. Penanda utama kepadatan transportasi jalan raya dan kawasan industri perkotaan Surabaya.
              </p>
              <div className="bg-[#050B14] p-3 rounded-xl border border-blue-900/30 text-xs text-slate-400 space-y-1">
                <p><strong>Dampak:</strong> Iritasi saluran pernapasan, pembentukan aerosol nitrat sekunder, dan prekursor ozon fotokimia.</p>
                <p><strong>Hotspot Surabaya:</strong> Koridor Pelabuhan Tanjung Perak, Tol Dupak, dan Kawasan SIER Rungkut.</p>
              </div>
            </div>

            {/* SO2 */}
            <div className="bg-[#0a1120] p-6 rounded-2xl border border-blue-900/40 hover:border-blue-500/50 hover:shadow-neon-blue transition-all flex flex-col gap-3 shadow-lg group">
              <div className="flex items-center justify-between">
                <span className="text-base md:text-lg font-bold text-white group-hover:text-blue-300 transition-colors">SO₂ — Sulfur Dioksida</span>
                <span className="text-[11px] font-mono bg-blue-950/80 text-blue-300 px-2.5 py-1 rounded-lg border border-blue-700/40">mol/m²</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Dihasilkan dari pembakaran bahan bakar fosil yang mengandung sulfur (batu bara, solar kapal kargo berat, boiler minyak). Di udara, SO₂ bereaksi cepat dengan uap air membentuk aerosol sulfat yang bersifat asam dan tahan lama.
              </p>
              <div className="bg-[#050B14] p-3 rounded-xl border border-blue-900/30 text-xs text-slate-400 space-y-1">
                <p><strong>Dampak:</strong> Memperparah asma, merusak vegetasi, dan menyebabkan hujan asam yang merusak material korosif.</p>
                <p><strong>Hotspot Surabaya:</strong> Dermaga Jamrud Pelabuhan Perak, Pabean Cantikan, dan pergudangan Margomulyo.</p>
              </div>
            </div>

            {/* CO */}
            <div className="bg-[#0a1120] p-6 rounded-2xl border border-blue-900/40 hover:border-blue-500/50 hover:shadow-neon-blue transition-all flex flex-col gap-3 shadow-lg group">
              <div className="flex items-center justify-between">
                <span className="text-base md:text-lg font-bold text-white group-hover:text-blue-300 transition-colors">CO — Karbon Monoksida</span>
                <span className="text-[11px] font-mono bg-blue-950/80 text-blue-300 px-2.5 py-1 rounded-lg border border-blue-700/40">mol/m²</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Gas tidak berbau dan tidak berwarna hasil pembakaran tidak sempurna akibat pasokan oksigen yang minim. Berasal dari knalpot kendaraan saat macet padat, pembakaran sampah/biomassa, serta fasilitas pengolahan bahan bakar.
              </p>
              <div className="bg-[#050B14] p-3 rounded-xl border border-blue-900/30 text-xs text-slate-400 space-y-1">
                <p><strong>Dampak:</strong> Mengikat hemoglobin darah 200× lebih kuat daripada oksigen; beracun pada konsentrasi tinggi.</p>
                <p><strong>Hotspot Surabaya:</strong> Kawasan industri Romokalisari / Benowo, Margomulyo, dan arteri Karang Pilang.</p>
              </div>
            </div>

            {/* HCHO */}
            <div className="bg-[#0a1120] p-6 rounded-2xl border border-blue-900/40 hover:border-blue-500/50 hover:shadow-neon-blue transition-all flex flex-col gap-3 shadow-lg group">
              <div className="flex items-center justify-between">
                <span className="text-base md:text-lg font-bold text-white group-hover:text-blue-300 transition-colors">HCHO — Formaldehida</span>
                <span className="text-[11px] font-mono bg-blue-950/80 text-blue-300 px-2.5 py-1 rounded-lg border border-blue-700/40">mol/m²</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Gas intermediat yang sangat reaktif. Formaldehida terbentuk dari oksidasi senyawa organik volatil (VOC) yang diemisikan oleh pelarut industri cat, resin kimia, knalpot bensin, serta evaporasi hidrokarbon.
              </p>
              <div className="bg-[#050B14] p-3 rounded-xl border border-blue-900/30 text-xs text-slate-400 space-y-1">
                <p><strong>Dampak:</strong> Iritasi mata dan tenggorokan; penanda kunci aktivitas kimia fotokimia regional atmosfer.</p>
                <p><strong>Hotspot Surabaya:</strong> Pusat Niaga Genteng / Tunjungan, Bubutan Pasar Turi, dan Sukolilo.</p>
              </div>
            </div>

            {/* O3 */}
            <div className="bg-[#0a1120] p-6 rounded-2xl border border-blue-900/40 hover:border-blue-500/50 hover:shadow-neon-blue transition-all flex flex-col gap-3 shadow-lg group">
              <div className="flex items-center justify-between">
                <span className="text-base md:text-lg font-bold text-white group-hover:text-blue-300 transition-colors">O₃ — Ozon Atmosfer Total</span>
                <span className="text-[11px] font-mono bg-blue-950/80 text-blue-300 px-2.5 py-1 rounded-lg border border-blue-700/40">mol/m²</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Produk Sentinel-5P mengukur <strong>kolom total ozon vertikal</strong> dari permukaan hingga stratosfer. Di stratosfer, ozon sangat bermanfaat melindungi Bumi dari radiasi UV ultraviolet berbahaya matahari.
              </p>
              <div className="bg-[#050B14] p-3 rounded-xl border border-blue-900/40 text-xs text-blue-200 space-y-1 flex items-start gap-2.5">
                <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <p><strong>Catatan Kritis:</strong> Peta ini adalah kolom total atmosfer, <em>bukan</em> konsentrasi ozon permukaan tanah (*photochemical smog*). Tidak boleh dipromosikan sebagai peta polusi ozon hirup jalanan.</p>
              </div>
            </div>

            {/* UVAI */}
            <div className="bg-[#0a1120] p-6 rounded-2xl border border-blue-900/40 hover:border-blue-500/50 hover:shadow-neon-blue transition-all flex flex-col gap-3 shadow-lg group">
              <div className="flex items-center justify-between">
                <span className="text-base md:text-lg font-bold text-white group-hover:text-blue-300 transition-colors">UVAI — UV Aerosol Index</span>
                <span className="text-[11px] font-mono bg-slate-900 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/50">indeks</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Indeks optik berbasis panjang gelombang ultraviolet untuk mendeteksi aerosol penyerap radiasi seperti asap jelaga hitam (*black carbon*), asap kebakaran lahan, debu tanah kering, dan abu partikulat.
              </p>
              <div className="bg-[#050B14] p-3 rounded-xl border border-blue-900/30 text-xs text-slate-400 space-y-1 flex items-start gap-2.5">
                <svg className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.516 0c.85.493 1.508 1.333 1.508 2.316V18" />
                </svg>
                <p>Nilai positif tinggi mengindikasikan adanya asap/debu penyerap UV pekat; nilai mendekati nol/negatif menunjukkan atmosfer bersih atau aerosol penghambur cahaya.</p>
              </div>
            </div>

            {/* AOD055 */}
            <div className="bg-[#0a1120] p-6 rounded-2xl border border-blue-900/40 hover:border-blue-500/50 hover:shadow-neon-blue transition-all flex flex-col gap-3 shadow-lg group md:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-base md:text-lg font-bold text-white group-hover:text-blue-300 transition-colors">AOD055 — Aerosol Optical Depth 0.55 µm (MODIS MAIAC)</span>
                <span className="text-[11px] font-mono bg-blue-950/80 text-blue-300 px-2.5 py-1 rounded-lg border border-blue-700/40">26 Tahun Historis</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Mengukur seberapa banyak pancaran sinar Matahari yang dihamburkan dan diserap oleh partikel aerosol di seluruh kolom atmosfer dari permukaan hingga batas antariksa pada panjang gelombang 550 nm (cahaya tampak hijau). Menggunakan algoritma MAIAC (Multi-Angle Implementation of Atmospheric Correction) dengan resolusi spasial 1 km.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-400 bg-[#050B14] p-3.5 rounded-xl border border-blue-900/30">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                  </svg>
                  <p><strong>Manfaat:</strong> Melacak tren historis aerosol perkotaan Surabaya selama lebih dari seperempat abad (2000–2025) untuk studi dampak jangka panjang.</p>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  <p><strong>Hubungan PM₂.₅:</strong> Nilai AOD tinggi umumnya berkorelasi dengan polusi partikel, namun dipengaruhi oleh kelembapan udara dan ketinggian lapisan batas atmosfer (*boundary layer*).</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ==================== SECTION 4: 8 SEKTOR EDGAR ==================== */}
      {(activeTab === 'semua' || activeTab === 'edgar') && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-blue-900/40 pb-3">
            <span className="w-2 h-6 bg-amber-500 rounded-full shadow-neon-blue inline-block"></span>
            <h2 className="text-xl md:text-2xl font-bold text-white font-display">
              Section Karbon EDGAR: Delapan Sektor Emisi CO₂ Kota Surabaya
            </h2>
          </div>

          {/* Tabel Kontribusi Emisi Surabaya 2025 */}
          <div className="bg-[#0a1120] p-6 rounded-2xl border border-blue-900/40 shadow-xl overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="w-1.5 h-4 bg-amber-500 rounded-full inline-block"></span>
                  <span>Distribusi Emisi CO₂ Fosil Kota Surabaya Berdasarkan Olahan EDGAR 2025</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Total Estimasi 8 Sektor Terolah: <strong className="text-amber-400 font-mono">5.697.095,12 ton CO₂/tahun</strong> (±5,70 juta ton)
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-950/70 text-amber-300 rounded-full text-xs font-mono font-bold border border-amber-600/40">
                Data Rilis IEA–EDGAR 2026
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="bg-[#050B14] text-blue-300 uppercase tracking-wider text-[11px] border-b border-blue-900/50">
                  <tr>
                    <th className="py-2.5 px-4">Peringkat & Sektor</th>
                    <th className="py-2.5 px-4 text-right">Estimasi 2025 (Ton CO₂/Tahun)</th>
                    <th className="py-2.5 px-4 text-right">Proporsi Kontribusi</th>
                    <th className="py-2.5 px-4">Aktivitas Utama Penyumbang</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-900/30 font-medium">
                  <tr className="hover:bg-blue-950/20">
                    <td className="py-2.5 px-4 font-bold text-amber-300">1. Fuel Exploitation</td>
                    <td className="py-2.5 px-4 text-right font-mono">2.097.410,72</td>
                    <td className="py-2.5 px-4 text-right font-bold text-amber-400">36,815%</td>
                    <td className="py-2.5 px-4">Produksi, pemurnian bahan bakar, penyimpanan energi, dan flaring fasilitas minyak/gas.</td>
                  </tr>
                  <tr className="hover:bg-blue-950/20">
                    <td className="py-2.5 px-4 font-bold text-amber-300">2. Industrial Combustion</td>
                    <td className="py-2.5 px-4 text-right font-mono">1.741.980,34</td>
                    <td className="py-2.5 px-4 text-right font-bold text-amber-400">30,577%</td>
                    <td className="py-2.5 px-4">Boiler, tungku bakar, dan mesin pemanas industri manufaktur logam, makanan, & tekstil.</td>
                  </tr>
                  <tr className="hover:bg-blue-950/20">
                    <td className="py-2.5 px-4 font-bold text-blue-300">3. Transport</td>
                    <td className="py-2.5 px-4 text-right font-mono">977.576,72</td>
                    <td className="py-2.5 px-4 text-right font-bold text-blue-400">17,159%</td>
                    <td className="py-2.5 px-4">Kendaraan jalan raya (motor, mobil, truk), operasional kapal pelabuhan, dan kereta api.</td>
                  </tr>
                  <tr className="hover:bg-blue-950/20">
                    <td className="py-2.5 px-4 font-bold text-slate-200">4. Power Industry</td>
                    <td className="py-2.5 px-4 text-right font-mono">332.414,70</td>
                    <td className="py-2.5 px-4 text-right font-mono">5,835%</td>
                    <td className="py-2.5 px-4">Pembangkitan tenaga listrik dan uap panas berbasis pembakaran fosil di sel grid Surabaya.</td>
                  </tr>
                  <tr className="hover:bg-blue-950/20">
                    <td className="py-2.5 px-4 font-bold text-slate-200">5. Buildings</td>
                    <td className="py-2.5 px-4 text-right font-mono">315.121,68</td>
                    <td className="py-2.5 px-4 text-right font-mono">5,531%</td>
                    <td className="py-2.5 px-4">Konsumsi energi termal langsung gedung komersial, hotel, rumah sakit, dan pemukiman (LPG).</td>
                  </tr>
                  <tr className="hover:bg-blue-950/20">
                    <td className="py-2.5 px-4 font-bold text-slate-200">6. Industrial Processes</td>
                    <td className="py-2.5 px-4 text-right font-mono">225.370,14</td>
                    <td className="py-2.5 px-4 text-right font-mono">3,956%</td>
                    <td className="py-2.5 px-4">Reaksi kimia kalsinasi bahan baku klinker semen, peleburan logam, dan bahan kimia dasar.</td>
                  </tr>
                  <tr className="hover:bg-blue-950/20">
                    <td className="py-2.5 px-4 font-bold text-slate-300">7. Waste</td>
                    <td className="py-2.5 px-4 text-right font-mono">6.910,43</td>
                    <td className="py-2.5 px-4 text-right font-mono">0,121%</td>
                    <td className="py-2.5 px-4">Pengolahan sampah padat dan penanganan air limbah industri & domestik.</td>
                  </tr>
                  <tr className="hover:bg-blue-950/20">
                    <td className="py-2.5 px-4 font-bold text-slate-400">8. Agriculture</td>
                    <td className="py-2.5 px-4 text-right font-mono">310,40</td>
                    <td className="py-2.5 px-4 text-right font-mono">0,005%</td>
                    <td className="py-2.5 px-4">Aktivitas pembakaran residu tanaman dan pengelolaan lahan pertanian terbatas.</td>
                  </tr>
                  <tr className="bg-amber-950/30 font-bold text-amber-300 border-t border-amber-500/40">
                    <td className="py-3 px-4">TOTAL (8 SEKTOR)</td>
                    <td className="py-3 px-4 text-right font-mono">5.697.095,12</td>
                    <td className="py-3 px-4 text-right font-mono">100,00%</td>
                    <td className="py-3 px-4">Agregat teralokasi pada luas batas wilayah administrasi Kota Surabaya.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Rincian Penjelasan Sektor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#0a1120] p-5 rounded-2xl border border-blue-900/40 hover:border-amber-500/40 hover:shadow-neon-blue transition-all space-y-2 group">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                  </svg>
                </div>
                <h4 className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">Sektor 1: Fuel Exploitation (36,8%)</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Menyumbang emisi terbesar di Surabaya. Berasal dari aktivitas rantai pasok energi fosil di kawasan pesisir dan pelabuhan, termasuk pemurnian bahan bakar, operasional tangki timbun minyak/gas, kompresi pipa gas, dan kehilangan energi operasional.
              </p>
            </div>

            <div className="bg-[#0a1120] p-5 rounded-2xl border border-blue-900/40 hover:border-amber-500/40 hover:shadow-neon-blue transition-all space-y-2 group">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                  </svg>
                </div>
                <h4 className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">Sektor 2: Industrial Combustion (30,6%)</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Berasal dari pembakaran batu bara, gas bumi, dan minyak bakar pada boiler serta tungku industri manufaktur di kawasan Margomulyo, Rungkut SIER, Karang Pilang, dan Kalianak untuk memproduksi uap dan panas proses.
              </p>
            </div>

            <div className="bg-[#0a1120] p-5 rounded-2xl border border-blue-900/40 hover:border-blue-500/40 hover:shadow-neon-blue transition-all space-y-2 group">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25H6.75A2.25 2.25 0 004.5 9.75v6" />
                  </svg>
                </div>
                <h4 className="font-bold text-white text-sm group-hover:text-blue-300 transition-colors">Sektor 3: Transport (17,2%)</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Mencakup konsumsi bensin dan solar kendaraan bermotor pribadi dan logistik barang yang melintasi jalan tol dan arteri Surabaya, serta manuver kapal di Pelabuhan Tanjung Perak.
              </p>
            </div>

            <div className="bg-[#0a1120] p-5 rounded-2xl border border-blue-900/40 hover:border-blue-500/40 hover:shadow-neon-blue transition-all space-y-2 group">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-950/60 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-105 transition-transform">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
                <h4 className="font-bold text-white text-sm group-hover:text-blue-300 transition-colors">Sektor 4: Power Industry (5,8%)</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Pembangkit listrik berbasis bahan bakar fosil dan genset captive industri di dalam grid Surabaya. Angka ini mencerminkan emisi dari lokasi pembangkit, bukan emisi pemakaian listrik warga kota secara keseluruhan.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ==================== SECTION 5: REFERENSI ILMIAH ==================== */}
      {(activeTab === 'semua' || activeTab === 'referensi') && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-blue-900/40 pb-3">
            <span className="w-2 h-6 bg-blue-500 rounded-full shadow-neon-blue inline-block"></span>
            <h2 className="text-xl md:text-2xl font-bold text-white font-display">
              Referensi Ilmiah & Basis Data Resmi
            </h2>
          </div>

          <div className="bg-[#0a1120] p-6 rounded-2xl border border-blue-900/40 shadow-xl space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Seluruh data, metodologi perhitungan spasial, dan informasi kimia atmosfer pada dashboard ini mengacu pada literatur ilmiah dan dokumen teknis otoritas meteorologi dan keantariksaan dunia:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
              <div className="bg-[#050B14] p-4 rounded-xl border border-blue-900/30 hover:border-blue-500/40 transition-colors space-y-1">
                <span className="text-blue-300 font-bold flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  [S1] European Commission JRC (2026)
                </span>
                <p className="text-slate-400">EDGAR_2026_GHG Greenhouse Gas Emissions Dataset. European Commission, Joint Research Centre.</p>
                <a href="https://edgar.jrc.ec.europa.eu" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline block pt-1 font-mono text-[11px]">edgar.jrc.ec.europa.eu ↗</a>
              </div>

              <div className="bg-[#050B14] p-4 rounded-xl border border-blue-900/30 hover:border-blue-500/40 transition-colors space-y-1">
                <span className="text-blue-300 font-bold flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  [S2] European Space Agency (ESA)
                </span>
                <p className="text-slate-400">Copernicus Sentinel-5P Mission & TROPOMI Atmospheric Instrument Specifications.</p>
                <a href="https://dataspace.copernicus.eu" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline block pt-1 font-mono text-[11px]">dataspace.copernicus.eu ↗</a>
              </div>

              <div className="bg-[#050B14] p-4 rounded-xl border border-blue-900/30 hover:border-blue-500/40 transition-colors space-y-1">
                <span className="text-blue-300 font-bold flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  [S3] NASA Earth Observatory & LP DAAC
                </span>
                <p className="text-slate-400">MODIS Terra/Aqua MAIAC (MCD19A2) Aerosol Optical Depth 1 km Product.</p>
                <a href="https://lpdaac.usgs.gov" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline block pt-1 font-mono text-[11px]">lpdaac.usgs.gov ↗</a>
              </div>

              <div className="bg-[#050B14] p-4 rounded-xl border border-blue-900/30 hover:border-blue-500/40 transition-colors space-y-1">
                <span className="text-blue-300 font-bold flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  [S4] World Health Organization (WHO 2021)
                </span>
                <p className="text-slate-400">Global Air Quality Guidelines: Particulate Matter (PM₂.₅, PM₁₀), Ozone, Nitrogen Dioxide, and Sulfur Dioxide.</p>
                <a href="https://www.who.int" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline block pt-1 font-mono text-[11px]">who.int ↗</a>
              </div>

              <div className="bg-[#050B14] p-4 rounded-xl border border-blue-900/30 hover:border-blue-500/40 transition-colors space-y-1">
                <span className="text-blue-300 font-bold flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  [S5] United States Environmental Protection Agency (US EPA)
                </span>
                <p className="text-slate-400">Ground-level Ozone and Particulate Matter Atmospheric Criteria Assessment.</p>
                <a href="https://www.epa.gov" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline block pt-1 font-mono text-[11px]">epa.gov ↗</a>
              </div>

              <div className="bg-[#050B14] p-4 rounded-xl border border-blue-900/30 hover:border-blue-500/40 transition-colors space-y-1">
                <span className="text-blue-300 font-bold flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  [S6] STMKG Atmospheric Research Team (2026)
                </span>
                <p className="text-slate-400">DOCS MASTER Jejak Karbon & Polutan Atmosfer Kota Surabaya, Sekolah Tinggi Meteorologi Klimatologi dan Geofisika.</p>
                <span className="text-slate-500 block pt-1 font-mono text-[11px]">Audit Data Master 11-12 November 2026</span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
