/**
 * SI JAKA PANTAU - Shared AI Configuration & Prompt Builder
 * Single source of truth untuk konfigurasi model AI, instruksi sistem,
 * dan konstruksi data konteks analisis dashboard.
 */

export const AI_CONFIG = {
  model: 'kimi-k3.1-pro',
  maxTokens: 16384,
  temperature: 0.6,
  appName: 'SI JAKA PANTAU',
  appFullName: 'Sistem Informasi Jejak Karbon dan Polutan Atmosfer Surabaya',
}

export const SYSTEM_INSTRUCTION = `Kamu adalah Asisten Ahli AI Senior untuk SI JAKA PANTAU (Sistem Informasi Jejak Karbon dan Polutan Atmosfer Surabaya).
Tuliskan laporan analisis sintesis ilmiah mendalam, kaya data numerik, dan komprehensif dalam 5 bagian terstruktur:

### 1. Peta Spasial & Koridor Hotspot Surabaya
Ulas pola sebaran spasial, interpretasikan rentang skala visual peta (min-max), dan bedah koridor hotspot konsentrasi tertinggi di Surabaya dengan menghubungkannya ke kawasan industri, pelabuhan, atau lalu lintas.

### 2. Peringkat Emisi Sektoral & Kontributor Antropogenik Utama
Ulas peringkat kontributor emisi EDGAR v2026 Kota Surabaya (sektor terbesar, persentase kontribusi, dan mekanisme aktivitasnya terhadap pelepasan polutan/karbon kota).

### 3. Dinamika Tren Temporal & Komparasi Antar-Tahun
Analisis kurva grafik temporal (titik puncak dan terendah beserta faktor pemicunya). Bedah hasil komparasi antar-tahun pembanding terpilih (arah perubahan, angka, persentase, dan implikasi jangka panjangnya).

### 4. Analisis Risiko Lingkungan & Kesehatan Warga
Ulas dampak pajanan bagi kesehatan warga dan kelompok rentan (anak-anak, lansia, pekerja luar ruangan). Berikan edukasi ilmiah mengenai batasan data kolom troposfer satelit dibanding konsentrasi ambien di permukaan tanah.

### 5. Rekomendasi Kebijakan Mitigasi Terukur Pemkot Surabaya
Rumuskan program aksi terukur dan aplikatif untuk instansi Pemkot Surabaya (DLH, Dishub, dsb.), mencakup pengawasan emisi sumber bergerak dan industri, penataan koridor transportasi, sensor darat, dan RTH.

ATURAN STRUKTUR & KINERJA LENGKAP:
- Gunakan nama resmi aplikasi: SI JAKA PANTAU.
- Bahasa: 100% BAHASA INDONESIA yang baku, formal, dan ilmiah.
- STRUKTUR: Langsung gunakan 5 judul utama tingkat 3 (### 1. sampai ### 5.). JANGAN membuat puluhan sub-bab bernomor berantai (seperti 1.1, 1.2, 5.1 dst) agar alur bahasan tetap terfokus, padat, dan tuntas.
- KEDALAMAN: Tuliskan 2-3 paragraf analitis mendalam per bagian yang padat data numerik konkret, analitis, dan aplikatif (target total 900 - 1.250 kata).
- Tuntaskan seluruh Bagian 1 sampai selesai Bagian 5 secara lengkap tanpa terpotong!`

/**
 * Format string data konteks dari state dashboard aktif
 */
export function buildDashboardPromptContext({
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
}) {
  // 1. Skala visual peta spasial
  const skalaPetaDesc = activeScale
    ? `${activeScale.title} dengan rentang skala visual Min: ${activeScale.min} hingga Max: ${activeScale.max} ${activeScale.unit}`
    : 'Resolusi grid 0.1° (~11 km) berbasis batas wilayah Kota Surabaya'

  // 2. Data tren temporal grafik
  let trenGrafikDesc = `Mode Grafik ${chartView}: `
  if (chartData && chartData.length > 0) {
    const validPoints = chartData.filter(d => d.value != null)
    if (validPoints.length > 0) {
      const minPt = validPoints.reduce((p, c) => (c.value < p.value ? c : p), validPoints[0])
      const maxPt = validPoints.reduce((p, c) => (c.value > p.value ? c : p), validPoints[0])
      const unit = isAtmosfer ? indicatorMeta?.displayUnit || '' : 'ton CO₂'
      const formatVal = isAtmosfer ? fmtNum : fmtTon
      trenGrafikDesc += `Puncak tertinggi tercatat pada ${maxPt.year || maxPt.month} (${formatVal(maxPt.value)} ${unit}), titik terendah pada ${minPt.year || minPt.month} (${formatVal(minPt.value)} ${unit}).`
    }
  }

  // 3. Koridor hotspot konsentrasi tertinggi
  const hotspotDesc = isAtmosfer && hotspots && hotspots.length > 0
    ? hotspots.map((h, i) => `${i + 1}. ${h.name} (${h.val})`).join(', ')
    : 'Konsentrasi spasial emisi terakumulasi pada koridor logistik pelabuhan utara (Tanjung Perak), kawasan industri-pergudangan (Margomulyo & Rungkut), serta jalur arteri perlintasan utama Surabaya.'

  // 4. Peringkat emisi sektoral EDGAR v2026
  const rankingSektoralDesc = edgarPieData && edgarPieData.length > 0
    ? edgarPieData.map((s, i) =>
        `${i + 1}. ${s.fullName} [${s.name}]: ${fmtTon(s.value)} ton CO₂ (${edgarTotalCO2 > 0 ? ((s.value / edgarTotalCO2) * 100).toFixed(1) : 0}%)`
      ).join('; ')
    : 'Data emisi 8 sektor EDGAR v2026 (Transportasi, Industri Manufaktur, Energi, Residensial, dll).'

  // 5. Data komparasi antar-tahun
  const komparasiDesc = comparisonData && comparisonData.valA != null && comparisonData.valB != null
    ? `Komparasi Tahun ${yearA} (${isAtmosfer ? fmtNum(comparisonData.valA) + ' ' + (indicatorMeta?.displayUnit || '') : fmtTon(comparisonData.valA) + ' ton CO₂'}) terhadap Tahun ${yearB} (${isAtmosfer ? fmtNum(comparisonData.valB) + ' ' + (indicatorMeta?.displayUnit || '') : fmtTon(comparisonData.valB) + ' ton CO₂'}): Tercatat perubahan ${comparisonData.change > 0 ? 'Kenaikan (+)' : comparisonData.change < 0 ? 'Penurunan (-)' : 'Stabil'} sebesar ${comparisonData.change != null ? comparisonData.change.toFixed(1) : '–'}%.`
    : `Perbandingan terpilih antara tahun ${yearA} dan ${yearB}.`

  // 6. Ringkasan KPI
  const kpiDesc = isAtmosfer
    ? `${fmtNum(kpiData?.latest)} ${indicatorMeta?.displayUnit || ''} (Perubahan YoY: ${kpiData?.change != null ? (kpiData.change > 0 ? '+' : '') + kpiData.change.toFixed(1) + '%' : '–'})`
    : `Total Emisi Kota: ${fmtTon(kpiData?.total)} ton CO₂ (Sektor Terbesar: ${kpiData?.topSector?.name || '–'} ${fmtTon(kpiData?.topSector?.value)} ton)`

  return `DATA KONTEKS DASHBOARD BERANDA SI JAKA PANTAU (SISTEM INFORMASI JEJAK KARBON & POLUTAN ATMOSFER SURABAYA):
- Sektor/Parameter Utama: ${isAtmosfer ? `${indicatorMeta?.fullName || ''} (${indicatorMeta?.label || ''})` : `${sectorMeta?.label || ''} (${sectorMeta?.short || ''})`}
- Sektor/Kategori Aktif: ${activeSection}
- Periode Aktif: Bulan ${monthName} Tahun ${activeYear} (Tampilan Grafik ${chartView})
- Nilai Rata-rata/Total Terkini: ${kpiDesc}
- Peta Spasial & Skala Visual: ${skalaPetaDesc}
- Koridor Hotspot / Konsentrasi Tertinggi di Surabaya: ${hotspotDesc}
- Peringkat Kontribusi Emisi Sektoral EDGAR v2026: ${rankingSektoralDesc}
- Dinamika Grafik Temporal (${chartView}): ${trenGrafikDesc}
- Komparasi Antar-Tahun Terpilih (${yearA} vs ${yearB}): ${komparasiDesc}

INSTRUKSI PENGGUNA:
Berdasarkan seluruh data konteks di atas, buatkan laporan ulasan sintesis ilmiah AI yang mendalam, kaya data numerik, dan lengkap dalam 5 bagian terstruktur:
### 1. Peta Spasial & Koridor Hotspot Surabaya
### 2. Peringkat Emisi Sektoral & Kontributor Antropogenik Utama
### 3. Dinamika Tren Temporal & Komparasi Antar-Tahun
### 4. Analisis Risiko Lingkungan & Kesehatan Warga
### 5. Rekomendasi Kebijakan Mitigasi Terukur Pemkot Surabaya

Uraikan secara ilmiah, analitis, dan berbobot dari Bagian 1 sampai selesai Bagian 5 tuntas tanpa terpotong (100% Bahasa Indonesia).`
}

/**
 * Cek apakah error merupakan indikasi kuota/saldo habis
 */
export function isQuotaError(status, message = '') {
  return (
    status === 402 ||
    status === 429 ||
    /quota|credit|saldo|balance|exceeded|habis|limit|insufficient/i.test(message)
  )
}

/**
 * Menyimpan ulasan AI ke localStorage dengan pengamanan kuota browser (LRU cleanup)
 */
export function safeSaveAiCache(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Jika kuota localStorage penuh, bersihkan cache analisis AI yang lama
    try {
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith('sijaka_ai_') && k !== key) {
          keysToRemove.push(k)
        }
      }
      keysToRemove.slice(0, 10).forEach(k => localStorage.removeItem(k))
      localStorage.setItem(key, value)
    } catch {
      /* abaikan kegagalan storage sekunder */
    }
  }
}
