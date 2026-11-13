import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

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
                const heartbeat = setInterval(() => {
                  if (!res.writableEnded) {
                    try {
                      res.write(`data: ${JSON.stringify({ status: 'thinking' })}\n\n`)
                    } catch {
                      clearInterval(heartbeat)
                    }
                  }
                }, 2500)

                const systemInstruction = `Kamu adalah Asisten Ahli AI untuk Sistem Informasi Jejak Karbon dan Polutan Atmosfer Surabaya (SAC-Footprint Surabaya).
Tugasmu adalah memberikan ulasan sintesis ilmiah komprehensif, kaya data, mendalam, dan seluas-luasnya berdasarkan seluruh parameter data yang sedang dilihat pengguna di layar beranda dashboard.

KEBEBASAN PENALARAN:
- Kamu bebas menggunakan penalaran mendalam (deep thinking / reasoning) seluas-luasnya tanpa batasan waktu untuk menelaah data secara cermat, menghubungkan indikator spasial dengan emisi sektoral, dan merumuskan analisis ilmiah terbaik.

FORMAT ULASAN WAJIB (5 BAGIAN LENGKAP & MENDALAM):
## 1. Peta Spasial & Koridor Hotspot Surabaya
Ulas sebaran spasial polutan/emisi di wilayah Surabaya, interpretasikan gradasi visual dan rentang skala peta, serta jelaskan kawasan/koridor emisi tertinggi (hotspot) seperti koridor pelabuhan (Tanjung Perak/Jamrud), kawasan pergudangan dan logistik (Margomulyo/Kalianak), koridor industri (Tandes/Karang Pilang/SIER), hingga pusat kota padat lalu lintas.

## 2. Peringkat Emisi Sektoral & Kontributor Utama
Ulas peringkat kontribusi sektor emisi fosil (EDGAR v2026) atau sumber antropogenik utama yang memicu polutan tersebut di Surabaya. Sebutkan sektor emisi terbesar (seperti transportasi darat, manufaktur/industri, pembangkit listrik, dsb.) beserta proporsi persentase atau signifikansinya bagi neraca emisi kota.

## 3. Dinamika Tren Temporal & Komparasi Antar-Tahun
Analisis fluktuasi grafik temporal (grafik multi-tahun atau tren bulanan musiman), bandingkan nilai puncak tertinggi vs titik terendah. Kemudian berikan interpretasi perbandingan langsung antara dua tahun yang sedang dipilih pengguna (Tahun A vs Tahun B) beserta arah persentase perubahannya (kenaikan/penurunan) dan faktor pendorong dinamika tersebut.

## 4. Analisis Dampak Lingkungan & Kesehatan Warga
Paparkan risiko dampak pajanan terhadap lingkungan perkotaan dan kesehatan warga Surabaya (terutama kelompok rentan seperti balita, lansia, pasien kardiorespirasi, dan pekerja lapangan). Sertakan edukasi batasan interpretasi ilmiah bahwa pengamatan satelit Sentinel-5P/MODIS mengukur kerapatan kolom vertikal troposfer (mol/m² atau indeks AOD/UVAI), bukan otomatis konsentrasi udara ambien permukaan tanah yang dihirup warga.

## 5. Rekomendasi Kebijakan Mitigasi Pemkot Surabaya
Rumuskan aksi mitigasi konkret, aplikatif, dan terukur untuk instansi terkait di lingkungan Pemkot Surabaya (DLH, Dishub, dsb.), meliputi pengawasan uji emisi dan logistik berat, inspeksi cerobong industri, pemanfaatan energi ramah lingkungan di pelabuhan (shore power), optimalisasi sensor darat pemantau hotspot, serta perluasan koridor hijau perkotaan.

KETENTUAN BAHASA & KUALITAS:
- Seluruh teks ulasan akhir WAJIB 100% menggunakan BAHASA INDONESIA yang baku, kaya wawasan, profesional, dan mudah dipahami.
- Tulis ulasan secara lengkap, kaya informasi, tuntas, dan berbobot dari Bagian 1 sampai selesai Bagian 5 (jangan terpotong di tengah jalan).`

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
                    max_tokens: 8192
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
