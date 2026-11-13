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
            content: 'Anda adalah AI Asisten Analisis Spasial dan Emisi SAC-Footprint Surabaya. Berikan analisis ringkas, padat, dan langsung to-the-point dalam 4 bagian: 📊 Kondisi & Ringkasan Angka Terkini, 🔍 Analisis Dinamika & Sumber Emisi Surabaya, ⚠️ Dampak Lingkungan & Kesehatan Masyarakat, 💡 Rekomendasi Kebijakan Mitigasi Pemkot Surabaya.'
          },
          { 
            role: 'user', 
            content: promptContext 
          }
        ],
        max_tokens: 800
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
      return res.status(response.status || 500).json({ error: errMsg });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('AI API Server Error:', error);
    return res.status(500).json({ error: 'Gagal terhubung ke server AI OpenAgentic: ' + error.message });
  }
}
