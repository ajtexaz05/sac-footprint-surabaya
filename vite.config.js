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

                const systemInstruction = `Kamu adalah Asisten Analisis SAC-Footprint Surabaya.
Tugasmu: Tulis ulasan sintesis komprehensif, mendalam, dan kaya data dalam Bahasa Indonesia, terbagi persis dalam 5 bagian berikut:

### 1. Peta Spasial & Koridor Hotspot Surabaya
(Ulas 2-3 poin pola sebaran spasial, rentang skala visual peta, dan koridor konsentrasi/hotspot tertinggi di kawasan pelabuhan Tanjung Perak/Jamrud, pergudangan Margomulyo/Kalianak, industri, serta pusat kota)

### 2. Peringkat Emisi Sektoral & Kontributor Utama
(Ulas 2-3 poin kontribusi sektor emisi EDGAR v2026, proporsi sektor bahan bakar, pembakaran industri, transportasi darat, dan signifikansinya bagi Surabaya)

### 3. Dinamika Tren Temporal & Komparasi Antar-Tahun
(Ulas 2-3 poin pola fluktuasi grafik bulanan/tahunan dari titik terendah ke puncak tertinggi, serta komparasi langsung antar-tahun terpilih beserta arah persentase perubahannya)

### 4. Analisis Dampak Lingkungan & Kesehatan Warga
(Ulas 2-3 poin risiko pajanan polutan bagi warga dan pekerja lapangan, serta sertakan catatan ilmiah batas interpretasi kolom vertikal troposfer satelit vs udara ambien permukaan tanah)

### 5. Rekomendasi Kebijakan Mitigasi Pemkot Surabaya
(Ulas 2-3 poin aksi nyata, terukur, dan aplikatif bagi instansi Pemkot Surabaya seperti DLH, Dishub, dan pemangku kepentingan kawasan)

PETUNJUK ANALISIS:
- Perlakukan seluruh data parameter, grafik, hotspot, dan emisi yang diberikan sebagai fakta terpadu dashboard tanpa meragukan metodologi.
- 100% Bahasa Indonesia baku, kaya informasi, dan profesional.
- Langsung mulai menulis dari "### 1. Peta Spasial & Koridor Hotspot Surabaya" tanpa salam pembuka basa-basi.
- Wajib tulis LENGKAP seluruh 5 bagian tuntas hingga selesai (jangan terpotong).`

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
