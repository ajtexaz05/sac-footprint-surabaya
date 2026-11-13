export default function TentangPage() {
  const DEVELOPERS = [
    {
      id: 1,
      role: 'Lead Developer & Web GIS Architect',
      name: 'Taruna STMKG (Pengembang 1)',
      institution: 'Sekolah Tinggi Meteorologi Klimatologi dan Geofisika (STMKG)',
      desc: 'Merancang arsitektur sistem web interaktif, integrasi peta spasial Leaflet OpenStreetMap, komponen visualisasi temporal Recharts, dan pengalaman antarmuka pengguna.',
      badge: 'Web & GIS'
    },
    {
      id: 2,
      role: 'Satellite Remote Sensing Specialist',
      name: 'Taruna STMKG (Pengembang 2)',
      institution: 'Sekolah Tinggi Meteorologi Klimatologi dan Geofisika (STMKG)',
      desc: 'Bertanggung jawab atas pengunduhan, kalibrasi, ekstraksi, dan pengolahan citra satelit Sentinel-5P (TROPOMI) serta MODIS MAIAC AOD055 format GeoTIFF.',
      badge: 'Satelit & Atmosfer'
    },
    {
      id: 3,
      role: 'EDGAR Emission Modeler & Spatial Analyst',
      name: 'Taruna STMKG (Pengembang 3)',
      institution: 'Sekolah Tinggi Meteorologi Klimatologi dan Geofisika (STMKG)',
      desc: 'Melakukan analisis pemodelan spasial delapan sektor IEA–EDGAR GHG 2000–2025, alokasi bobot proporsi luas wilayah Surabaya, serta perhitungan statistik emisi.',
      badge: 'Emisi EDGAR'
    },
    {
      id: 4,
      role: 'Quality Assurance & Scientific Documenter',
      name: 'Taruna STMKG (Pengembang 4)',
      institution: 'Sekolah Tinggi Meteorologi Klimatologi dan Geofisika (STMKG)',
      desc: 'Menyusun dokumentasi ilmiah (DOCS MASTER), validasi mutu dataset (QC), harmonisasi metadata sensor, serta verifikasi batas administratif Kota Surabaya.',
      badge: 'QA & Dokumen'
    },
  ]

  return (
    <div className="space-y-12 max-w-6xl mx-auto py-4 animate-in fade-in duration-300">
      {/* ==================== HERO HEADER ==================== */}
      <div className="text-center space-y-4 border-b border-blue-900/40 pb-8">
        <div className="inline-flex items-center gap-2 bg-blue-950/70 border border-blue-500/40 px-4 py-1.5 rounded-full text-xs font-semibold text-blue-300 shadow-neon-blue">
          <img src="/img/Logo_STMKG.png" alt="STMKG Logo" className="w-4 h-4 object-contain inline-block" />
          <span>Profil Platform & Tim Pengembang</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight font-display drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">
          Surabaya Atmospheric & Carbon Footprint
        </h1>
        <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">
          SAC-Footprint Surabaya • STMKG 2026
        </p>
        <p className="text-slate-300 max-w-3xl mx-auto text-sm md:text-base leading-relaxed">
          Platform pemantauan geospasial terintegrasi yang menyajikan dinamika gas polutan atmosfer (Sentinel-5P & MODIS) dan estimasi jejak emisi karbon dioksida fosil (IEA–EDGAR) di wilayah metropolitan Kota Surabaya.
        </p>
      </div>

      {/* ==================== LATAR BELAKANG & VISI ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#0a1120] p-6 rounded-3xl border border-blue-900/40 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-blue-400 font-bold text-base">
              <span>🎯</span>
              <h2 className="text-lg font-bold text-white font-display">Latar Belakang & Urgensi</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Kota Surabaya merupakan kota metropolitan terbesar kedua di Indonesia sekaligus pusat perekonomian, industri manufaktur, dan logistik maritim di kawasan timur Pulau Jawa. Pertumbuhan aktivitas ekonomi, keberadaan Pelabuhan Tanjung Perak, dan jaringan transportasi yang padat berkontribusi signifikan terhadap emisi gas rumah kaca serta dinamika polutan atmosfer.
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Platform ini dikembangkan untuk menjembatani kesenjangan akses data geospasial ilmiah dengan menyatukan observasi penginderaan jauh satelit modern (Sentinel-5P dan MODIS) serta inventarisasi emisi berstandar internasional (IEA–EDGAR) dalam satu dashboard yang mudah dipahami oleh publik, akademisi, dan pemangku kebijakan.
            </p>
          </div>
          <div className="bg-[#050B14] p-3.5 rounded-2xl border border-blue-900/30 text-xs text-blue-300 flex items-center gap-3">
            <span className="text-xl">💡</span>
            <span>Mendukung target pencapaian Net Zero Emission dan pengawasan kualitas udara berkelanjutan di Kota Surabaya.</span>
          </div>
        </div>

        <div className="bg-[#0a1120] p-6 rounded-3xl border border-blue-900/40 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
              <span>🏛️</span>
              <h2 className="text-lg font-bold text-white font-display">Afiliasi Akademik & Pembina</h2>
            </div>
            <div className="flex items-center gap-4 bg-[#050B14] p-4 rounded-2xl border border-blue-900/40">
              <img src="/img/Logo_STMKG.png" alt="Logo STMKG" className="w-16 h-16 object-contain" />
              <div>
                <h3 className="font-bold text-white text-sm">Sekolah Tinggi Meteorologi Klimatologi dan Geofisika</h3>
                <p className="text-xs text-blue-400 font-medium">STMKG — Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)</p>
                <p className="text-[11px] text-slate-400 mt-1">Tangerang Selatan, Banten, Indonesia</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Karya ini merupakan wujud kontribusi riset terapan dan inovasi teknologi taruna STMKG dalam mendayagunakan sains atmosfer, instrumentasi satelit penginderaan jauh, dan komputasi geospasial untuk mitigasi perubahan iklim di tingkat kota.
            </p>
          </div>
          <div className="pt-2 text-[11px] text-slate-400 border-t border-blue-900/30">
            Kementerian / Lembaga: <strong>Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)</strong>
          </div>
        </div>
      </div>

      {/* ==================== TIM PENGEMBANG (4 ORANG TANPA FOTO) ==================== */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-7 bg-blue-500 rounded-full shadow-neon-blue inline-block"></span>
            <h2 className="text-2xl font-bold text-white font-display">
              Tim Pengembang
            </h2>
          </div>
          <span className="text-xs text-slate-400 bg-[#0a1120] px-3 py-1 rounded-full border border-blue-900/40">
            4 Taruna STMKG
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DEVELOPERS.map(dev => (
            <div
              key={dev.id}
              className="bg-[#0a1120] p-6 rounded-3xl border border-blue-900/40 hover:border-blue-500/50 hover:shadow-neon-blue transition-all duration-300 flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-blue-950 text-blue-400 rounded-full text-[11px] font-bold border border-blue-700/40">
                    {dev.badge}
                  </span>
                  <span className="text-xs font-mono text-slate-500">#{dev.id}</span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                    {dev.name}
                  </h3>
                  <p className="text-xs font-semibold text-blue-400 mt-0.5">{dev.role}</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">{dev.institution}</p>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-blue-900/30">
                  {dev.desc}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-blue-900/30 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Taruna Aktif STMKG</span>
                </span>
                <span className="font-mono text-slate-500">STMKG © 2026</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== TECH STACK & METODOLOGI ==================== */}
      <section className="bg-[#0a1120] p-6 md:p-8 rounded-3xl border border-blue-900/40 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <span className="w-2 h-6 bg-cyan-500 rounded-full inline-block"></span>
          <h2 className="text-xl font-bold text-white font-display">Teknologi & Alur Arsitektur Data</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="bg-[#050B14] p-4 rounded-2xl border border-blue-900/30">
            <span className="text-2xl block mb-1">🛰️</span>
            <h4 className="font-bold text-white text-xs">Sentinel-5P & MODIS</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Citra TROPOMI Level-2 & MAIAC AOD</p>
          </div>
          <div className="bg-[#050B14] p-4 rounded-2xl border border-blue-900/30">
            <span className="text-2xl block mb-1">🏭</span>
            <h4 className="font-bold text-white text-xs">IEA–EDGAR v2026</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Grid Emisi Fosil 8 Sektor (26 Tahun)</p>
          </div>
          <div className="bg-[#050B14] p-4 rounded-2xl border border-blue-900/30">
            <span className="text-2xl block mb-1">🗺️</span>
            <h4 className="font-bold text-white text-xs">Leaflet & OpenStreetMap</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Engine Web GIS & Overlay Spasial</p>
          </div>
          <div className="bg-[#050B14] p-4 rounded-2xl border border-blue-900/30">
            <span className="text-2xl block mb-1">⚡</span>
            <h4 className="font-bold text-white text-xs">React & Tailwind CSS</h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Antarmuka Responsif & Recharts</p>
          </div>
        </div>

        <div className="bg-[#050B14] p-4 rounded-2xl border border-blue-900/30 text-xs text-slate-300 leading-relaxed space-y-2">
          <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
            <span>🛡️</span> Penafian Akademis & Batasan Data (Scientific Disclaimer)
          </h4>
          <p>
            Informasi estimasi emisi dan konsentrasi kolom atmosfer pada website ini disajikan untuk keperluan pembelajaran, penelitian akademis, dan edukasi publik. Data estimasi EDGAR adalah hasil alokasi model grid matematis dan bukan merupakan pengukuran neraca gas rumah kaca resmi perorangan atau audit cerobong pabrik. Hasil retrieval satelit mengukur kerapatan kolom vertikal atmosfer dan tidak dapat disamakan secara langsung dengan bacaan stasiun ISPU permukaan tanah.
          </p>
        </div>
      </section>
    </div>
  )
}

