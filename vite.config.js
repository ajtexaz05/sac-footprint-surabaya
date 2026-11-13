import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import dns from 'dns'

try {
  dns.setDefaultResultOrder('ipv4first')
} catch {}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'local-vercel-api-middleware',
        configureServer(server) {
          // Middleware lokal untuk meniru Vercel Serverless Function /api/generate di localhost
          server.middlewares.use('/api/generate', (req, res) => {
            if (req.method === 'OPTIONS') {
              res.statusCode = 200
              res.setHeader('Access-Control-Allow-Origin', '*')
              res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
              res.end()
              return
            }

            if (req.method !== 'POST') {
              res.statusCode = 405
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Method Not Allowed' }))
              return
            }

            let body = ''
            req.on('data', chunk => {
              body += chunk
            })

            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body || '{}')
                const { promptContext, model } = parsed
                const apiKey = process.env.SECRET_AI_API_KEY || env.SECRET_AI_API_KEY

                if (!apiKey) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({
                    error: 'API Key belum disetel di file .env lokal (SECRET_AI_API_KEY). Buat file .env di folder proyek dan isi dengan API Key OpenAgentic Anda.'
                  }))
                  return
                }

                let targetModel = model || 'kimi-k3.1-pro'
                if (targetModel === 'kimi-k3-1-pro') targetModel = 'kimi-k3.1-pro'

                // Set SSE Headers untuk streaming real-time
                res.writeHead(200, {
                  'Content-Type': 'text/event-stream; charset=utf-8',
                  'Cache-Control': 'no-cache, no-transform',
                  'Connection': 'keep-alive',
                  'Access-Control-Allow-Origin': '*'
                })

                // Kirim keep-alive awal langsung ke client
                res.write(': keep-alive start\n\n')
                res.write(`data: ${JSON.stringify({ status: 'thinking' })}\n\n`)

                // Heartbeat interval 2.5 detik untuk menjaga socket tetap aktif selama AI menalar
                let hasReceivedContent = false
                const heartbeat = setInterval(() => {
                  if (!res.writableEnded && !hasReceivedContent) {
                    try {
                      res.write(`data: ${JSON.stringify({ status: 'thinking' })}\n\n`)
                    } catch {
                      clearInterval(heartbeat)
                    }
                  }
                }, 2500)

                const systemInstruction = `Kamu adalah Asisten Ahli AI Senior untuk Sistem Informasi Jejak Karbon dan Polutan Atmosfer Surabaya (SAC-Footprint Surabaya).
Tugas utamamu adalah menyusun laporan sintesis ilmiah mendalam, ekstensif, kaya wawasan, berbobot analitis tinggi, dan komprehensif berdasarkan seluruh parameter data dashboard yang sedang diakses pengguna.

WAJIB SUSUN DALAM 5 BAGIAN UTAMA BERIKUT SECARA PANJANG, DETAIL, DAN MENYELURUH:

### 1. Peta Spasial & Koridor Hotspot Surabaya
Ulas secara rinci gradasi visual sebaran spasial polutan di Surabaya, interpretasikan arti nilai rentang skala visual peta (minimum hingga maksimum), serta telaah mendalam kawasan koridor konsentrasi tertinggi (hotspot). Hubungkan secara geografis antara zona hotspot dengan kepadatan lalu lintas pusat kota, simpul komersial, pergudangan, maupun kawasan industri di Surabaya.

### 2. Peringkat Emisi Sektoral & Kontributor Antropogenik Utama
Ulas profil emisi sektoral EDGAR v2026 Kota Surabaya secara mendalam. Bahas sektor-sektor penyumbang terbesar (eksploitasi bahan bakar, industri, transportasi, pembangkit listrik, dll) beserta kontribusi persentasenya. Jelaskan mekanisme keterkaitan antara aktivitas sektor-sektor tersebut dengan pelepasan polutan di atmosfer Surabaya.

### 3. Dinamika Tren Temporal & Komparasi Antar-Tahun
Lakukan analisis mendalam terhadap kurva tren temporal grafik (fluktuasi tahunan atau variasi musiman bulanan). Jelaskan faktor yang memicu titik puncak tertinggi dan titik terendah. Analisis secara tajam perbandingan langsung antara tahun pembanding yang dipilih pengguna (angka awal vs angka pembanding, arah dan persentase perubahan), serta interpretasikan maknanya bagi perbaikan atau beban kualitas udara jangka panjang.

### 4. Analisis Risiko Lingkungan & Kesehatan Warga
Ulas secara komprehensif dampak biologis dan kesehatan dari pajanan polutan tersebut terhadap warga Surabaya, khususnya kelompok rentan (anak-anak, lansia, pasien penyakit pernapasan/kardiovaskular, dan pekerja luar ruangan). Berikan edukasi ilmiah yang jelas mengenai perbedaan mendasar antara data pengamatan kolom troposfer satelit (mol/m² atau indeks) dengan konsentrasi udara ambien di permukaan tanah yang dihirup manusia.

### 5. Rekomendasi Kebijakan Mitigasi Terukur Pemkot Surabaya
Rumuskan program aksi strategis, aplikatif, dan terukur untuk jajaran instansi Pemkot Surabaya (Dinas Lingkungan Hidup, Dinas Perhubungan, dsb.) dan pengelola kawasan. Sertakan usulan konkret mencakup pengawasan emisi sumber bergerak dan industri, penataan koridor transportasi, optimalisasi jaringan sensor pemantau darat, serta perluasan ruang terbuka hijau (RTH) kota.

PEDOMAN PENULISAN:
- Seluruh teks WAJIB 100% dalam BAHASA INDONESIA yang baku, formal, kaya kosakata ilmiah, dan profesional.
- JANGAN hanya membuat ringkasan singkat atau poin pendek. Uraikan setiap bagian dengan penjelasan mendalam, paragraf elaboratif, dan data numerik konkret yang kaya wawasan.
- JANGAN menulis kalimat pembuka basa-basi seperti "Konteks telah dipahami". LANGSUNG mulai dari judul "### 1. Peta Spasial & Koridor Hotspot Surabaya" dan tulis lengkap dari Bagian 1 sampai selesai Bagian 5 tanpa terpotong!`

                const openAgenticRes = await fetch('https://openagentic.id/api/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    model: targetModel,
                    stream: true,
                    messages: [
                      { role: 'system', content: systemInstruction },
                      { role: 'user', content: promptContext }
                    ],
                    max_tokens: 16384
                  })
                })

                if (!openAgenticRes.ok) {
                  clearInterval(heartbeat)
                  const errText = await openAgenticRes.text()
                  let errMsg = `Error dari OpenAgentic (Status ${openAgenticRes.status})`
                  let isQuota = false
                  try {
                    const errJson = JSON.parse(errText)
                    errMsg = errJson?.error?.message || errMsg
                    isQuota = openAgenticRes.status === 402 || openAgenticRes.status === 429 || /quota|credit|saldo|balance|exceeded|habis|limit|insufficient/i.test(errMsg)
                  } catch {}

                  res.write(`data: ${JSON.stringify({ error: errMsg, isQuotaExhausted: isQuota })}\n\n`)
                  res.end()
                  return
                }

                const reader = openAgenticRes.body.getReader()
                const decoder = new TextDecoder('utf-8')
                let buffer = ''
                let contentDelivered = false

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
                        const parsed = JSON.parse(trimmed.slice(6))
                        const delta = parsed.choices?.[0]?.delta

                        // HANYA kirim teks ulasan akhir (content), buang monolog reasoning internal Kimi
                        if (delta?.content) {
                          if (!hasReceivedContent) {
                            hasReceivedContent = true
                            clearInterval(heartbeat)
                          }
                          contentDelivered = true
                          res.write(`data: ${JSON.stringify({ content: delta.content })}\n\n`)
                        }
                      } catch {}
                    }
                  }
                }

                clearInterval(heartbeat)

                if (!contentDelivered) {
                  res.write(`data: ${JSON.stringify({ error: 'Server AI membutuhkan waktu penalaran lebih lama. Silakan klik Perbarui Analisis sekali lagi.' })}\n\n`)
                }

                res.write('data: [DONE]\n\n')
                res.end()
              } catch (err) {
                res.write(`data: ${JSON.stringify({ error: err.message || 'Gagal memproses permintaan di local development server.' })}\n\n`)
                res.end()
              }
            })
          })
        }
      }
    ]
  }
})
