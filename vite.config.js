import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import dns from 'dns'
import { SYSTEM_INSTRUCTION, AI_CONFIG, isQuotaError } from './src/utils/aiPrompt.js'

try {
  dns.setDefaultResultOrder('ipv4first')
} catch {
  /* ignore DNS configuration error on systems where not supported */
}

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
              let parsed
              try {
                parsed = JSON.parse(body || '{}')
              } catch {
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: 'Invalid JSON request body' }))
                return
              }

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

              let targetModel = model || AI_CONFIG.model
              if (targetModel === 'kimi-k3-1-pro') targetModel = AI_CONFIG.model

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

              const abortController = new AbortController()
              const cleanup = () => {
                clearInterval(heartbeat)
                if (!abortController.signal.aborted) {
                  abortController.abort()
                }
              }

              res.on('close', cleanup)

              try {
                const openAgenticRes = await fetch('https://openagentic.id/api/v1/chat/completions', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                  },
                  signal: abortController.signal,
                  body: JSON.stringify({
                    model: targetModel,
                    stream: true,
                    messages: [
                      { role: 'system', content: SYSTEM_INSTRUCTION },
                      { role: 'user', content: promptContext }
                    ],
                    max_tokens: AI_CONFIG.maxTokens,
                    temperature: AI_CONFIG.temperature
                  })
                })

                if (!openAgenticRes.ok) {
                  clearInterval(heartbeat)
                  const errText = await openAgenticRes.text()
                  let errMsg = `Error dari OpenAgentic (Status ${openAgenticRes.status})`
                  let quotaDetected = false
                  try {
                    const errJson = JSON.parse(errText)
                    errMsg = errJson?.error?.message || errMsg
                    quotaDetected = isQuotaError(openAgenticRes.status, errMsg)
                  } catch {
                    /* ignore json parse error */
                  }

                  res.write(`data: ${JSON.stringify({ error: errMsg, isQuotaExhausted: quotaDetected })}\n\n`)
                  res.end()
                  return
                }

                const reader = openAgenticRes.body.getReader()
                const decoder = new TextDecoder('utf-8')
                let streamBuffer = ''
                let contentDelivered = false

                while (true) {
                  const { done, value } = await reader.read()
                  if (done) break

                  streamBuffer += decoder.decode(value, { stream: true })
                  const lines = streamBuffer.split('\n')
                  streamBuffer = lines.pop() || ''

                  for (const line of lines) {
                    const trimmed = line.trim()
                    if (!trimmed || trimmed === 'data: [DONE]') continue

                    if (trimmed.startsWith('data: ')) {
                      try {
                        const chunkData = JSON.parse(trimmed.slice(6))
                        const delta = chunkData.choices?.[0]?.delta

                        // HANYA kirim teks ulasan akhir (content), buang monolog reasoning internal Kimi
                        if (delta?.content) {
                          if (!hasReceivedContent) {
                            hasReceivedContent = true
                            clearInterval(heartbeat)
                          }
                          contentDelivered = true
                          res.write(`data: ${JSON.stringify({ content: delta.content })}\n\n`)
                        }
                      } catch {
                        /* ignore incomplete chunk */
                      }
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
                clearInterval(heartbeat)
                if (!res.writableEnded) {
                  res.write(`data: ${JSON.stringify({ error: err.message || 'Gagal memproses permintaan di local development server.' })}\n\n`)
                  res.end()
                }
              }
            })
          })
        }
      }
    ]
  }
})
