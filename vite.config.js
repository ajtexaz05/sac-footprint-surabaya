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
                      {
                        role: 'system',
                        content: 'Kamu adalah Asisten AI SAC-Footprint Surabaya. Tuliskan ulasan dalam 4 bagian:\n1. 🗺️ **Peta Spasial & Hotspot Surabaya** (analisis sebaran konsentrasi, gradasi warna, dan koridor emisi)\n2. 📈 **Tren Temporal & Komparasi Antar-Tahun** (analisis grafik musiman dan perbandingan tahun)\n3. ⚠️ **Dampak Lingkungan & Kesehatan Warga** (risiko pajanan warga & batasan kolom satelit vs udara ambien)\n4. 💡 **Rekomendasi Kebijakan Mitigasi Pemkot** (langkah konkret terarah untuk Pemkot Surabaya)\n\nPENTING:\n- Penalaran internal (thinking) sangat singkat (1-2 kalimat saja).\n- Tulis ulasan padat tuntas sampai selesai (maksimal 250-300 kata, dilarang terpotong di tengah jalan).\n- Seluruh teks ulasan akhir WAJIB 100% dalam BAHASA INDONESIA.'
                      },
                      { role: 'user', content: promptContext }
                    ],
                    max_tokens: 2500
                  })
                })

                if (!openAgenticRes.ok) {
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
                let lastKeepAlive = Date.now()
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

                        // Kirim status keepalive saat AI sedang dalam tahap reasoning
                        if (delta?.reasoning_content) {
                          const now = Date.now()
                          if (now - lastKeepAlive > 2500) {
                            lastKeepAlive = now
                            res.write(`data: ${JSON.stringify({ status: 'thinking' })}\n\n`)
                          }
                        }

                        // Kirim teks jawaban akhir (content), buang monolog reasoning internal Kimi
                        if (delta?.content) {
                          contentDelivered = true
                          res.write(`data: ${JSON.stringify({ content: delta.content })}\n\n`)
                        }
                      } catch {}
                    }
                  }
                }

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
