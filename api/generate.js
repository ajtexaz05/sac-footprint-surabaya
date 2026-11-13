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

  try {
    // Normalisasi Model ID OpenAgentic: Kimi K3.1 Pro resmi adalah 'kimi-k3.1-pro'
    let targetModel = model || 'kimi-k3.1-pro';
    if (targetModel === 'kimi-k3-1-pro') {
      targetModel = 'kimi-k3.1-pro';
    }

    const response = await fetch('https://openagentic.id/api/v1/chat/completions', {
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
          { 
            role: 'user', 
            content: promptContext 
          }
        ],
        max_tokens: 1500,
        temperature: 0.6
      })
    });

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

    // Berikan header Cache-Control pada Vercel Edge CDN agar request serupa dari user lain langsung dilayani dari cache
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');

    return res.status(200).json(data);
  } catch (error) {
    console.error('AI API Server Error:', error);
    return res.status(500).json({ error: 'Gagal terhubung ke server AI OpenAgentic: ' + error.message });
  }
}
