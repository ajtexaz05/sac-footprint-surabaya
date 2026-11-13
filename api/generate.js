export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { promptContext, model } = req.body;
  
  // Mengambil API Key dari Environment Variable Vercel
  const apiKey = process.env.SECRET_AI_API_KEY; 

  if (!apiKey) {
    return res.status(500).json({ 
      error: 'API Key server belum dikonfigurasi pada Environment Variables Vercel (SECRET_AI_API_KEY).' 
    });
  }

  // Setup AbortController dengan batas waktu 54 detik (sebelum batas 60 detik Vercel Serverless Function)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 54000);

  try {
    // Normalisasi Model ID OpenAgentic: Kimi K3.1 Pro resmi adalah 'kimi-k3.1-pro'
    let targetModel = model || 'kimi-k3.1-pro';
    if (targetModel === 'kimi-k3-1-pro') {
      targetModel = 'kimi-k3.1-pro';
    }

    // Catatan penting: Model reasoning Kimi K3.1 Pro TIDAK mendukung parameter 'temperature' (akan throw HTTP 400 jika ada).
    const response = await fetch('https://openagentic.id/api/v1/chat/completions', {
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
            content: 'Anda adalah AI Asisten Pakar Analisis Sains Atmosfer & Jejak Karbon untuk platform Surabaya Atmospheric & Carbon Footprint (SAC-Footprint Surabaya). Berikan ulasan tajam, padat, to-the-point dalam 4 bagian berurutan:\n1. 🗺️ **Peta Spasial & Hotspot Surabaya** (analisis sebaran konsentrasi, gradasi warna, dan koridor emisi tertinggi)\n2. 📈 **Tren Temporal & Komparasi Antar-Tahun** (analisis dinamika grafik, fluktuasi musiman, dan perbandingan antar-tahun)\n3. ⚠️ **Dampak Lingkungan & Kesehatan Warga** (risiko pajanan masyarakat & batasan kolom satelit vs udara ambien)\n4. 💡 **Rekomendasi Kebijakan Mitigasi Pemkot** (langkah konkret terarah untuk dinas terkait Pemkot Surabaya)\nLangsung berikan ulasan to-the-point tanpa kalimat pembuka basa-basi atau penalaran bertele-tele (maksimal 250-300 kata total).'
          },
          { 
            role: 'user', 
            content: promptContext 
          }
        ],
        max_tokens: 800
      })
    });

    clearTimeout(timeoutId);

    const rawText = await response.text();
    let data;
    try {
      // Membersihkan teks jika terdapat trailing SSE 'data: [DONE]' dari proxy OpenAgentic
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      data = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawText);
    } catch (parseErr) {
      console.error('Failed to parse OpenAgentic response:', rawText);
      return res.status(500).json({ 
        error: 'Format balasan dari server AI OpenAgentic tidak valid.' 
      });
    }

    if (!response.ok || data.error) {
      console.error('OpenAgentic API Error Response:', data);
      const errMsg = typeof data?.error === 'object' 
        ? data?.error?.message || JSON.stringify(data.error)
        : data?.error || `Error dari OpenAgentic (Status ${response.status})`;

      // Deteksi apakah kegagalan disebabkan kuota token atau saldo habis
      const isQuotaExhausted = response.status === 402 || 
                               response.status === 429 || 
                               /quota|credit|saldo|balance|exceeded|habis|limit|insufficient|upgrade plan/i.test(errMsg);

      return res.status(response.status || 500).json({ 
        error: errMsg,
        isQuotaExhausted
      });
    }

    // Pastikan konten terisi baik dari content maupun reasoning_content jika terjadi truncation
    const choice = data?.choices?.[0];
    const finalContent = (choice?.message?.content && choice.message.content.trim()) 
      || (choice?.message?.reasoning_content && choice.message.reasoning_content.trim())
      || (typeof choice?.text === 'string' && choice.text.trim()) 
      || '';

    if (data?.choices?.[0]?.message) {
      data.choices[0].message.content = finalContent;
    }

    // Berikan header Cache-Control pada Vercel Edge CDN agar request serupa dari user lain langsung dilayani dari cache
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');

    return res.status(200).json(data);
  } catch (error) {
    clearTimeout(timeoutId);
    console.error('AI API Server Error:', error);
    if (error.name === 'AbortError') {
      return res.status(504).json({
        error: 'Waktu penalaran server AI OpenAgentic melebihi batas waktu (54 detik). Silakan coba klik tombol Generate kembali.'
      });
    }
    return res.status(500).json({ error: 'Gagal terhubung ke server AI OpenAgentic: ' + error.message });
  }
}
