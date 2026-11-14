import { useState, useEffect, useMemo } from 'react'
import {
  AI_CONFIG,
  buildDashboardPromptContext,
  safeSaveAiCache
} from '../utils/aiPrompt'

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

  // Cache key unik untuk setiap kombinasi tampilan dashboard (v6 SI JAKA PANTAU - Tersimpan per-browser user di localStorage)
  const currentCacheKey = useMemo(() => {
    const itemKey = isAtmosfer ? activeIndicator : activeSector
    return `sijaka_ai_v6_${activeSection}_${itemKey}_${activeYear}_${activeMonth}_${chartView}_${yearA}_${yearB}`
  }, [activeSection, isAtmosfer, activeIndicator, activeSector, activeYear, activeMonth, chartView, yearA, yearB])

  // Sinkronisasi dengan localStorage browser lokal user saat berpindah indikator/tahun
  useEffect(() => {
    let isCancelled = false
    try {
      const cached = localStorage.getItem(currentCacheKey)
      // Gunakan queueMicrotask untuk mencegah synchronous cascading renders di React 19
      queueMicrotask(() => {
        if (isCancelled) return
        if (cached) {
          setAiOutput(cached)
          setLastGeneratedContext(`${isAtmosfer ? indicatorMeta?.label : sectorMeta?.short} • ${monthName} ${activeYear}`)
          setErrorMsg('')
          setIsQuotaExhausted(false)
        } else {
          setAiOutput('')
        }
      })
    } catch {
      /* abaikan bila localStorage tidak tersedia */
    }
    return () => {
      isCancelled = true
    }
  }, [currentCacheKey, isAtmosfer, indicatorMeta?.label, sectorMeta?.short, monthName, activeYear])

  // Generate Analisis AI Komprehensif Melalui Secure Server Proxy /api/generate
  const handleGenerateAi = async (forceRefresh = false) => {
    if (!forceRefresh && aiOutput) return

    setIsLoading(true)
    setErrorMsg('')
    setIsQuotaExhausted(false)

    // Bangun data konteks terstruktur menggunakan shared prompt builder
    const promptContext = buildDashboardPromptContext({
      isAtmosfer,
      activeSection,
      indicatorMeta,
      sectorMeta,
      activeYear,
      monthName,
      chartView,
      kpiData,
      activeScale,
      hotspots,
      edgarPieData,
      edgarTotalCO2,
      chartData,
      yearA,
      yearB,
      comparisonData,
      fmtTon,
      fmtNum
    })

    let accumulatedText = ''

    try {
      // Panggil backend API serverless/edge proxy (Kunci API tidak pernah diekspos ke browser)
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          promptContext,
          model: AI_CONFIG.model
        })
      })

      if (!response.ok) {
        throw new Error(`Server AI merespon dengan status error ${response.status}`)
      }

      setLastGeneratedContext(`${isAtmosfer ? indicatorMeta?.label : sectorMeta?.short} • ${monthName} ${activeYear}`)

      // Membaca SSE Stream secara real-time
      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
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

              // Ekstrak teks konten dari delta
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
        safeSaveAiCache(currentCacheKey, accumulatedText)
      } else if (!detectedQuota) {
        throw new Error('Server AI membutuhkan waktu penalaran sedikit lebih lama untuk parameter ini. Silakan klik tombol "Perbarui Analisis" untuk memuat ulasan.')
      }
    } catch (err) {
      console.error('AI Generation Error:', err)
      const rawMsg = typeof err?.message === 'object' ? JSON.stringify(err.message) : (err?.message || '')
      let message = rawMsg
      if (/terminated|premature|socket hang up|abort/i.test(rawMsg)) {
        message = 'Koneksi ke server AI sempat terputus saat proses penalaran berlangsung. Silakan klik tombol "Perbarui Analisis" di kanan atas untuk memuat kembali ulasan lengkap.'
      } else if (!message) {
        message = 'Terjadi kesalahan saat memproses permintaan AI.'
      }
      
      // Jika sudah ada teks analisis yang mengalir, simpan teks tersebut dan jangan timpa dengan pesan error kosong
      if (accumulatedText.trim()) {
        safeSaveAiCache(currentCacheKey, accumulatedText)
      } else {
        setErrorMsg(message)
      }
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

  // Format teks Markdown dengan styling modern
  const renderFormattedAiText = (text) => {
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim()
      if (!trimmed) return <div key={idx} className="h-2.5"></div>

      // Deteksi Heading (#, ##, ###)
      if (trimmed.startsWith('#')) {
        const cleanHeading = trimmed.replace(/^#+\s*/, '')
        const parts = cleanHeading.split(/(\*\*.*?\*\*)/g)
        const headingContent = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <span key={pIdx} className="font-extrabold text-white">{part.slice(2, -2)}</span>
          }
          return part
        })

        return (
          <div key={idx} className="mt-5 mb-2.5 pt-3 border-t border-indigo-900/30 first:border-0 first:pt-0 first:mt-1">
            <h4 className="text-sm md:text-base font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-200 to-cyan-300 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full inline-block shadow-neon-blue flex-shrink-0"></span>
              <span>{headingContent}</span>
            </h4>
          </div>
        )
      }

      // Deteksi Bullet Points (-, *, •)
      if (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*')) {
        const cleanBullet = trimmed.replace(/^[-•*]\s*/, '')
        const parts = cleanBullet.split(/(\*\*.*?\*\*)/g)
        const bulletContent = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={pIdx} className="text-white font-bold">{part.slice(2, -2)}</strong>
          }
          return part
        })

        return (
          <div key={idx} className="flex items-start gap-2.5 ml-2 my-1.5 text-xs md:text-sm text-indigo-100/95 leading-relaxed">
            <span className="text-cyan-400 mt-1 flex-shrink-0 font-bold">•</span>
            <div>{bulletContent}</div>
          </div>
        )
      }

      // Deteksi Baris Tabel (|)
      if (trimmed.startsWith('|')) {
        return (
          <div key={idx} className="font-mono text-[11px] md:text-xs text-indigo-200/90 py-0.5 overflow-x-auto whitespace-pre">
            {line}
          </div>
        )
      }

      // Paragraf biasa dengan deteksi bold
      const parts = line.split(/(\*\*.*?\*\*)/g)
      const formattedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="text-white font-bold">{part.slice(2, -2)}</strong>
        }
        return part
      })

      return <p key={idx} className="text-xs md:text-sm text-indigo-100/90 leading-relaxed my-1.5">{formattedParts}</p>
    })
  }

  return (
    <div className="bg-gradient-to-br from-indigo-950/40 via-[#0a1120] to-blue-950/30 rounded-3xl border border-indigo-500/40 p-6 md:p-8 relative overflow-hidden group hover:border-indigo-400/60 hover:shadow-neon-indigo transition-all duration-500">
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-600/10 blur-[100px] pointer-events-none group-hover:bg-indigo-600/20 transition-colors"></div>

      {/* ==================== HEADER KARTU AI ==================== */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-5 relative z-10 border-b border-indigo-900/40 pb-4">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-white font-display flex items-center gap-2.5">
            <span className="p-2 bg-gradient-to-br from-blue-600/30 to-indigo-600/30 rounded-2xl text-cyan-400 border border-indigo-500/40 shadow-neon-blue inline-flex items-center justify-center">
              {/* Modern Sparkles Vector Icon */}
              <svg className="w-5 h-5 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                <path d="M5 3v4"/>
                <path d="M19 17v4"/>
                <path d="M3 5h4"/>
                <path d="M17 19h4"/>
              </svg>
            </span>
            <span>Analisis Sintesis Cerdas AI (Kimi K3.1 Pro)</span>
          </h3>
          <p className="text-xs text-indigo-300/80 mt-1">
            Penjelasan komprehensif peta spasial, peringkat emisi sektoral, tren grafik temporal, dan komparasi antar-tahun
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Badge Konteks Posisi Saat Ini */}
          <span className="text-xs font-bold text-indigo-300 bg-indigo-950/80 px-3.5 py-1.5 rounded-xl border border-indigo-500/40 flex items-center gap-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>{isAtmosfer ? indicatorMeta?.label : sectorMeta?.short} • {monthName} {activeYear} ({chartView})</span>
          </span>

          {/* Tombol Salin (Bila Ada Hasil) */}
          {aiOutput && !isLoading && (
            <button
              onClick={handleCopy}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 flex items-center gap-1.5 transition cursor-pointer"
              title="Salin analisis lengkap ke clipboard"
            >
              {isCopied ? (
                <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
              <span>{isCopied ? 'Tersalin!' : 'Salin'}</span>
            </button>
          )}

          {/* SATU TOMBOL UTAMA GENERATE / REFRESH AI */}
          <button
            onClick={() => handleGenerateAi(!!aiOutput)}
            disabled={isLoading}
            className={`px-4 py-2 text-xs md:text-sm font-bold rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer ${
              isLoading
                ? 'bg-indigo-700 text-indigo-200 cursor-not-allowed opacity-80 animate-pulse'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border border-cyan-400/40 shadow-neon-blue'
            }`}
          >
            {isLoading ? (
              <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
              </svg>
            ) : aiOutput ? (
              <svg className="w-4 h-4 text-cyan-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-cyan-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
            <span>{isLoading ? 'Memproses Penalaran AI...' : aiOutput ? 'Perbarui Analisis' : 'Generate Analisis AI'}</span>
          </button>
        </div>
      </div>

      {/* ==================== ALERT KHUSUS JIKA TOKEN/SALDO HABIS ==================== */}
      {isQuotaExhausted && (
        <div className="mb-5 p-4 bg-amber-950/60 border border-amber-500/60 rounded-2xl text-xs md:text-sm text-amber-200 flex items-start gap-3 relative z-10 shadow-lg animate-in fade-in">
          <svg className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
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
            <svg className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-400 hover:text-white font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* ==================== KONTEN ANALISIS AI ==================== */}
      <div className="relative z-10">
        {/* Loading State: Tampilan Saat AI Sedang Menalar & Mengalirkan Teks */}
        {isLoading && !aiOutput && (
          <div className="space-y-3.5 py-6 animate-pulse">
            <div className="flex items-center gap-2.5 text-indigo-300 text-xs md:text-sm font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
              <span>
                Model Kimi K3.1 Pro sedang menelaah 5 dimensi data spasial, sektoral, & temporal Surabaya ({isAtmosfer ? indicatorMeta?.label : sectorMeta?.short} • {monthName} {activeYear})...
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
                  ID 100% Bahasa Indonesia
                </span>
                <span>Didukung Kimi K3.1 Pro • OpenAgentic API</span>
              </div>
            </div>
            {/* Kotak responsif: tinggi otomatis menyesuaikan konten, dan jika panjang dapat di-scroll dengan elegan */}
            <div className="max-h-[580px] overflow-y-auto pr-2 custom-scrollbar space-y-2">
              {renderFormattedAiText(aiOutput)}
              {isLoading && (
                <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-1 align-middle"></span>
              )}
            </div>
          </div>
        )}

        {/* Hero CTA State: Tampilan Awal Sebelum Generate (HANYA SATU TOMBOL DI HEADER) */}
        {!isLoading && !aiOutput && (
          <div className="p-6 md:p-8 rounded-2xl bg-[#050B14]/60 border border-indigo-900/40 text-center space-y-5">
            <div className="max-w-2xl mx-auto space-y-2">
              <h4 className="text-lg md:text-xl font-bold text-white font-display">
                Ingin Memahami Makna Angka & Pola Spasial Ini Secara Mendalam?
              </h4>
              <p className="text-xs md:text-sm text-indigo-200/80 leading-relaxed">
                Klik tombol <strong className="text-cyan-300">"Generate Analisis AI"</strong> di kanan atas. Model AI Kimi K3.1 Pro akan membaca posisi layar Anda secara real-time dan menghasilkan sintesis komprehensif 5 bagian:
              </p>
            </div>

            {/* Grid 5 Kartu Fitur Analisis dengan Ikon Modern (Tanpa Emoji) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 text-left">
              {/* 1. Peta Spasial */}
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-900/40 flex flex-col gap-1.5 hover:border-blue-500/40 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-white">Peta & Hotspot Spasial</span>
                <span className="text-[11px] text-slate-400 leading-snug">Gradasi wilayah pekat di Surabaya, arti skala, & koridor emisi.</span>
              </div>

              {/* 2. Peringkat Sektoral */}
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-900/40 flex flex-col gap-1.5 hover:border-indigo-500/40 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-white">Peringkat Sektoral</span>
                <span className="text-[11px] text-slate-400 leading-snug">Kontributor terbesar EDGAR & proporsi sektor fosil Surabaya.</span>
              </div>

              {/* 3. Tren & Komparasi Antar-Tahun */}
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-900/40 flex flex-col gap-1.5 hover:border-cyan-500/40 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-white">Tren & Komparasi Tahun</span>
                <span className="text-[11px] text-slate-400 leading-snug">Fluktuasi grafik {chartView} & perbandingan {yearA} vs {yearB}.</span>
              </div>

              {/* 4. Dampak Lingkungan */}
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-900/40 flex flex-col gap-1.5 hover:border-amber-500/40 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-white">Dampak Lingkungan</span>
                <span className="text-[11px] text-slate-400 leading-snug">Risiko pajanan warga & batasan kolom vertikal troposfer.</span>
              </div>

              {/* 5. Rekomendasi Pemkot */}
              <div className="p-3.5 rounded-xl bg-indigo-950/40 border border-indigo-900/40 flex flex-col gap-1.5 hover:border-emerald-500/40 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-white">Rekomendasi Kebijakan</span>
                <span className="text-[11px] text-slate-400 leading-snug">Aksi mitigasi konkret & terukur untuk instansi Pemkot Surabaya.</span>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-indigo-300/70 font-mono">
              Silakan klik tombol <strong className="text-cyan-400 font-sans">"Generate Analisis AI"</strong> di header kartu di atas untuk memulai.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
