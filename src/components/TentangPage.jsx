export default function TentangPage() {
  const DEVELOPERS = [
    {
      id: 1,
      role: 'Ketua TIM',
      name: 'Putra Abdurrazzaq A. Wahid',
      institution: 'Prodi Klimatologi',
      desc: 'Bertanggung jawab atas pengunduhan dan pengolahan citra satelit Sentinel-5P (TROPOMI) serta MODIS MAIAC AOD055 format GeoTIFF.',
      badge: 'STMKG'
    },
    {
      id: 2,
      role: 'Anggota',
      name: 'Marianus Carol Jehadun',
      institution: 'Prodi Instrumentasi MKG',
      desc: 'Merancang arsitektur sistem web interaktif, integrasi peta spasial Leaflet OpenStreetMap, komponen visualisasi temporal Recharts, dan pengalaman antarmuka pengguna.',
      badge: 'STMKG'
    },
    {
      id: 3,
      role: 'Anggota',
      name: 'Riza Bina Bhakti Adinegara',
      institution: 'Prodi Instrumentasi MKG',
      desc: 'Melakukan integrasi AI Model pada website untuk menjelaskan informasi kepada pengguna sesuai konteks pemilihan yang disesuaikan.',
      badge: 'STMKG'
    },
    {
      id: 4,
      role: 'Anggota',
      name: 'Fahri Kuncoro',
      institution: 'Prodi Instrumentasi MKG',
      desc: 'Menyusun dokumentasi ilmiah (DOCS MASTER), validasi mutu dataset (QC), harmonisasi metadata sensor, serta verifikasi batas administratif Kota Surabaya.',
      badge: 'STMKG'
    },
  ]

  return (
    <div className="space-y-12 max-w-6xl mx-auto py-4 animate-in fade-in duration-300">
      {/* ==================== HERO HEADER ==================== */}
      <div className="text-center space-y-4 border-b border-blue-900/40 pb-8">
        <div className="inline-flex items-center gap-2 bg-blue-950/70 border border-blue-500/40 px-4 py-1.5 rounded-full text-xs font-semibold text-blue-300 shadow-neon-blue">
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
            <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.516 0c.85.493 1.508 1.333 1.508 2.316V18" />
            </svg>
            <span>Mendukung target pencapaian Net Zero Emission dan pengawasan kualitas udara berkelanjutan di Kota Surabaya.</span>
          </div>
        </div>

        <div className="bg-[#0a1120] p-6 rounded-3xl border border-blue-900/40 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-base">
              <h2 className="text-lg font-bold text-white font-display">Kampus</h2>
            </div>
            <div className="flex items-center gap-4 bg-[#050B14] p-4 rounded-2xl border border-blue-900/40">
              <img src="/img/Logo_STMKG.png" alt="Logo STMKG" className="w-16 h-16 object-contain" />
              <div>
                <h3 className="font-bold text-white text-sm">Sekolah Tinggi Meteorologi Klimatologi dan Geofisika</h3>
                <p className="text-xs text-blue-400 font-medium">STMKG</p>
                <p className="text-[11px] text-slate-400 mt-1">Tangerang, Banten</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Karya ini merupakan wujud kontribusi riset terapan dan inovasi teknologi taruna STMKG dalam mendayagunakan sains atmosfer, instrumentasi satelit penginderaan jauh, dan komputasi geospasial untuk mitigasi perubahan iklim di tingkat kota.
            </p>
          </div>
          <div className="pt-2 text-[11px] text-slate-400 border-t border-blue-900/30">
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
            Tentang TIM
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
          {/* Card 1: Sentinel-5P & MODIS */}
          <div className="bg-[#050B14] p-5 rounded-2xl border border-blue-900/30 hover:border-cyan-500/50 hover:shadow-neon-cyan transition-all duration-300 group flex flex-col items-center">
            <div className="w-12 h-12 mb-3 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:border-cyan-400 shadow-sm transition-transform duration-300">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 7l5 5m-7-3l2 2m-8 4l2 2" />
                <path d="M4 14l3.5-3.5a2.121 2.121 0 0 1 3 0l3 3a2.121 2.121 0 0 1 0 3L10 20l-6-6z" />
                <path d="M12 2l4 4-2 2-4-4 2-2z" />
                <path d="M18 8l4 4-2 2-4-4 2-2z" />
                <path d="M2 22l3-3" />
                <path d="M17 2l5 5" />
              </svg>
            </div>
            <h4 className="font-bold text-white text-xs md:text-sm group-hover:text-cyan-300 transition-colors">Sentinel-5P & MODIS</h4>
            <p className="text-[10px] md:text-[11px] text-slate-400 mt-1">Citra TROPOMI Level-2 & MAIAC AOD</p>
          </div>

          {/* Card 2: IEA–EDGAR v2026 */}
          <div className="bg-[#050B14] p-5 rounded-2xl border border-blue-900/30 hover:border-amber-500/50 hover:shadow-neon-amber transition-all duration-300 group flex flex-col items-center">
            <div className="w-12 h-12 mb-3 rounded-2xl bg-amber-950/60 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:border-amber-400 shadow-sm transition-transform duration-300">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                <path d="M17 18h1" />
                <path d="M12 18h1" />
                <path d="M7 18h1" />
              </svg>
            </div>
            <h4 className="font-bold text-white text-xs md:text-sm group-hover:text-amber-300 transition-colors">IEA–EDGAR v2026</h4>
            <p className="text-[10px] md:text-[11px] text-slate-400 mt-1">Grid Emisi Fosil 8 Sektor (26 Tahun)</p>
          </div>

          {/* Card 3: Leaflet & OpenStreetMap */}
          <div className="bg-[#050B14] p-5 rounded-2xl border border-blue-900/30 hover:border-emerald-500/50 hover:shadow-neon-emerald transition-all duration-300 group flex flex-col items-center">
            <div className="w-12 h-12 mb-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 group-hover:border-emerald-400 shadow-sm transition-transform duration-300">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                <line x1="9" x2="9" y1="3" y2="18" />
                <line x1="15" x2="15" y1="6" y2="21" />
              </svg>
            </div>
            <h4 className="font-bold text-white text-xs md:text-sm group-hover:text-emerald-300 transition-colors">Leaflet & OpenStreetMap</h4>
            <p className="text-[10px] md:text-[11px] text-slate-400 mt-1">Engine Web GIS & Overlay Spasial</p>
          </div>

          {/* Card 4: React & Tailwind CSS */}
          <div className="bg-[#050B14] p-5 rounded-2xl border border-blue-900/30 hover:border-indigo-500/50 hover:shadow-neon-indigo transition-all duration-300 group flex flex-col items-center">
            <div className="w-12 h-12 mb-3 rounded-2xl bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-110 group-hover:border-indigo-400 shadow-sm transition-transform duration-300">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75}>
                <circle cx="12" cy="12" r="2.5" fill="currentColor" />
                <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(30 12 12)" />
                <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(90 12 12)" />
                <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(150 12 12)" />
              </svg>
            </div>
            <h4 className="font-bold text-white text-xs md:text-sm group-hover:text-indigo-300 transition-colors">React & Tailwind CSS</h4>
            <p className="text-[10px] md:text-[11px] text-slate-400 mt-1">Antarmuka Responsif & Recharts</p>
          </div>
        </div>

        <div className="bg-[#050B14] p-4 rounded-2xl border border-blue-900/30 text-xs text-slate-300 leading-relaxed space-y-2">
          <h4 className="font-bold text-white text-xs flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
            <span>Penafian Akademis & Batasan Data (Scientific Disclaimer)</span>
          </h4>
          <p>
            Informasi estimasi emisi dan konsentrasi kolom atmosfer pada website ini disajikan untuk keperluan pembelajaran, penelitian akademis, dan edukasi publik. Data estimasi EDGAR adalah hasil alokasi model grid matematis dan bukan merupakan pengukuran neraca gas rumah kaca resmi perorangan atau audit cerobong pabrik. Hasil retrieval satelit mengukur kerapatan kolom vertikal atmosfer dan tidak dapat disamakan secara langsung dengan bacaan stasiun ISPU permukaan tanah.
          </p>
        </div>
      </section>
    </div>
  )
}

