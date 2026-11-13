import { useState, useEffect, useMemo } from 'react'

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
  isAtmosfer,
  chartView,
  chartData,
  yearA,
  yearB,
  comparisonData,
  activeScale,
  edgarPieData,
  edgarTotalCO2
}) {
  // Status UI & Respon AI
  const [aiOutput, setAiOutput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [isQuotaExhausted, setIsQuotaExhausted] = useState(false)
  const [lastGeneratedContext, setLastGeneratedContext] = useState(null)
  const [isCopied, setIsCopied] = useState(false)

  // Cache key unik untuk setiap kombinasi tampilan dashboard
  const currentCacheKey = useMemo(() => {
    const itemKey = isAtmosfer ? activeIndicator : activeSector
    return `sac_ai_${activeSection}_${itemKey}_${activeYear}_${activeMonth}_${chartView}_${yearA}_${yearB}`
  }, [activeSection, isAtmosfer, activeIndicator, activeSector, activeYear, activeMonth, chartView, yearA, yearB])

  // Sinkronisasi dengan cache sesi browser saat berpindah indikator/tahun
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem(currentCacheKey)
      if (cached) {
        setAiOutput(cached)
        setLastGeneratedContext(`${isAtmosfer ? indicatorMeta.label : sectorMeta.short} • ${monthName} ${activeYear}`)
        setErrorMsg('')
        setIsQuotaExhausted(false)
      } else {
        setAiOutput('')
      }
    } catch {
      // Abaikan jika storage dinonaktifkan
    }
  }, [currentCacheKey, isAtmosfer, indicatorMeta.label, sectorMeta.short, monthName, activeYear])

  // Generate Analisis AI Komprehensif Membaca Seluruh Elemen di Layar
  const handleGenerateAi = async (forceRefresh = false) => {
    if (!forceRefresh && aiOutput) return

    setIsLoading(true)
    setErrorMsg('')
    setIsQuotaExhausted(false)

    // 1. Ekstrak deskripsi peta spasial & skala
    const skalaPetaDesc = activeScale
      ? `${activeScale.title} dengan rentang nilai Min: ${activeScale.min} hingga Max: ${activeScale.max} ${activeScale.unit}`
      : 'Sesuai resolusi grid 0.1° batas administratif Surabaya'

    // 2. Ekstrak tren grafik temporal yang sedang dipilih
    let trenGrafikDesc = `Tampilan ${chartView}: `
    if (chartData && chartData.length > 0) {
      const validPoints = chartData.filter(d => d.value != null)
      if (validPoints.length > 0) {
        const minPt = validPoints.reduce((p, c) => (c.value < p.value ? c : p), validPoints[0])
        const maxPt = validPoints.reduce((p, c) => (c.value > p.value ? c : p), validPoints[0])
        trenGrafikDesc += `Puncak tertinggi tercatat pada ${maxPt.year || maxPt.month} (${isAtmosfer ? fmtNum(maxPt.value) : fmtTon(maxPt.value)} ${isAtmosfer ? indicatorMeta.displayUnit : 'ton'}), sedangkan titik terendah pada ${minPt.year || minPt.month} (${isAtmosfer ? fmtNum(minPt.value) : fmtTon(minPt.value)} ${isAtmosfer ? indicatorMeta.displayUnit : 'ton'}).`
      }
    }

    // 3. Ekstrak data hotspot konsentrasi / proporsi sektor
    let hotspotDesc = ''
    if (isAtmosfer && hotspots && hotspots.length > 0) {
      hotspotDesc = hotspots.map((h, i) => `${i + 1}. ${h.name} (${h.val})`).join(', ')
    } else if (!isAtmosfer && edgarPieData && edgarPieData.length > 0) {
      hotspotDesc = edgarPieData.slice(0, 4).map((s, i) => `${i + 1}. ${s.fullName} (${fmtTon(s.value)} ton, ${((s.value / (edgarTotalCO2 || 1)) * 100).toFixed(1)}%)`).join(', ')
    } else {
      hotspotDesc = 'Tersebar di wilayah industri dan transportasi Surabaya'
    }

    // 4. Ekstrak komparasi antar-tahun
    const komparasiDesc = comparisonData
      ? `Perbandingan Tahun ${yearA} (${isAtmosfer ? fmtNum(comparisonData.valA) : fmtTon(comparisonData.valA)}) terhadap Tahun ${yearB} (${isAtmosfer ? fmtNum(comparisonData.valB) : fmtTon(comparisonData.valB)}), tercatat perubahan sebesar ${comparisonData.change != null ? (comparisonData.change > 0 ? '+' : '') + comparisonData.change.toFixed(1) + '%' : '–'}.`
      : 'Belum ada data komparasi tahun pembanding'

    // 5. Susun prompt konteks padat & terstruktur
    const promptContext = `Data Dashboard SAC-Footprint Surabaya:
- Parameter/Sektor: ${isAtmosfer ? `${indicatorMeta.fullName} (${indicatorMeta.label})` : `${sectorMeta.label} (${sectorMeta.short})`}
- Periode Terpilih: Bulan ${monthName} ${activeYear} (${chartView})
- Nilai Terkini: ${isAtmosfer ? `Rata-rata: ${fmtNum(kpiData.latest)} ${indicatorMeta.displayUnit} (YoY: ${kpiData.change != null ? (kpiData.change > 0 ? '+' : '') + kpiData.change.toFixed(1) + '%' : '–'})` : `Total: ${fmtTon(kpiData.total)} ton CO₂. Terbesar: ${kpiData.topSector?.name || '–'} (${fmtTon(kpiData.topSector?.value)} ton)`}
- Peta Spasial: ${skalaPetaDesc}
- Tren Grafik (${chartView}): ${trenGrafikDesc}
- Hotspot Tertinggi: ${hotspotDesc}
- Komparasi Tahun: ${komparasiDesc}`

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          promptContext,
          model: 'kimi-k3.1-pro'
        })
      })

      if (!response.ok) {
        throw new Error(`Server AI merespon dengan status error ${response.status}`)
      }

      setLastGeneratedContext(`${isAtmosfer ? indicatorMeta.label : sectorMeta.short} • ${monthName} ${activeYear}`)

      // Membaca SSE Stream secara real-time
      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let accumulatedText = ''
      let buffer = ''
      let detectedQuota = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed === 'data: [DONE]') continue

          if (trimmed.startsWith('data: ')) {
            try {
              const data = JSON.parse(trimmed.slice(6))

              if (data.error) {
                if (data.isQuotaExhausted) {
                  detectedQuota = true
                  setIsQuotaExhausted(true)
                }
                throw new Error(data.error)
              }

              // Hanya tampilkan jawaban akhir (content), buang monolog penalaran internal Kimi
              if (data.content) {
                accumulatedText += data.content
                setAiOutput(accumulatedText)
              }
            } catch (parseError) {
              if (parseError.message && !parseError.message.includes('Unexpected token')) {
                throw parseError
              }
            }
          }
        }
      }

      if (accumulatedText.trim()) {
        try {
          sessionStorage.setItem(currentCacheKey, accumulatedText)
        } catch {}
      } else if (!detectedQuota) {
        throw new Error('Server AI membutuhkan waktu penalaran sedikit lebih lama untuk parameter ini. Silakan klik tombol "Perbarui Analisis" untuk memuat ulasan.')
      }
    } catch (err) {
      console.error('AI Generation Error:', err)
      const message = typeof err?.message === 'object' ? JSON.stringify(err.message) : (err?.message || 'Terjadi kesalahan saat memproses permintaan AI.')
      setErrorMsg(message)
    } finally {
      setIsLoading(false)
    }
  }

  // Fungsi Salin Teks Analisis
  const handleCopy = () => {
    if (!aiOutput) return
    navigator.clipboard.writeText(aiOutput)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2500)
  }

  // Format teks Markdown sederhana (bold, bullet points, headings)
  const renderFormattedAiText = (text) => {
    return text.split('\n').map((line, idx) => {
      if (!line.trim()) return <div key={idx} className="h-2.5"></div>

      // Deteksi bold **text**
      const parts = line.split(/(\*\*.*?\*\*)/g)
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="text-white font-bold">{part.slice(2, -2)}</strong>
        }
        return part
      })

      if (line.startsWith('###') || line.startsWith('##') || line.startsWith('#')) {
        return <h4 key={idx} className="text-sm md:text-base font-bold text-blue-300 mt-4 mb-1.5 flex items-center gap-1.5">{formattedParts}</h4>
      }
      if (line.trim().startsWith('-') || line.trim().startsWith('•') || line.trim().startsWith('*')) {
        return (
          <div key={idx} className="flex items-start gap-2.5 ml-2 my-1 text-xs md:text-sm text-indigo-100/95 leading-relaxed">
            <span className="text-blue-400 mt-1 flex-shrink-0">•</span>
            <div>{formattedParts}</div>
          </div>
        )
      }
      return <p key={idx} className="text-xs md:text-sm text-indigo-100/90 leading-relaxed my-1">{formattedParts}</p>
    })
  }

  return (
    <div className="bg-gradient-to-br from-indigo-950/40 via-[#0a1120] to-blue-950/30 rounded-3xl border border-indigo-500/40 p-6 md:p-8 relative overflow-hidden group hover:border-indigo-400/60 hover:shadow-neon-indigo transition-all duration-500">
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/10 blur-[100px] pointer-events-none group-hover:bg-indigo-600/20 transition-colors"></div>

      {/* ==================== HEADER KARTU AI ==================== */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-5 relative z-10 border-b border-indigo-900/40 pb-4">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-white font-display flex items-center gap-2.5">
            <span className="p-2 bg-gradient-to-br from-blue-600/30 to-indigo-600/30 rounded-2xl text-indigo-400 border border-indigo-500/40 shadow-neon-blue inline-flex items-center justify-center">
              ✨
            </span>
            <span>Analisis Sintesis Cerdas AI (Kimi K3.1 Pro)</span>
          </h3>
          <p className="text-xs text-indigo-300/80 mt-1">
            Penjelasan mendalam peta spasial, tren temporal grafis, analisis hotspot, dan komparasi antar-tahun
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Badge Konteks Posisi Saat Ini */}
          <span className="text-xs font-bold text-indigo-300 bg-indigo-950/80 px-3.5 py-1.5 rounded-xl border border-indigo-500/40 flex items-center gap-1.5 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
            <span>{isAtmosfer ? indicatorMeta.label : sectorMeta.short} • {monthName} {activeYear} ({chartView})</span>
          </span>

          {/* Tombol Salin (Bila Ada Hasil) */}
          {aiOutput && !isLoading && (
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 flex items-center gap-1.5 transition cursor-pointer"
              title="Salin analisis lengkap ke clipboard"
            >
              <span>{isCopied ? '✓' : '📋'}</span>
              <span>{isCopied ? 'Tersalin!' : 'Salin'}</span>
            </button>
          )}

          {/* Tombol Generate / Refresh AI */}
          <button
            onClick={() => handleGenerateAi(!!aiOutput)}
            disabled={isLoading}
            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer ${
              isLoading
                ? 'bg-indigo-700 text-indigo-200 cursor-not-allowed opacity-80 animate-pulse'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border border-blue-400/50 shadow-neon-blue'
            }`}
          >
            <span>{isLoading ? '⏳' : aiOutput ? '🔄' : '⚡'}</span>
            <span>{isLoading ? 'Memproses Penalaran AI...' : aiOutput ? 'Perbarui Analisis' : 'Generate Analisis AI'}</span>
          </button>
        </div>
      </div>

      {/* ==================== ALERT KHUSUS JIKA TOKEN/SALDO HABIS ==================== */}
      {isQuotaExhausted && (
        <div className="mb-5 p-4 bg-amber-950/60 border border-amber-500/60 rounded-2xl text-xs md:text-sm text-amber-200 flex items-start gap-3 relative z-10 shadow-lg animate-in fade-in">
          <span className="text-xl">⚠️</span>
          <div className="space-y-1">
            <h5 className="font-bold text-amber-300 text-sm">Pemberitahuan: Kuota Token AI / Saldo Wallet Mencapai Batas</h5>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              Layanan AI sementara tidak dapat memproses permintaan baru karena kuota token atau saldo wallet OpenAgentic Anda telah habis.
            </p>
            <div className="pt-1.5 flex flex-wrap gap-3 text-[11px] font-mono text-amber-400">
              <span>Solusi: Buka dashboard OpenAgentic & lakukan Top Up saldo atau perpanjang kuota paket Kimi K3.1 Pro.</span>
            </div>
          </div>
        </div>
      )}

      {/* ==================== PESAN ERROR STANDAR ==================== */}
      {errorMsg && !isQuotaExhausted && (
        <div className="mb-4 p-3.5 bg-rose-950/50 border border-rose-500/50 rounded-xl text-xs text-rose-200 flex items-start justify-between gap-2 relative z-10">
          <div className="flex items-start gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-400 hover:text-white font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* ==================== KONTEN ANALISIS AI ==================== */}
      <div className="relative z-10">
        {/* Loading State: Tampilan Saat AI Sedang Menalar (Thinking) & Belum Mengalirkan Teks */}
        {isLoading && !aiOutput && (
          <div className="space-y-3.5 py-6 animate-pulse">
            <div className="flex items-center gap-2.5 text-indigo-300 text-xs md:text-sm font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping"></span>
              <span>
                Model Kimi K3.1 Pro sedang menelaah data spasial & dinamika atmosfer Surabaya ({isAtmosfer ? indicatorMeta.label : sectorMeta.short} • {monthName} {activeYear})...
              </span>
            </div>
            <div className="h-3 bg-indigo-900/40 rounded-full w-5/6"></div>
            <div className="h-3 bg-indigo-900/30 rounded-full w-full"></div>
            <div className="h-3 bg-indigo-900/25 rounded-full w-4/6"></div>
            <p className="text-[11px] text-slate-400 italic">
              AI sedang menjalankan penalaran ilmiah mendalam. Teks ulasan Bahasa Indonesia akan mulai mengalir secara real-time sesaat lagi...
            </p>
          </div>
        )}

        {/* Tampilan Output Analisis (Mendukung Live Streaming Real-time Maupun Selesai) */}
        {aiOutput && (
          <div className="bg-[#050B14]/85 p-6 rounded-2xl border border-indigo-500/40 shadow-inner space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-indigo-400 border-b border-indigo-900/40 pb-2.5 font-mono">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-ping' : 'bg-emerald-400 shadow-neon-emerald'}`}></span>
                <span>
                  {isLoading ? 'Mengalirkan Analisis AI:' : 'Analisis AI Komprehensif:'} <strong>{lastGeneratedContext}</strong>
                </span>
              </span>
              <div className="flex items-center gap-2 text-slate-400 text-[10px]">
                <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 text-[10px] font-sans font-medium">
                  🇮🇩 100% Bahasa Indonesia
                </span>
                <span>Didukung Kimi K3.1 Pro • OpenAgentic API</span>
              </div>
            </div>
            {/* Kotak responsif: tinggi otomatis menyesuaikan konten, dan jika panjang dapat di-scroll dengan elegan */}
            <div className="max-h-[560px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
              {renderFormattedAiText(aiOutput)}
              {isLoading && (
                <span className="inline-block w-2 h-4 bg-indigo-400 animate-pulse ml-1 align-middle"></span>
              )}
            </div>
          </div>
        )}

        {/* Hero CTA State: Tampilan Awal Sebelum Generate (Menggantikan Teks Standar Lama) */}
        {!isLoading && !aiOutput && (
          <div className="p-6 md:p-8 rounded-2xl bg-[#050B14]/60 border border-indigo-900/40 text-center space-y-4">
            <div className="max-w-2xl mx-auto space-y-2">
              <h4 className="text-lg md:text-xl font-bold text-white font-display">
                Ingin Memahami Makna Angka & Pola Spasial Ini Secara Mendalam?
              </h4>
              <p className="text-xs md:text-sm text-indigo-200/80 leading-relaxed">
                Klik tombol <strong className="text-blue-300">"Generate Analisis AI"</strong> di atas. Model AI Kimi K3.1 Pro akan membaca posisi layar Anda secara real-time dan menghasilkan sintesis komprehensif 4 bagian:
              </p>
            </div>

            {/* Grid 4 Kartu Fitur Analisis */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-left">
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-900/40 flex flex-col gap-1">
                <span className="text-base">🗺️</span>
                <span className="text-xs font-bold text-white">Peta & Hotspot Spasial</span>
                <span className="text-[11px] text-slate-400 leading-snug">Gradasi wilayah pekat di Surabaya, arti skala, & koridor emisi.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-900/40 flex flex-col gap-1">
                <span className="text-base">📈</span>
                <span className="text-xs font-bold text-white">Tren & Komparasi Tahun</span>
                <span className="text-[11px] text-slate-400 leading-snug">Fluktuasi grafik {chartView} & perbandingan {yearA} vs {yearB}.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-900/40 flex flex-col gap-1">
                <span className="text-base">⚠️</span>
                <span className="text-xs font-bold text-white">Dampak Lingkungan</span>
                <span className="text-[11px] text-slate-400 leading-snug">Risiko pajanan warga & batasan kolom vertikal satelit.</span>
              </div>
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-900/40 flex flex-col gap-1">
                <span className="text-base">💡</span>
                <span className="text-xs font-bold text-white">Rekomendasi Kebijakan</span>
                <span className="text-[11px] text-slate-400 leading-snug">Aksi mitigasi konkret & terukur untuk Pemkot Surabaya.</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => handleGenerateAi(false)}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs md:text-sm shadow-neon-blue transition cursor-pointer active:scale-95"
              >
                ⚡ Mulai Generate Analisis AI Kimi Sekarang
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
