import { useState, useEffect, useMemo } from 'react'
import Papa from 'papaparse'
import { MapContainer, TileLayer, ImageOverlay } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import PustakaPage from './components/PustakaPage'
import TentangPage from './components/TentangPage'
import AiInsightCard from './components/AiInsightCard'

// ============================================================
// CONSTANTS & METADATA
// ============================================================
const BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const ATMOSFER_VARS = ['CO', 'NO2', 'SO2', 'HCHO', 'O3', 'UVAI', 'AOD055']
const ATMOSFER_YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025]
const EDGAR_YEARS = Array.from({ length: 26 }, (_, i) => 2000 + i) // 2000-2025

const INDICATOR_META = {
  CO: {
    label: 'CO',
    fullName: 'Karbon Monoksida',
    unit: 'mol/m²',
    displayUnit: 'mol/m²',
    color: '#ef4444',
    source: 'Sentinel-5P / TROPOMI',
    desc: 'Gas hasil pembakaran tidak sempurna (transportasi & industri). Berperan dalam kimia pembentukan ozon troposfer.'
  },
  NO2: {
    label: 'NO₂',
    fullName: 'Nitrogen Dioksida',
    unit: 'mol/m²',
    displayUnit: 'mol/m²',
    color: '#f97316',
    source: 'Sentinel-5P / TROPOMI',
    desc: 'Gas kecokelatan dari pembakaran suhu tinggi pada kendaraan & industri. Penanda aktivitas perkotaan dan industri padat.'
  },
  SO2: {
    label: 'SO₂',
    fullName: 'Sulfur Dioksida',
    unit: 'mol/m²',
    displayUnit: 'mol/m²',
    color: '#eab308',
    source: 'Sentinel-5P / TROPOMI',
    desc: 'Berasal dari pembakaran bahan bakar fosil bersulfur dan aktivitas industri/pelabuhan. Prekursor aerosol sulfat halus.'
  },
  HCHO: {
    label: 'HCHO',
    fullName: 'Formaldehida',
    unit: 'mol/m²',
    displayUnit: 'mol/m²',
    color: '#22c55e',
    source: 'Sentinel-5P / TROPOMI',
    desc: 'Gas reaktif penanda proses oksidasi senyawa organik mudah menguap (VOC) dari emisi mesin, pelarut, dan vegetasi.'
  },
  O3: {
    label: 'O₃',
    fullName: 'Ozon Atmosfer Total',
    unit: 'mol/m²',
    displayUnit: 'mol/m²',
    color: '#3b82f6',
    source: 'Sentinel-5P / TROPOMI',
    desc: 'Kolom ozon total atmosfer. Menunjukkan dinamika kimia atmosfer regional dan pengaruh lapisan stratosfer/troposfer.'
  },
  UVAI: {
    label: 'UVAI',
    fullName: 'UV Aerosol Index',
    unit: '–',
    displayUnit: '(indeks)',
    color: '#8b5cf6',
    source: 'Sentinel-5P / TROPOMI',
    desc: 'Indeks optik aerosol penyerap radiasi UV seperti jelaga/asap pembakaran, debu mineral, dan abu partikulat.'
  },
  AOD055: {
    label: 'AOD055',
    fullName: 'Aerosol Optical Depth (0.55 µm)',
    unit: '–',
    displayUnit: '(indeks)',
    color: '#ec4899',
    source: 'MODIS MAIAC (Terra/Aqua 2000–2025)',
    desc: 'Kedalaman optik aerosol historis jangka panjang (26 tahun). Mengukur derajat hambatan radiasi cahaya oleh partikel udara.'
  },
}

const EDGAR_SECTORS = [
  { key: 'FUEL_EXPLOITATION', label: 'Fuel Exploitation', short: 'Fuel', color: '#f59e0b', desc: 'Produksi, transformasi, dan pemurnian bahan bakar (36.8%)' },
  { key: 'IND_COMBUSTION', label: 'Industrial Combustion', short: 'Ind.Comb.', color: '#ef4444', desc: 'Pembakaran boiler & turbin manufaktur (30.6%)' },
  { key: 'TRANSPORT', label: 'Transport', short: 'Transport', color: '#3b82f6', desc: 'Pergerakan kendaraan jalan, laut & rel (17.2%)' },
  { key: 'POWER_INDUSTRY', label: 'Power Industry', short: 'Power', color: '#a855f7', desc: 'Pembangkitan tenaga listrik dan panas (5.8%)' },
  { key: 'BUILDINGS', label: 'Buildings', short: 'Buildings', color: '#22c55e', desc: 'Energi stasioner komersial & residensial (5.5%)' },
  { key: 'IND_PROCESSES', label: 'Industrial Processes', short: 'Ind.Proc.', color: '#06b6d4', desc: 'Reaksi kimia kalsinasi semen & logam (4.0%)' },
  { key: 'WASTE', label: 'Waste', short: 'Waste', color: '#ec4899', desc: 'Pengolahan sampah padat & air limbah (0.12%)' },
  { key: 'AGRICULTURE', label: 'Agriculture', short: 'Agri.', color: '#64748b', desc: 'Aktivitas lahan dan pengelolaan pertanian (0.005%)' },
]

// Data Skala Colorbar Resmi (berdasarkan SKALA_COLORBAR_PER_SEKTOR.csv dan statistik Sentinel-5P)
const COLORBAR_SCALES = {
  // Sektor EDGAR (ton CO₂ / grid 0.1° / bulan)
  AGRICULTURE: { min: '0', max: '703.7', unit: 'ton CO₂/sel/bln', title: 'Skala Emisi Pertanian' },
  BUILDINGS: { min: '0', max: '18.36 rb', unit: 'ton CO₂/sel/bln', title: 'Skala Emisi Bangunan' },
  FUEL_EXPLOITATION: { min: '0', max: '65.15 rb', unit: 'ton CO₂/sel/bln', title: 'Skala Emisi Bahan Bakar' },
  IND_COMBUSTION: { min: '0', max: '198.9 rb', unit: 'ton CO₂/sel/bln', title: 'Skala Emisi Manufaktur' },
  IND_PROCESSES: { min: '0', max: '168.4 rb', unit: 'ton CO₂/sel/bln', title: 'Skala Emisi Proses Industri' },
  POWER_INDUSTRY: { min: '0', max: '933.3 rb', unit: 'ton CO₂/sel/bln', title: 'Skala Emisi Pembangkit' },
  TRANSPORT: { min: '0', max: '42.20 rb', unit: 'ton CO₂/sel/bln', title: 'Skala Emisi Transportasi' },
  WASTE: { min: '0', max: '233.8', unit: 'ton CO₂/sel/bln', title: 'Skala Emisi Sampah/Limbah' },
  // Atmosfer & Aerosol
  CO: { min: '0.023', max: '0.041', unit: 'mol/m²', title: 'Skala Kolom Vertikal CO' },
  NO2: { min: '0', max: '1.36 × 10⁻⁴', unit: 'mol/m²', title: 'Skala Kolom Troposfer NO₂' },
  SO2: { min: '0', max: '6.06 × 10⁻⁴', unit: 'mol/m²', title: 'Skala Kolom Vertikal SO₂' },
  HCHO: { min: '0', max: '3.13 × 10⁻⁴', unit: 'mol/m²', title: 'Skala Kolom Troposfer HCHO' },
  O3: { min: '0.110', max: '0.123', unit: 'mol/m²', title: 'Skala Kolom Total O₃' },
  UVAI: { min: '-2.0', max: '+0.1', unit: '(indeks)', title: 'Skala Indeks Aerosol UV' },
  AOD055: { min: '0.10', max: '0.35', unit: '(indeks)', title: 'Skala AOD MODIS (0.55 µm)' },
}

// Data Hotspot Spasial Riil (diambil dari rata-rata agregat NILAI_AEROSOL_2019_2025.csv)
const REAL_HOTSPOTS = {
  CO: [
    { name: 'Kawasan Industri Benowo / Romokalisari', val: '0.0306 mol/m²', tag: 'Top 1' },
    { name: 'Koridor Barat Tandes / Margomulyo', val: '0.0305 mol/m²', tag: 'Top 2' },
    { name: 'Kawasan Pergudangan Kalianak / Asemrowo', val: '0.0305 mol/m²', tag: 'Top 3' },
    { name: 'Koridor Karang Pilang / Mastrip', val: '0.0305 mol/m²', tag: 'Top 4' },
    { name: 'Pusat Kota Gubeng / Pemuda', val: '0.0304 mol/m²', tag: 'Top 5' }
  ],
  NO2: [
    { name: 'Pelabuhan Tanjung Perak & Semampir', val: '7.41e-5 mol/m²', tag: 'Top 1' },
    { name: 'Kawasan Asemrowo & Tol Dupak', val: '7.40e-5 mol/m²', tag: 'Top 2' },
    { name: 'Krembangan / Koridor Perak Barat', val: '7.33e-5 mol/m²', tag: 'Top 3' },
    { name: 'Pusat Kota Genteng & Basuki Rahmat', val: '7.28e-5 mol/m²', tag: 'Top 4' },
    { name: 'Kawasan Industri Rungkut (SIER)', val: '7.24e-5 mol/m²', tag: 'Top 5' }
  ],
  SO2: [
    { name: 'Terminal Jamrud / Tanjung Perak', val: '2.12e-4 mol/m²', tag: 'Top 1' },
    { name: 'Pabean Cantikan / Kalimas Baru', val: '2.11e-4 mol/m²', tag: 'Top 2' },
    { name: 'Koridor Maritim Ujung / Semampir', val: '2.10e-4 mol/m²', tag: 'Top 3' },
    { name: 'Pergudangan Margomulyo / Kalianak', val: '2.09e-4 mol/m²', tag: 'Top 4' },
    { name: 'Kawasan Kenjeran Pesisir Utara', val: '2.07e-4 mol/m²', tag: 'Top 5' }
  ],
  HCHO: [
    { name: 'Pusat Niaga Genteng / Tunjungan', val: '1.90e-4 mol/m²', tag: 'Top 1' },
    { name: 'Kawasan Bubutan & Pasar Turi', val: '1.89e-4 mol/m²', tag: 'Top 2' },
    { name: 'Koridor Simpang Sawahan / Diponegoro', val: '1.87e-4 mol/m²', tag: 'Top 3' },
    { name: 'Kawasan Sukolilo & Mulyorejo', val: '1.87e-4 mol/m²', tag: 'Top 4' },
    { name: 'Kawasan Industri Rungkut (SIER)', val: '1.87e-4 mol/m²', tag: 'Top 5' }
  ],
  O3: [
    { name: 'Pesisir Gunung Anyar / Mangrove Timur', val: '0.1160 mol/m²', tag: 'Top 1' },
    { name: 'Pesisir Rungkut Medokan Ayu', val: '0.1160 mol/m²', tag: 'Top 2' },
    { name: 'Pesisir Sukolilo Pantai Timur', val: '0.1160 mol/m²', tag: 'Top 3' },
    { name: 'Bulak / Kenjeran Selat Madura', val: '0.1160 mol/m²', tag: 'Top 4' },
    { name: 'Kawasan Terbuka Benowo Barat', val: '0.1159 mol/m²', tag: 'Top 5' }
  ],
  UVAI: [
    { name: 'Kawasan Padat Wonokromo / Jagir', val: '-0.708 (indeks)', tag: 'Top 1' },
    { name: 'Koridor Raya Darmo / Tegalsari', val: '-0.709 (indeks)', tag: 'Top 2' },
    { name: 'Kawasan Karang Pilang Industri', val: '-0.709 (indeks)', tag: 'Top 3' },
    { name: 'Pusat Kota Gubeng / Airlangga', val: '-0.710 (indeks)', tag: 'Top 4' },
    { name: 'Kawasan Industri SIER Rungkut', val: '-0.711 (indeks)', tag: 'Top 5' }
  ],
  AOD055: [
    { name: 'Surabaya Utara (Pelabuhan & Industri)', val: '0.28 (QC70)', tag: 'Top 1' },
    { name: 'Surabaya Barat (Pergudangan & Tol)', val: '0.26 (QC70)', tag: 'Top 2' },
    { name: 'Surabaya Pusat (Koridor Bisnis)', val: '0.25 (QC70)', tag: 'Top 3' },
    { name: 'Surabaya Selatan (Kawasan Pemukiman)', val: '0.24 (QC70)', tag: 'Top 4' },
    { name: 'Surabaya Timur (Pesisir Pamurbaya)', val: '0.22 (QC70)', tag: 'Top 5' }
  ]
}

const SURABAYA_CENTER = [-7.275, 112.755]

// Bounding box standar diselaraskan dengan memperhitungkan colorbar di sebelah kanan citra
const AEROSOL_MAP_BOUNDS = [[-7.383, 112.583], [-7.158, 112.893]]
const EDGAR_MAP_BOUNDS = [[-7.379, 112.588], [-7.168, 112.913]]

// ============================================================
// FORMATTERS
// ============================================================
function fmtNum(n) {
  if (n == null || isNaN(n)) return '–'
  const abs = Math.abs(n)
  if (abs === 0) return '0'
  if (abs >= 1e6) return (n / 1e6).toFixed(2) + ' jt'
  if (abs >= 1e3) return (n / 1e3).toFixed(1) + ' rb'
  if (abs < 0.001 && abs !== 0) return n.toExponential(2)
  if (abs < 1) return n.toFixed(4)
  return n.toFixed(2)
}

function fmtTon(n) {
  if (n == null || isNaN(n)) return '–'
  if (n >= 1e6) return (n / 1e6).toFixed(2) + ' juta'
  if (n >= 1e3) return (n / 1e3).toFixed(1) + ' ribu'
  return n.toFixed(1)
}

function pad2(n) { return String(n).padStart(2, '0') }

function pctChange(curr, prev) {
  if (!prev || prev === 0) return null
  return ((curr - prev) / Math.abs(prev)) * 100
}

// ============================================================
// MAIN COMPONENT
// ============================================================
function App() {
  const [currentPage, setCurrentPage] = useState('beranda') // 'beranda' | 'pustaka' | 'tentang'
  const [activeSection, setActiveSection] = useState('atmosfer')
  const [activeIndicator, setActiveIndicator] = useState('CO')
  const [activeSector, setActiveSector] = useState('FUEL_EXPLOITATION')
  const [activeYear, setActiveYear] = useState(2025)
  const [activeMonth, setActiveMonth] = useState(1)
  const [chartView, setChartView] = useState('Tahunan')
  const [mapOpacity, setMapOpacity] = useState(0.85)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  // Kontrol Kalibrasi Interaktif Peta (Bisa digeser manual oleh user & tersimpan di localStorage)
  const [showCalibration, setShowCalibration] = useState(false)
  const [mapOffsetX, setMapOffsetX] = useState(() => {
    const s = localStorage.getItem('sfootprint_map_offset_x')
    return s !== null ? Number(s) : 0
  })
  const [mapOffsetY, setMapOffsetY] = useState(() => {
    const s = localStorage.getItem('sfootprint_map_offset_y')
    return s !== null ? Number(s) : 0
  })
  const [mapScaleX, setMapScaleX] = useState(() => {
    const s = localStorage.getItem('sfootprint_map_scale_x')
    return s !== null ? Number(s) : 1
  })
  const [mapScaleY, setMapScaleY] = useState(() => {
    const s = localStorage.getItem('sfootprint_map_scale_y')
    return s !== null ? Number(s) : 1
  })

  // Simpan pengaturan kalibrasi otomatis ke localStorage
  useEffect(() => {
    localStorage.setItem('sfootprint_map_offset_x', mapOffsetX)
    localStorage.setItem('sfootprint_map_offset_y', mapOffsetY)
    localStorage.setItem('sfootprint_map_scale_x', mapScaleX)
    localStorage.setItem('sfootprint_map_scale_y', mapScaleY)
  }, [mapOffsetX, mapOffsetY, mapScaleX, mapScaleY])

  const handleResetCalibration = () => {
    setMapOffsetX(0)
    setMapOffsetY(0)
    setMapScaleX(1)
    setMapScaleY(1)
  }

  // Data states
  const [atmosData, setAtmosData] = useState([])
  const [aodHistoris, setAodHistoris] = useState([])
  const [edgarYearly, setEdgarYearly] = useState([])
  const [edgarMonthly, setEdgarMonthly] = useState([])

  // Year comparison
  const [yearA, setYearA] = useState(2019)
  const [yearB, setYearB] = useState(2025)

  useEffect(() => {
    document.documentElement.classList.add('dark')
  }, [])

  // Load CSV datasets
  useEffect(() => {
    const load = (url, setter) =>
      fetch(url)
        .then(r => r.text())
        .then(t => Papa.parse(t, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: res => setter(res.data)
        }))
        .catch(err => console.error('Error loading CSV:', url, err))

    load('/data/tren_aerosol.csv', setAtmosData)
    load('/data/tren_historis_aod.csv', setAodHistoris)
    load('/data/edgar_tahunan.csv', setEdgarYearly)
    load('/data/edgar_bulanan.csv', setEdgarMonthly)
  }, [])

  // Time Player: Animasi otomatis memutar bulan 1 s/d 12
  useEffect(() => {
    let timer = null
    if (isPlaying) {
      timer = setInterval(() => {
        setActiveMonth(prev => (prev >= 12 ? 1 : prev + 1))
      }, 900)
    }
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [isPlaying])

  // Menentukan daftar tahun yang tersedia (AOD055 dan EDGAR mendukung 2000-2025)
  const availableYears = useMemo(() => {
    if (activeSection === 'atmosfer') {
      if (activeIndicator === 'AOD055') return EDGAR_YEARS // 26 tahun MODIS historis
      return ATMOSFER_YEARS // 2019-2025 Sentinel-5P
    }
    return EDGAR_YEARS // 2000-2025 EDGAR
  }, [activeSection, activeIndicator])

  // Bounding box efektif setelah digeser dan di-scale secara real-time oleh pengguna
  const activeMapBounds = useMemo(() => {
    const baseBounds = activeSection === 'atmosfer' ? AEROSOL_MAP_BOUNDS : EDGAR_MAP_BOUNDS

    const [[baseSouth, baseWest], [baseNorth, baseEast]] = baseBounds
    const centerLat = (baseNorth + baseSouth) / 2
    const centerLon = (baseEast + baseWest) / 2
    const spanLat = (baseNorth - baseSouth) * mapScaleY
    const spanLon = (baseEast - baseWest) * mapScaleX

    const south = centerLat - spanLat / 2 + mapOffsetY
    const north = centerLat + spanLat / 2 + mapOffsetY
    const west = centerLon - spanLon / 2 + mapOffsetX
    const east = centerLon + spanLon / 2 + mapOffsetX

    return [[south, west], [north, east]]
  }, [activeSection, mapOffsetX, mapOffsetY, mapScaleX, mapScaleY])

  // Penyesuaian rentang tahun saat berpindah indikator/seksi
  useEffect(() => {
    if (activeSection === 'atmosfer') {
      if (activeIndicator === 'AOD055') {
        if (!EDGAR_YEARS.includes(activeYear)) setActiveYear(2025)
        setYearA(2000)
        setYearB(2025)
      } else {
        if (!ATMOSFER_YEARS.includes(activeYear)) setActiveYear(2025)
        setYearA(2019)
        setYearB(2025)
      }
    } else {
      if (!EDGAR_YEARS.includes(activeYear)) setActiveYear(2025)
      setYearA(2000)
      setYearB(2025)
    }
  }, [activeSection, activeIndicator])

  // ============================================================
  // COMPUTED — ATMOSFER
  // ============================================================
  const atmosYearlyChart = useMemo(() => {
    if (activeIndicator === 'AOD055' && aodHistoris.length > 0) {
      const byYear = {}
      aodHistoris.forEach(row => {
        if (!row.year || row.year > 2025) return
        if (!byYear[row.year]) byYear[row.year] = { sum: 0, count: 0 }
        const v = row.AOD055_mean
        if (v != null && !isNaN(v)) {
          byYear[row.year].sum += v
          byYear[row.year].count += 1
        }
      })
      return Object.entries(byYear)
        .map(([yr, d]) => ({ year: Number(yr), value: d.count > 0 ? d.sum / d.count : null }))
        .sort((a, b) => a.year - b.year)
    }

    if (!atmosData.length) return []
    const byYear = {}
    atmosData.forEach(row => {
      if (!row.year) return
      if (!byYear[row.year]) byYear[row.year] = { sum: 0, count: 0 }
      const v = row[activeIndicator]
      if (v != null && !isNaN(v)) {
        byYear[row.year].sum += v
        byYear[row.year].count += 1
      }
    })
    return Object.entries(byYear)
      .map(([yr, d]) => ({ year: Number(yr), value: d.count > 0 ? d.sum / d.count : null }))
      .sort((a, b) => a.year - b.year)
  }, [atmosData, aodHistoris, activeIndicator])

  const atmosMonthlyChart = useMemo(() => {
    if (activeIndicator === 'AOD055' && aodHistoris.length > 0) {
      return aodHistoris
        .filter(row => row.year === activeYear)
        .sort((a, b) => a.month - b.month)
        .map(row => ({
          month: BULAN[row.month - 1] || row.month,
          value: row.AOD055_mean != null && !isNaN(row.AOD055_mean) ? row.AOD055_mean : null
        }))
    }

    if (!atmosData.length) return []
    return atmosData
      .filter(row => row.year === activeYear)
      .sort((a, b) => a.month - b.month)
      .map(row => ({
        month: BULAN[row.month - 1] || row.month,
        value: row[activeIndicator] != null && !isNaN(row[activeIndicator]) ? row[activeIndicator] : null
      }))
  }, [atmosData, aodHistoris, activeIndicator, activeYear])

  const atmosKpi = useMemo(() => {
    if (!atmosYearlyChart.length) return { latest: null, avg: null, change: null, yearRange: '' }
    const curr = atmosYearlyChart.find(d => d.year === activeYear)
    const prev = atmosYearlyChart.find(d => d.year === activeYear - 1)
    const validVals = atmosYearlyChart.filter(d => d.value != null).map(d => d.value)
    const avg = validVals.length > 0 ? validVals.reduce((a, b) => a + b, 0) / validVals.length : null
    const change = curr && prev && prev.value ? pctChange(curr.value, prev.value) : null
    const firstYear = atmosYearlyChart[0]?.year
    const lastYear = atmosYearlyChart[atmosYearlyChart.length - 1]?.year
    return {
      latest: curr?.value ?? null,
      avg,
      change,
      yearRange: `${firstYear}–${lastYear}`
    }
  }, [atmosYearlyChart, activeYear])

  const atmosComparison = useMemo(() => {
    const a = atmosYearlyChart.find(d => d.year === yearA)
    const b = atmosYearlyChart.find(d => d.year === yearB)
    const valA = a?.value ?? null
    const valB = b?.value ?? null
    const change = valA && valB ? pctChange(valB, valA) : null
    return { valA, valB, change }
  }, [atmosYearlyChart, yearA, yearB])

  const atmosMapUrl = useMemo(() => {
    if (activeIndicator === 'AOD055') return null
    return `/maps/aerosol/${activeIndicator}/${activeIndicator}_${activeYear}_${pad2(activeMonth)}.png`
  }, [activeIndicator, activeYear, activeMonth])

  // ============================================================
  // COMPUTED — EDGAR
  // ============================================================
  const edgarPieData = useMemo(() => {
    if (!edgarYearly.length) return []
    return EDGAR_SECTORS.map(s => {
      const row = edgarYearly.find(r => r.sektor === s.key && r.tahun === activeYear)
      return {
        name: s.short,
        fullName: s.label,
        value: row?.emisi_ton_co2_estimasi ?? 0,
        color: s.color,
        key: s.key
      }
    }).sort((a, b) => b.value - a.value)
  }, [edgarYearly, activeYear])

  const edgarTotalCO2 = useMemo(() =>
    edgarPieData.reduce((sum, d) => sum + d.value, 0)
  , [edgarPieData])

  const edgarSectorYearlyChart = useMemo(() => {
    if (!edgarYearly.length) return []
    return edgarYearly
      .filter(r => r.sektor === activeSector)
      .sort((a, b) => a.tahun - b.tahun)
      .map(r => ({ year: r.tahun, value: r.emisi_ton_co2_estimasi }))
  }, [edgarYearly, activeSector])

  const edgarSectorMonthlyChart = useMemo(() => {
    if (!edgarMonthly.length) return []
    return edgarMonthly
      .filter(r => r.sektor === activeSector && r.tahun === activeYear)
      .sort((a, b) => a.bulan - b.bulan)
      .map(r => ({ month: BULAN[r.bulan - 1], value: r.emisi_ton_co2_estimasi }))
  }, [edgarMonthly, activeSector, activeYear])

  const edgarKpi = useMemo(() => {
    const currTotal = edgarPieData.reduce((s, d) => s + d.value, 0)
    const prevPie = EDGAR_SECTORS.map(s => {
      const row = edgarYearly.find(r => r.sektor === s.key && r.tahun === activeYear - 1)
      return row?.emisi_ton_co2_estimasi ?? 0
    })
    const prevTotal = prevPie.reduce((s, v) => s + v, 0)
    const change = pctChange(currTotal, prevTotal)
    const topSector = edgarPieData[0]
    return { total: currTotal, change, topSector }
  }, [edgarPieData, edgarYearly, activeYear])

  const edgarMapUrl = useMemo(() =>
    `/maps/edgar/${activeSector}/${activeSector}_${activeYear}_${pad2(activeMonth)}.png`
  , [activeSector, activeYear, activeMonth])

  const edgarComparison = useMemo(() => {
    const getTotal = (yr) => EDGAR_SECTORS.reduce((sum, s) => {
      const row = edgarYearly.find(r => r.sektor === s.key && r.tahun === yr)
      return sum + (row?.emisi_ton_co2_estimasi ?? 0)
    }, 0)
    const valA = getTotal(yearA)
    const valB = getTotal(yearB)
    const change = pctChange(valB, valA)
    return { valA, valB, change }
  }, [edgarYearly, yearA, yearB])

  const isAtmosfer = activeSection === 'atmosfer'
  const chartData = isAtmosfer
    ? (chartView === 'Tahunan' ? atmosYearlyChart : atmosMonthlyChart)
    : (chartView === 'Tahunan' ? edgarSectorYearlyChart : edgarSectorMonthlyChart)
  const xKey = chartView === 'Tahunan' ? 'year' : 'month'
  const sectorMeta = EDGAR_SECTORS.find(s => s.key === activeSector) || EDGAR_SECTORS[0]

  // Skala Colorbar Aktif
  const activeScale = isAtmosfer
    ? (COLORBAR_SCALES[activeIndicator] || COLORBAR_SCALES.CO)
    : (COLORBAR_SCALES[activeSector] || COLORBAR_SCALES.FUEL_EXPLOITATION)

  // Sinkronisasi & Preloading Peta Spasial (mencegah blank/freeze saat ganti sektor/bulan)
  const targetMapUrl = isAtmosfer ? atmosMapUrl : edgarMapUrl
  const [displayedMapUrl, setDisplayedMapUrl] = useState(targetMapUrl)
  const [isMapLoading, setIsMapLoading] = useState(false)

  useEffect(() => {
    if (!targetMapUrl) {
      setDisplayedMapUrl(null)
      setIsMapLoading(false)
      return
    }

    if (targetMapUrl === displayedMapUrl) {
      setIsMapLoading(false)
      return
    }

    setIsMapLoading(true)
    const img = new Image()
    img.src = targetMapUrl
    img.onload = () => {
      setDisplayedMapUrl(targetMapUrl)
      setIsMapLoading(false)
    }
    img.onerror = () => {
      setDisplayedMapUrl(targetMapUrl)
      setIsMapLoading(false)
    }
  }, [targetMapUrl, displayedMapUrl])

  // Unduh Gambar Peta
  const handleDownloadMap = () => {
    const url = isAtmosfer ? atmosMapUrl : edgarMapUrl
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = `${isAtmosfer ? activeIndicator : activeSector}_${activeYear}_${pad2(activeMonth)}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const scrollToMetadata = () => {
    const el = document.getElementById('metadata-section')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#050B14] text-slate-200 font-sans pb-10 bg-grid-pattern relative">
      {/* Background Neon Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* ==================== HEADER (NAVBAR RESTORED) ==================== */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#050B14]/80 border-b border-blue-900/30 shadow-[0_4px_30px_rgba(0,0,0,0.5)] mb-6">
        <div className="max-w-6xl mx-auto px-6 lg:px-12 py-4 flex flex-col md:flex-row justify-between items-center relative z-10">
          
          {/* Logo & Mobile Top */}
          <div className="flex items-center justify-between w-full md:w-auto">
            <div
              onClick={() => {
                setCurrentPage('beranda')
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="flex items-center gap-3 cursor-pointer group"
              title="Kembali ke Beranda Dashboard"
            >
              <img
                src="/img/Logo_STMKG.png"
                alt="Logo STMKG"
                className="h-12 w-auto object-contain bg-[#0a1120] rounded-lg p-1 border border-blue-900/40 group-hover:border-blue-500/50 transition-all duration-300"
                onError={(e) => {
                  e.target.onerror = null
                  e.target.outerHTML = `<div class="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shadow-neon-blue"><span class="text-blue-400 font-bold font-display text-xs">STMKG</span></div>`
                }}
              />
              <div>
                <h1 className="text-base md:text-lg font-bold tracking-tight text-white font-display group-hover:text-blue-300 transition-colors">
                  SAC-Footprint Surabaya
                </h1>
                <p className="text-[10px] text-blue-400/80 font-medium hidden sm:block">
                   Polutan Atmosfer & Emisi Karbon
                </p>
              </div>
            </div>

            {/* Mobile Controls: Bell + Burger */}
            <div className="flex items-center gap-3 md:hidden">
              <button 
                onClick={() => {
                  setCurrentPage('pustaka')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="relative p-2 text-slate-400 hover:text-white transition-colors bg-[#0a1120] rounded-full border border-blue-900/40 shadow-inner"
                title="Buka Pustaka Pembelajaran"
              >
                <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-0 right-1 block h-2 w-2 rounded-full bg-blue-500 ring-2 ring-[#050B14]"></span>
              </button>
              <button
                className="p-2 text-slate-300 hover:text-white"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>

          {/* Desktop & Mobile Menu */}
          <div className={`${isMenuOpen ? 'flex' : 'hidden'} md:flex flex-col md:flex-row items-center justify-end flex-1 w-full md:w-auto mt-4 md:mt-0 gap-4 md:gap-6`}>
            
            {/* Navigasi Beranda, Pustaka, Tentang (Center di Desktop) */}
            <nav className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto md:absolute md:left-1/2 md:-translate-x-1/2">
              <button
                onClick={() => {
                  setCurrentPage('beranda')
                  setIsMenuOpen(false)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all w-full md:w-auto justify-center ${
                  currentPage === 'beranda'
                    ? 'bg-blue-900/30 border border-blue-500/40 text-blue-400 shadow-neon-blue'
                    : 'text-slate-400 hover:text-white hover:bg-[#0a1120] border border-transparent'
                }`}
              >
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Beranda</span>
              </button>

              <button
                onClick={() => {
                  setCurrentPage('pustaka')
                  setIsMenuOpen(false)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all w-full md:w-auto justify-center ${
                  currentPage === 'pustaka'
                    ? 'bg-blue-900/30 border border-blue-500/40 text-blue-400 shadow-neon-blue'
                    : 'text-slate-400 hover:text-white hover:bg-[#0a1120] border border-transparent'
                }`}
              >
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Pustaka</span>
              </button>

              <button
                onClick={() => {
                  setCurrentPage('tentang')
                  setIsMenuOpen(false)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all w-full md:w-auto justify-center ${
                  currentPage === 'tentang'
                    ? 'bg-blue-900/30 border border-blue-500/40 text-blue-400 shadow-neon-blue'
                    : 'text-slate-400 hover:text-white hover:bg-[#0a1120] border border-transparent'
                }`}
              >
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Tentang</span>
              </button>
            </nav>

            {/* Right: Bell Icon Only (Search Bar Dihilangkan) */}
            <div className="flex items-center justify-end w-full md:w-auto mt-2 md:mt-0">
              <button
                onClick={() => {
                  setCurrentPage('pustaka')
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                title="Buka Pustaka Pembelajaran & Dokumen Ilmiah"
                className="relative p-2.5 text-slate-400 hover:text-white transition-colors bg-[#0a1120] rounded-full border border-blue-900/40 hover:border-blue-500/50 shadow-inner group"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-blue-500 ring-2 ring-[#050B14]"></span>
              </button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-[1px] neon-border-gradient animate-border-flow"></div>
      </header>

      <main className="px-6 lg:px-12 py-8 max-w-6xl mx-auto space-y-10 relative z-10">
        {currentPage === 'pustaka' && <PustakaPage />}
        {currentPage === 'tentang' && <TentangPage />}
        {currentPage === 'beranda' && (
          <>
            {/* ==================== TOGGLE PILIHAN (DI BAWAH NAVBAR & CENTER) ==================== */}
        <div className="flex justify-center pt-2">
          <div className="inline-flex bg-[#0a1120] p-1.5 rounded-2xl border border-blue-900/50 shadow-neon-blue">
            <button
              onClick={() => setActiveSection('atmosfer')}
              className={`px-6 py-2.5 text-xs md:text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 ${
                activeSection === 'atmosfer'
                  ? 'bg-blue-600 text-white shadow-neon-blue border border-blue-400/50'
                  : 'text-slate-400 hover:text-blue-300 border border-transparent'
              }`}
            >
              Polutan & Atmosfer
            </button>
            <button
              onClick={() => setActiveSection('edgar')}
              className={`px-6 py-2.5 text-xs md:text-sm font-bold rounded-xl transition-all duration-300 flex items-center gap-2 ${
                activeSection === 'edgar'
                  ? 'bg-blue-600 text-white shadow-neon-blue border border-blue-400/50'
                  : 'text-slate-400 hover:text-blue-300 border border-transparent'
              }`}
            >
              Emisi CO₂ EDGAR
            </button>
          </div>
        </div>

        {/* ==================== TITLE & SELECTORS ==================== */}
        <div className="flex flex-col items-center text-center gap-6 border-b border-blue-900/30 pb-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-950/60 border border-blue-500/30 px-3.5 py-1 rounded-full text-xs font-semibold text-blue-300 mb-3">
              Basis Data: Sentinel-5P / TROPOMI • MODIS MAIAC • IEA–EDGAR CO₂
            </div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight font-display leading-tight drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              {isAtmosfer ? 'Kondisi Atmosfer Kota Surabaya' : 'Estimasi Emisi CO₂ Kota Surabaya'}
            </h2>
            <p className="text-blue-400/80 mt-3 max-w-2xl mx-auto text-base font-medium">
              {isAtmosfer
                ? 'Visualisasi spasial dan tren temporal gas polutan dan indikator aerosol (Sentinel-5P 2019–2025 & MODIS 2000–2025).'
                : 'Distribusi spasial dan tren emisi karbon dioksida fosil delapan sektor ekonomi (IEA–EDGAR GHG 2000–2025).'}
            </p>
          </div>

          {/* Indicator / Sector Tabs */}
          <div className="flex flex-wrap justify-center items-center gap-3 w-full">
            {isAtmosfer ? (
              <div className="flex flex-wrap bg-[#0a1120] p-1.5 rounded-xl border border-blue-900/40 shadow-inner max-w-full justify-center">
                {ATMOSFER_VARS.map(v => (
                  <button
                    key={v}
                    onClick={() => setActiveIndicator(v)}
                    className={`px-3 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
                      activeIndicator === v
                        ? 'bg-blue-600 text-white shadow-neon-blue border border-blue-400/50'
                        : 'text-slate-400 hover:text-blue-300 hover:bg-blue-900/30 border border-transparent'
                    }`}
                  >
                    {INDICATOR_META[v].label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap bg-[#0a1120] p-1.5 rounded-xl border border-blue-900/40 shadow-inner max-w-2xl justify-center gap-1">
                {EDGAR_SECTORS.map(s => (
                  <button
                    key={s.key}
                    onClick={() => setActiveSector(s.key)}
                    className={`px-3 py-2 text-xs font-bold rounded-lg transition-all duration-300 ${
                      activeSector === s.key
                        ? 'text-white shadow-neon-blue border border-blue-400/50'
                        : 'text-slate-400 hover:text-blue-300 hover:bg-blue-900/30 border border-transparent'
                    }`}
                    style={activeSector === s.key ? { backgroundColor: s.color } : {}}
                  >
                    {s.short}
                  </button>
                ))}
              </div>
            )}

            {/* Year, Month Picker & Time Player */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#0a1120] border border-blue-900/40 rounded-xl px-3 py-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Tahun:</span>
                <select
                  value={activeYear}
                  onChange={e => setActiveYear(Number(e.target.value))}
                  className="bg-transparent text-white text-sm font-bold outline-none cursor-pointer"
                >
                  {availableYears.map(y => (
                    <option key={y} value={y} className="bg-[#0a1120] text-white">{y}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-[#0a1120] border border-blue-900/40 rounded-xl px-3 py-1.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Bulan:</span>
                <select
                  value={activeMonth}
                  onChange={e => setActiveMonth(Number(e.target.value))}
                  className="bg-transparent text-white text-sm font-bold outline-none cursor-pointer"
                >
                  {BULAN.map((b, i) => (
                    <option key={i + 1} value={i + 1} className="bg-[#0a1120] text-white">{b}</option>
                  ))}
                </select>
              </div>

              {/* Tombol Animasi Otomatis (Time Player) */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all shadow-sm ${
                  isPlaying
                    ? 'bg-amber-600/30 text-amber-300 border-amber-500/50 shadow-neon-blue animate-pulse'
                    : 'bg-[#0a1120] text-blue-300 hover:bg-blue-900/30 border-blue-900/50'
                }`}
                title={isPlaying ? 'Jeda animasi bulanan' : 'Putar animasi otomatis bulanan (Jan–Des)'}
              >
                <span>{isPlaying ? '⏸' : '▶'}</span>
                <span>{isPlaying ? 'Jeda' : 'Animasi'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ==================== KPI CARDS ==================== */}
        {isAtmosfer ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard
              label={`Rata-rata ${activeYear}`}
              value={fmtNum(atmosKpi.latest)}
              sub={INDICATOR_META[activeIndicator].displayUnit}
              badge={atmosKpi.change != null ? `${atmosKpi.change > 0 ? '↑' : '↓'} ${Math.abs(atmosKpi.change).toFixed(1)}%` : null}
              badgeUp={atmosKpi.change > 0}
              note="Rata-rata kolom atmosfer tahunan"
            />
            <KpiCard
              label="Rata-rata Periode"
              value={fmtNum(atmosKpi.avg)}
              sub={INDICATOR_META[activeIndicator].displayUnit}
              note={`Rentang ${atmosKpi.yearRange}`}
            />
            <KpiCard
              label="Perubahan YoY"
              value={atmosKpi.change != null ? `${atmosKpi.change > 0 ? '+' : ''}${atmosKpi.change.toFixed(1)}%` : '–'}
              note={`${activeYear - 1} → ${activeYear}`}
            />
            <KpiCard
              label="Sensor / Produk"
              value={INDICATOR_META[activeIndicator].source.split(' ')[0]}
              note={INDICATOR_META[activeIndicator].fullName}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard
              label={`Total Emisi ${activeYear}`}
              value={fmtTon(edgarKpi.total)}
              sub="ton CO₂"
              badge={edgarKpi.change != null ? `${edgarKpi.change > 0 ? '↑' : '↓'} ${Math.abs(edgarKpi.change).toFixed(1)}%` : null}
              badgeUp={edgarKpi.change > 0}
              note="Agregat 8 sektor EDGAR"
            />
            <KpiCard
              label="Sektor Terbesar"
              value={edgarKpi.topSector?.name || '–'}
              note={edgarKpi.topSector ? `${((edgarKpi.topSector.value / edgarKpi.total) * 100).toFixed(1)}% (${fmtTon(edgarKpi.topSector.value)} ton)` : ''}
            />
            <KpiCard
              label="Sektor Terpilih"
              value={sectorMeta.short}
              note={sectorMeta.desc}
            />
            <KpiCard
              label="Resolusi Spasial"
              value="0.1° × 0.1°"
              note="IEA–EDGAR 2026 GHG (2000–2025)"
            />
          </div>
        )}

        {/* ==================== MAP CONTAINER ==================== */}
        <div className="w-full flex flex-col">
          <div className="bg-[#0a1120] rounded-3xl border border-blue-900/40 shadow-[0_0_20px_rgba(59,130,246,0.05)] overflow-hidden flex-1 min-h-[520px] flex flex-col z-0 relative group transition-all duration-500 hover:border-blue-500/50 hover:shadow-neon-blue">
            <div className="px-6 py-5 border-b border-blue-900/40 flex flex-wrap justify-between items-center gap-4 bg-[#0a1120] z-10 relative">
              <div>
                <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-blue-500 rounded-full shadow-neon-blue inline-block"></span>
                  Peta Spasial Surabaya
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Overlay citra resolusi tinggi dengan batas administrasi Kota Surabaya
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Opacity slider */}
                <div className="flex items-center gap-2 bg-[#050B14] px-3 py-1.5 rounded-lg border border-blue-900/40">
                  <span className="text-xs text-slate-400">Transparansi:</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={mapOpacity * 100}
                    onChange={e => setMapOpacity(Number(e.target.value) / 100)}
                    className="w-20 accent-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-mono text-blue-300 w-8">{Math.round(mapOpacity * 100)}%</span>
                </div>

                {/* Badge Status */}
                <div className="inline-flex items-center gap-2 bg-[#050B14] px-3.5 py-1.5 rounded-lg border border-blue-900/40">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,1)]"></span>
                  <span className="text-xs font-bold text-blue-300">
                    {isAtmosfer ? INDICATOR_META[activeIndicator].label : sectorMeta.short} • {BULAN[activeMonth - 1]} {activeYear}
                  </span>
                </div>

                {/* Tombol Toggle Geser & Kalibrasi Posisi */}
                <button
                  onClick={() => setShowCalibration(!showCalibration)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all shadow-sm ${
                    showCalibration
                      ? 'bg-amber-600/30 text-amber-300 border-amber-500 shadow-neon-blue animate-pulse'
                      : 'bg-blue-900/30 hover:bg-blue-800/40 text-blue-300 border-blue-700/50'
                  }`}
                  title="Buka panel geser posisi dan kalibrasi peta presisi"
                >
                  <span>🎛️</span>
                  <span>{showCalibration ? 'Tutup Kontrol' : 'Geser Posisi Peta'}</span>
                </button>

                {/* Tombol Unduh Peta */}
                {(isAtmosfer ? atmosMapUrl : edgarMapUrl) && (
                  <button
                    onClick={handleDownloadMap}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-900/30 hover:bg-blue-800/40 text-blue-300 border border-blue-700/50 flex items-center gap-1 transition"
                    title="Simpan citra PNG peta saat ini"
                  >
                    <span>🗺️</span> Unduh Peta
                  </button>
                )}
              </div>
            </div>

            {/* Leaflet Area */}
            <div className="flex-1 relative min-h-[460px]">
              {/* ==================== PANEL KONTROL GESER & KALIBRASI INTERAKTIF ==================== */}
              {showCalibration && (
                <div className="absolute top-4 left-4 z-[1001] pointer-events-auto bg-[#0a1120]/95 backdrop-blur-md border border-amber-500/60 p-4 rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.2)] flex flex-col gap-3 w-80 max-w-[92vw] text-xs">
                  <div className="flex items-center justify-between border-b border-blue-900/50 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                      <span className="font-bold text-white text-sm">🎯 Geser Posisi Citra</span>
                    </div>
                    <button
                      onClick={() => setShowCalibration(false)}
                      className="text-slate-400 hover:text-white p-1 rounded-md transition"
                      title="Tutup panel kalibrasi"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Tombol Panah Pintas (D-Pad Geser Cepat) */}
                  <div className="flex flex-col items-center gap-1.5 bg-[#050B14] p-3 rounded-xl border border-blue-900/50">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Tombol Geser Cepat (±200m):</span>
                    <div className="flex flex-col items-center gap-1.5">
                      <button
                        onClick={() => setMapOffsetY(prev => Number((prev + 0.002).toFixed(4)))}
                        className="px-3.5 py-1 bg-blue-900/50 hover:bg-blue-700/60 text-blue-200 rounded-lg border border-blue-600/50 font-bold active:scale-95 transition flex items-center gap-1"
                        title="Geser Naik (Utara) ~200 m"
                      >
                        ▲ Naik
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setMapOffsetX(prev => Number((prev - 0.002).toFixed(4)))}
                          className="px-3 py-1 bg-blue-900/50 hover:bg-blue-700/60 text-blue-200 rounded-lg border border-blue-600/50 font-bold active:scale-95 transition flex items-center gap-1"
                          title="Geser Kiri (Barat) ~200 m"
                        >
                          ◀ Kiri
                        </button>
                        <button
                          onClick={handleResetCalibration}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-mono border border-slate-600 active:scale-95 transition"
                          title="Kembalikan posisi ke nol"
                        >
                          Pusat
                        </button>
                        <button
                          onClick={() => setMapOffsetX(prev => Number((prev + 0.002).toFixed(4)))}
                          className="px-3 py-1 bg-blue-900/50 hover:bg-blue-700/60 text-blue-200 rounded-lg border border-blue-600/50 font-bold active:scale-95 transition flex items-center gap-1"
                          title="Geser Kanan (Timur) ~200 m"
                        >
                          Kanan ▶
                        </button>
                      </div>
                      <button
                        onClick={() => setMapOffsetY(prev => Number((prev - 0.002).toFixed(4)))}
                        className="px-3.5 py-1 bg-blue-900/50 hover:bg-blue-700/60 text-blue-200 rounded-lg border border-blue-600/50 font-bold active:scale-95 transition flex items-center gap-1"
                        title="Geser Turun (Selatan) ~200 m"
                      >
                        ▼ Turun
                      </button>
                    </div>
                  </div>

                  {/* Slider Horizontal (X) */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300">Geser Horizontal (X):</span>
                      <span className="font-mono text-amber-300 font-bold">
                        {mapOffsetX === 0
                          ? '0 m (Pas)'
                          : mapOffsetX > 0
                            ? `+${Math.round(mapOffsetX * 110000)} m (Kanan)`
                            : `${Math.round(mapOffsetX * 110000)} m (Kiri)`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-0.04"
                      max="0.04"
                      step="0.0005"
                      value={mapOffsetX}
                      onChange={e => setMapOffsetX(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Slider Vertikal (Y) */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300">Geser Vertikal (Y):</span>
                      <span className="font-mono text-amber-300 font-bold">
                        {mapOffsetY === 0
                          ? '0 m (Pas)'
                          : mapOffsetY > 0
                            ? `+${Math.round(mapOffsetY * 111000)} m (Atas)`
                            : `${Math.round(mapOffsetY * 111000)} m (Bawah)`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-0.04"
                      max="0.04"
                      step="0.0005"
                      value={mapOffsetY}
                      onChange={e => setMapOffsetY(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>

                  {/* Slider Skala Ukuran */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300">Ukuran Skala:</span>
                      <span className="font-mono text-blue-300 font-bold">{Math.round(mapScaleX * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.85"
                      max="1.15"
                      step="0.005"
                      value={mapScaleX}
                      onChange={e => {
                        const v = Number(e.target.value)
                        setMapScaleX(v)
                        setMapScaleY(v)
                      }}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>

                  {/* Footer & Reset */}
                  <div className="pt-2 border-t border-blue-900/40 flex justify-between items-center text-[10px] text-slate-400">
                    <span className="text-emerald-400 font-medium">✓ Tersimpan otomatis</span>
                    <button
                      onClick={handleResetCalibration}
                      className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                    >
                      Reset Standar
                    </button>
                  </div>
                </div>
              )}

              {/* Floating Loading Indicator saat ganti bulan/sektor/indikator */}
              {isMapLoading && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none bg-[#0a1120]/95 backdrop-blur-md border border-blue-500/60 px-4 py-1.5 rounded-full text-blue-300 text-xs font-bold flex items-center gap-2.5 shadow-neon-blue animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
                  <span>Memuat Citra Spasial ({isAtmosfer ? INDICATOR_META[activeIndicator].label : sectorMeta.short} • {BULAN[activeMonth - 1]} {activeYear})...</span>
                </div>
              )}

              <MapContainer
                center={SURABAYA_CENTER}
                zoom={12}
                className="w-full h-full absolute inset-0"
                zoomControl={true}
                attributionControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {displayedMapUrl && (
                  <ImageOverlay
                    key={`${displayedMapUrl}_${mapOffsetX}_${mapOffsetY}_${mapScaleX}_${mapScaleY}`}
                    url={displayedMapUrl}
                    bounds={activeMapBounds}
                    opacity={mapOpacity}
                    eventHandlers={{ error: () => {} }}
                  />
                )}
              </MapContainer>

              {/* ==================== LEGENDA POJOK BAWAH (WARNA YlOrRd SAMA PERSIS DENGAN PETA) ==================== */}
              <div className="absolute bottom-5 right-5 z-[1000] pointer-events-auto bg-[#0a1120]/90 backdrop-blur-md border border-blue-900/50 p-3 rounded-2xl shadow-2xl flex flex-col gap-1.5 min-w-[220px]">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-200">
                  <span>{activeScale.title}</span>
                  <span className="text-amber-400 font-mono text-[10px]">{activeScale.unit}</span>
                </div>

                {/* Gradien Bar Warna YlOrRd (Kuning -> Oranye -> Merah Tua, SAMA PERSIS dengan peta) */}
                <div className="h-3 w-full rounded-md bg-gradient-to-r from-[#ffffb2] via-[#fecc5c] via-[#fd8d3c] via-[#f03b20] to-[#bd0026] border border-slate-700/60 shadow-inner"></div>

                {/* Nilai Min & Max */}
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-300 pt-0.5">
                  <span>Rendah: <strong className="text-amber-200">{activeScale.min}</strong></span>
                  <span>Tinggi: <strong className="text-rose-400">{activeScale.max}</strong></span>
                </div>
              </div>
            </div>

            {isAtmosfer && activeIndicator === 'AOD055' && (
              <div className="px-6 py-3 bg-amber-900/20 border-t border-amber-500/30 text-amber-300 text-xs font-medium text-center">
                ℹ️ Data AOD055 MODIS MAIAC disajikan dalam format GeoTIFF tahunan & deret waktu historis 26 tahun (2000–2025). Data dapat dianalisis secara lengkap pada grafik tren temporal di bawah.
              </div>
            )}
          </div>
        </div>

        {/* ==================== CHART CONTAINER ==================== */}
        <div className="w-full flex flex-col">
          <div className="bg-[#0a1120] rounded-3xl border border-blue-900/40 shadow-[0_0_20px_rgba(59,130,246,0.05)] overflow-hidden flex-1 min-h-[480px] flex flex-col group transition-all duration-500 hover:border-blue-500/50 hover:shadow-neon-blue">
            <div className="px-6 py-5 border-b border-blue-900/40 flex flex-wrap justify-between items-center gap-3 bg-[#0a1120]">
              <div>
                <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-blue-500 rounded-full shadow-neon-blue inline-block"></span>
                  {isAtmosfer ? `Tren Temporal — ${INDICATOR_META[activeIndicator].fullName}` : `Tren Emisi — ${sectorMeta.label}`}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {chartView === 'Tahunan'
                    ? (activeIndicator === 'AOD055' ? 'Deret waktu historis MODIS MAIAC 26 tahun (2000–2025)' : 'Grafik pergerakan nilai tahunan')
                    : `Dinamika 12 bulan pada tahun ${activeYear}`}
                </p>
              </div>

              <div className="flex bg-[#050B14] p-1.5 rounded-lg border border-blue-900/40">
                <button
                  onClick={() => setChartView('Tahunan')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-300 ${
                    chartView === 'Tahunan' ? 'bg-blue-600 text-white shadow-neon-blue' : 'text-slate-400 hover:text-blue-300'
                  }`}
                >
                  Tahunan
                </button>
                <button
                  onClick={() => setChartView('Bulanan')}
                  className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all duration-300 ${
                    chartView === 'Bulanan' ? 'bg-blue-600 text-white shadow-neon-blue' : 'text-slate-400 hover:text-blue-300'
                  }`}
                >
                  Bulanan ({activeYear})
                </button>
              </div>
            </div>

            <div className="flex-1 p-6 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={380}>
                  <AreaChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isAtmosfer ? INDICATOR_META[activeIndicator].color : sectorMeta.color} stopOpacity={0.5} />
                        <stop offset="95%" stopColor={isAtmosfer ? INDICATOR_META[activeIndicator].color : sectorMeta.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e3a8a" strokeOpacity={0.4} />
                    <XAxis
                      dataKey={xKey}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#60a5fa' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#60a5fa' }}
                      width={80}
                      domain={['auto', 'auto']}
                      tickFormatter={v => {
                        if (typeof v !== 'number' || isNaN(v)) return v
                        if (!isAtmosfer) return fmtTon(v)
                        if (Math.abs(v) < 0.001 && v !== 0) return v.toExponential(1)
                        return v.toFixed(4)
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid rgba(30,58,138,0.5)',
                        backgroundColor: 'rgba(10,17,32,0.95)',
                        color: '#fff',
                        fontSize: '13px'
                      }}
                      formatter={(val) => [
                        isAtmosfer ? `${fmtNum(val)} ${INDICATOR_META[activeIndicator].displayUnit}` : `${fmtTon(val)} ton CO₂`,
                        isAtmosfer ? activeIndicator : sectorMeta.label
                      ]}
                      labelFormatter={l => chartView === 'Tahunan' ? `Tahun ${l}` : `Bulan ${l}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={isAtmosfer ? INDICATOR_META[activeIndicator].color : sectorMeta.color}
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorMain)"
                      activeDot={{
                        r: 6,
                        fill: '#fff',
                        stroke: isAtmosfer ? INDICATOR_META[activeIndicator].color : sectorMeta.color,
                        strokeWidth: 2
                      }}
                      connectNulls
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-[380px] flex items-center justify-center border-2 border-dashed border-blue-900/40 rounded-lg">
                  <p className="text-blue-400/60 text-sm font-medium">Memuat data grafik...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==================== EDGAR: PIE CHART ==================== */}
        {!isAtmosfer && edgarPieData.length > 0 && (
          <div className="bg-[#0a1120] rounded-3xl border border-blue-900/40 p-8 transition-all duration-500 hover:border-blue-500/50 hover:shadow-neon-blue">
            <h3 className="text-lg font-bold text-white font-display flex items-center gap-2 mb-6">
              <span className="w-1.5 h-6 bg-blue-500 rounded-full shadow-neon-blue inline-block"></span>
              Proporsi Kontribusi 8 Sektor Emisi CO₂ — Tahun {activeYear}
            </h3>
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="w-full lg:w-1/2 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height={360}>
                  <PieChart>
                    <Pie
                      data={edgarPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      innerRadius={68}
                      minAngle={4}
                      paddingAngle={2}
                      strokeWidth={0}
                      labelLine={true}
                      label={({ name, percent }) => {
                        const p = percent * 100
                        if (p >= 1) return `${name} ${p.toFixed(1)}%`
                        if (p > 0.05) return `${name} <1%`
                        return `${name} ~0%`
                      }}
                    >
                      {edgarPieData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    </Pie>
                    <Tooltip
                      formatter={(val) => `${fmtTon(val)} ton CO₂`}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid rgba(30,58,138,0.5)',
                        backgroundColor: 'rgba(10,17,32,0.95)',
                        color: '#fff'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Metrik Tengah Donut Ring */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total {activeYear}</span>
                  <span className="text-base font-extrabold text-white font-mono drop-shadow">{fmtTon(edgarTotalCO2)}</span>
                  <span className="text-[10px] text-blue-400 font-semibold">ton CO₂</span>
                </div>
              </div>

              <div className="w-full lg:w-1/2 space-y-2">
                {edgarPieData.map((d, i) => {
                  const pct = edgarTotalCO2 > 0 ? (d.value / edgarTotalCO2) * 100 : 0
                  const isSelected = activeSector === d.key
                  return (
                    <div
                      key={i}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-900/40 border-blue-500 shadow-neon-blue ring-1 ring-blue-500/50'
                          : 'border-blue-900/30 hover:bg-blue-900/20 hover:border-blue-500/30'
                      }`}
                      onClick={() => setActiveSector(d.key)}
                      title={`Klik untuk menampilkan spasial peta sektor ${d.fullName}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: d.color }}></div>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-200">{d.fullName}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{d.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-400">{fmtTon(d.value)} ton</span>
                        <span className="text-sm font-bold text-blue-300 min-w-[55px] text-right">
                          {pct >= 0.1 ? `${pct.toFixed(1)}%` : '<0.1%'}
                        </span>
                        {isSelected && isMapLoading && (
                          <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" title="Memuat citra peta..."></span>
                        )}
                      </div>
                    </div>
                  )
                })}
                <div className="flex justify-between p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/40 mt-3 shadow-inner">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    Total Estimasi 8 Sektor
                  </span>
                  <span className="text-sm font-bold text-blue-300 font-mono">{fmtTon(edgarTotalCO2)} ton CO₂</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== BOTTOM: HOTSPOT & YEAR COMPARISON ==================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Hotspot Analysis (Atmosfer) or Sektor Ranking (EDGAR) */}
          <div className="bg-[#0a1120] rounded-3xl shadow-[0_0_15px_rgba(59,130,246,0.03)] border border-blue-900/30 p-8 flex flex-col transition-all duration-500 hover:border-blue-500/50 hover:shadow-neon-blue relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[50px] pointer-events-none group-hover:bg-blue-600/10 transition-colors"></div>
            <div className="flex justify-between items-center mb-6 relative z-10">
              <div>
                <h3 className="text-xl font-bold text-white font-display">
                  {isAtmosfer ? 'Analisis Hotspot Konsentrasi' : 'Peringkat Emisi Sektoral'}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isAtmosfer ? 'Berdasarkan Agregat Pengamatan Multi-Tahun (2019–2025)' : `Peringkat kontribusi emisi tahun ${activeYear}`}
                </p>
              </div>
              <span className="text-xs font-bold text-blue-400 bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-500/30">
                {isAtmosfer ? `Indikator ${INDICATOR_META[activeIndicator].label}` : `Tahun ${activeYear}`}
              </span>
            </div>

            {isAtmosfer ? (
              <ul className="space-y-1 relative z-10">
                {(REAL_HOTSPOTS[activeIndicator] || []).map((item, i) => (
                  <li
                    key={i}
                    className="flex justify-between items-center border-b border-blue-900/30 pb-3 pt-3 first:pt-0 last:border-0 hover:bg-blue-900/20 px-3 -mx-3 rounded-xl transition-colors group/item"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-blue-500/50 w-5 group-hover/item:text-blue-400 transition-colors">
                        0{i + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-300 group-hover/item:text-white transition-colors">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-medium text-blue-200 bg-[#050B14] px-2.5 py-1 rounded-md border border-blue-800/50 shadow-inner group-hover/item:border-blue-500/50 transition-all">
                      {item.val}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-1 relative z-10">
                {edgarPieData.slice(0, 5).map((item, i) => (
                  <li
                    key={i}
                    className="flex justify-between items-center border-b border-blue-900/30 pb-3 pt-3 first:pt-0 last:border-0 hover:bg-blue-900/20 px-3 -mx-3 rounded-xl transition-colors group/item cursor-pointer"
                    onClick={() => setActiveSector(item.key)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold text-blue-500/50 w-5 group-hover/item:text-blue-400 transition-colors">
                        0{i + 1}
                      </span>
                      <span className="text-sm font-semibold text-slate-300 group-hover/item:text-white transition-colors">
                        {item.fullName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-300">
                        {edgarTotalCO2 > 0 ? ((item.value / edgarTotalCO2) * 100).toFixed(1) : 0}%
                      </span>
                      <span className="text-xs font-mono text-slate-400 bg-[#050B14] px-2 py-0.5 rounded border border-blue-800/40">
                        {fmtTon(item.value)} ton
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Year Comparison */}
          <div className="bg-[#0a1120] rounded-3xl border border-blue-900/30 p-8 flex flex-col justify-between transition-all duration-500 hover:border-blue-500/50 hover:shadow-neon-blue relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[50px] pointer-events-none group-hover:bg-blue-600/10 transition-colors"></div>
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="text-xl font-bold text-white font-display">Perbandingan Antar-Tahun</h3>
              <span className="text-xs font-bold text-blue-400 bg-blue-900/20 px-3 py-1.5 rounded-lg border border-blue-500/30">
                {isAtmosfer ? INDICATOR_META[activeIndicator].label : 'Total Emisi CO₂'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 relative z-10">
              <div className="flex-1 bg-[#050B14] p-5 rounded-2xl border border-blue-900/40">
                <span className="block text-xs font-bold text-blue-500/60 uppercase tracking-widest mb-2">Tahun A</span>
                <select
                  className="w-full bg-[#0a1120] border border-blue-900/50 text-lg font-bold text-white outline-none mb-3 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  value={yearA}
                  onChange={e => setYearA(Number(e.target.value))}
                >
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <div className="text-xl font-extrabold text-white font-display">
                  {isAtmosfer ? fmtNum(atmosComparison.valA) : fmtTon(edgarComparison.valA)}
                  <span className="text-xs font-medium text-blue-400/80 ml-1">
                    {isAtmosfer ? INDICATOR_META[activeIndicator].displayUnit : 'ton CO₂'}
                  </span>
                </div>
              </div>

              <div className="flex-1 bg-[#050B14] p-5 rounded-2xl border border-blue-900/40">
                <span className="block text-xs font-bold text-blue-500/60 uppercase tracking-widest mb-2">Tahun B</span>
                <select
                  className="w-full bg-[#0a1120] border border-blue-900/50 text-lg font-bold text-white outline-none mb-3 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500"
                  value={yearB}
                  onChange={e => setYearB(Number(e.target.value))}
                >
                  {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <div className="text-xl font-extrabold text-white font-display">
                  {isAtmosfer ? fmtNum(atmosComparison.valB) : fmtTon(edgarComparison.valB)}
                  <span className="text-xs font-medium text-blue-400/80 ml-1">
                    {isAtmosfer ? INDICATOR_META[activeIndicator].displayUnit : 'ton CO₂'}
                  </span>
                </div>
              </div>
            </div>

            {(() => {
              const change = isAtmosfer ? atmosComparison.change : edgarComparison.change
              return (
                <div className="mt-6 text-center text-sm font-bold text-slate-300 bg-[#050B14] py-3 rounded-xl border border-blue-900/40 relative z-10">
                  Perubahan {yearA} → {yearB}:{' '}
                  <span
                    className={
                      change != null
                        ? change > 0
                          ? 'text-rose-400 drop-shadow-[0_0_5px_rgba(244,63,94,0.5)]'
                          : 'text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]'
                        : 'text-slate-500'
                    }
                  >
                    {change != null ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%` : '–'}
                  </span>
                </div>
              )
            })()}
          </div>
        </div>

        {/* ==================== ASISTEN AI & INSIGHT DINAMIS ==================== */}
        <AiInsightCard
          activeSection={activeSection}
          activeIndicator={activeIndicator}
          indicatorMeta={INDICATOR_META[activeIndicator]}
          activeSector={activeSector}
          sectorMeta={sectorMeta}
          activeYear={activeYear}
          activeMonth={activeMonth}
          monthName={BULAN[activeMonth - 1]}
          kpiData={isAtmosfer ? atmosKpi : edgarKpi}
          hotspots={isAtmosfer ? REAL_HOTSPOTS[activeIndicator] : null}
          fmtTon={fmtTon}
          fmtNum={fmtNum}
          isAtmosfer={isAtmosfer}
          chartView={chartView}
          chartData={chartData}
          yearA={yearA}
          yearB={yearB}
          comparisonData={isAtmosfer ? atmosComparison : edgarComparison}
          activeScale={activeScale}
          edgarPieData={edgarPieData}
          edgarTotalCO2={edgarTotalCO2}
        />

        {/* ==================== METADATA & BATASAN ==================== */}
        <div id="metadata-section" className="bg-[#050B14]/80 rounded-3xl border border-blue-900/20 p-8 opacity-85 hover:opacity-100 transition-opacity">
          <h3 className="font-bold text-slate-300 mb-4 text-sm font-display tracking-wide uppercase flex items-center gap-2">
            <span className="w-1.5 h-4 bg-blue-500 rounded-full inline-block"></span>
            Panduan Konten & Batasan Interpretasi (Audit 2026)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3 text-sm text-slate-400 font-medium">
            <ul className="list-disc list-outside ml-5 space-y-2 marker:text-blue-500">
              <li><strong>Kolom Atmosfer vs Konsentrasi Permukaan:</strong> Data Sentinel-5P mengamati jumlah molekul pada kolom udara utuh (mol/m²), bukan otomatis konsentrasi di permukaan tanah yang dihirup warga.</li>
              <li><strong>Beda CO dan CO₂:</strong> Karbon monoksida (CO) adalah gas polutan pengamatan Sentinel-5P, sedangkan karbon dioksida (CO₂) adalah gas rumah kaca estimasi pemodelan EDGAR.</li>
              <li><strong>Periode Produk:</strong> Sentinel-5P mencakup 2019–2025; MODIS MAIAC AOD055 dan EDGAR mencakup rentang historis 2000–2025 (26 tahun).</li>
            </ul>
            <ul className="list-disc list-outside ml-5 space-y-2 marker:text-blue-500">
              <li><strong>Cakupan EDGAR:</strong> Sektor EDGAR pada dashboard ini khusus emisi CO₂ dari bahan bakar fosil, belum mencakup emisi biogenik atau gas rumah kaca lain seperti CH₄ dan N₂O.</li>
              <li><strong>Alokasi Spasial:</strong> Grid EDGAR berukuran ~11 km × 11 km (0.1°). Nilai Surabaya dihitung dengan bobot proporsi irisan sel grid dengan batas administratif kota.</li>
              <li><strong>Penyaringan Mutu:</strong> Data AOD MODIS menggunakan filter QC70; data satelit telah melalui algoritma retrieval Copernicus & NASA.</li>
            </ul>
          </div>
        </div>
          </>
        )}

      </main>
    </div>
  )
}

// ============================================================
// REUSABLE KPI CARD
// ============================================================
function KpiCard({ label, value, sub, badge, badgeUp, note }) {
  return (
    <div className="p-6 bg-[#0a1120] rounded-3xl shadow-[0_0_15px_rgba(59,130,246,0.03)] border border-blue-900/30 flex flex-col justify-between transition-all duration-500 hover:-translate-y-1 hover:border-blue-500/50 hover:shadow-neon-blue group relative overflow-hidden">
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600/0 via-blue-400/10 to-blue-600/0 opacity-0 group-hover:opacity-100 transition duration-1000 pointer-events-none"></div>
      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 relative z-10">{label}</span>
      <div className="flex items-baseline gap-2 relative z-10">
        <span className="text-3xl font-extrabold text-white font-display drop-shadow-[0_0_10px_rgba(255,255,255,0.4)] transition-all">
          {value}
        </span>
        {sub && <span className="text-sm font-semibold text-blue-400/80">{sub}</span>}
      </div>
      {badge && (
        <div
          className={`mt-3 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg w-max relative z-10 border ${
            badgeUp
              ? 'text-rose-400 bg-rose-900/20 border-rose-500/30'
              : 'text-emerald-400 bg-emerald-900/20 border-emerald-500/30'
          }`}
        >
          {badge}
        </div>
      )}
      {note && <span className="text-xs font-medium text-slate-500 mt-3 block relative z-10">{note}</span>}
    </div>
  )
}

export default App
