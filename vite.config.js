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

                const openAgenticRes = await fetch('https://openagentic.id/api/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    model: targetModel,
                    messages: [
                      {
                        role: 'system',
                        content: 'Anda adalah AI Asisten Pakar Analisis Sains Atmosfer & Jejak Karbon untuk platform Surabaya Atmospheric & Carbon Footprint (SAC-Footprint Surabaya). Berikan analisis komprehensif, ilmiah, tajam, dan mudah dipahami dalam 6 bagian utama dengan heading markdown tebal dan emoji:\n1. 🗺️ **Analisis Peta Spasial & Gradasi Wilayah Surabaya**\n2. 📈 **Tren Dinamika Temporal (Tampilan Grafik)**\n3. 📍 **Bedah Lokasi Hotspot Konsentrasi Tertinggi**\n4. ⚖️ **Komparasi Antar-Tahun Terpilih**\n5. ⚠️ **Dampak Lingkungan & Kesehatan Masyarakat**\n6. 💡 **Rekomendasi Kebijakan Strategis untuk Pemkot Surabaya**'
                      },
                      { role: 'user', content: promptContext }
                    ],
                    max_tokens: 1500,
                    temperature: 0.6
                  })
                })

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
