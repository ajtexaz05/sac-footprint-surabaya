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

  const { promptContext, model } = req.body || {};
  const apiKey = process.env.SECRET_AI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'API Key server belum dikonfigurasi pada Environment Variables Vercel (SECRET_AI_API_KEY).'
    });
  }

  // Set SSE Streaming Headers agar respons langsung mengalir ke browser tanpa terkena timeout
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*'
  });

  try {
    let targetModel = model || 'kimi-k3.1-pro';
    if (targetModel === 'kimi-k3-1-pro') targetModel = 'kimi-k3.1-pro';

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
            content: 'Kamu adalah Asisten Ahli AI SAC-Footprint Surabaya. Berikan analisis ilmiah mendalam, komprehensif, dan solutif dalam 4 bagian utama terstruktur:\n1. 🗺️ **Analisis Peta Spasial & Hotspot Surabaya** (sebaran konsentrasi, gradasi warna peta, dan koridor emisi utama)\n2. 📈 **Tren Dinamika Temporal & Komparasi Antar-Tahun** (fluktuasi grafik bulanan/tahunan, pengaruh musim/meteorologi, dan perbandingan tahun terpilih)\n3. ⚠️ **Dampak Lingkungan & Kesehatan Masyarakat** (risiko pajanan warga, standar kesehatan, dan catatan kolom satelit vertikal vs udara ambien)\n4. 💡 **Rekomendasi Kebijakan Mitigasi Pemkot Surabaya** (solusi konkret tata ruang, regulasi transportasi/industri, dan aksi mitigasi dinas terkait)\n\nKETENTUAN MUTLAK:\n- Seluruh jawaban akhir WAJIB 100% dalam BAHASA INDONESIA yang baku dan profesional.\n- Sajikan ulasan yang kaya informasi dan berbobot tanpa kalimat pembuka basa-basi.'
          },
          { role: 'user', content: promptContext }
        ],
        max_tokens: 2000
      })
    });

    if (!openAgenticRes.ok) {
      const errText = await openAgenticRes.text();
      let errMsg = `Error dari OpenAgentic (Status ${openAgenticRes.status})`;
      let isQuota = false;
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson?.error?.message || errMsg;
        isQuota = openAgenticRes.status === 402 || openAgenticRes.status === 429 || /quota|credit|saldo|balance|exceeded|habis|limit|insufficient/i.test(errMsg);
      } catch {}

      res.write(`data: ${JSON.stringify({ error: errMsg, isQuotaExhausted: isQuota })}\n\n`);
      res.end();
      return;
    }

    const reader = openAgenticRes.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let lastKeepAlive = Date.now();

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

            // Jika Kimi sedang dalam tahap penalaran internal (reasoning), kirim keep-alive status agar koneksi tetap segar
            if (delta?.reasoning_content) {
              const now = Date.now();
              if (now - lastKeepAlive > 3000) {
                lastKeepAlive = now;
                res.write(`data: ${JSON.stringify({ status: 'thinking' })}\n\n`);
              }
            }

            // HANYA kirim teks jawaban akhir (content), abaikan dan buang monolog reasoning internal Kimi
            if (delta?.content) {
              res.write(`data: ${JSON.stringify({ content: delta.content })}\n\n`);
            }
          } catch {}
        }
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Serverless Stream Error:', err);
    res.write(`data: ${JSON.stringify({ error: 'Terjadi gangguan koneksi ke server AI: ' + err.message })}\n\n`);
    res.end();
  }
}
