import { useState } from 'react'

export default function AiInsightCard({
  activeSection,
  activeIndicator,
  indicatorMeta,
  activeSector,
  sectorMeta,
  activeYear,
  activeMonth,
  monthName,
  kpiData,
  hotspots,
  fmtTon,
  fmtNum,
  isAtmosfer
}) {
  // Status UI & Respon AI
  const [aiOutput, setAiOutput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [lastGeneratedContext, setLastGeneratedContext] = useState(null)

  // Generate Analisis AI melalui Vercel Serverless Function (/api/generate)
  const handleGenerateAi = async () => {
    setIsLoading(true)
    setErrorMsg('')

    // Susun ringkasan konteks data yang sedang dilihat user
    const currentContext = {
      tipe: isAtmosfer ? 'Polutan & Atmosfer Sentinel-5P / MODIS' : 'Inventaris Emisi CO₂ Sektoral IEA-EDGAR',
      itemTerpilih: isAtmosfer ? `${indicatorMeta.fullName} (${indicatorMeta.label})` : `${sectorMeta.label} (${sectorMeta.short})`,
      satuan: isAtmosfer ? indicatorMeta.unit : 'ton CO₂/bulan & tahun',
      periode: `Bulan ${monthName} Tahun ${activeYear}`,
      ringkasanAngka: isAtmosfer
        ? `Rata-rata tahun ${activeYear}: ${fmtNum(kpiData.latest)} ${indicatorMeta.displayUnit}. Perubahan YoY: ${kpiData.change != null ? (kpiData.change > 0 ? '+' : '') + kpiData.change.toFixed(1) + '%' : '–'}.`
        : `Total Emisi Kota Surabaya tahun ${activeYear}: ${fmtTon(kpiData.total)} ton CO₂. Sektor terbesar: ${kpiData.topSector?.name || '–'} (${fmtTon(kpiData.topSector?.value)} ton).`,
      hotspotKecamatan: hotspots && hotspots.length > 0
        ? hotspots.map((h, i) => `${i + 1}. ${h.name} (${h.val})`).join(', ')
        : 'Sesuai grid spasial terdistribusi Kota Surabaya'
    }

    const promptContext = `Halo AI, saya saat ini sedang melihat dashboard pada posisi berikut:
- Tipe Data: ${currentContext.tipe}
- Indikator/Sektor Terpilih: ${currentContext.itemTerpilih}
- Periode Waktu: ${currentContext.periode}
- Nilai Statistik: ${currentContext.ringkasanAngka}
- Lokasi Hotspot Konsentrasi Tertinggi di Surabaya: ${currentContext.hotspotKecamatan}

Tolong berikan analisis komprehensif, interpretasi makna angka tersebut, dan rekomendasi mitigasinya!`

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          promptContext,
          model: 'meta-llama/llama-3-8b-instruct:free'
        })
      })

      const data = await response.json()

      if (!response.ok || data.error) {
        throw new Error(data?.error || `Gagal menghubungi server AI (Status ${response.status})`)
      }

      const text = data?.choices?.[0]?.message?.content || 'Tidak ada teks respon yang diterima dari model AI.'
      setAiOutput(text)
      setLastGeneratedContext(`${currentContext.itemTerpilih} • ${currentContext.periode}`)
    } catch (err) {
      console.error('AI Generation Error:', err)
      setErrorMsg(err.message || 'Terjadi kesalahan saat memproses permintaan AI.')
    } finally {
      setIsLoading(false)
    }
  }

  // Format teks Markdown sederhana (bold, bullet points, headings)
  const renderFormattedAiText = (text) => {
    return text.split('\n').map((line, idx) => {
      if (!line.trim()) return <div key={idx} className="h-2"></div>
      
      // Deteksi bold **text**
      const parts = line.split(/(\*\*.*?\*\*)/g)
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="text-white font-bold">{part.slice(2, -2)}</strong>
        }
        return part
      })

      if (line.startsWith('###') || line.startsWith('##') || line.startsWith('#')) {
        return <h4 key={idx} className="text-sm font-bold text-blue-300 mt-2.5 mb-1">{formattedParts}</h4>
      }
      if (line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().startsWith('*')) {
        return (
          <div key={idx} className="flex items-start gap-2 ml-2 my-0.5 text-xs text-indigo-100/90 leading-relaxed">
            <span className="text-blue-400 mt-1 flex-shrink-0">•</span>
            <div>{formattedParts}</div>
          </div>
        )
      }
      return <p key={idx} className="text-xs text-indigo-100/90 leading-relaxed my-0.5">{formattedParts}</p>
    })
  }

  return (
    <div className="bg-gradient-to-br from-indigo-950/40 via-[#0a1120] to-blue-950/30 rounded-3xl border border-indigo-500/40 p-6 md:p-8 relative overflow-hidden group hover:border-indigo-400/60 hover:shadow-neon-indigo transition-all duration-500">
      <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-600/10 blur-[90px] pointer-events-none group-hover:bg-indigo-600/20 transition-colors"></div>

      {/* ==================== HEADER KARTU AI ==================== */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-4 relative z-10 border-b border-indigo-900/40 pb-4">
        <div>
          <h3 className="text-xl font-bold text-white font-display flex items-center gap-2">
            <span className="p-1.5 bg-indigo-600/20 rounded-xl text-indigo-400 border border-indigo-500/30 inline-block">
              ✨
            </span>
            <span>Interpretasi Cerdas & Analisis AI</span>
          </h3>
          <p className="text-xs text-indigo-300/80 mt-1">
            Membaca konteks posisi data yang sedang Anda amati secara real-time via Vercel Serverless Function
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Badge Konteks Aktif */}
          <span className="text-xs font-bold text-indigo-300 bg-indigo-950/70 px-3.5 py-1.5 rounded-xl border border-indigo-500/40 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            <span>{isAtmosfer ? indicatorMeta.label : sectorMeta.short} • {monthName} {activeYear}</span>
          </span>

          {/* Tombol Generate AI */}
          <button
            onClick={handleGenerateAi}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer ${
              isLoading
                ? 'bg-indigo-700 text-indigo-200 cursor-not-allowed opacity-80 animate-pulse'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/50 shadow-neon-blue'
            }`}
          >
            <span>{isLoading ? '⏳' : '⚡'}</span>
            <span>{isLoading ? 'AI Menganalisis...' : 'Generate AI'}</span>
          </button>
        </div>
      </div>

      {/* ==================== PESAN ERROR (BILA ADA) ==================== */}
      {errorMsg && (
        <div className="mb-4 p-3.5 bg-rose-950/50 border border-rose-500/50 rounded-xl text-xs text-rose-200 flex items-start justify-between gap-2 relative z-10">
          <div className="flex items-start gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-400 hover:text-white font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* ==================== KONTEN INTERPRETASI ==================== */}
      <div className="relative z-10 space-y-3">
        {/* Loading State Skeleton */}
        {isLoading && (
          <div className="space-y-3 py-4 animate-pulse">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping"></span>
              <span>Model AI sedang mengekstrak wawasan spasial Surabaya ({isAtmosfer ? indicatorMeta.label : sectorMeta.short} • {monthName} {activeYear})...</span>
            </div>
            <div className="h-3 bg-indigo-900/40 rounded-full w-5/6"></div>
            <div className="h-3 bg-indigo-900/30 rounded-full w-full"></div>
            <div className="h-3 bg-indigo-900/20 rounded-full w-4/6"></div>
          </div>
        )}

        {/* Tampilan Output AI Khusus Hasil Generate */}
        {!isLoading && aiOutput && (
          <div className="bg-[#050B14]/80 p-5 rounded-2xl border border-indigo-500/30 shadow-inner space-y-2">
            <div className="flex items-center justify-between text-[11px] text-indigo-400 border-b border-indigo-900/40 pb-2 mb-2 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Analisis AI Spesifik: <strong>{lastGeneratedContext}</strong></span>
              </span>
              <button
                onClick={() => setAiOutput('')}
                className="text-slate-400 hover:text-slate-200 underline cursor-pointer"
                title="Tampilkan teks default dokumen resmi"
              >
                Lihat Teks Standar
              </button>
            </div>
            <div className="space-y-1">
              {renderFormattedAiText(aiOutput)}
            </div>
          </div>
        )}

        {/* Tampilan Standar Berdasarkan Dokumen Resmi (Bila Belum Generate AI) */}
        {!isLoading && !aiOutput && (
          <div className="space-y-3">
            <p className="text-sm md:text-base text-indigo-100/90 leading-relaxed font-normal">
              {isAtmosfer ? (
                <>
                  Pada tahun <strong className="text-white font-bold">{activeYear}</strong> (Bulan {monthName}), rata-rata kolom{' '}
                  <strong className="text-blue-300 font-bold">{indicatorMeta.fullName}</strong> ({indicatorMeta.label}) di Kota Surabaya
                  {kpiData.change != null && (
                    <> tercatat {kpiData.change > 0 ? 'meningkat' : 'menurun'} sebesar <strong className="text-white font-bold">{Math.abs(kpiData.change).toFixed(1)}%</strong> dibandingkan tahun sebelumnya</>
                  )}.
                  {' '}{indicatorMeta.desc} Pengamatan kolom vertikal atmosfer dari satelit {indicatorMeta.source} menunjukkan dinamika yang dipengaruhi perpaduan fluktuasi emisi kendaraan/industri dan pola sirkulasi angin muson perkotaan.
                </>
              ) : (
                <>
                  Estimasi total emisi CO₂ delapan sektor di Kota Surabaya untuk tahun <strong className="text-white font-bold">{activeYear}</strong> adalah{' '}
                  <strong className="text-emerald-300 font-bold">{fmtTon(kpiData.total)} ton CO₂</strong>.
                  {kpiData.topSector && (
                    <> Sektor dengan kontribusi terbesar adalah <strong className="text-white font-bold">{kpiData.topSector.name}</strong> yang menyumbang <strong className="text-emerald-300 font-bold">{((kpiData.topSector.value / kpiData.total) * 100).toFixed(1)}%</strong> ({fmtTon(kpiData.topSector.value)} ton CO₂/tahun).</>
                  )}
                  {' '}Sektor yang sedang Anda sorot saat ini adalah <strong className="text-blue-300 font-bold">{sectorMeta.label}</strong> ({sectorMeta.desc}). Data dialokasikan dari grid 0.1° × 0.1° basis data global IEA–EDGAR_2026_GHG berdasarkan proporsi tutupan wilayah Surabaya.
                </>
              )}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-indigo-900/30 text-xs text-indigo-300/70">
              <span className="flex items-center gap-1.5">
                <span>💡</span>
                <span>Klik tombol <strong>"Generate AI"</strong> di atas untuk memperoleh analisis mendalam & rekomendasi kebijakan instan dari server AI SAC-Footprint.</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
