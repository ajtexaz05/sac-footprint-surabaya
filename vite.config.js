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
                    error: 'API Key belum disetel di file .env lokal (SECRET_AI_API_KEY). Buat file .env di folder proyek dan isi dengan API Key OpenAgentic Anda untuk pengujian di localhost, atau lakukan pengujian langsung di Vercel.'
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
                        content: 'Anda adalah AI Asisten Analisis Spasial dan Emisi. Berikan jawaban dalam 4 poin: 📊 Kondisi & Ringkasan Angka Terkini, 🔍 Analisis Dinamika & Sumber Emisi Surabaya, ⚠️ Dampak Lingkungan & Kesehatan Masyarakat, 💡 Rekomendasi Kebijakan Mitigasi Pemkot Surabaya.'
                      },
                      { role: 'user', content: promptContext }
                    ]
                  })
                })

                const data = await openAgenticRes.json()
                res.statusCode = openAgenticRes.status
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
