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
              res.setHeader('Content-Type', 'application/json')
              res.setHeader('Access-Control-Allow-Origin', '*')

              try {
                const parsed = JSON.parse(body || '{}')
                const { promptContext, model } = parsed
                const apiKey = process.env.SECRET_AI_API_KEY || env.SECRET_AI_API_KEY

                if (!apiKey) {
                  res.statusCode = 500
                  res.end(JSON.stringify({
                    error: 'API Key belum disetel di file .env lokal (SECRET_AI_API_KEY). Buat file .env di folder proyek dan isi dengan API Key OpenAgentic Anda.'
                  }))
                  return
                }

                let targetModel = model || 'kimi-k3.1-pro'
                if (targetModel === 'kimi-k3-1-pro') targetModel = 'kimi-k3.1-pro'

                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 54000)

                const openAgenticRes = await fetch('https://openagentic.id/api/v1/chat/completions', {
                  method: 'POST',
                  signal: controller.signal,
                  headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    model: targetModel,
                    messages: [
                      {
                        role: 'system',
                        content: 'Kamu adalah Asisten AI SAC-Footprint Surabaya. PENTING: Penalaran internal (thinking) harus sangat singkat (maksimal 2-3 kalimat saja). Jawaban akhir WAJIB 100% BAHASA INDONESIA dalam 4 bagian padat berurutan:\n1. 🗺️ **Peta Spasial & Hotspot Surabaya** (analisis sebaran konsentrasi, gradasi warna, dan koridor emisi tertinggi)\n2. 📈 **Tren Temporal & Komparasi Antar-Tahun** (analisis grafik musiman/tahunan dan perbandingan tahun terpilih)\n3. ⚠️ **Dampak Lingkungan & Kesehatan Warga** (risiko pajanan masyarakat & batasan kolom satelit vs udara ambien)\n4. 💡 **Rekomendasi Kebijakan Mitigasi Pemkot** (langkah konkret terarah untuk Pemkot Surabaya)\nFormat rapi to-the-point, maksimal 250 kata. Seluruh kata dan istilah analisis WAJIB dalam Bahasa Indonesia (dilarang menggunakan bahasa Inggris).'
                      },
                      { role: 'user', content: promptContext }
                    ],
                    max_tokens: 1200
                  })
                })

                clearTimeout(timeoutId)

                const rawText = await openAgenticRes.text()
                let data
                try {
                  const match = rawText.match(/\{[\s\S]*\}/)
                  data = match ? JSON.parse(match[0]) : JSON.parse(rawText)
                } catch (e) {
                  res.statusCode = 500
                  res.end(JSON.stringify({ 
                    error: 'Gagal mem-parsing balasan dari OpenAgentic: ' + rawText.slice(0, 150) 
                  }))
                  return
                }

                if (!openAgenticRes.ok || data.error) {
                  const errMsg = typeof data?.error === 'object'
                    ? data?.error?.message || JSON.stringify(data.error)
                    : data?.error || `Error dari OpenAgentic (Status ${openAgenticRes.status})`

                  const isQuotaExhausted = openAgenticRes.status === 402 || 
                                           openAgenticRes.status === 429 || 
                                           /quota|credit|saldo|balance|exceeded|habis|limit|insufficient|upgrade plan/i.test(errMsg)

                  res.statusCode = openAgenticRes.status || 500
                  res.end(JSON.stringify({ error: errMsg, isQuotaExhausted }))
                  return
                }

                // Normalisasi isi konten dalam Bahasa Indonesia
                const choice = data?.choices?.[0]
                let finalContent = (choice?.message?.content && choice.message.content.trim()) || ''

                if (!finalContent && choice?.message?.reasoning_content) {
                  const rawReasoning = choice.message.reasoning_content
                  const indonesianMatch = rawReasoning.match(/(?:🗺️|1\.|###\s*1)[^\0]*/)
                  finalContent = indonesianMatch ? indonesianMatch[0].trim() : rawReasoning.trim()
                }

                if (!finalContent && typeof choice?.text === 'string') {
                  finalContent = choice.text.trim()
                }

                if (data?.choices?.[0]?.message) {
                  data.choices[0].message.content = finalContent || 'Gagal memuat teks analisis Bahasa Indonesia.'
                }

                res.statusCode = 200
                res.end(JSON.stringify(data))
              } catch (err) {
                res.statusCode = 500
                res.end(JSON.stringify({
                  error: err.message || 'Gagal memproses permintaan di local development server.'
                }))
              }
            })
          })
        }
      }
    ]
  }
})
