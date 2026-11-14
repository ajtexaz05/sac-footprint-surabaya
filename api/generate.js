import dns from 'dns';
import { SYSTEM_INSTRUCTION, AI_CONFIG, isQuotaError } from '../src/utils/aiPrompt.js';

try {
  dns.setDefaultResultOrder('ipv4first');
} catch {
  /* ignore DNS error on environments where unsupported */
}

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON request body' });
    }
  }

  const { promptContext, model } = body || {};
  const apiKey = process.env.SECRET_AI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'API Key server belum dikonfigurasi pada Environment Variables Vercel (SECRET_AI_API_KEY).'
    });
  }

  if (!promptContext) {
    return res.status(400).json({
      error: 'Parameter promptContext wajib disertakan.'
    });
  }

  // Set SSE Streaming Headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*'
  });

  // Kirim keep-alive awal langsung ke client
  res.write(': keep-alive start\n\n');
  res.write(`data: ${JSON.stringify({ status: 'thinking' })}\n\n`);

  // Heartbeat interval 2.5 detik untuk menjaga socket tetap aktif selama AI menalar
  let hasReceivedContent = false;
  const heartbeat = setInterval(() => {
    if (!res.writableEnded && !hasReceivedContent) {
      try {
        res.write(`data: ${JSON.stringify({ status: 'thinking' })}\n\n`);
      } catch {
        clearInterval(heartbeat);
      }
    }
  }, 2500);

  // Bersihkan heartbeat dan batalkan upstream saat klien memutuskan koneksi
  const abortController = new AbortController();
  const cleanup = () => {
    clearInterval(heartbeat);
    if (!abortController.signal.aborted) {
      abortController.abort();
    }
  };

  res.on('close', cleanup);

  // Batas waktu timeout 55 detik agar upstream berhenti rapi sebelum hard kill 60s Vercel
  const timeoutId = setTimeout(() => {
    cleanup();
  }, 55000);

  try {
    let targetModel = model || AI_CONFIG.model;
    if (targetModel === 'kimi-k3-1-pro') targetModel = AI_CONFIG.model;

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
    });

    if (!openAgenticRes.ok) {
      clearTimeout(timeoutId);
      clearInterval(heartbeat);
      const errText = await openAgenticRes.text();
      let errMsg = `Error dari OpenAgentic (Status ${openAgenticRes.status})`;
      let quotaDetected = false;
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson?.error?.message || errMsg;
        quotaDetected = isQuotaError(openAgenticRes.status, errMsg);
      } catch {
        /* ignore parse error */
      }

      res.write(`data: ${JSON.stringify({ error: errMsg, isQuotaExhausted: quotaDetected })}\n\n`);
      res.end();
      return;
    }

    const reader = openAgenticRes.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let contentDelivered = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;

        if (trimmed.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(trimmed.slice(6));
            const delta = parsed.choices?.[0]?.delta;

            // HANYA kirim teks ulasan akhir (content), buang monolog reasoning internal Kimi
            if (delta?.content) {
              if (!hasReceivedContent) {
                hasReceivedContent = true;
                clearInterval(heartbeat);
              }
              contentDelivered = true;
              res.write(`data: ${JSON.stringify({ content: delta.content })}\n\n`);
            }
          } catch {
            /* ignore malformed chunk */
          }
        }
      }
    }

    clearTimeout(timeoutId);
    clearInterval(heartbeat);

    if (!contentDelivered) {
      res.write(`data: ${JSON.stringify({ error: 'Server AI membutuhkan waktu penalaran lebih lama. Silakan klik Perbarui Analisis sekali lagi.' })}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    clearTimeout(timeoutId);
    clearInterval(heartbeat);
    if (!res.writableEnded) {
      const isAbort = err.name === 'AbortError' || abortController.signal.aborted;
      const errorText = isAbort
        ? 'Batas waktu penalaran server tercapai (55s). Silakan klik "Perbarui Analisis" untuk memuat kembali ulasan.'
        : 'Terjadi gangguan koneksi ke server AI: ' + err.message;
      res.write(`data: ${JSON.stringify({ error: errorText })}\n\n`);
      res.end();
    }
  }
}
